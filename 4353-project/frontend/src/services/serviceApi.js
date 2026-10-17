const API_BASE = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

async function request(path, { token, ...options } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('The server returned an unreadable response. Please try again.');
  }
  if (!response.ok) throw new Error(data.error || 'The service request failed. Please try again.');
  return data;
}

export function listServices() {
  return request('/services');
}

export function createService(data, token) {
  return request('/services', { method: 'POST', body: JSON.stringify(data), token });
}

export function updateService(id, data, token) {
  return request(`/services/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data), token });
}
