import { authLogger, loggers } from '@/utils/logger';

const BASE = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8080/api';

type APIError = { error: string };

const post = async <T>(path: string, body: unknown): Promise<T> => {
  const url = `${BASE}${path}`;
  
  loggers.logApiRequest('POST', url, body);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // send cookies
      body: JSON.stringify(body),
    });

    const data = await res.json();
    
    loggers.logApiResponse('POST', url, res.status, data);
    
    if (!res.ok) {
      const errorMessage = (data as APIError).error ?? res.statusText;
      loggers.logApiError('POST', url, errorMessage);
      throw new Error(errorMessage);
    }
    
    return data as T;
  } catch (error) {
    loggers.logApiError('POST', url, error);
    throw error;
  }
};

export const login = async (email: string, password: string) => {
  authLogger.info({ email }, 'Attempting login');
  try {
    const result = await post<{ token: string }>('/auth/login', { email, password });
    loggers.logAuthSuccess('login', email);
    return result;
  } catch (error) {
    loggers.logAuthError('login', error);
    throw error;
  }
};

export const register = async (name: string, email: string, password: string) => {
  authLogger.info({ name, email }, 'Attempting registration');
  try {
    const result = await post<{ token: string }>('/auth/register', { name, email, password });
    loggers.logAuthSuccess('register', email);
    return result;
  } catch (error) {
    loggers.logAuthError('register', error);
    throw error;
  }
};

export const logout = async () => {
  authLogger.info('Attempting logout');
  try {
    const response = await fetch(`${BASE}/auth/logout`, { 
      method: 'POST', 
      credentials: 'include' 
    });
    
    if (response.ok) {
      loggers.logAuthSuccess('logout');
    } else {
      loggers.logAuthError('logout', `Status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    loggers.logAuthError('logout', error);
    throw error;
  }
};

// fetch user (works client & server):
export const fetchMe = async (init?: RequestInit) => {
  const url = `${BASE}/me`;
  
  authLogger.debug('Fetching current user');
  
  try {
    const res = await fetch(url, {
      credentials: 'include',
      ...init,
    });
    
    authLogger.debug({ status: res.status, ok: res.ok }, 'fetchMe response');
    
    if (!res.ok) {
      authLogger.warn({ status: res.status }, 'fetchMe failed - user not authenticated');
      return null;
    }
    
    const data = await res.json();
    authLogger.debug({ userId: data?.user?.id }, 'fetchMe success');
    return data;
  } catch (error) {
    authLogger.error({ error: error instanceof Error ? error.message : String(error) }, 'fetchMe error');
    return null;
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
    try {
        const session = await fetchMe();
        const authenticated = !!(session?.user);
        authLogger.debug({ authenticated }, 'Authentication check');
        return authenticated;
    } catch (error) {
        authLogger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error checking authentication');
        return false;
    }
};

// Helper function to get current user
export const getCurrentUser = async () => {
    try {
        const session = await fetchMe();
        const user = session?.user || null;
        authLogger.debug({ userId: user?.id }, 'Getting current user');
        return user;
    } catch (error) {
        authLogger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error getting current user');
        return null;
    }
}; 