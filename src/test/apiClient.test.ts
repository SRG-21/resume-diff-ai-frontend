import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiFetch, apiJson, ApiError, AUTH_LOGOUT_EVENT } from '../api/client';

const fetchMock = () => globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
const json = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response;

const tokensResponse = { access_token: 'new-access', refresh_token: 'new-refresh', token_type: 'bearer', expires_in: 1800, user: { id: 'u' } };

describe('api client', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('resume_diff_access_token', 'old-access');
    localStorage.setItem('resume_diff_refresh_token', 'old-refresh');
    globalThis.fetch = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  it('adds the bearer token and a JSON content type for string bodies', async () => {
    fetchMock().mockResolvedValueOnce(json(200, { ok: true }));
    await apiFetch('/x', { method: 'POST', body: '{"a":1}' });
    const init = fetchMock().mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBe('Bearer old-access');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('refreshes an expired access token once and retries the request', async () => {
    fetchMock()
      .mockResolvedValueOnce(json(401, { detail: 'expired' }))
      .mockResolvedValueOnce(json(200, tokensResponse)) // /auth/refresh
      .mockResolvedValueOnce(json(200, { value: 42 }));

    const result = await apiJson<{ value: number }>('/things');

    expect(result.value).toBe(42);
    expect(fetchMock().mock.calls[1][0]).toMatch(/\/auth\/refresh$/);
    expect(localStorage.getItem('resume_diff_access_token')).toBe('new-access');
    const retryHeaders = new Headers((fetchMock().mock.calls[2][1] as RequestInit).headers);
    expect(retryHeaders.get('Authorization')).toBe('Bearer new-access');
  });

  it('shares one refresh between concurrent 401s', async () => {
    let refreshCalls = 0;
    fetchMock().mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith('/auth/refresh')) {
        refreshCalls += 1;
        return json(200, tokensResponse);
      }
      const bearer = new Headers(init.headers).get('Authorization');
      return bearer === 'Bearer new-access' ? json(200, {}) : json(401, {});
    });

    await Promise.all([apiFetch('/a'), apiFetch('/b'), apiFetch('/c')]);

    expect(refreshCalls).toBe(1);
  });

  it('clears the session and signals logout when refresh fails', async () => {
    const onLogout = vi.fn();
    window.addEventListener(AUTH_LOGOUT_EVENT, onLogout);
    fetchMock().mockResolvedValueOnce(json(401, {})).mockResolvedValueOnce(json(401, {})); // request, refresh

    const response = await apiFetch('/things');

    expect(response.status).toBe(401);
    expect(localStorage.getItem('resume_diff_access_token')).toBeNull();
    expect(onLogout).toHaveBeenCalledTimes(1);
    window.removeEventListener(AUTH_LOGOUT_EVENT, onLogout);
  });

  it('parses string, object and validation-array error details', async () => {
    fetchMock().mockResolvedValueOnce(json(400, { detail: 'Email already registered' }));
    await expect(apiJson('/a')).rejects.toMatchObject({ status: 400, message: 'Email already registered' });

    fetchMock().mockResolvedValueOnce(json(402, { detail: { code: 'quota_exceeded', message: 'Out of scans' } }));
    const err = await apiJson('/b').catch((e) => e as ApiError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('quota_exceeded');
    expect(err.message).toBe('Out of scans');
    expect(err.isUpgrade).toBe(true);

    fetchMock().mockResolvedValueOnce(json(422, { detail: [{ msg: 'Value error, Password must be at least 8 characters' }] }));
    await expect(apiJson('/c')).rejects.toMatchObject({ message: 'Password must be at least 8 characters' });
  });
});
