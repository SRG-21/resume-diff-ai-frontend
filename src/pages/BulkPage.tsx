import React, { useState } from 'react';
import { bulkRank } from '../api/endpoints';
import { ApiError } from '../api/client';
import { useBilling } from '../context/useBilling';
import { UpgradePrompt } from '../components/UpgradePrompt';
import { validateResumeFile } from '../utils/validation';
import type { BulkRankResponse } from '../types/api';

/** Coach plan: rank several resumes against one job description. Nothing is saved. */
export const BulkPage: React.FC = () => {
  const { status, can, refresh } = useBilling();
  const [jd, setJd] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<BulkRankResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status && !can('bulk_rank')) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <UpgradePrompt source="bulk" title="Bulk ranking is part of the Coach plan" message="Score up to 10 resumes against one job description and get a ranked list in one run." />
      </div>
    );
  }

  const max = status?.entitlements.bulk_max_resumes ?? 10;

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    const problem = picked.map(validateResumeFile).find(Boolean);
    if (problem) return setError(problem);
    if (picked.length > max) return setError(`Choose up to ${max} resumes`);
    setError(null);
    setFiles(picked);
  };

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      setResult(await bulkRank(jd, files));
      void refresh();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Ranking failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bulk ranking</h1>
        <p className="text-gray-600">Rank up to {max} resumes against one job. Files are scored and discarded; nothing is stored.</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}

      <div className="space-y-4 rounded-xl bg-white p-6 shadow-md">
        <div>
          <label htmlFor="bulk-jd" className="block text-sm font-medium text-gray-700 mb-1">Job description</label>
          <textarea id="bulk-jd" className="input-field min-h-[160px]" value={jd} onChange={(e) => setJd(e.target.value)} />
        </div>
        <div>
          <label htmlFor="bulk-files" className="block text-sm font-medium text-gray-700 mb-1">Resumes (PDF, DOCX or TXT)</label>
          <input id="bulk-files" type="file" multiple accept=".pdf,.docx,.txt" onChange={onFiles} />
          {files.length > 0 && <p className="mt-1 text-xs text-gray-500">{files.length} selected. Uses {files.length} scans.</p>}
        </div>
        <button className="btn-primary" disabled={busy || jd.trim().length < 10 || files.length === 0} onClick={run}>
          {busy ? 'Ranking…' : 'Rank resumes'}
        </button>
      </div>

      {result && (
        <div className="rounded-xl bg-white p-6 shadow-md">
          <ol className="space-y-4">
            {result.ranked.map((r) => (
              <li key={r.name} className="flex gap-4">
                <span className="w-8 text-xl font-bold text-gray-400">#{r.rank}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{r.name} <span className="ml-2 text-blue-600">{r.matchPercent}%</span></p>
                  <p className="text-xs text-green-700">Matched: {r.matchedSkills.slice(0, 8).join(', ') || '–'}</p>
                  <p className="text-xs text-red-700">Missing: {r.missingSkills.slice(0, 8).join(', ') || '–'}</p>
                </div>
              </li>
            ))}
          </ol>
          {result.errors.length > 0 && (
            <ul className="mt-4 space-y-1 border-t border-gray-200 pt-4 text-sm text-red-700">
              {result.errors.map((e) => (
                <li key={e.name}>{e.name}: {e.error} (not charged)</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
