import { createMiddleware } from '@tanstack/react-start';
import { createServerFn } from '@tanstack/react-start';
import { authLogger, loggers } from '@/utils/logger';
import { redirect } from '@tanstack/react-router';
import { authService } from '@/services/auth-service';
import { userService } from '@/services/user-service';

const BACKEND = process.env.VITE_BACKEND_URL ?? 'http://localhost:8080';

// Simple in-memory cache for auth results (server-side only)
let authCache: {
  user: any;
  timestamp: number;
  cookieHash: string;
} | null = null;

const CACHE_DURATION = 30 * 1000; // 30 seconds

// Create a hash of cookies to detect changes
function hashCookies(cookies: string): string {
  return cookies.split(';').sort().join(';').trim();
}

// Create a server function to fetch user data with caching
const fetchUser = createServerFn({ method: 'GET' }).handler(async () => {
  // Import server-side utilities inside the handler
  const { getHeaders } = await import('@tanstack/react-start/server');
  
  let user: any = null;
  try {
    const headers = getHeaders();
    const cookieHeader = headers['cookie'] || '';
    
    // If no cookies, return null user
    if (!cookieHeader) {
      authLogger.info('Auth middleware - No cookies available, skipping API call');
      return null;
    }

    const cookieHash = hashCookies(cookieHeader);
    const now = Date.now();

    // Check cache first
    if (authCache && 
        authCache.cookieHash === cookieHash && 
        (now - authCache.timestamp) < CACHE_DURATION) {
      authLogger.info('Auth middleware - Using cached authentication result');
      return authCache.user;
    }

    authLogger.info('Auth middleware - Cookie header:', cookieHeader ? 'Present' : 'Missing');

    // Make direct request to Go backend with cookies forwarded
    authLogger.info('Auth middleware - Making request to Go backend /api/me');
    
    const response = await fetch(`${BACKEND}/api/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader, // Forward all cookies to Go backend
      },
      credentials: 'include',
    });

    authLogger.info('Auth middleware - Go backend response status:', response.status);

    if (response.ok) {
      const json = await response.json();
      authLogger.info('Auth middleware - Response received from Go backend');
      
      // Go backend returns: { success: true, data: { user data } }
      if (json.success && json.data) {
        user = json.data;
        
        // Cache the successful result
        authCache = {
          user,
          timestamp: now,
          cookieHash,
        };
        
        authLogger.info('Auth middleware - User authenticated successfully (cached)', { 
          userId: user.id || 'unknown',
          email: user.email || 'unknown'
        });
      } else {
        authLogger.warn('Auth middleware - Go backend returned unsuccessful response', json);
        // Clear cache on auth failure
        authCache = null;
      }
    } else {
      const errorText = await response.text();
      authLogger.error('Auth middleware - Go backend request failed', { 
        status: response.status, 
        statusText: response.statusText, 
        error: errorText 
      });
      // Clear cache on error
      authCache = null;
    }
  } catch (err) {
    // Go backend unreachable or other error; treat as unauthenticated
    authLogger.error('Auth middleware - Error checking authentication with Go backend:', err);
    // Clear cache on error
    authCache = null;
  }

  return user;
});

export const authMiddleware = createMiddleware({
  type: 'function',
  validateClient: true,
}).server(async ({ next }) => {
  const user = await fetchUser();

  // If no user found, redirect to login
  if (!user) {
    authLogger.info('Auth middleware - No user found, redirecting to login');
    throw redirect({ to: '/login' });
  }

  authLogger.info('Auth middleware - User context set, proceeding to next middleware');
  return next({
    context: {
      user,
    },
  });
});

// Route-level authentication check for beforeLoad
export const requireAuth = async () => {
  const user = await fetchUser();
  
  if (!user) {
    authLogger.info('Route auth check - No user found, redirecting to login');
    throw redirect({ to: '/login' });
  }
  
  authLogger.info('Route auth check - User authenticated, proceeding');
  return { user };
};

// Lightweight auth check for child routes (assumes parent already checked)
export const requireAuthLite = async () => {
  // Check cache first without making API call
  const now = Date.now();
  if (authCache && (now - authCache.timestamp) < CACHE_DURATION) {
    authLogger.info('Route auth check - Using cached result (lite)');
    return { user: authCache.user };
  }
  
  // If no cache, fall back to full auth check
  authLogger.info('Route auth check - Cache expired, performing full check');
  return requireAuth();
};

// Debug function to test auth middleware (remove in production)
export const testAuthMiddleware = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await fetchUser();
  return {
    authenticated: !!user,
    user: user || null,
    timestamp: new Date().toISOString(),
    cacheStatus: authCache ? 'cached' : 'no-cache',
  };
});