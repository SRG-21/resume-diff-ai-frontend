import { apiFetch, apiJson, jsonBody, toApiError } from './client';
import type {
  Application,
  ApplicationInput,
  BillingStatus,
  BulkRankResponse,
  CompareResponse,
  CoverLetter,
  HistoryList,
  InterviewQuestion,
  RewriteResult,
  SavedAiOutputs,
  SavedResume,
} from '../types/api';

export const getBillingStatus = () => apiJson<BillingStatus>('/billing/status');

export const startCheckout = (product: string) =>
  apiJson<{ url: string }>('/billing/checkout', jsonBody({ product }));

export const openBillingPortal = () => apiJson<{ url: string }>('/billing/portal', { method: 'POST' });

export const getHistory = (skip = 0, limit = 50) =>
  apiJson<HistoryList>(`/history?skip=${skip}&limit=${limit}`);

export const getHistoryItem = (id: string) => apiJson<CompareResponse>(`/history/${id}`);

export const deleteHistoryItem = (id: string) => apiJson<{ message: string }>(`/history/${id}`, { method: 'DELETE' });

export const clearHistory = () => apiJson<{ deleted: number }>('/history', { method: 'DELETE' });

export const getSavedResumes = () => apiJson<{ items: SavedResume[]; limit: number }>('/resumes');

export const uploadResume = (file: File, name?: string) => {
  const form = new FormData();
  form.append('resume_file', file);
  if (name) form.append('name', name);
  return apiJson<SavedResume>('/resumes', { method: 'POST', body: form });
};

export const deleteResume = (id: string) => apiJson<{ message: string }>(`/resumes/${id}`, { method: 'DELETE' });

export const importJob = (url: string) =>
  apiJson<{ text: string; title: string | null; company: string | null }>('/import-job', jsonBody({ url }));

export const getSavedAi = (id: string) => apiJson<SavedAiOutputs>(`/ai/${id}`);

export const generateRewrites = (comparisonId: string, regenerate = false) =>
  apiJson<RewriteResult>('/ai/rewrites', jsonBody({ comparison_id: comparisonId, regenerate }));

export const generateCoverLetter = (comparisonId: string, tone: string, regenerate = false) =>
  apiJson<CoverLetter>('/ai/cover-letter', jsonBody({ comparison_id: comparisonId, tone, regenerate }));

export const generateInterviewPrep = (comparisonId: string, regenerate = false) =>
  apiJson<{ questions: InterviewQuestion[] }>('/ai/interview-prep', jsonBody({ comparison_id: comparisonId, regenerate }));

export const exportTailored = async (comparisonId: string, accepted: { original: string; suggested: string }[]) => {
  const response = await apiFetch('/export/tailored', jsonBody({ comparison_id: comparisonId, accepted }));
  if (!response.ok) throw await toApiError(response);
  return response.blob();
};

export const listApplications = () => apiJson<{ items: Application[]; statuses: string[] }>('/applications');

export const createApplication = (input: ApplicationInput) => apiJson<Application>('/applications', jsonBody(input));

export const updateApplication = (id: string, changes: Partial<ApplicationInput>) =>
  apiJson<Application>(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(changes) });

export const deleteApplication = (id: string) =>
  apiJson<{ message: string }>(`/applications/${id}`, { method: 'DELETE' });

export const bulkRank = (jdText: string, files: File[]) => {
  const form = new FormData();
  form.append('jd_text', jdText);
  files.forEach((f) => form.append('resume_files', f));
  return apiJson<BulkRankResponse>('/bulk/rank', { method: 'POST', body: form });
};

export const resendVerification = () => apiJson<{ message: string }>('/auth/resend-verification', { method: 'POST' });

export const deleteAccount = () => apiJson<{ message: string }>('/auth/account', { method: 'DELETE' });
