'use client'

import { useActionState } from 'react'
import { loginAction } from './actions'
import type { LoginFormState } from '@/specs/001-supabase-ssr-auth/contracts/auth-contracts'

interface LoginFormProps {
  redirectTo?: string
}

const initialState: LoginFormState = {
  email: '',
  error: null,
  success: false,
}

export function LoginForm({ redirectTo = '/dashboard' }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)

  return (
    <form action={formAction} className="w-full">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <h2 className="text-3xl font-bold tracking-tight text-text-primary">
        Log in
      </h2>
      <p className="mt-2 mb-8 text-[16px] text-text-muted">
        Administrator access only.
      </p>

      {state?.error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-6 p-3.5 rounded-lg bg-danger-light border border-danger-border text-danger text-sm flex items-start gap-2.5 transition-all"
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

      <div className="mb-5.5">
        <label
          htmlFor="email"
          className="block text-[15.5px] font-semibold text-text-primary mb-2"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={state?.email || ''}
          autoComplete="username"
          required
          placeholder="admin@arlq.com"
          className="w-full min-h-[48px] px-4 py-3 text-[16.5px] rounded-lg bg-bg-input text-text-primary border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-border-focus transition-colors"
        />
      </div>

      <div className="mb-6">
        <label
          htmlFor="password"
          className="block text-[15.5px] font-semibold text-text-primary mb-2"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="w-full min-h-[48px] px-4 py-3 text-[16.5px] rounded-lg bg-bg-input text-text-primary border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:border-border-focus transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full min-h-[48px] py-3 px-5 rounded-lg text-[16.5px] font-semibold bg-primary hover:bg-primary-hover text-text-light transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
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

      <p className="mt-5 text-[14px] text-text-muted text-center">
        Forgot your password? Contact the system developer to reset it.
      </p>
    </form>
  )
}
