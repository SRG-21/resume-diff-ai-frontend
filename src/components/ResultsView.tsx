import React, { useState } from 'react';
import type { CompareResponse } from '../types/api';
import { ProgressCircle } from './ProgressCircle';
import { SkillChips } from './SkillChips';
import { copyToClipboard, exportToCSV, formatSkillsList } from '../utils/export';

interface ResultsViewProps {
  data: CompareResponse;
  onNewComparison: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ data, onNewComparison }) => {
  const [showRawJSON, setShowRawJSON] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyMissingSkills = async () => {
    const success = await copyToClipboard(formatSkillsList(data.missingSkills));
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(data.missingSkills);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Warnings */}
      {data.warnings && data.warnings.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Warnings</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {data.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match Percentage */}
      <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Overall Match</h2>
        <ProgressCircle percentage={data.matchPercent} />
      </div>

      {/* Matched and Missing Skills Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matched Skills */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg
              className="h-5 w-5 text-green-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Matched Skills ({data.matchedSkills.length})
          </h3>
          <SkillChips skills={data.matchedSkills} variant="matched" />
        </div>

        {/* Missing Skills */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg
              className="h-5 w-5 text-red-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Missing Skills ({data.missingSkills.length})
          </h3>
          <SkillChips skills={data.missingSkills} variant="missing" className="mb-4" />

          {data.missingSkills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleCopyMissingSkills}
                className="btn-secondary flex-1 sm:flex-none"
                aria-label="Copy missing skills to clipboard"
              >
                <svg
                  className="h-5 w-5 mr-2 inline"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                onClick={handleExportCSV}
                className="btn-secondary flex-1 sm:flex-none"
                aria-label="Export missing skills as CSV"
              >
                <svg
                  className="h-5 w-5 mr-2 inline"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Optional Highlights */}
      {data.highlights && (data.highlights.jdMatches || data.highlights.resumeMatches) && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Highlights</h3>
          <div className="space-y-4">
            {data.highlights.jdMatches && data.highlights.jdMatches.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Job Description Matches</h4>
                <ul className="space-y-2">
                  {data.highlights.jdMatches.map((match, index) => (
                    <li key={index} className="text-sm bg-blue-50 p-3 rounded-lg">
                      <span className="font-medium text-blue-900">{match.term}:</span>{' '}
                      <span className="text-blue-800">{match.context}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.highlights.resumeMatches && data.highlights.resumeMatches.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Resume Matches</h4>
                <ul className="space-y-2">
                  {data.highlights.resumeMatches.map((match, index) => (
                    <li key={index} className="text-sm bg-green-50 p-3 rounded-lg">
                      <span className="font-medium text-green-900">{match.term}:</span>{' '}
                      <span className="text-green-800">{match.context}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Raw JSON Toggle */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <button
          onClick={() => setShowRawJSON(!showRawJSON)}
          className="btn-secondary w-full sm:w-auto"
          aria-expanded={showRawJSON}
        >
          {showRawJSON ? 'Hide' : 'Show'} Raw JSON
        </button>
        {showRawJSON && (
          <pre className="mt-4 p-4 bg-gray-50 rounded-lg overflow-x-auto text-xs">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>

      {/* New Comparison Button */}
      <div className="flex justify-center">
        <button onClick={onNewComparison} className="btn-primary">
          <svg
            className="h-5 w-5 mr-2 inline"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Comparison
        </button>
      </div>
    </div>
  );
};
