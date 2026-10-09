import { useState, useCallback } from 'react';
import { authService, AuthUser, LoginDto, LoginResponse } from '../services/authService';

export interface UseAuthActionsResult {
  loading: boolean;
  error: string | null;
  user: AuthUser | null;
  login: (credentials: LoginDto) => Promise<LoginResponse | null>;
  logout: (sessionId?: string) => Promise<void>;
  clearError: () => void;
}

export function useAuthActions(): UseAuthActionsResult {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(() => authService.getStoredUser());

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (credentials: LoginDto): Promise<LoginResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login(credentials);
      setUser(res.user);
      return res;
    } catch (err: any) {
      const msg =
        err?.message ||
        (Array.isArray(err?.message) ? err.message.join(', ') : null) ||
        'Authentication failed. Please check your credentials.';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async (sessionId?: string): Promise<void> => {
    setLoading(true);
    try {
      await authService.logout(sessionId);
    } catch {
      // Ignore API logout error and clear local session anyway
      authService.clearSession();
    } finally {
      setUser(null);
      setError(null);
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    user,
    login,
    logout,
    clearError,
  };
}
