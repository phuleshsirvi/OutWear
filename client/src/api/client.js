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
 * Map standard HTTP status codes to user-friendly messages when the server sends none.
 * Never displays raw technical error text.
 */
function getStatusFallbackMessage(status) {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your inputs.';
    case 401:
      return 'Please sign in to continue.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'A conflict occurred. Please check your data.';
    case 429:
      return 'Too many requests, please wait a moment';
    case 500:
      return 'Something went wrong. Please try again.';
    case 502:
    case 503:
    case 504:
      return 'Service is temporarily unavailable';
    default:
      return 'Something went wrong. Please try again.';
  }
}

/**
 * Fetch wrapper for OutWear API requests
 * - Base URL from import.meta.env.VITE_API_URL (defaults to http://localhost:4000/api)
 * - Always includes credentials for httpOnly cookie management
 * - Serializes JSON request bodies
 * - Handles network drops with friendly message: "Can't reach the server, check your connection"
 * - Maps missing server error messages to friendly status fallbacks
 * - Triggers unauthorizedHandler on 401 (excluding login)
 */
export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    // Gracefully catch network failure (offline, connection refused, DNS error)
    console.error('[API Network Error]:', networkError);
    const err = new Error("Can't reach the server, check your connection");
    err.status = 0;
    err.isNetworkError = true;
    throw err;
  }

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
    const rawServerMessage =
      data?.error ||
      data?.message ||
      (Array.isArray(data?.details) && data.details[0]?.message);

    const message =
      typeof rawServerMessage === 'string' && rawServerMessage.trim().length > 0
        ? rawServerMessage.trim()
        : getStatusFallbackMessage(response.status);

    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    err.requestId = data?.requestId;
    throw err;
  }

  return data;
}

export default apiClient;
