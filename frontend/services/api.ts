import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * Token persistence helpers supporting both localStorage and document.cookie
 * to guarantee resilience across page refreshes and SSR hydration.
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Check localStorage first
  try {
    const localToken = localStorage.getItem('shoplagbe_token');
    if (localToken && localToken.trim() !== '') {
      return localToken.trim();
    }
  } catch {
    // localStorage might be unavailable in restricted environments
  }

  // 2. Check document.cookie fallback
  try {
    const match = document.cookie.match(/(?:^|;\s*)shoplagbe_token=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]).trim();
    }
  } catch {
    // Cookie reading fallback
  }

  return null;
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('shoplagbe_token', token);
  } catch {
    // Handle quota or permission errors
  }

  try {
    // Persist for 30 days
    const maxAge = 30 * 24 * 60 * 60;
    document.cookie = `shoplagbe_token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    // Cookie set fallback
  }
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('shoplagbe_token');
    localStorage.removeItem('shoplagbe_user');
  } catch {
    // Handle error
  }

  try {
    document.cookie = 'shoplagbe_token=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'shoplagbe_user=; path=/; max-age=0; SameSite=Lax';
  } catch {
    // Handle error
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 20000,
});

// Request interceptor to inject Authorization Bearer token & handle FormData
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();

  if (token) {
    if (config.headers && typeof (config.headers as any).set === 'function') {
      (config.headers as any).set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // If payload is FormData, remove manual Content-Type header so the browser/Axios
  // can automatically attach the boundary parameter required by multipart requests.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers) {
      if (typeof (config.headers as any).delete === 'function') {
        (config.headers as any).delete('Content-Type');
      } else {
        delete config.headers['Content-Type'];
      }
    }
  }

  return config;
});

// Response interceptor for unified and descriptive error extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      // Extract specific validation message if available
      let detailedMessage = data?.message || data?.error;
      if (status === 422 && data?.errors && typeof data.errors === 'object') {
        const fieldErrors = Object.values(data.errors).flat().filter(Boolean);
        if (fieldErrors.length > 0) {
          detailedMessage = fieldErrors.join(' ');
        }
      }

      switch (status) {
        case 401: {
          const isAuthEndpoint =
            error.config?.url?.includes('/login') || error.config?.url?.includes('/register');

          // Only clear token if an existing session failed on protected endpoints
          if (!isAuthEndpoint) {
            clearAuthToken();
            if (
              typeof window !== 'undefined' &&
              window.location.pathname.startsWith('/admin') &&
              window.location.pathname !== '/admin/login'
            ) {
              window.location.href = '/admin/login';
            }
          }

          error.message = detailedMessage || 'Unauthorized - login required. Your session may have expired.';
          break;
        }
        case 403:
          error.message = detailedMessage || 'Admin permission required. You do not have administrator privileges.';
          break;
        case 422:
          error.message = detailedMessage || 'Validation error: Please review the submitted product details.';
          break;
        case 500:
          error.message = detailedMessage || 'Server error. Please try again later or contact the system administrator.';
          break;
        default:
          if (detailedMessage) {
            error.message = detailedMessage;
          }
          break;
      }
    } else if (error.request) {
      error.message = 'Network error. Unable to connect to ShopLagbe API server.';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
