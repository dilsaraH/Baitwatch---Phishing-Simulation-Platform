export async function apiFetch(endpoint, options = {}) {
  const stored = localStorage.getItem('baitwatch_auth');
  const token = stored ? JSON.parse(stored).token : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  return response;
}