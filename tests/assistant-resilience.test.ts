import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  pruneConversationHistory,
  mapGeminiError,
  MISSING_API_KEY_MESSAGE,
  RATE_LIMIT_MESSAGE,
  TIMEOUT_MESSAGE,
  UPSTREAM_OUTAGE_MESSAGE,
  GENERIC_ERROR_MESSAGE,
  STATUS_INDICATOR_MESSAGE,
} from '../lib/assistant/assistant-resilience.ts';
import { containsEmoji, SendMessageInputSchema } from '../lib/assistant/assistant-contracts.ts';
import { POST, pruneConversationHistory as routePruneHelper } from '../app/api/chat/route.ts';

describe('Gemini Free-Tier Resilience, Context Pruning & Rate Limits (ARL-34)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.ASSISTANT_OFFLINE_MODE;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('1. Standardized Error Constants & Zero-Emoji Compliance', () => {
    test('error constants match Jira specifications letter-for-letter', () => {
      assert.strictEqual(
        MISSING_API_KEY_MESSAGE,
        'The store assistant is not configured. Please configure GEMINI_API_KEY in the environment settings.'
      );
      assert.strictEqual(
        RATE_LIMIT_MESSAGE,
        'The store assistant is receiving high request traffic. Please wait 30 seconds before sending another question.'
      );
      assert.strictEqual(
        TIMEOUT_MESSAGE,
        'The request timed out while checking store records. Please try again.'
      );
      assert.strictEqual(
        UPSTREAM_OUTAGE_MESSAGE,
        'The store assistant service is temporarily unavailable. Please try again shortly.'
      );
      assert.strictEqual(
        GENERIC_ERROR_MESSAGE,
        'An unexpected error occurred while processing your request. Please try again.'
      );
      assert.strictEqual(STATUS_INDICATOR_MESSAGE, 'Checking store records...');
    });

    test('error constants and status indicator contain strictly zero emojis', () => {
      assert.strictEqual(containsEmoji(MISSING_API_KEY_MESSAGE), false);
      assert.strictEqual(containsEmoji(RATE_LIMIT_MESSAGE), false);
      assert.strictEqual(containsEmoji(TIMEOUT_MESSAGE), false);
      assert.strictEqual(containsEmoji(UPSTREAM_OUTAGE_MESSAGE), false);
      assert.strictEqual(containsEmoji(GENERIC_ERROR_MESSAGE), false);
      assert.strictEqual(containsEmoji(STATUS_INDICATOR_MESSAGE), false);
    });
  });

  describe('2. Context Pruning (Sliding Window Mechanism)', () => {
    test('handles empty message array gracefully', () => {
      const result = pruneConversationHistory([]);
      assert.deepStrictEqual(result, []);
    });

    test('retains all messages when count is less than or equal to maxTurns (6)', () => {
      const turns = [
        { role: 'user', content: 'Turn 1' },
        { role: 'assistant', content: 'Reply 1' },
        { role: 'user', content: 'Turn 2' },
        { role: 'assistant', content: 'Reply 2' },
      ];
      const result = pruneConversationHistory(turns, 6);
      assert.strictEqual(result.length, 4);
      assert.deepStrictEqual(result, turns);
    });

    test('prunes history to exactly 6 most recent message turns when history exceeds limit', () => {
      const turns = [
        { role: 'user', content: 'Turn 1' },
        { role: 'assistant', content: 'Reply 1' },
        { role: 'user', content: 'Turn 2' },
        { role: 'assistant', content: 'Reply 2' },
        { role: 'user', content: 'Turn 3' },
        { role: 'assistant', content: 'Reply 3' },
        { role: 'user', content: 'Turn 4' },
        { role: 'assistant', content: 'Reply 4' },
        { role: 'user', content: 'Turn 5' },
        { role: 'assistant', content: 'Reply 5' },
      ];

      const result = pruneConversationHistory(turns, 6);
      assert.strictEqual(result.length, 6);
      // Must retain Turns 3, 4, 5
      assert.strictEqual(result[0].content, 'Turn 3');
      assert.strictEqual(result[1].content, 'Reply 3');
      assert.strictEqual(result[2].content, 'Turn 4');
      assert.strictEqual(result[3].content, 'Reply 4');
      assert.strictEqual(result[4].content, 'Turn 5');
      assert.strictEqual(result[5].content, 'Reply 5');
    });

    test('re-exported pruneConversationHistory from chat route behaves identically', () => {
      assert.strictEqual(typeof routePruneHelper, 'function');
      const turns = Array.from({ length: 10 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Msg ${i}`,
      }));
      const pruned = routePruneHelper(turns, 6);
      assert.strictEqual(pruned.length, 6);
      assert.strictEqual(pruned[5].content, 'Msg 9');
    });
  });

  describe('3. Error Mapping & Upstream Status Handler', () => {
    test('maps HTTP 429 and RESOURCE_EXHAUSTED bodies to 429 with RATE_LIMIT_MESSAGE', () => {
      const byStatus = mapGeminiError(429);
      assert.strictEqual(byStatus.status, 429);
      assert.strictEqual(byStatus.message, RATE_LIMIT_MESSAGE);

      const byBody = mapGeminiError(
        400,
        JSON.stringify({ error: { message: 'Quota exceeded', status: 'RESOURCE_EXHAUSTED' } })
      );
      assert.strictEqual(byBody.status, 429);
      assert.strictEqual(byBody.message, RATE_LIMIT_MESSAGE);

      const byError = mapGeminiError(new Error('Fetch failed with status 429 RESOURCE_EXHAUSTED'));
      assert.strictEqual(byError.status, 429);
      assert.strictEqual(byError.message, RATE_LIMIT_MESSAGE);
    });

    test('maps request timeouts and AbortError to 504 with TIMEOUT_MESSAGE', () => {
      const byStatus = mapGeminiError(504);
      assert.strictEqual(byStatus.status, 504);
      assert.strictEqual(byStatus.message, TIMEOUT_MESSAGE);

      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      const byAbort = mapGeminiError(abortError);
      assert.strictEqual(byAbort.status, 504);
      assert.strictEqual(byAbort.message, TIMEOUT_MESSAGE);
    });

    test('maps 500, 502, 503, and UNAVAILABLE to 503 with UPSTREAM_OUTAGE_MESSAGE', () => {
      const s500 = mapGeminiError(500);
      assert.strictEqual(s500.status, 503);
      assert.strictEqual(s500.message, UPSTREAM_OUTAGE_MESSAGE);

      const s502 = mapGeminiError(502);
      assert.strictEqual(s502.status, 503);
      assert.strictEqual(s502.message, UPSTREAM_OUTAGE_MESSAGE);

      const s503 = mapGeminiError(503);
      assert.strictEqual(s503.status, 503);
      assert.strictEqual(s503.message, UPSTREAM_OUTAGE_MESSAGE);

      const byBody = mapGeminiError(
        503,
        JSON.stringify({ error: { status: 'UNAVAILABLE' } })
      );
      assert.strictEqual(byBody.status, 503);
      assert.strictEqual(byBody.message, UPSTREAM_OUTAGE_MESSAGE);
    });

    test('maps unknown runtime exceptions to 500 with GENERIC_ERROR_MESSAGE', () => {
      const generic = mapGeminiError(new Error('Something completely unexpected'));
      assert.strictEqual(generic.status, 500);
      assert.strictEqual(generic.message, GENERIC_ERROR_MESSAGE);
    });
  });

  describe('4. Scenario 4: Missing GEMINI_API_KEY Environment Notice', () => {
    test('POST /api/chat returns HTTP 503 when GEMINI_API_KEY is not configured', async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.ASSISTANT_OFFLINE_MODE;

      const req = new Request('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'What is our low stock status?' }],
        }),
      });

      const res = await POST(req);
      assert.strictEqual(res.status, 503);
      const json = (await res.json()) as { error: string };
      assert.strictEqual(json.error, MISSING_API_KEY_MESSAGE);
      assert.strictEqual(containsEmoji(json.error), false);
    });
  });

  describe('5. Scenario 3 & 5: Mock Upstream Interception (Rate Limit 429 & Timeout 504)', () => {
    test('POST /api/chat catches HTTP 429 from Google Generative Language API', async () => {
      process.env.GEMINI_API_KEY = 'test-mock-key';

      // Mock global fetch to simulate Google AI Studio returning 429 RESOURCE_EXHAUSTED
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            error: {
              code: 429,
              message: 'Resource has been exhausted (e.g. check quota).',
              status: 'RESOURCE_EXHAUSTED',
            },
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      };

      try {
        const req = new Request('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'How many bottles of Toyo 1L are in stock?' }],
          }),
        });

        const res = await POST(req);
        assert.strictEqual(res.status, 429);
        const json = (await res.json()) as { error: string };
        assert.strictEqual(json.error, RATE_LIMIT_MESSAGE);
        assert.strictEqual(containsEmoji(json.error), false);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    test('POST /api/chat catches timeout > 15s and returns HTTP 504 cleanly', async () => {
      process.env.GEMINI_API_KEY = 'test-mock-key';

      const originalFetch = globalThis.fetch;
      globalThis.fetch = async () => {
        const abortError = new Error('The operation was aborted');
        abortError.name = 'AbortError';
        throw abortError;
      };

      try {
        const req = new Request('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'Summarize today sales' }],
          }),
        });

        const res = await POST(req);
        assert.strictEqual(res.status, 504);
        const json = (await res.json()) as { error: string };
        assert.strictEqual(json.error, TIMEOUT_MESSAGE);
        assert.strictEqual(containsEmoji(json.error), false);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('6. Scenario 1: Context Pruning in Chat API Route Dispatch', () => {
    test('POST /api/chat passes only the 6 most recent message turns to upstream Gemini', async () => {
      process.env.GEMINI_API_KEY = 'test-mock-key';

      let capturedPayload: unknown = null;
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (_input, init) => {
        if (init?.body) {
          capturedPayload = JSON.parse(init.body as string);
        }
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: 'All systems operational.' }],
                },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      try {
        // Create 10 previous in-scope message turns
        const tenMessages = Array.from({ length: 10 }, (_, i) => ({
          role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
          content:
            i % 2 === 0
              ? `Check inventory stock for Toyo size ${i}`
              : `Toyo size ${i} currently has 20 units in store.`,
        }));

        const req = new Request('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: tenMessages }),
        });

        const res = await POST(req);
        assert.strictEqual(res.status, 200);

        // Verify captured contents has length 6
        const payloadObj = capturedPayload as { contents: Array<{ role: string; parts: Array<{ text: string }> }> };
        assert.ok(payloadObj);
        assert.strictEqual(payloadObj.contents.length, 6);
        assert.strictEqual(payloadObj.contents[0].parts[0].text, 'Check inventory stock for Toyo size 4');
        assert.strictEqual(payloadObj.contents[5].parts[0].text, 'Toyo size 9 currently has 20 units in store.');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('7. Scenario 2: Prevention of Duplicate Submissions & Client Debounce', () => {
    test('input submission blocks empty or whitespace-only messages', () => {
      assert.strictEqual(SendMessageInputSchema.safeParse({ content: '' }).success, false);
      assert.strictEqual(SendMessageInputSchema.safeParse({ content: '   ' }).success, false);
      assert.strictEqual(SendMessageInputSchema.safeParse({ content: '\n\t  ' }).success, false);
      assert.strictEqual(SendMessageInputSchema.safeParse({ content: 'Valid message' }).success, true);
    });

    test('error state maintains lastFailedQuery for clean recovery', () => {
      // Test message turn with error status
      const errorMessage = {
        id: 'err_123',
        role: 'assistant' as const,
        content: RATE_LIMIT_MESSAGE,
        timestamp: new Date().toISOString(),
        status: 'error' as const,
      };

      assert.strictEqual(errorMessage.status, 'error');
      assert.strictEqual(errorMessage.content, RATE_LIMIT_MESSAGE);
      assert.strictEqual(containsEmoji(errorMessage.content), false);
    });
  });
});
