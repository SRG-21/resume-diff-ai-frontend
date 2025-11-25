import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCompare } from '../hooks/useCompare';

describe('useCompare hook', () => {
  const mockResponse = {
    matchPercent: 75,
    matchedSkills: ['JavaScript', 'React', 'TypeScript'],
    missingSkills: ['Python', 'Django'],
    warnings: [],
  };

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCompare());

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle successful API call', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useCompare());

    const resumeFile = new File(['test'], 'resume.pdf', { type: 'application/pdf' });
    const jdFile = new File(['test'], 'jd.pdf', { type: 'application/pdf' });

    await result.current.compare({
      resumeFile,
      jdFile,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(result.current.error).toBeNull();
  });

  it('should handle API error', async () => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ message: 'Server error' }),
    });

    const { result } = renderHook(() => useCompare());

    const resumeFile = new File(['test'], 'resume.pdf', { type: 'application/pdf' });

    await result.current.compare({
      resumeFile,
      jdText: 'Job description text',
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toContain('Server error');
  });

  it('should build FormData correctly with jdFile', async () => {
    let capturedFormData: FormData | undefined;

    (globalThis.fetch as any).mockImplementationOnce((_url: string, options: any) => {
      capturedFormData = options.body;
      return Promise.resolve({
        ok: true,
        json: async () => mockResponse,
      });
    });

    const { result } = renderHook(() => useCompare());

    const resumeFile = new File(['resume'], 'resume.pdf', { type: 'application/pdf' });
    const jdFile = new File(['jd'], 'jd.pdf', { type: 'application/pdf' });

    await result.current.compare({
      resumeFile,
      jdFile,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(capturedFormData).toBeInstanceOf(FormData);
    expect(capturedFormData?.get('resume_file')).toBe(resumeFile);
    expect(capturedFormData?.get('jd_file')).toBe(jdFile);
  });

  it('should build FormData correctly with jdText', async () => {
    let capturedFormData: FormData | undefined;

    (globalThis.fetch as any).mockImplementationOnce((_url: string, options: any) => {
      capturedFormData = options.body;
      return Promise.resolve({
        ok: true,
        json: async () => mockResponse,
      });
    });

    const { result } = renderHook(() => useCompare());

    const resumeFile = new File(['resume'], 'resume.pdf', { type: 'application/pdf' });
    const jdText = 'Looking for a developer...';

    await result.current.compare({
      resumeFile,
      jdText,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(capturedFormData).toBeInstanceOf(FormData);
    expect(capturedFormData?.get('resume_file')).toBe(resumeFile);
    expect(capturedFormData?.get('jd_text')).toBe(jdText);
  });

  it('should handle request cancellation', async () => {
    (globalThis.fetch as any).mockImplementationOnce(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 100);
      });
    });

    const { result } = renderHook(() => useCompare());

    const resumeFile = new File(['test'], 'resume.pdf', { type: 'application/pdf' });

    const promise = result.current.compare({
      resumeFile,
      jdText: 'Job description',
    });

    result.current.cancel();

    await promise;

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
  });

  it('should reset state', () => {
    const { result } = renderHook(() => useCompare());

    // Manually set some state
    result.current.compare({
      resumeFile: new File(['test'], 'resume.pdf', { type: 'application/pdf' }),
      jdText: 'test',
    });

    result.current.reset();

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
