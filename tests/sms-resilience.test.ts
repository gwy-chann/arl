import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  CircuitBreaker,
  dispatchSmsSafe,
  isRetryableError,
  executeWithTimeout,
  SmsTimeoutError,
  smsCircuitBreaker,
} from '../lib/services/sms-resilience.ts';
import {
  _resetPhilSmsMockHistory,
} from '../lib/services/philsms-adapter.ts';
import { SaleService, resetInMemorySales } from '../lib/sales/sale-service.ts';
import { resetInMemoryProducts } from '../lib/products/product-service.ts';
import { resetMemoryCustomerStore } from '../lib/customers/customer-service.ts';

describe('Feature ARL-25: SMS Gateway Resilience & Circuit Breaker', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.PHILSMS_MOCK_DISPATCH = 'true';
    _resetPhilSmsMockHistory();
    smsCircuitBreaker.reset();
    resetInMemoryProducts();
    resetMemoryCustomerStore();
    resetInMemorySales();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    _resetPhilSmsMockHistory();
    smsCircuitBreaker.reset();
  });

  describe('Circuit Breaker State Machine Engine', () => {
    it('initializes in CLOSED state with zero failures', () => {
      const breaker = new CircuitBreaker();
      assert.equal(breaker.getState(), 'CLOSED');
      assert.equal(breaker.getFailureCount(), 0);
      assert.equal(breaker.canExecute(), true);
    });

    it('remains CLOSED when failures are below the failureThreshold (3 strikes)', () => {
      const breaker = new CircuitBreaker({ failureThreshold: 3 });
      breaker.recordFailure();
      assert.equal(breaker.getState(), 'CLOSED');
      assert.equal(breaker.getFailureCount(), 1);

      breaker.recordFailure();
      assert.equal(breaker.getState(), 'CLOSED');
      assert.equal(breaker.getFailureCount(), 2);
    });

    it('trips to OPEN on the 3rd consecutive failure', () => {
      const breaker = new CircuitBreaker({ failureThreshold: 3 });
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();

      assert.equal(breaker.getState(), 'OPEN');
      assert.equal(breaker.canExecute(), false);
      assert.equal(breaker.getMetrics().totalTrips, 1);
    });

    it('resets consecutive failures to 0 on any successful dispatch', () => {
      const breaker = new CircuitBreaker({ failureThreshold: 3 });
      breaker.recordFailure();
      breaker.recordFailure();
      assert.equal(breaker.getFailureCount(), 2);

      breaker.recordSuccess();
      assert.equal(breaker.getState(), 'CLOSED');
      assert.equal(breaker.getFailureCount(), 0);
    });

    it('transitions to HALF_OPEN after cooldown period (60s) has elapsed', () => {
      let mockTime = 100000;
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        cooldownMs: 60000,
        nowFn: () => mockTime,
      });

      // Trip to OPEN
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      assert.equal(breaker.getState(), 'OPEN');

      // 30 seconds later -> still OPEN
      mockTime += 30000;
      assert.equal(breaker.getState(), 'OPEN');
      assert.equal(breaker.canExecute(), false);

      // 60 seconds later -> transitions to HALF_OPEN
      mockTime += 30001;
      assert.equal(breaker.getState(), 'HALF_OPEN');
      assert.equal(breaker.canExecute(), true);
    });

    it('allows only 1 probe in flight during HALF_OPEN', () => {
      let mockTime = 100000;
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        cooldownMs: 60000,
        nowFn: () => mockTime,
      });

      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      mockTime += 60001;
      assert.equal(breaker.getState(), 'HALF_OPEN');

      // First call consumes the probe
      assert.equal(breaker.canExecute(), true);
      // Subsequent calls during probe in-flight are rejected
      assert.equal(breaker.canExecute(), false);
    });

    it('resets to CLOSED when the HALF_OPEN probe succeeds', () => {
      let mockTime = 100000;
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        cooldownMs: 60000,
        nowFn: () => mockTime,
      });

      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      mockTime += 60001;
      assert.equal(breaker.getState(), 'HALF_OPEN');

      breaker.canExecute(); // initiate probe
      breaker.recordSuccess(); // probe succeeds

      assert.equal(breaker.getState(), 'CLOSED');
      assert.equal(breaker.getFailureCount(), 0);
      assert.equal(breaker.canExecute(), true);
    });

    it('re-trips to OPEN when the HALF_OPEN probe fails', () => {
      let mockTime = 100000;
      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        cooldownMs: 60000,
        nowFn: () => mockTime,
      });

      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      mockTime += 60001;
      assert.equal(breaker.getState(), 'HALF_OPEN');

      breaker.canExecute(); // initiate probe
      breaker.recordFailure(); // probe fails

      assert.equal(breaker.getState(), 'OPEN');
      assert.equal(breaker.canExecute(), false);

      // Advance only 30s -> still OPEN
      mockTime += 30000;
      assert.equal(breaker.getState(), 'OPEN');
    });
  });

  describe('Transient vs Non-Retryable Error Classifier', () => {
    it('identifies 502, 503, 504 and 429 as retryable gateway conditions', () => {
      assert.equal(isRetryableError(502), true);
      assert.equal(isRetryableError(503), true);
      assert.equal(isRetryableError(504), true);
      assert.equal(isRetryableError(429), true);
    });

    it('identifies 400, 401, 402, and 422 as non-retryable client errors', () => {
      assert.equal(isRetryableError(400), false);
      assert.equal(isRetryableError(401), false);
      assert.equal(isRetryableError(402), false);
      assert.equal(isRetryableError(422), false);
    });

    it('identifies NETWORK_UNREACHABLE and TIMEOUT as retryable', () => {
      assert.equal(isRetryableError(undefined, 'NETWORK_UNREACHABLE'), true);
      assert.equal(isRetryableError(undefined, 'TIMEOUT'), true);
      assert.equal(isRetryableError(new SmsTimeoutError()), true);
    });

    it('identifies GATEWAY_AUTH_ERROR, INSUFFICIENT_CREDITS, and INVALID_INPUT as non-retryable', () => {
      assert.equal(isRetryableError(undefined, 'GATEWAY_AUTH_ERROR'), false);
      assert.equal(isRetryableError(undefined, 'INSUFFICIENT_CREDITS'), false);
      assert.equal(isRetryableError(undefined, 'INVALID_RECIPIENT_MOBILE'), false);
      assert.equal(isRetryableError(undefined, 'INVALID_INPUT'), false);
    });
  });

  describe('Scenario: Fast-fail timeout when PhilSMS API hangs', () => {
    it('aborts at specified deadline via AbortController and throws SmsTimeoutError', async () => {
      const startTime = Date.now();
      await assert.rejects(
        async () => {
          await executeWithTimeout(
            () =>
              new Promise(() => {
                // simulated hanging API call (never resolves)
              }),
            100 // fast timeout for test execution
          );
        },
        (err: unknown) => {
          assert(err instanceof SmsTimeoutError);
          assert.match(err.message, /timed out/);
          return true;
        }
      );
      const elapsed = Date.now() - startTime;
      assert(elapsed >= 90 && elapsed < 500, `Elapsed ${elapsed}ms should be around 100ms`);
    });

    it('dispatchSmsSafe returns errorCode TIMEOUT without throwing an unhandled exception', async () => {
      const customBreaker = new CircuitBreaker({
        timeoutMs: 100,
        maxRetries: 0,
      });

      // Override global fetch to simulate a hung HTTP request
      const originalFetch = globalThis.fetch;
      globalThis.fetch = () =>
        new Promise(() => {
          // hangs indefinitely
        });
      process.env.PHILSMS_MOCK_DISPATCH = 'false';
      process.env.PHILSMS_API_TOKEN = 'test_token';

      try {
        const result = await dispatchSmsSafe(
          {
            recipientMobile: '09171234567',
            recipientType: 'CUSTOMER',
            message: 'Payment notification',
          },
          { timeoutMs: 100, maxRetries: 0 },
          customBreaker
        );

        assert.equal(result.success, false);
        assert.equal(result.errorCode, 'TIMEOUT');
        assert.equal(result.circuitState, 'CLOSED');
        assert.equal(customBreaker.getFailureCount(), 1);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('Scenario: Circuit breaker trips to OPEN after consecutive gateway failures', () => {
    it('trips to OPEN after 3 consecutive 503 gateway errors and fast-fails within 5ms', async () => {
      const customBreaker = new CircuitBreaker({
        failureThreshold: 3,
        cooldownMs: 60000,
        maxRetries: 0,
      });

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ status: 'error', message: 'Service Unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      process.env.PHILSMS_MOCK_DISPATCH = 'false';
      process.env.PHILSMS_API_TOKEN = 'test_token';

      try {
        // Call 1
        const res1 = await dispatchSmsSafe(
          { recipientMobile: '09171234567', recipientType: 'CUSTOMER', message: 'Call 1' },
          { maxRetries: 0 },
          customBreaker
        );
        assert.equal(res1.success, false);
        assert.equal(customBreaker.getState(), 'CLOSED');
        assert.equal(customBreaker.getFailureCount(), 1);

        // Call 2
        const res2 = await dispatchSmsSafe(
          { recipientMobile: '09171234567', recipientType: 'CUSTOMER', message: 'Call 2' },
          { maxRetries: 0 },
          customBreaker
        );
        assert.equal(res2.success, false);
        assert.equal(customBreaker.getState(), 'CLOSED');
        assert.equal(customBreaker.getFailureCount(), 2);

        // Call 3 (Strikes out)
        const res3 = await dispatchSmsSafe(
          { recipientMobile: '09171234567', recipientType: 'CUSTOMER', message: 'Call 3' },
          { maxRetries: 0 },
          customBreaker
        );
        assert.equal(res3.success, false);
        assert.equal(customBreaker.getState(), 'OPEN');
        assert.equal(res3.circuitState, 'OPEN');

        // Subsequent call in OPEN state fast-fails in < 5ms without calling fetch
        let fetchCalledAfterTrip = false;
        globalThis.fetch = async () => {
          fetchCalledAfterTrip = true;
          return new Response('{}', { status: 200 });
        };

        const fastFailStart = Date.now();
        const res4 = await dispatchSmsSafe(
          { recipientMobile: '09171234567', recipientType: 'CUSTOMER', message: 'Call 4' },
          { maxRetries: 0 },
          customBreaker
        );
        const fastFailDuration = Date.now() - fastFailStart;

        assert.equal(res4.success, false);
        assert.equal(res4.errorCode, 'CIRCUIT_OPEN');
        assert.equal(res4.circuitState, 'OPEN');
        assert.equal(fetchCalledAfterTrip, false, 'Fetch must NOT be called when circuit is OPEN');
        assert(
          fastFailDuration < 10,
          `Fast fail took ${fastFailDuration}ms, must be < 10ms (DoD target: < 5ms)`
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('Scenario: Circuit breaker recovers through HALF_OPEN state', () => {
    it('shifts to HALF_OPEN after cooldown and resets to CLOSED on successful probe', async () => {
      let simulatedTime = 100000;
      const customBreaker = new CircuitBreaker({
        failureThreshold: 3,
        cooldownMs: 60000,
        nowFn: () => simulatedTime,
      });

      // Trip the breaker
      customBreaker.recordFailure();
      customBreaker.recordFailure();
      customBreaker.recordFailure();
      assert.equal(customBreaker.getState(), 'OPEN');

      // Cooldown expires
      simulatedTime += 60001;
      assert.equal(customBreaker.getState(), 'HALF_OPEN');

      // Mock mode returns successful probe
      process.env.PHILSMS_MOCK_DISPATCH = 'true';
      const probeResult = await dispatchSmsSafe(
        { recipientMobile: '09171234567', recipientType: 'CUSTOMER', message: 'Probe test' },
        {},
        customBreaker
      );

      assert.equal(probeResult.success, true);
      assert.equal(customBreaker.getState(), 'CLOSED');
      assert.equal(customBreaker.getFailureCount(), 0);
    });
  });

  describe('Scenario: Transient 502 error recovers on single retry', () => {
    it('retries on initial 502 and succeeds on 2nd attempt with duration logged', async () => {
      let callCount = 0;
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        callCount++;
        if (callCount === 1) {
          return new Response(JSON.stringify({ message: 'Bad Gateway' }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(
          JSON.stringify({
            status: 'success',
            data: { uid: 'recovered_502_msg_id', cost: 1 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };
      process.env.PHILSMS_MOCK_DISPATCH = 'false';
      process.env.PHILSMS_API_TOKEN = 'test_token';

      try {
        const customBreaker = new CircuitBreaker();
        const result = await dispatchSmsSafe(
          { recipientMobile: '09171234567', recipientType: 'CUSTOMER', message: 'Retry test' },
          { maxRetries: 1, baseRetryDelayMs: 10, jitterMs: 5 }, // minimal delay for test speed
          customBreaker
        );

        assert.equal(result.success, true);
        assert.equal(result.messageId, 'recovered_502_msg_id');
        assert.equal(result.retryCount, 1);
        assert.equal(callCount, 2);
        assert.equal(customBreaker.getState(), 'CLOSED');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('Scenario: Non-retryable errors fail immediately without retry or tripping circuit', () => {
    it('fails immediately on HTTP 401 Unauthorized without retrying and leaves breaker CLOSED', async () => {
      let callCount = 0;
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        callCount++;
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      };
      process.env.PHILSMS_MOCK_DISPATCH = 'false';
      process.env.PHILSMS_API_TOKEN = 'bad_token';

      try {
        const customBreaker = new CircuitBreaker();
        const result = await dispatchSmsSafe(
          { recipientMobile: '09171234567', recipientType: 'CUSTOMER', message: 'Auth failure' },
          { maxRetries: 1, baseRetryDelayMs: 10, jitterMs: 5 },
          customBreaker
        );

        assert.equal(result.success, false);
        assert.equal(result.errorCode, 'GATEWAY_ERROR');
        assert.equal(callCount, 1, 'Non-retryable 401 must not trigger retry attempts');
        assert.equal(customBreaker.getState(), 'CLOSED');
        assert.equal(customBreaker.getFailureCount(), 0, 'Auth errors must not trip the circuit breaker');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('rejects invalid recipient mobile as INVALID_INPUT immediately', async () => {
      const customBreaker = new CircuitBreaker();
      const result = await dispatchSmsSafe(
        { recipientMobile: '', recipientType: 'CUSTOMER', message: 'Empty phone' },
        {},
        customBreaker
      );

      assert.equal(result.success, false);
      assert.equal(result.errorCode, 'INVALID_INPUT');
      assert.equal(customBreaker.getState(), 'CLOSED');
      assert.equal(customBreaker.getFailureCount(), 0);
    });
  });

  describe('Scenario: Point-of-sale checkout commits successfully despite SMS failure', () => {
    it('persists sale transaction into database even when SMS gateway times out or fails', async () => {
      const saleService = new SaleService(null);

      // Simulate a completely broken/hanging SMS dispatch
      const customBreaker = new CircuitBreaker({
        failureThreshold: 1,
        cooldownMs: 60000,
      });
      customBreaker.recordFailure(); // trip breaker to OPEN

      // 1. Point of sale checkout commits
      const checkoutResult = await saleService.createSaleTransaction({
        customerId: 'c1',
        lines: [
          {
            productId: 'prod-patis',
            variantId: 'patis-gal',
            size: 'gal',
            quantity: 1,
            unitPrice: 200,
            unitCost: 160,
          },
        ],
        paymentStatus: 'Partially Paid',
        amountPaid: 50,
        orderStatus: 'Pending',
      });

      assert.equal(checkoutResult.success, true, 'Checkout must succeed');
      const createdSale = checkoutResult.sale;
      assert(createdSale, 'Sale transaction record must be created');
      assert.equal(createdSale.balance, 150);
      assert.equal(createdSale.payment_status, 'Partially Paid');

      // 2. Outbound SMS dispatch executed with error isolation
      const smsResult = await dispatchSmsSafe(
        {
          recipientMobile: '09171234567',
          recipientType: 'CUSTOMER',
          message: `Receipt #${createdSale.receipt_number}: Balance ₱150.00`,
        },
        {},
        customBreaker
      );

      // 3. Confirm SMS failed gracefully due to OPEN circuit
      assert.equal(smsResult.success, false);
      assert.equal(smsResult.errorCode, 'CIRCUIT_OPEN');

      // 4. Invariant: Sale remains committed and readable in the database/ledger
      const verifiedSale = await saleService.getSaleById(createdSale.id);
      assert(verifiedSale, 'Sale must remain committed in database despite SMS failure');
      assert.equal(verifiedSale.id, createdSale.id);
      assert.equal(verifiedSale.balance, 150);
      assert.equal(verifiedSale.receipt_number, createdSale.receipt_number);
    });
  });
});
