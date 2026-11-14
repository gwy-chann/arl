'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { LoginFormState } from '@/specs/001-supabase-ssr-auth/contracts/auth-contracts';

export async function loginAction(
  prevState: LoginFormState | null,
  formData: FormData
): Promise<LoginFormState> {
  const rawInput = (
    formData.get('username')?.toString() ||
    formData.get('email')?.toString() ||
    ''
  ).trim();
  const password = formData.get('password')?.toString() || '';
  const redirectTo = formData.get('redirectTo')?.toString().trim() || '/dashboard';

  if (!rawInput || !password) {
    return {
      email: rawInput,
      username: rawInput,
      error: 'Please enter both username and password.',
    };
  }

  const email = rawInput.includes('@') ? rawInput : `${rawInput}@arlq.com`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your-project-url') {
    return {
      email,
      username: rawInput,
      error: 'Supabase connection is not configured. Please supply valid project credentials.',
    };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        email,
        username: rawInput,
        error: error.message === 'Invalid login credentials' 
          ? 'Invalid login credentials. Please verify your username and password.'
          : error.message,
      };
    }
  } catch (err: unknown) {
    // If Next.js redirect was thrown, re-throw it so Next.js handles the redirect
    if (err && typeof err === 'object' && 'digest' in err) {
      throw err;
    }

    return {
      email,
      username: rawInput,
      error: 'Cannot connect to Supabase. Ensure local Supabase is running (npx supabase start) or check your network.',
    };
  }

  // Redirect on successful authentication (safe target check)
  const target = redirectTo.startsWith('/') ? redirectTo : '/dashboard';
  redirect(target);
}

export async function logoutAction(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your-project-url') {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Offline fallback
    }
  }

  redirect('/login');
}
