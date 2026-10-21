/**
 * Authentication and Session Contract Interfaces
 * Feature Key: ARL-2
 * Feature Slug: 001-supabase-ssr-auth
 */

export interface LoginCredentials {
  email: string;
  password: string;
  redirectTo?: string;
}

export interface LoginFormState {
  email?: string;
  error?: string | null;
  success?: boolean;
  redirectTo?: string;
}

export interface AuthErrorResponse {
  message: string;
  code?: string;
  status?: number;
}

export interface SessionValidationResult {
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
  error?: string | null;
}

export interface RouteProtectionConfig {
  publicRoutes: readonly string[];
  defaultRedirectAuthenticated: string;
  defaultRedirectUnauthenticated: string;
  loginPath: string;
}

export const DEFAULT_ROUTE_PROTECTION_CONFIG: RouteProtectionConfig = {
  publicRoutes: ['/login', '/auth/callback'],
  defaultRedirectAuthenticated: '/dashboard',
  defaultRedirectUnauthenticated: '/login',
  loginPath: '/login',
};

/**
 * Validates login input parameters.
 * Basic client and server invariant checking.
 */
export function validateLoginInput(credentials: Partial<LoginCredentials>): {
  isValid: boolean;
  error?: string;
} {
  if (!credentials.email || !credentials.email.trim()) {
    return { isValid: false, error: 'Email is required' };
  }
  if (!credentials.email.includes('@')) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  if (!credentials.password || credentials.password.length === 0) {
    return { isValid: false, error: 'Password is required' };
  }
  return { isValid: true };
}
