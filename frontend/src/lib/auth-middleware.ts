import { createMiddleware } from '@tanstack/react-start';
import { createServerFn } from '@tanstack/react-start';
import { authLogger, loggers } from '@/utils/logger';
import { redirect } from '@tanstack/react-router';

const BACKEND = process.env.VITE_BACKEND_URL ?? 'http://localhost:8080/api';

// Create a server function to fetch user data
const fetchUser = createServerFn({ method: 'GET' }).handler(async () => {
  // Import server-side utilities inside the handler
  const { getHeaders } = await import('@tanstack/react-start/server');
  
  let user: any = null;
  try {
    const headers = getHeaders();
    const cookieHeader = headers['cookie'] || '';
    
    authLogger.info('Auth middleware - Cookie header:', cookieHeader ? 'Present' : 'Missing');
    authLogger.info('Auth middleware - Full cookie header:', cookieHeader);
    
    // If no cookies, return null user
    if (!cookieHeader) {
      authLogger.info('Auth middleware - No cookies available, skipping API call');
      return null;
    }

    const fetchHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
    };

    authLogger.info('Auth middleware - Making request to /me endpoint');
    const res = await fetch(`${BACKEND}/me`, {
      headers: fetchHeaders,
      credentials: 'include',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    authLogger.info('Auth middleware - Response status:', res.status);

    if (res.ok) {
      const json = await res.json();
      authLogger.info('Auth middleware - Response data received');
      // Handle the backend response format: { success: true, data: { user: {...}, session: {...} } }
      if (json.success && json.data) {
        user = json.data.user;
        authLogger.info('Auth middleware - User extracted from response data');
      } else {
        user = json.user; // fallback for direct user object
        authLogger.info('Auth middleware - User extracted from direct response');
      }
      
      if (user) {
        authLogger.info('Auth middleware - User authenticated successfully', { userId: user.id || 'unknown' });
      } else {
        authLogger.warn('Auth middleware - No user data in successful response');
      }
    } else {
      const errorText = await res.text();
      authLogger.error('Auth middleware - Request failed', { 
        status: res.status, 
        statusText: res.statusText, 
        error: errorText 
      });
    }
  } catch (err) {
    // backend unreachable or other error; treat as unauthenticated
    authLogger.error('Auth middleware - Error checking authentication:', err);
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