import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth')

  // If Supabase credentials are not configured yet, guard protected routes gracefully
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your-project-url') {
    if (!isAuthPage && !isAuthCallback) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      const target = request.nextUrl.pathname + request.nextUrl.search
      if (target && target !== '/') {
        url.searchParams.set('redirectTo', target)
      }
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Gracefully handle auth error if project is offline or keys are invalid during dev
    user = null
  }

  // Scenario 3: Protected Route Interception
  // If user is unauthenticated and attempting to visit any protected route
  if (!user && !isAuthPage && !isAuthCallback) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const target = request.nextUrl.pathname + request.nextUrl.search
    if (target && target !== '/') {
      url.searchParams.set('redirectTo', target)
    }
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  // If user is authenticated and navigating to /login or root /
  if (user && (isAuthPage || request.nextUrl.pathname === '/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.searchParams.delete('redirectTo')
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  return supabaseResponse
}
