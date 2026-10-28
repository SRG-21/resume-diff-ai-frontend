import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { clearHistory, deleteHistoryItem, getHistory, getHistoryItem } from '../api/endpoints';
import { ApiError } from '../api/client';
import { ResultsView } from '../components/ResultsView';
import { AiTools } from '../components/AiTools';
import { TrackButton } from '../components/TrackButton';
import { UpgradePrompt } from '../components/UpgradePrompt';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { CompareResponse, HistoryList } from '../types/api';

const scoreColor = (n: number) => (n >= 75 ? 'text-green-600' : n >= 50 ? 'text-yellow-600' : 'text-red-600');

const formatDate = (iso: string) =>
  new Date(iso.endsWith('Z') ? iso : `${iso}Z`).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export const HistoryPage: React.FC = () => {
  const [data, setData] = useState<HistoryList | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await getHistory());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load history');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (error) return <p className="p-8 text-center text-red-600" role="alert">{error}</p>;
  if (!data) return <div className="p-16"><LoadingSpinner message="Loading history…" /></div>;

  const hidden = data.items.filter((i) => i.locked).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-gray-900">History</h1>
        {data.total > 0 && (
          <button
            className="text-sm text-red-600 hover:underline"
            onClick={async () => {
              if (window.confirm('Delete all saved comparisons? This cannot be undone.')) {
                await clearHistory();
                await load();
              }
            }}
          >
            Delete all
          </button>
        )}
      </div>

      {data.items.length === 0 ? (
        <div className="mt-8 rounded-xl bg-white p-10 text-center shadow-md">
          <p className="text-gray-600">No comparisons yet.</p>
          <Link to="/app" className="btn-primary mt-4 inline-flex items-center">Scan a resume</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {data.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
              <span className={`w-16 text-center text-2xl font-bold ${scoreColor(item.match_percent)}`}>{item.match_percent}%</span>
              <div className="min-w-0 flex-1">
                {item.locked ? (
                  <p className="font-medium text-gray-400">{item.job_title || 'Untitled role'} <span className="text-xs">(upgrade to view)</span></p>
                ) : (
                  <Link to={`/history/${item.id}`} className="block truncate font-medium text-gray-900 hover:text-blue-600">
                    {item.job_title || 'Untitled role'}{item.company ? ` · ${item.company}` : ''}
                  </Link>
                )}
                <p className="truncate text-xs text-gray-500">
                  {formatDate(item.created_at)} · {item.resume_name} · {item.matched_count} matched, {item.missing_count} missing
                  {item.ats_score !== null && ` · ATS ${item.ats_score}`}
                </p>
              </div>
              <button
                className="text-sm text-gray-400 hover:text-red-600"
                aria-label="Delete comparison"
                onClick={async () => {
                  await deleteHistoryItem(item.id);
                  await load();
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {hidden > 0 && (
        <div className="mt-6">
          <UpgradePrompt
            source="history"
            title={`${hidden} older ${hidden === 1 ? 'comparison is' : 'comparisons are'} locked`}
            message={`The free plan opens your latest ${data.history_limit} comparisons. Upgrade for unlimited history.`}
          />
        </div>
      )}
    </div>
  );
};

export const HistoryDetailPage: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<CompareResponse | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHistoryItem(id)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        {error instanceof ApiError && error.isUpgrade ? (
          <UpgradePrompt source="history_detail" message="This comparison is outside your plan’s history window." />
        ) : (
          <p className="text-center text-red-600" role="alert">{error.message}</p>
        )}
        <p className="mt-6 text-center"><Link to="/history" className="text-blue-600 hover:underline">Back to history</Link></p>
      </div>
    );
  }
  if (!data) return <div className="p-16"><LoadingSpinner message="Loading…" /></div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button className="text-sm text-blue-600 hover:underline" onClick={() => navigate('/history')}>← History</button>
        <TrackButton comparisonId={id} company={data.company ?? ''} role={data.jobTitle ?? ''} />
      </div>
      <ResultsView data={data} />
      <AiTools comparisonId={id} />
    </div>
  );
};
