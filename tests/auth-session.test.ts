import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateLoginInput,
  DEFAULT_ROUTE_PROTECTION_CONFIG,
} from '../specs/001-supabase-ssr-auth/contracts/auth-contracts.ts';

describe('Supabase SSR Authentication & Session Contracts (ARL-2)', () => {
  describe('validateLoginInput validation logic', () => {
    test('rejects empty or whitespace-only email', () => {
      const res1 = validateLoginInput({ email: '', password: 'password123' });
      assert.strictEqual(res1.isValid, false);
      assert.strictEqual(res1.error, 'Email is required');

      const res2 = validateLoginInput({ email: '   ', password: 'password123' });
      assert.strictEqual(res2.isValid, false);
      assert.strictEqual(res2.error, 'Email is required');
    });

    test('rejects invalid email format missing @', () => {
      const res = validateLoginInput({ email: 'adminarlq.com', password: 'password123' });
      assert.strictEqual(res.isValid, false);
      assert.strictEqual(res.error, 'Please enter a valid email address');
    });

    test('rejects missing or empty password', () => {
      const res1 = validateLoginInput({ email: 'admin@arlq.com', password: '' });
      assert.strictEqual(res1.isValid, false);
      assert.strictEqual(res1.error, 'Password is required');

      const res2 = validateLoginInput({ email: 'admin@arlq.com' });
      assert.strictEqual(res2.isValid, false);
      assert.strictEqual(res2.error, 'Password is required');
    });

    test('accepts valid credentials matching ARLQ administrator account', () => {
      const res = validateLoginInput({
        email: 'admin@arlq.com',
        password: 'admin123',
      });
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.error, undefined);
    });
  });

  describe('DEFAULT_ROUTE_PROTECTION_CONFIG routing invariants', () => {
    test('designates public routes matching specifications', () => {
      assert.ok(DEFAULT_ROUTE_PROTECTION_CONFIG.publicRoutes.includes('/login'));
      assert.ok(DEFAULT_ROUTE_PROTECTION_CONFIG.publicRoutes.includes('/auth/callback'));
    });

    test('designates default redirect destinations for auth states', () => {
      assert.strictEqual(
        DEFAULT_ROUTE_PROTECTION_CONFIG.defaultRedirectAuthenticated,
        '/dashboard'
      );
      assert.strictEqual(
        DEFAULT_ROUTE_PROTECTION_CONFIG.defaultRedirectUnauthenticated,
        '/login'
      );
      assert.strictEqual(DEFAULT_ROUTE_PROTECTION_CONFIG.loginPath, '/login');
    });

    test('landing page route resolution adheres to auth status', () => {
      // Unauthenticated landing page destination must be login
      const unauthDestination = DEFAULT_ROUTE_PROTECTION_CONFIG.defaultRedirectUnauthenticated;
      assert.strictEqual(unauthDestination, '/login');

      // Authenticated landing page destination must be dashboard
      const authDestination = DEFAULT_ROUTE_PROTECTION_CONFIG.defaultRedirectAuthenticated;
      assert.strictEqual(authDestination, '/dashboard');
    });
  });
});
