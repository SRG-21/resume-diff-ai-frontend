import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createApplication, deleteApplication, listApplications, updateApplication } from '../api/endpoints';
import { ApiError } from '../api/client';
import { UpgradePrompt } from '../components/UpgradePrompt';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { Application, ApplicationStatus } from '../types/api';

const COLUMNS: Array<{ id: ApplicationStatus; label: string }> = [
  { id: 'saved', label: 'Saved' },
  { id: 'applied', label: 'Applied' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offer' },
  { id: 'rejected', label: 'Rejected' },
];

export const TrackerPage: React.FC = () => {
  const [items, setItems] = useState<Application[] | null>(null);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');

  const load = useCallback(async () => {
    try {
      setItems((await listApplications()).items);
    } catch (err) {
      if (err instanceof ApiError && err.isUpgrade) setLocked(true);
      else setError(err instanceof Error ? err.message : 'Could not load applications');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (locked) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <UpgradePrompt source="tracker" title="Application tracker" message="Keep every job, match score and status in one board. Included with Pro and the Job Hunt Pass." />
      </div>
    );
  }
  if (error) return <p className="p-8 text-center text-red-600" role="alert">{error}</p>;
  if (!items) return <div className="p-16"><LoadingSpinner message="Loading…" /></div>;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;
    await createApplication({ company: company.trim(), role: role.trim() });
    setCompany('');
    setRole('');
    await load();
  };

  const move = async (app: Application, status: ApplicationStatus) => {
    // Stamp the first time a job moves to "applied"
    const appliedOn = status === 'applied' && !app.applied_on ? new Date().toISOString().slice(0, 10) : undefined;
    await updateApplication(app.id, { status, ...(appliedOn ? { applied_on: appliedOn } : {}) });
    await load();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Applications</h1>

      <form onSubmit={add} className="mt-6 flex flex-wrap gap-3">
        <input className="input-field max-w-xs" placeholder="Company" aria-label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
        <input className="input-field max-w-xs" placeholder="Role" aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)} />
        <button className="btn-primary" disabled={!company.trim() || !role.trim()}>Add</button>
      </form>

      <div className="mt-8 grid gap-4 md:grid-cols-5">
        {COLUMNS.map((col) => {
          const cards = items.filter((a) => a.status === col.id);
          return (
            <section key={col.id} className="rounded-xl bg-gray-100 p-3" aria-label={col.label}>
              <h2 className="mb-3 text-sm font-semibold text-gray-700">{col.label} <span className="text-gray-400">({cards.length})</span></h2>
              <ul className="space-y-3">
                {cards.map((a) => (
                  <li key={a.id} className="rounded-lg bg-white p-3 shadow-sm">
                    <p className="font-medium text-gray-900">{a.role}</p>
                    <p className="text-sm text-gray-600">{a.company}</p>
                    {a.match_percent !== null && (
                      <p className="mt-1 text-xs text-gray-500">
                        Match {a.match_percent}%
                        {a.comparison_id && <> · <Link className="text-blue-600 hover:underline" to={`/history/${a.comparison_id}`}>view</Link></>}
                      </p>
                    )}
                    <select
                      className="mt-2 w-full rounded border border-gray-300 p-1 text-xs"
                      value={a.status}
                      aria-label={`Status for ${a.role} at ${a.company}`}
                      onChange={(e) => move(a, e.target.value as ApplicationStatus)}
                    >
                      {COLUMNS.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                    <button
                      className="mt-2 text-xs text-gray-400 hover:text-red-600"
                      onClick={async () => {
                        await deleteApplication(a.id);
                        await load();
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
};
