const BASE_URL = import.meta.env.VITE_API_URL ?? '';

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) return null;

      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        return data.token as string;
      }
      return null;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  // Access token expired — attempt silent token refresh unless it's an auth endpoint
  if (res.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/refresh')) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry original request with the new access token
      const retryRes = await fetch(`${BASE_URL}/api${path}`, {
        ...options,
        credentials: 'include',
        headers: {
          ...headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
      const retryData = await retryRes.json();
      if (!retryRes.ok) throw { ...retryData, message: retryData.message ?? 'Request failed' };
      return retryData;
    }

    // Refresh failed — clear credentials and redirect to login
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw { message: 'Session expired. Please log in again.' };
  }

  const data = await res.json();
  if (!res.ok) throw { ...data, message: data.message ?? 'Request failed' };
  return data;
}

export default apiFetch;
