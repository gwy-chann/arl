import { createBrowserClient } from '@supabase/ssr'

export function isMissingSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !url || !key || url === 'your-project-url'
}

export function createClient() {
  if (isMissingSupabaseConfig()) {
    throw new Error(
      "Your project's URL and Key are required to create a Supabase client!\n\n" +
      "Check your Supabase project's API settings to find these values:\n" +
      "https://supabase.com/dashboard/project/_/settings/api"
    )
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function getSafeBrowserSupabaseClient() {
  try {
    if (isMissingSupabaseConfig()) {
      return null
    }
    return createClient()
  } catch {
    return null
  }
}
