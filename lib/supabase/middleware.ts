import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function isMissingSupabaseConfig(url?: string, anonKey?: string): boolean {
  return !url || !anonKey || url === 'your-project-url'
}

function copyCookies(sourceResponse: NextResponse, targetResponse: NextResponse): void {
  sourceResponse.cookies.getAll().forEach(cookie => {
    targetResponse.cookies.set(cookie.name, cookie.value, cookie)
  })
}

function redirectToLogin(request: NextRequest, sourceResponse?: NextResponse): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  const target = request.nextUrl.pathname + request.nextUrl.search
  if (target && target !== '/') {
    url.searchParams.set('redirectTo', target)
  }
  const redirectResponse = NextResponse.redirect(url)
  if (sourceResponse) {
    copyCookies(sourceResponse, redirectResponse)
  }
  return redirectResponse
}

function redirectToDashboard(request: NextRequest, sourceResponse: NextResponse): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/dashboard'
  url.searchParams.delete('redirectTo')
  const redirectResponse = NextResponse.redirect(url)
  copyCookies(sourceResponse, redirectResponse)
  return redirectResponse
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth')
  const isPublicAuthRoute = isAuthPage || isAuthCallback

  // If Supabase credentials are not configured yet, guard protected routes gracefully
  if (isMissingSupabaseConfig(supabaseUrl, supabaseAnonKey)) {
    if (!isPublicAuthRoute) {
      if (process.env.NODE_ENV === 'development') {
        return supabaseResponse
      }
      return redirectToLogin(request)
    }
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseAnonKey!,
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

  // Avoid unnecessary and failing network requests when no auth cookies exist
  const hasAuthCookie = request.cookies.getAll().some(
    cookie => cookie.name.includes('auth-token') || cookie.name.startsWith('sb-')
  )

  let user = null
  if (hasAuthCookie) {
    try {
      const { data } = await supabase.auth.getUser()
      user = data?.user ?? null
    } catch {
      // Gracefully handle auth error if project is offline or keys are invalid during dev
      user = null
    }
  }

  // Scenario 3: Protected Route Interception
  // If user is unauthenticated and attempting to visit any protected route
  if (!user && !isPublicAuthRoute) {
    if (process.env.NODE_ENV === 'development') {
      return supabaseResponse
    }
    return redirectToLogin(request, supabaseResponse)
  }

  // If user is authenticated and navigating to /login or root /
  if (user && (isAuthPage || request.nextUrl.pathname === '/')) {
    return redirectToDashboard(request, supabaseResponse)
  }

  return supabaseResponse
}
