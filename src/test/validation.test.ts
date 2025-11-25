import { describe, it, expect } from 'vitest';
import {
  validateResumeFile,
  validateJDFile,
  validateJDText,
  validateForm,
  formatFileSize,
} from '../utils/validation';

describe('validation utilities', () => {
  describe('validateResumeFile', () => {
    it('should return error if file is null', () => {
      const error = validateResumeFile(null);
      expect(error).toBe('Resume file is required');
    });

    it('should return error if file is too large', () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'resume.pdf', {
        type: 'application/pdf',
      });
      const error = validateResumeFile(largeFile);
      expect(error).toContain('File size must be less than');
    });

    it('should return error for invalid file type', () => {
      const invalidFile = new File(['test'], 'resume.exe', {
        type: 'application/x-msdownload',
      });
      const error = validateResumeFile(invalidFile);
      expect(error).toContain('Invalid file type');
    });

    it('should return null for valid PDF file', () => {
      const validFile = new File(['test content'], 'resume.pdf', {
        type: 'application/pdf',
      });
      const error = validateResumeFile(validFile);
      expect(error).toBeNull();
    });

    it('should return null for valid TXT file', () => {
      const validFile = new File(['test content'], 'resume.txt', {
        type: 'text/plain',
      });
      const error = validateResumeFile(validFile);
      expect(error).toBeNull();
    });
  });

  describe('validateJDFile', () => {
    it('should return null if file is null (optional)', () => {
      const error = validateJDFile(null);
      expect(error).toBeNull();
    });

    it('should return error if file is too large', () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'jd.pdf', {
        type: 'application/pdf',
      });
      const error = validateJDFile(largeFile);
      expect(error).toContain('File size must be less than');
    });

    it('should return error for non-PDF file', () => {
      const invalidFile = new File(['test'], 'jd.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const error = validateJDFile(invalidFile);
      expect(error).toContain('Invalid file type');
    });

    it('should return null for valid PDF file', () => {
      const validFile = new File(['test content'], 'jd.pdf', {
        type: 'application/pdf',
      });
      const error = validateJDFile(validFile);
      expect(error).toBeNull();
    });
  });

  describe('validateJDText', () => {
    it('should return null for empty text (optional)', () => {
      const error = validateJDText('');
      expect(error).toBeNull();
    });

    it('should return error for text that is too long', () => {
      const longText = 'x'.repeat(50001);
      const error = validateJDText(longText);
      expect(error).toContain('too long');
    });

    it('should return null for valid text', () => {
      const validText = 'We are looking for a skilled developer...';
      const error = validateJDText(validText);
      expect(error).toBeNull();
    });
  });

  describe('validateForm', () => {
    it('should return error if resume file is missing', () => {
      const jdFile = new File(['test'], 'jd.pdf', { type: 'application/pdf' });
      const errors = validateForm('upload', jdFile, '', null);
      expect(errors.resume).toBeDefined();
    });

    it('should return error if JD file is missing in upload mode', () => {
      const resumeFile = new File(['test'], 'resume.pdf', {
        type: 'application/pdf',
      });
      const errors = validateForm('upload', null, '', resumeFile);
      expect(errors.jd).toBeDefined();
    });

    it('should return error if JD text is missing in text mode', () => {
      const resumeFile = new File(['test'], 'resume.pdf', {
        type: 'application/pdf',
      });
      const errors = validateForm('text', null, '', resumeFile);
      expect(errors.jd).toBeDefined();
    });

    it('should return no errors for valid upload mode', () => {
      const jdFile = new File(['test'], 'jd.pdf', { type: 'application/pdf' });
      const resumeFile = new File(['test'], 'resume.pdf', {
        type: 'application/pdf',
      });
      const errors = validateForm('upload', jdFile, '', resumeFile);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('should return no errors for valid text mode', () => {
      const resumeFile = new File(['test'], 'resume.pdf', {
        type: 'application/pdf',
      });
      const errors = validateForm('text', null, 'Looking for a developer', resumeFile);
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe('formatFileSize', () => {
    it('should format 0 bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    it('should format bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
    });
  });
});
