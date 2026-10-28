import { clearAuthData, getAccessToken, getRefreshToken, storeAuthData } from './tokens';
import type { LoginResponse } from '../types/api';

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api';

/** Fired when the session can no longer be refreshed so the UI can sign the user out */
export const AUTH_LOGOUT_EVENT = 'auth:logout';

export class ApiError extends Error {
  status: number;
  code?: string;
  detail?: unknown;

  constructor(status: number, message: string, code?: string, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.detail = detail;
  }

  /** The request needs a paid plan or the monthly quota is used up */
  get isUpgrade(): boolean {
    return this.status === 402;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

/** Exchange the refresh token for new tokens. Concurrent callers share one request. */
const refreshTokens = (): Promise<boolean> => {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return false;
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!response.ok) return false;
        storeAuthData((await response.json()) as LoginResponse);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

const withAuth = (init: RequestInit): RequestInit => {
  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return { ...init, headers };
};

/** fetch() against the API with the bearer token; retries once after a silent token refresh */
export const apiFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
  let response = await fetch(`${API_BASE_URL}${path}`, withAuth(init));
  if (response.status === 401 && getRefreshToken()) {
    if (await refreshTokens()) {
      response = await fetch(`${API_BASE_URL}${path}`, withAuth(init));
    }
    if (response.status === 401) {
      clearAuthData();
      window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
    }
  }
  return response;
};

export const toApiError = async (response: Response): Promise<ApiError> => {
  let message = `Request failed (${response.status})`;
  let code: string | undefined;
  let detail: unknown;
  try {
    const body = await response.json();
    detail = body.detail ?? body;
    if (typeof detail === 'string') {
      message = detail;
    } else if (Array.isArray(detail)) {
      // FastAPI validation errors: [{ msg: "Value error, Password must ..." }]
      message = detail.map((d) => String(d?.msg ?? d).replace(/^Value error, /, '')).join('. ');
    } else if (detail && typeof detail === 'object') {
      const d = detail as { message?: string; code?: string };
      message = d.message || message;
      code = d.code;
    }
  } catch {
    // body was not JSON
  }
  return new ApiError(response.status, message, code, detail);
};

/** JSON request/response helper that throws ApiError on non-2xx */
export const apiJson = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await apiFetch(path, init);
  if (!response.ok) throw await toApiError(response);
  return (await response.json()) as T;
};

export const jsonBody = (data: unknown): RequestInit => ({
  method: 'POST',
  body: JSON.stringify(data),
});
