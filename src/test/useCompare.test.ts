import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCompare } from '../hooks/useCompare';

const fetchMock = () => globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

const okResponse = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
const errorResponse = (status: number, body: unknown) => ({ ok: false, status, json: async () => body });

const pdf = (name = 'resume.pdf') => new File(['test'], name, { type: 'application/pdf' });

describe('useCompare hook', () => {
  const mockResponse = {
    id: 'c1',
    matchPercent: 75,
    matchedSkills: ['JavaScript', 'React', 'TypeScript'],
    missingSkills: ['Python', 'Django'],
    warnings: [],
  };

  beforeEach(() => {
    localStorage.clear();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts idle', () => {
    const { result } = renderHook(() => useCompare());
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('stores the response on success and sends the bearer token', async () => {
    localStorage.setItem('resume_diff_access_token', 'tok123');
    fetchMock().mockResolvedValueOnce(okResponse(mockResponse));
    const { result } = renderHook(() => useCompare());

    await act(() => result.current.compare({ resumeFile: pdf(), jdFile: pdf('jd.pdf') }));

    expect(result.current.data).toEqual(mockResponse);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();

    const [url, init] = fetchMock().mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/compare$/);
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer tok123');
    // multipart bodies must not get a JSON content type
    expect(new Headers(init.headers).has('Content-Type')).toBe(false);
  });

  it('surfaces the API error message', async () => {
    fetchMock().mockResolvedValueOnce(errorResponse(500, { detail: 'Server error' }));
    const { result } = renderHook(() => useCompare());

    await act(() => result.current.compare({ resumeFile: pdf(), jdText: 'Job description text' }));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Server error');
  });

  it('exposes the error code for quota problems so the UI can offer an upgrade', async () => {
    fetchMock().mockResolvedValueOnce(
      errorResponse(402, { detail: { code: 'quota_exceeded', message: 'You have used all 3 scans' } }),
    );
    const { result } = renderHook(() => useCompare());

    await act(() => result.current.compare({ resumeFile: pdf(), jdText: 'Job description text' }));

    expect(result.current.error).toBe('You have used all 3 scans');
    expect(result.current.errorCode).toBe('quota_exceeded');
  });

  it('reports an expired session on 401 when it cannot refresh', async () => {
    fetchMock().mockResolvedValue(errorResponse(401, { detail: 'Invalid or expired token' }));
    const { result } = renderHook(() => useCompare());

    await act(() => result.current.compare({ resumeFile: pdf(), jdText: 'Job description text' }));

    expect(result.current.error).toMatch(/session expired/i);
  });

  it('gives a friendly message when the network is down', async () => {
    fetchMock().mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const { result } = renderHook(() => useCompare());

    await act(() => result.current.compare({ resumeFile: pdf(), jdText: 'Job description text' }));

    expect(result.current.error).toMatch(/unable to connect/i);
  });

  it('builds FormData with jd_file', async () => {
    fetchMock().mockResolvedValueOnce(okResponse(mockResponse));
    const { result } = renderHook(() => useCompare());
    const resumeFile = pdf();
    const jdFile = pdf('jd.pdf');

    await act(() => result.current.compare({ resumeFile, jdFile }));

    const form = (fetchMock().mock.calls[0][1] as RequestInit).body as FormData;
    expect(form.get('resume_file')).toBe(resumeFile);
    expect(form.get('jd_file')).toBe(jdFile);
  });

  it('builds FormData with jd_text and save_resume_as', async () => {
    fetchMock().mockResolvedValueOnce(okResponse(mockResponse));
    const { result } = renderHook(() => useCompare());
    const resumeFile = pdf();

    await act(() => result.current.compare({ resumeFile, jdText: 'Looking for a developer...', saveResumeAs: 'Main CV' }));

    const form = (fetchMock().mock.calls[0][1] as RequestInit).body as FormData;
    expect(form.get('jd_text')).toBe('Looking for a developer...');
    expect(form.get('save_resume_as')).toBe('Main CV');
    expect(form.has('resume_id')).toBe(false);
  });

  it('uses a saved resume id instead of uploading', async () => {
    fetchMock().mockResolvedValueOnce(okResponse(mockResponse));
    const { result } = renderHook(() => useCompare());

    await act(() => result.current.compare({ resumeId: 'r-1', jdText: 'Looking for a developer...' }));

    const form = (fetchMock().mock.calls[0][1] as RequestInit).body as FormData;
    expect(form.get('resume_id')).toBe('r-1');
    expect(form.has('resume_file')).toBe(false);
  });

  it('treats a cancelled request as neither data nor error', async () => {
    fetchMock().mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        }),
    );
    const { result } = renderHook(() => useCompare());

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.compare({ resumeFile: pdf(), jdText: 'Job description' });
    });
    expect(result.current.loading).toBe(true);

    await act(async () => {
      result.current.cancel();
      await pending;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
  });

  it('reset clears results and errors', async () => {
    fetchMock().mockResolvedValueOnce(okResponse(mockResponse));
    const { result } = renderHook(() => useCompare());
    await act(() => result.current.compare({ resumeFile: pdf(), jdText: 'x'.repeat(20) }));
    expect(result.current.data).not.toBeNull();

    act(() => result.current.reset());

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
