export type CompareResponse = {
  matchPercent: number;
  matchedSkills: string[];
  missingSkills: string[];
  highlights?: {
    jdMatches?: Array<{ term: string; context: string }>;
    resumeMatches?: Array<{ term: string; context: string }>;
  };
  warnings?: string[];
};

export type JDInputMode = 'upload' | 'text';

export type ValidationErrors = {
  jd?: string;
  resume?: string;
  general?: string;
};

export type CompareState = {
  data: CompareResponse | null;
  loading: boolean;
  error: string | null;
};
