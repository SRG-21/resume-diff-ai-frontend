import { useState, useRef, useCallback } from 'react';
import type { CompareResponse, CompareState } from '../types/api';

interface UseCompareParams {
  apiBaseUrl?: string;
}

interface CompareOptions {
  jdFile?: File | null;
  jdText?: string;
  resumeFile: File;
}

export const useCompare = ({ apiBaseUrl = '/api' }: UseCompareParams = {}) => {
  const [state, setState] = useState<CompareState>({
    data: null,
    loading: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const compare = useCallback(
    async (options: CompareOptions): Promise<void> => {
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setState({ data: null, loading: true, error: null });

      try {
        // Build FormData
        const formData = new FormData();

        if (options.jdFile) {
          formData.append('jd_file', options.jdFile);
        } else if (options.jdText) {
          formData.append('jd_text', options.jdText);
        }

        formData.append('resume_file', options.resumeFile);

        // Construct full API URL
        const apiUrl = `${apiBaseUrl}/compare`;

        // Make API request
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          let errorMessage = `Server error: ${response.status}`;
          
          // Provide specific error messages based on status code
          if (response.status === 404) {
            errorMessage = 'API endpoint not found (404). Please ensure the backend server is running and configured correctly.';
          } else if (response.status === 500) {
            errorMessage = 'Internal server error (500). Please check the backend server logs.';
          } else if (response.status === 413) {
            errorMessage = 'File too large (413). Please upload smaller files.';
          } else {
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
              // If response is not JSON, use status text
              errorMessage = response.statusText || errorMessage;
            }
          }

          throw new Error(errorMessage);
        }

        const data: CompareResponse = await response.json();

        setState({ data, loading: false, error: null });
      } catch (err) {
        if (err instanceof Error) {
          // Don't set error state if request was cancelled
          if (err.name === 'AbortError') {
            setState({ data: null, loading: false, error: null });
            return;
          }

          // Provide better error messages for common issues
          let errorMessage = err.message;
          
          if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
            errorMessage = 'Unable to connect to the server. Please check if the backend API is running and accessible.';
          } else if (err.message.includes('CORS')) {
            errorMessage = 'CORS error: The backend server is not configured to accept requests from this domain.';
          } else if (err.message.includes('404') || err.message.includes('Not Found')) {
            errorMessage = 'API endpoint not found. Please ensure the backend server is running at the configured URL.';
          }

          setState({ data: null, loading: false, error: errorMessage });
        } else {
          setState({
            data: null,
            loading: false,
            error: 'An unexpected error occurred',
          });
        }
      }
    },
    [apiBaseUrl]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState({ data: null, loading: false, error: null });
  }, [cancel]);

  return {
    ...state,
    compare,
    cancel,
    reset,
  };
};
