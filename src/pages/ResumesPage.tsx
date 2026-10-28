import React, { useCallback, useEffect, useRef, useState } from 'react';
import { deleteResume, getSavedResumes, uploadResume } from '../api/endpoints';
import { ApiError } from '../api/client';
import { UpgradePrompt } from '../components/UpgradePrompt';
import { validateResumeFile } from '../utils/validation';
import type { SavedResume } from '../types/api';

export const ResumesPage: React.FC = () => {
  const [items, setItems] = useState<SavedResume[]>([]);
  const [limit, setLimit] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const r = await getSavedResumes();
    setItems(r.items);
    setLimit(r.limit);
  }, []);

  useEffect(() => {
    load().catch(() => setError('Could not load your resumes'));
  }, [load]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const problem = validateResumeFile(file);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    setLimitHit(false);
    try {
      await uploadResume(file, file.name.replace(/\.[^.]+$/, ''));
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'resume_limit') setLimitHit(true);
      else setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Saved resumes</h1>
          <p className="text-sm text-gray-500">{items.length} of {limit} used</p>
        </div>
        <input ref={input} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={onFile} aria-label="Upload resume" />
        <button className="btn-primary" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? 'Uploading…' : 'Upload resume'}
        </button>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      {limitHit && (
        <div className="mt-4">
          <UpgradePrompt source="resume_limit" message="You’ve reached your plan’s saved-resume limit. Delete one or upgrade to keep more versions." />
        </div>
      )}

      {items.length === 0 ? (
        <p className="mt-8 rounded-xl bg-white p-10 text-center text-gray-600 shadow-md">
          Save a resume once and reuse it on every comparison.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
              <div>
                <p className="font-medium text-gray-900">{r.name}</p>
                <p className="text-xs text-gray-500">{r.filename} · {r.words.toLocaleString()} words · {new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              <button
                className="text-sm text-gray-400 hover:text-red-600"
                onClick={async () => {
                  if (window.confirm(`Delete “${r.name}”?`)) {
                    await deleteResume(r.id);
                    await load();
                  }
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
