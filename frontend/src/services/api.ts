async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Expired or invalid token — clear auth and force re-login
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw { message: 'Session expired. Please log in again.' };
  }

  const data = await res.json();
  if (!res.ok) throw { ...data, message: data.message ?? 'Request failed' };
  return data;
}

export default apiFetch;
