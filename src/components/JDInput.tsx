import React from 'react';
import { FileUpload } from './FileUpload';
import type { JDInputMode } from '../types/api';

interface JDInputProps {
  mode: JDInputMode;
  onModeChange: (mode: JDInputMode) => void;
  jdFile: File | null;
  onFileChange: (file: File | null) => void;
  jdText: string;
  onTextChange: (text: string) => void;
  error?: string;
  disabled?: boolean;
}

const MAX_JD_LENGTH = 50000;

export const JDInput: React.FC<JDInputProps> = ({
  mode,
  onModeChange,
  jdFile,
  onFileChange,
  jdText,
  onTextChange,
  error,
  disabled = false,
}) => {
  const charCount = jdText.length;
  const isNearLimit = charCount > MAX_JD_LENGTH * 0.9;
  const isOverLimit = charCount > MAX_JD_LENGTH;

  return (
    <div className="w-full space-y-4">
      {/* Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <label className="block text-sm font-medium text-gray-700">
          Job Description <span className="text-red-500">*</span>
        </label>
        <div
          className="inline-flex rounded-lg border border-gray-300 p-1 bg-white"
          role="group"
          aria-label="Job description input mode"
        >
          <button
            type="button"
            onClick={() => onModeChange('upload')}
            disabled={disabled}
            className={`px-4 py-2 text-sm font-medium rounded-md min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              mode === 'upload'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-pressed={mode === 'upload'}
          >
            Upload PDF
          </button>
          <button
            type="button"
            onClick={() => onModeChange('text')}
            disabled={disabled}
            className={`px-4 py-2 text-sm font-medium rounded-md min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              mode === 'text'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-pressed={mode === 'text'}
          >
            Paste Text
          </button>
        </div>
      </div>

      {/* File Upload Mode */}
      {mode === 'upload' && (
        <FileUpload
          id="jd-file"
          label=""
          accept=".pdf,application/pdf"
          file={jdFile}
          onFileChange={onFileChange}
          error={error}
          disabled={disabled}
        />
      )}

      {/* Text Input Mode */}
      {mode === 'text' && (
        <div>
          <textarea
            id="jd-text"
            rows={8}
            value={jdText}
            onChange={(e) => onTextChange(e.target.value)}
            disabled={disabled}
            placeholder="Paste the job description here..."
            className={`input-field resize-y ${
              error ? 'border-red-500 focus:ring-red-500' : ''
            }`}
            aria-invalid={!!error}
            aria-describedby={error ? 'jd-text-error' : 'jd-text-counter'}
          />
          
          {/* Character Counter */}
          <div className="mt-2 flex justify-between items-center">
            <div>
              {error && (
                <p id="jd-text-error" className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
            </div>
            <p
              id="jd-text-counter"
              className={`text-xs ${
                isOverLimit
                  ? 'text-red-600 font-semibold'
                  : isNearLimit
                  ? 'text-orange-600'
                  : 'text-gray-500'
              }`}
            >
              {charCount.toLocaleString()} / {MAX_JD_LENGTH.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
