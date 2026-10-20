const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

let unauthorizedHandler = null;

/**
 * Register a callback to be invoked when a 401 Unauthorized status is returned.
 * Used by AuthContext to reset user state and trigger redirection.
 */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

/**
 * Fetch wrapper for OutWear API requests
 * - Uses base URL http://localhost:4000/api
 * - Always includes credentials for httpOnly cookie management
 * - Automatically serializes JSON request bodies
 * - Triggers unauthorizedHandler on 401 (excluding the login request)
 * - Parses response JSON and throws an Error with server message on non-2xx status
 */
export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    credentials: 'include',
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  // If unauthorized on any endpoint except login, notify auth handler
  const isLoginRequest = url.includes('/auth/login');
  if (response.status === 401 && !isLoginRequest) {
    if (typeof unauthorizedHandler === 'function') {
      unauthorizedHandler();
    }
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      (Array.isArray(data?.details) && data.details[0]?.message) ||
      `Request failed with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export default apiClient;
