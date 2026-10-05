import apiClient, { getAuthToken, setAuthToken, clearAuthToken } from './api';
import { User } from '@/types';

export const authService = {
  /**
   * Admin Authentication: POST /api/admin/login
   * Authenticates with Laravel Sanctum and stores the issued Bearer token.
   */
  async adminLogin(email: string, password: string): Promise<{ token: string; user: User }> {
    const response = await apiClient.post('/admin/login', { email, password });
    const { token, user } = response.data;

    if (token) {
      setAuthToken(token);
    }

    if (user && typeof window !== 'undefined') {
      try {
        const userJson = JSON.stringify(user);
        localStorage.setItem('shoplagbe_user', userJson);
        const maxAge = 30 * 24 * 60 * 60;
        document.cookie = `shoplagbe_user=${encodeURIComponent(userJson)}; path=/; max-age=${maxAge}; SameSite=Lax`;
      } catch {
        // Safe storage fallback
      }
    }

    return { token, user };
  },

  /**
   * Customer Authentication: POST /api/login
   */
  async customerLogin(email: string, password: string): Promise<{ token: string; user: User }> {
    const response = await apiClient.post('/login', { email, password });
    const { token, user } = response.data;

    if (token) {
      setAuthToken(token);
    }

    if (user && typeof window !== 'undefined') {
      try {
        const userJson = JSON.stringify(user);
        localStorage.setItem('shoplagbe_user', userJson);
        const maxAge = 30 * 24 * 60 * 60;
        document.cookie = `shoplagbe_user=${encodeURIComponent(userJson)}; path=/; max-age=${maxAge}; SameSite=Lax`;
      } catch {
        // Safe storage fallback
      }
    }

    return { token, user };
  },

  /**
   * Customer Registration: POST /api/register
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ token: string; user: User }> {
    const response = await apiClient.post('/register', data);
    const { token, user } = response.data;

    if (token) {
      setAuthToken(token);
    }

    if (user && typeof window !== 'undefined') {
      try {
        const userJson = JSON.stringify(user);
        localStorage.setItem('shoplagbe_user', userJson);
        const maxAge = 30 * 24 * 60 * 60;
        document.cookie = `shoplagbe_user=${encodeURIComponent(userJson)}; path=/; max-age=${maxAge}; SameSite=Lax`;
      } catch {
        // Safe storage fallback
      }
    }

    return { token, user };
  },

  /**
   * Session Termination: POST /api/logout
   */
  async logout(): Promise<void> {
    try {
      const token = getAuthToken();
      if (token) {
        await apiClient.post('/logout');
      }
    } catch {
      // Ignore network failure during logout
    } finally {
      clearAuthToken();
    }
  },

  /**
   * Retrieves active authenticated user from local storage or cookie
   */
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;

    try {
      const userStr = localStorage.getItem('shoplagbe_user');
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch {
      // Continue to cookie check
    }

    try {
      const match = document.cookie.match(/(?:^|;\s*)shoplagbe_user=([^;]+)/);
      if (match && match[1]) {
        return JSON.parse(decodeURIComponent(match[1]));
      }
    } catch {
      // Cookie parsing fallback
    }

    return null;
  },

  /**
   * Checks current token status with backend GET /api/me
   */
  async getProfile(): Promise<User | null> {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const response = await apiClient.get('/me');
      const user = response.data.user || response.data;
      if (user && typeof window !== 'undefined') {
        localStorage.setItem('shoplagbe_user', JSON.stringify(user));
      }
      return user;
    } catch {
      return this.getCurrentUser();
    }
  },
};

export default authService;
