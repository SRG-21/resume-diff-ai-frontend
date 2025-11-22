import React, { useState } from 'react';
import { useCompare } from './hooks/useCompare';
import { JDInput } from './components/JDInput';
import { FileUpload } from './components/FileUpload';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ResultsView } from './components/ResultsView';
import { ErrorMessage } from './components/ErrorMessage';
import { validateForm } from './utils/validation';
import type { JDInputMode, ValidationErrors } from './types/api';

function App() {
  const [jdMode, setJDMode] = useState<JDInputMode>('upload');
  const [jdFile, setJDFile] = useState<File | null>(null);
  const [jdText, setJDText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const { data, loading, error, compare, cancel, reset } = useCompare({
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  });

  const handleJDModeChange = (mode: JDInputMode) => {
    setJDMode(mode);
    setValidationErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm(jdMode, jdFile, jdText, resumeFile);
    setValidationErrors(errors);

    // If there are validation errors, don't submit
    if (Object.keys(errors).length > 0) {
      return;
    }

    // Submit to API
    await compare({
      jdFile: jdMode === 'upload' ? jdFile : null,
      jdText: jdMode === 'text' ? jdText : undefined,
      resumeFile: resumeFile!,
    });
  };

  const handleNewComparison = () => {
    reset();
    setJDFile(null);
    setJDText('');
    setResumeFile(null);
    setValidationErrors({});
  };

  const handleCancel = () => {
    cancel();
  };

  const handleRetry = () => {
    handleSubmit(new Event('submit') as any);
  };

  const isFormValid =
    resumeFile &&
    ((jdMode === 'upload' && jdFile) || (jdMode === 'text' && jdText.trim().length > 0));

  // Show results if we have data
  if (data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Resume Analysis Results
            </h1>
            <p className="mt-2 text-gray-600">
              Your resume has been compared against the job description
            </p>
          </div>
          <ResultsView data={data} onNewComparison={handleNewComparison} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            AI Resume-JD Comparator
          </h1>
          <p className="mt-2 text-gray-600">
            Compare your resume against a job description to see how well you match
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <ErrorMessage
              message={error}
              onRetry={handleRetry}
              onDismiss={() => reset()}
            />
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
            {/* JD Input */}
            <JDInput
              mode={jdMode}
              onModeChange={handleJDModeChange}
              jdFile={jdFile}
              onFileChange={setJDFile}
              jdText={jdText}
              onTextChange={setJDText}
              error={validationErrors.jd}
              disabled={loading}
            />

            {/* Resume Upload */}
            <FileUpload
              id="resume-file"
              label="Resume"
              accept=".pdf,.doc,.docx,.txt"
              file={resumeFile}
              onFileChange={setResumeFile}
              error={validationErrors.resume}
              disabled={loading}
              required
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <LoadingSpinner size="lg" message="Analyzing your resume..." />
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Submit Button - Sticky on mobile */}
          {!loading && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:relative md:border-0 md:p-0 md:bg-transparent z-10">
              <button
                type="submit"
                disabled={!isFormValid}
                className="btn-primary w-full"
              >
                Compare Resume & JD
              </button>
            </div>
          )}
        </form>

        {/* Spacer for sticky button on mobile */}
        {!loading && <div className="h-20 md:h-0" />}
      </div>
    </div>
  );
}

export default App;
