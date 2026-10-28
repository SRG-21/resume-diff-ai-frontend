import { useState, useRef, useCallback } from 'react';
import type { CompareResponse, CompareState } from '../types/api';
import { apiFetch, toApiError } from '../api/client';
import { track } from '../analytics';

export interface CompareOptions {
  jdFile?: File | null;
  jdText?: string;
  jdUrl?: string;
  resumeFile?: File | null;
  /** Use a previously saved resume instead of uploading one */
  resumeId?: string;
  /** Save the uploaded resume under this name for reuse */
  saveResumeAs?: string;
}

const friendlyNetworkError = (message: string): string => {
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Unable to connect to the server. Please check your connection and try again.';
  }
  if (message.includes('CORS')) {
    return 'The server is not configured to accept requests from this site.';
  }
  return message;
};

export const useCompare = () => {
  const [state, setState] = useState<CompareState>({
    data: null,
    loading: false,
    error: null,
    errorCode: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const compare = useCallback(async (options: CompareOptions): Promise<void> => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setState({ data: null, loading: true, error: null, errorCode: null });

    try {
      const formData = new FormData();
      if (options.jdFile) {
        formData.append('jd_file', options.jdFile);
      } else if (options.jdText) {
        formData.append('jd_text', options.jdText);
      } else if (options.jdUrl) {
        formData.append('jd_url', options.jdUrl);
      }
      if (options.resumeFile) {
        formData.append('resume_file', options.resumeFile);
        if (options.saveResumeAs) formData.append('save_resume_as', options.saveResumeAs);
      } else if (options.resumeId) {
        formData.append('resume_id', options.resumeId);
      }

      const response = await apiFetch('/compare', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw Object.assign(new Error('Session expired. Please log in again.'), { code: 'unauthorized' });
        }
        if (response.status === 413) {
          throw new Error('File too large. Please upload smaller files.');
        }
        const apiError = await toApiError(response);
        throw Object.assign(new Error(apiError.message), { code: apiError.code });
      }

      const data: CompareResponse = await response.json();
      track('compare_completed', { match: data.matchPercent });
      setState({ data, loading: false, error: null, errorCode: null });
    } catch (err) {
      if ((err as { name?: string } | null)?.name === 'AbortError') {
        setState({ data: null, loading: false, error: null, errorCode: null });
        return;
      }
      const message = err instanceof Error ? friendlyNetworkError(err.message) : 'An unexpected error occurred';
      const code = (err as { code?: string } | null)?.code ?? null;
      setState({ data: null, loading: false, error: message, errorCode: code });
    }
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({ data: null, loading: false, error: null, errorCode: null });
  }, [cancel]);

  return { ...state, compare, cancel, reset };
};
