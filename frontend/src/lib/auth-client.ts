import { authService } from '@/services/auth-service';
import { userService } from '@/services/user-service';
import { authLogger, loggers } from '@/utils/logger';




export const login = async (email: string, password: string) => {
  authLogger.info({ email }, 'Attempting login');
  try {
    const result = await authService.login(email, password);
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
    const result = authService.register(name, email, password);
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
    const response = await authService.logout();
    
    if (response.success) {
      loggers.logAuthSuccess('logout');
    } else {
      loggers.logAuthError('logout', `Status: ${response.error}`);
    }
    
    return response;
  } catch (error) {
    loggers.logAuthError('logout', error);
    throw error;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
    try {
        const session = await userService.getUser();
        const authenticated = !!(session);
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
        const session = await userService.getUser();
        const user = session || null;
        authLogger.debug({ userId: user?.id }, 'Getting current user');
        return user;
    } catch (error) {
        authLogger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error getting current user');
        return null;
    }
}; 