'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { LoginFormState } from '@/specs/001-supabase-ssr-auth/contracts/auth-contracts'

export async function loginAction(
  prevState: LoginFormState | null,
  formData: FormData
): Promise<LoginFormState> {
  const email = formData.get('email')?.toString().trim() || ''
  const password = formData.get('password')?.toString() || ''
  const redirectTo = formData.get('redirectTo')?.toString().trim() || '/dashboard'

  if (!email || !password) {
    return {
      email,
      error: 'Please enter both email and password.',
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your-project-url') {
    return {
      email,
      error: 'Supabase connection is not configured. Please supply valid project credentials.',
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      email,
      error: error.message === 'Invalid login credentials' 
        ? 'Invalid login credentials. Please verify your email and password.'
        : error.message,
    }
  }

  // Redirect on successful authentication (safe target check)
  const target = redirectTo.startsWith('/') ? redirectTo : '/dashboard'
  redirect(target)
}

export async function logoutAction(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your-project-url') {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }

  redirect('/login')
}
