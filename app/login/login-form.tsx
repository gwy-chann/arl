'use client';

import { useActionState } from 'react';
import { loginAction } from './actions';
import type { LoginFormState } from '@/specs/001-supabase-ssr-auth/contracts/auth-contracts';

interface LoginFormProps {
  redirectTo?: string;
}

const initialState: LoginFormState = {
  email: '',
  username: 'admin',
  error: null,
  success: false,
};

export function LoginForm({ redirectTo = '/dashboard' }: Readonly<LoginFormProps>) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="login-form">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <h2>Log in</h2>
      <p className="sub">Administrator access only.</p>

      {state?.error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-5.5 p-3.5 rounded-lg bg-danger-light border border-danger-border text-danger text-sm flex items-start gap-2.5 transition-all"
        >
          <svg
            className="w-5 h-5 shrink-0 mt-0.5 text-danger"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="font-medium leading-relaxed">{state.error}</span>
        </div>
      )}

      <div className="field">
        <label htmlFor="u">Username</label>
        <input
          id="u"
          name="username"
          type="text"
          defaultValue={state?.username || state?.email || 'admin'}
          autoComplete="username"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="pw">Password</label>
        <input
          id="pw"
          name="password"
          type="password"
          defaultValue="password123"
          autoComplete="current-password"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="btn block"
      >
        {isPending ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-text-light"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Logging in...</span>
          </>
        ) : (
          <span>Log in</span>
        )}
      </button>

      <p className="hint muted" style={{ marginTop: '20px', fontSize: '14px', textAlign: 'center' }}>
        Forgot your password? Contact the system developer to reset it.
      </p>
    </form>
  );
}
