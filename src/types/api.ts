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

// ============ Authentication Types ============

export type User = {
  id: string;
  email: string;
  name: string;
  created_at: string;
};

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

export type LoginResponse = AuthTokens & {
  user: User;
};

export type SignupRequest = {
  email: string;
  name: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

export type AuthContextType = AuthState & {
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};
