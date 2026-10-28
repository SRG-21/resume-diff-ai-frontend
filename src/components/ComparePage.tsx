import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompare } from '../hooks/useCompare';
import { JDInput } from './JDInput';
import { FileUpload } from './FileUpload';
import { LoadingSpinner } from './LoadingSpinner';
import { ResultsView } from './ResultsView';
import { ErrorMessage } from './ErrorMessage';
import { AiTools } from './AiTools';
import { UpgradePrompt } from './UpgradePrompt';
import { TrackButton } from './TrackButton';
import { validateForm } from '../utils/validation';
import { getSavedResumes, importJob } from '../api/endpoints';
import { useBilling } from '../context/useBilling';
import type { JDInputMode, SavedResume, ValidationErrors } from '../types/api';

const UPGRADE_CODES = ['quota_exceeded', 'upgrade_required', 'resume_limit'];

export const ComparePage: React.FC = () => {
  const { status, can, refresh } = useBilling();
  const [jdMode, setJDMode] = useState<JDInputMode>('upload');
  const [jdFile, setJDFile] = useState<File | null>(null);
  const [jdText, setJDText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [resumeSource, setResumeSource] = useState<'upload' | 'saved'>('upload');
  const [savedResumeId, setSavedResumeId] = useState('');
  const [saveForLater, setSaveForLater] = useState(false);
  const [jobUrl, setJobUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const { data, loading, error, errorCode, compare, cancel, reset } = useCompare();

  useEffect(() => {
    getSavedResumes()
      .then((r) => {
        setSavedResumes(r.items);
        if (r.items.length > 0) {
          setResumeSource('saved');
          setSavedResumeId(r.items[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Keep the quota meter in the navbar and billing page current
  useEffect(() => {
    if (data) void refresh();
  }, [data, refresh]);

  const usingSaved = resumeSource === 'saved' && savedResumeId !== '';
  const canSaveMore = savedResumes.length < (status?.entitlements.saved_resumes ?? 1);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const errors = validateForm(jdMode, jdFile, jdText, resumeFile, !usingSaved);
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    await compare({
      jdFile: jdMode === 'upload' ? jdFile : null,
      jdText: jdMode === 'text' ? jdText : undefined,
      resumeFile: usingSaved ? null : resumeFile,
      resumeId: usingSaved ? savedResumeId : undefined,
      saveResumeAs: !usingSaved && saveForLater && canSaveMore && resumeFile ? resumeFile.name.replace(/\.[^.]+$/, '') : undefined,
    });
  };

  const handleImport = async () => {
    setImporting(true);
    setImportError(null);
    try {
      const imported = await importJob(jobUrl.trim());
      setJDText(imported.text);
      setJDMode('text');
      setValidationErrors({});
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Could not import that link');
    } finally {
      setImporting(false);
    }
  };

  const handleNewComparison = () => {
    reset();
    setJDFile(null);
    setJDText('');
    setJobUrl('');
    setResumeFile(null);
    setValidationErrors({});
  };

  const isFormValid =
    (usingSaved || resumeFile) &&
    ((jdMode === 'upload' && jdFile) || (jdMode === 'text' && jdText.trim().length > 0));

  if (data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Resume Analysis Results</h1>
              <p className="mt-2 text-gray-600">Your resume has been compared against the job description</p>
            </div>
            {data.id && (
              <TrackButton comparisonId={data.id} company={data.company ?? ''} role={data.jobTitle ?? ''} />
            )}
          </div>
          <ResultsView data={data} onNewComparison={handleNewComparison} />
          {data.id && <AiTools comparisonId={data.id} />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">AI Resume-JD Comparator</h1>
          <p className="mt-2 text-gray-600">
            Compare your resume against a job description to see how well you match
          </p>
          {status && (
            <p className="mt-2 text-sm text-gray-500" data-testid="scan-meter">
              {status.usage.scans} of {status.limits.scans} scans used this month
              {status.plan === 'free' && (
                <>
                  {' · '}
                  <Link to="/pricing" className="text-blue-600 hover:underline">
                    Upgrade for more
                  </Link>
                </>
              )}
            </p>
          )}
        </div>

        {error && UPGRADE_CODES.includes(errorCode ?? '') ? (
          <div className="mb-6">
            <UpgradePrompt
              source={`compare_${errorCode}`}
              title={errorCode === 'quota_exceeded' ? "You've used all your scans" : 'Upgrade to continue'}
              message={error}
            />
          </div>
        ) : (
          error && (
            <div className="mb-6">
              <ErrorMessage message={error} onRetry={() => handleSubmit()} onDismiss={() => reset()} />
            </div>
          )
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
            <JDInput
              mode={jdMode}
              onModeChange={(mode) => {
                setJDMode(mode);
                setValidationErrors({});
              }}
              jdFile={jdFile}
              onFileChange={setJDFile}
              jdText={jdText}
              onTextChange={setJDText}
              error={validationErrors.jd}
              disabled={loading}
            />

            {/* Import from a job posting link (paid) */}
            <div>
              <label htmlFor="job-url" className="block text-sm font-medium text-gray-700 mb-1">
                Or import from a job link
              </label>
              {can('job_url_import') ? (
                <>
                  <div className="flex gap-2">
                    <input
                      id="job-url"
                      type="url"
                      className="input-field"
                      placeholder="https://boards.greenhouse.io/…"
                      value={jobUrl}
                      onChange={(e) => setJobUrl(e.target.value)}
                      disabled={loading || importing}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={!jobUrl.trim() || importing || loading}
                      onClick={handleImport}
                    >
                      {importing ? 'Importing…' : 'Import'}
                    </button>
                  </div>
                  {importError && <p className="mt-1 text-sm text-red-600">{importError}</p>}
                  <p className="mt-1 text-xs text-gray-500">
                    Works with most company career pages. LinkedIn and Indeed require sign-in, so paste the text instead.
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  Paste a link and we fetch the job description.{' '}
                  <Link to="/pricing" className="text-blue-600 hover:underline">
                    Available on Pro
                  </Link>
                </p>
              )}
            </div>

            {/* Resume: saved or upload */}
            {savedResumes.length > 0 && (
              <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-white" role="group" aria-label="Resume source">
                {(['saved', 'upload'] as const).map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setResumeSource(src)}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      resumeSource === src ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {src === 'saved' ? 'Saved resume' : 'Upload new'}
                  </button>
                ))}
              </div>
            )}

            {usingSaved || (resumeSource === 'saved' && savedResumes.length > 0) ? (
              <div>
                <label htmlFor="saved-resume" className="block text-sm font-medium text-gray-700 mb-1">
                  Resume
                </label>
                <select
                  id="saved-resume"
                  className="input-field"
                  value={savedResumeId}
                  onChange={(e) => setSavedResumeId(e.target.value)}
                  disabled={loading}
                >
                  {savedResumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <FileUpload
                  id="resume-file"
                  label="Resume"
                  accept=".pdf,.docx,.txt"
                  file={resumeFile}
                  onFileChange={setResumeFile}
                  error={validationErrors.resume}
                  disabled={loading}
                  required
                />
                {canSaveMore && (
                  <label className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={saveForLater} onChange={(e) => setSaveForLater(e.target.checked)} />
                    Save this resume for next time
                  </label>
                )}
              </div>
            )}
          </div>

          {loading && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <LoadingSpinner size="lg" message="Analyzing your resume..." />
              <div className="mt-6 flex justify-center">
                <button type="button" onClick={cancel} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!loading && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:relative md:border-0 md:p-0 md:bg-transparent z-10">
              <button type="submit" disabled={!isFormValid} className="btn-primary w-full">
                Compare Resume & JD
              </button>
            </div>
          )}
        </form>

        {!loading && <div className="h-20 md:h-0" />}
      </div>
    </div>
  );
};

export default ComparePage;
