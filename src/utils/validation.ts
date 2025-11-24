import type { ValidationErrors } from '../types/api';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_RESUME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const ALLOWED_JD_TYPES = ['application/pdf'];

export const validateResumeFile = (file: File | null): string | null => {
  if (!file) {
    return 'Resume file is required';
  }

  if (file.size > MAX_FILE_SIZE) {
    return `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`;
  }

  if (!ALLOWED_RESUME_TYPES.includes(file.type)) {
    return 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT file';
  }

  return null;
};

export const validateJDFile = (file: File | null): string | null => {
  if (!file) {
    return null; // JD file is optional
  }

  if (file.size > MAX_FILE_SIZE) {
    return `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`;
  }

  if (!ALLOWED_JD_TYPES.includes(file.type)) {
    return 'Invalid file type. Please upload PDF file';
  }

  return null;
};

export const validateJDText = (text: string): string | null => {
  if (!text || text.trim().length === 0) {
    return null; // JD text is optional
  }

  if (text.length > 50000) {
    return 'Job description text is too long (max 50,000 characters)';
  }

  return null;
};

export const validateForm = (
  jdMode: 'upload' | 'text',
  jdFile: File | null,
  jdText: string,
  resumeFile: File | null
): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate resume
  const resumeError = validateResumeFile(resumeFile);
  if (resumeError) {
    errors.resume = resumeError;
  }

  // Validate JD input based on mode
  if (jdMode === 'upload') {
    const jdFileError = validateJDFile(jdFile);
    if (!jdFile) {
      errors.jd = 'Please upload a job description PDF or switch to text mode';
    } else if (jdFileError) {
      errors.jd = jdFileError;
    }
  } else {
    const jdTextError = validateJDText(jdText);
    if (!jdText || jdText.trim().length === 0) {
      errors.jd = 'Please enter job description text or switch to upload mode';
    } else if (jdTextError) {
      errors.jd = jdTextError;
    }
  }

  return errors;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
