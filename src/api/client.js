/**
 * Nepal Elections API Client
 * 
 * Drop-in replacement for JSON imports.
 * Mirrors the existing hook interfaces for minimal integration effort.
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/v1',
  timeout: 10000,
  tokenKey: 'nepal_elections_token',
  refreshTokenKey: 'nepal_elections_refresh_token',
  userKey: 'nepal_elections_user',
};

// ============================================================================
// HTTP CLIENT
// ============================================================================

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Initialize from localStorage
let authToken = typeof localStorage !== 'undefined' 
  ? localStorage.getItem(CONFIG.tokenKey) 
  : null;

function setAuthToken(token) {
  authToken = token;
  if (typeof localStorage !== 'undefined') {
    if (token) {
      localStorage.setItem(CONFIG.tokenKey, token);
    } else {
      localStorage.removeItem(CONFIG.tokenKey);
    }
  }
}

function getAuthToken() {
  return authToken;
}

function setRefreshToken(token) {
  if (typeof localStorage !== 'undefined') {
    if (token) {
      localStorage.setItem(CONFIG.refreshTokenKey, token);
    } else {
      localStorage.removeItem(CONFIG.refreshTokenKey);
    }
  }
}

function getRefreshToken() {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(CONFIG.refreshTokenKey);
  }
  return null;
}

function setStoredUser(user) {
  if (typeof localStorage !== 'undefined') {
    if (user) {
      localStorage.setItem(CONFIG.userKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(CONFIG.userKey);
    }
  }
}

function getStoredUser() {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(CONFIG.userKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
  }
  return null;
}

async function request(method, path, options = {}) {
  const url = new URL(`${CONFIG.baseUrl}${path}`);
  
  // Add query params
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    });
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (options.auth !== false && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

  try {
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        error.code || 'UNKNOWN_ERROR',
        error.message || `HTTP ${response.status}`,
        error.details
      );
    }

    if (response.status === 204) {
      return undefined;
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') {
      throw new ApiError(0, 'TIMEOUT', 'Request timed out');
    }
    throw new ApiError(0, 'NETWORK_ERROR', 'Network error');
  }
}

// ============================================================================
// API METHODS
// ============================================================================

// Helper to convert camelCase to snake_case for API params
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function transformParams(params) {
  const result = {};
  for (const [key, value] of Object.entries(params)) {
    result[toSnakeCase(key)] = value;
  }
  return result;
}

// Helper to convert API response (snake_case) to camelCase
function toCamelCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (obj !== null && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(value);
    }
    return result;
  }
  return obj;
}

export const api = {
  // --------------------------------------------------------------------------
  // Events
  // --------------------------------------------------------------------------
  events: {
    async list(filters = {}) {
      const response = await request('GET', '/events', { 
        params: transformParams(filters), 
        auth: false 
      });
      return toCamelCase(response);
    },

    async nearby(params) {
      const response = await request('GET', '/events/nearby', { 
        params: transformParams(params), 
        auth: false 
      });
      return toCamelCase(response);
    },

    async get(id) {
      const response = await request('GET', `/events/${id}`, { auth: false });
      return toCamelCase(response);
    },

    async rsvp(id, status = 'going') {
      const response = await request('POST', `/events/${id}/rsvp`, { 
        body: { status }, 
        auth: true 
      });
      return toCamelCase(response);
    },

    async cancelRsvp(id) {
      await request('DELETE', `/events/${id}/rsvp`, { auth: true });
    },
  },

  // --------------------------------------------------------------------------
  // Parties
  // --------------------------------------------------------------------------
  parties: {
    async list() {
      const response = await request('GET', '/parties', { auth: false });
      return toCamelCase(response).data;
    },

    async get(id) {
      const response = await request('GET', `/parties/${id}`, { auth: false });
      return toCamelCase(response);
    },
  },

  // --------------------------------------------------------------------------
  // Constituencies
  // --------------------------------------------------------------------------
  constituencies: {
    async list(filters = {}) {
      const response = await request('GET', '/constituencies', { 
        params: filters, 
        auth: false 
      });
      return toCamelCase(response).data;
    },

    async get(id) {
      const response = await request('GET', `/constituencies/${id}`, { auth: false });
      return toCamelCase(response);
    },

    async detect(lat, lng) {
      try {
        const response = await request('GET', '/constituencies/detect', { 
          params: { lat, lng }, 
          auth: false 
        });
        return toCamelCase(response);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },
  },

  // --------------------------------------------------------------------------
  // Auth
  // --------------------------------------------------------------------------
  auth: {
    async requestOtp(phone) {
      const response = await request('POST', '/auth/request-otp', { 
        body: { phone }, 
        auth: false 
      });
      return { 
        expiresIn: response.expires_in,
        devOtp: response.dev_otp // For testing
      };
    },

    async verifyOtp(phone, otp) {
      const response = await request('POST', '/auth/verify-otp', { 
        body: { phone, otp }, 
        auth: false 
      });
      
      // Store tokens and user
      setAuthToken(response.access_token);
      setRefreshToken(response.refresh_token);
      setStoredUser(response.user);
      
      return {
        user: toCamelCase(response.user),
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      };
    },

    async refresh() {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new ApiError(401, 'NO_REFRESH_TOKEN', 'No refresh token available');
      }
      
      const response = await request('POST', '/auth/refresh', {
        params: { refresh_token: refreshToken },
        auth: false
      });
      
      setAuthToken(response.access_token);
      
      return {
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      };
    },

    logout() {
      setAuthToken(null);
      setRefreshToken(null);
      setStoredUser(null);
    },

    isAuthenticated() {
      return !!getAuthToken();
    },

    getUser() {
      return getStoredUser();
    },

    setToken: setAuthToken,
    getToken: getAuthToken,
  },

  // --------------------------------------------------------------------------
  // User
  // --------------------------------------------------------------------------
  user: {
    async me() {
      const response = await request('GET', '/users/me', { auth: true });
      return toCamelCase(response);
    },

    async update(data) {
      const response = await request('PATCH', '/users/me', { 
        body: data, 
        auth: true 
      });
      const user = toCamelCase(response);
      setStoredUser(user);
      return user;
    },

    async rsvps() {
      const response = await request('GET', '/users/me/rsvps', { auth: true });
      return toCamelCase(response).data;
    },
  },

  // --------------------------------------------------------------------------
  // Meta
  // --------------------------------------------------------------------------
  meta: {
    async eventTypes() {
      return request('GET', '/meta/event-types', { auth: false });
    },
  },
};

export { ApiError, setAuthToken, getAuthToken };
export default api;
