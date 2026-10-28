import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  exportTailored,
  generateCoverLetter,
  generateInterviewPrep,
  generateRewrites,
  getSavedAi,
} from '../api/endpoints';
import { ApiError } from '../api/client';
import { useBilling } from '../context/useBilling';
import { copyToClipboard } from '../utils/export';
import { track } from '../analytics';
import type { CoverLetter, InterviewQuestion, RewriteResult } from '../types/api';
import { UpgradePrompt } from './UpgradePrompt';
import { LoadingSpinner } from './LoadingSpinner';

type Tab = 'rewrites' | 'cover' | 'interview';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'rewrites', label: 'Resume rewrites' },
  { id: 'cover', label: 'Cover letter' },
  { id: 'interview', label: 'Interview prep' },
];

const TONES = ['professional', 'friendly', 'confident', 'concise'];

const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const AiTools: React.FC<{ comparisonId: string }> = ({ comparisonId }) => {
  const { can, refresh } = useBilling();
  const [tab, setTab] = useState<Tab>('rewrites');
  const [rewrites, setRewrites] = useState<RewriteResult | null>(null);
  const [accepted, setAccepted] = useState<Set<number>>(new Set());
  const [cover, setCover] = useState<CoverLetter | null>(null);
  const [letterText, setLetterText] = useState('');
  const [tone, setTone] = useState('professional');
  const [questions, setQuestions] = useState<InterviewQuestion[] | null>(null);
  const [busy, setBusy] = useState<Tab | 'export' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const paid = can('rewrites');

  const applyRewrites = useCallback((result: RewriteResult | null) => {
    setRewrites(result);
    setAccepted(new Set(result ? result.rewrites.map((_, i) => i) : []));
  }, []);

  // Show anything generated earlier for this comparison without spending another AI action
  useEffect(() => {
    if (!paid) return;
    let cancelled = false;
    getSavedAi(comparisonId)
      .then((saved) => {
        if (cancelled) return;
        applyRewrites(saved.rewrites);
        setCover(saved.cover_letter);
        setLetterText(saved.cover_letter?.letter ?? '');
        if (saved.cover_letter) setTone(saved.cover_letter.tone);
        setQuestions(saved.interview_prep);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [comparisonId, paid, applyRewrites]);

  const run = async (which: Tab | 'export', action: () => Promise<void>) => {
    setBusy(which);
    setError(null);
    try {
      await action();
      track('ai_tool_used', { tool: which });
      void refresh();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(null);
    }
  };

  if (!paid) {
    return (
      <UpgradePrompt
        source="ai_tools"
        title="Fix the gaps with AI"
        message="Pro gives you tailored bullet rewrites, a cover letter for this job, interview questions based on your gaps, and a tailored resume download."
      />
    );
  }

  const download = (format: 'docx' | 'pdf') =>
    run('export', async () => {
      const chosen = rewrites ? rewrites.rewrites.filter((_, i) => accepted.has(i)) : [];
      const blob = await exportTailored(comparisonId, chosen.map(({ original, suggested }) => ({ original, suggested })), format);
      saveBlob(blob, `tailored_resume.${format}`);
    });

  const copy = async (text: string) => {
    if (await copyToClipboard(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-md p-6" aria-label="AI tools">
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}{' '}
          {/quota|used all|plan/i.test(error) && (
            <Link to="/pricing" className="underline">
              See plans
            </Link>
          )}
        </p>
      )}

      {busy && busy !== 'export' && (
        <div className="py-8">
          <LoadingSpinner message="Writing… this takes about 10 seconds" />
        </div>
      )}

      {tab === 'rewrites' && busy !== 'rewrites' && (
        <div className="mt-4">
          {!rewrites ? (
            <div>
              <p className="text-sm text-gray-600">
                Get stronger versions of your existing bullets that work in the keywords this job asks for. Suggestions
                only use experience already on your resume.
              </p>
              <button className="btn-primary mt-4" onClick={() => run('rewrites', async () => applyRewrites(await generateRewrites(comparisonId)))}>
                Suggest rewrites
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {rewrites.rewrites.length === 0 && <p className="text-sm text-gray-600">No rewrites were suggested for this job.</p>}
              {rewrites.rewrites.map((r, i) => (
                <div key={i} className="rounded-lg border border-gray-200 p-4">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={accepted.has(i)}
                      onChange={(e) => {
                        const next = new Set(accepted);
                        if (e.target.checked) next.add(i);
                        else next.delete(i);
                        setAccepted(next);
                      }}
                      aria-label={`Use rewrite ${i + 1}`}
                    />
                    <span className="flex-1 text-sm">
                      <span className="block text-gray-500 line-through">{r.original}</span>
                      <span className="mt-1 block font-medium text-gray-900">{r.suggested}</span>
                      {r.reason && <span className="mt-1 block text-gray-600">{r.reason}</span>}
                    </span>
                  </label>
                  <button className="mt-2 text-xs text-blue-600 hover:underline" onClick={() => copy(r.suggested)}>
                    {copied ? 'Copied!' : 'Copy suggestion'}
                  </button>
                </div>
              ))}

              {rewrites.gaps.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900">Skills to build or show</h4>
                  <ul className="mt-2 space-y-2 text-sm text-gray-700">
                    {rewrites.gaps.map((g) => (
                      <li key={g.skill}>
                        <span className="font-medium">{g.skill}:</span> {g.advice}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 pt-4">
                {can('export') && (
                  <>
                    <button className="btn-primary" onClick={() => download('docx')} disabled={busy === 'export'}>
                      {busy === 'export' ? 'Preparing…' : 'Download tailored resume (.docx)'}
                    </button>
                    <button className="btn-secondary" onClick={() => download('pdf')} disabled={busy === 'export'}>
                      Download PDF
                    </button>
                  </>
                )}
                <button
                  className="btn-secondary"
                  onClick={() => run('rewrites', async () => applyRewrites(await generateRewrites(comparisonId, true)))}
                >
                  Regenerate
                </button>
              </div>
              <p className="text-xs text-gray-500">
                The download rebuilds your resume as a plain single-column Word file with the checked rewrites applied.
                Review it and re-apply your own styling before sending.
              </p>
            </div>
          )}
        </div>
      )}

      {tab === 'cover' && busy !== 'cover' && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">
                Tone
              </label>
              <select id="tone" className="input-field" value={tone} onChange={(e) => setTone(e.target.value)}>
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn-primary"
              onClick={() =>
                run('cover', async () => {
                  const result = await generateCoverLetter(comparisonId, tone, !!cover);
                  setCover(result);
                  setLetterText(result.letter);
                })
              }
            >
              {cover ? 'Regenerate' : 'Write cover letter'}
            </button>
          </div>
          {cover && (
            <>
              <textarea
                className="input-field min-h-[320px] font-serif"
                value={letterText}
                onChange={(e) => setLetterText(e.target.value)}
                aria-label="Cover letter"
              />
              <div className="flex gap-3">
                <button className="btn-secondary" onClick={() => copy(letterText)}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button className="btn-secondary" onClick={() => saveBlob(new Blob([letterText], { type: 'text/plain' }), 'cover_letter.txt')}>
                  Download .txt
                </button>
              </div>
              <p className="text-xs text-gray-500">Replace [Hiring Manager] and [Your Name] before sending.</p>
            </>
          )}
        </div>
      )}

      {tab === 'interview' && busy !== 'interview' && (
        <div className="mt-4">
          {!questions ? (
            <div>
              <p className="text-sm text-gray-600">Likely interview questions for this role, weighted toward your skill gaps.</p>
              <button
                className="btn-primary mt-4"
                onClick={() => run('interview', async () => setQuestions((await generateInterviewPrep(comparisonId)).questions))}
              >
                Generate questions
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {questions.map((q, i) => (
                <li key={i}>
                  <details className="rounded-lg border border-gray-200 p-4">
                    <summary className="cursor-pointer font-medium text-gray-900">
                      {q.question}{' '}
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-600">{q.category}</span>
                    </summary>
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Why they ask:</span> {q.why}
                    </p>
                    <p className="mt-2 text-sm text-gray-800">
                      <span className="font-medium">How to answer:</span> {q.answer_outline}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};
