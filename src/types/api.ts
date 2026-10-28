export type Breakdown = {
  hardSkills: number;
  softSkills: number;
  experience: number;
  education: number;
  titleMatch: number;
  keywords: number;
};

export type AtsIssue = { severity: 'error' | 'warning' | 'info'; title: string; detail: string };

export type AtsReport = {
  score: number;
  issues: AtsIssue[];
  passed: string[];
  /** true when the plan hides the issue list */
  locked: boolean;
  /** number of issues found when the list is hidden */
  issue_count?: number;
};

export type CompareResponse = {
  id?: string | null;
  matchPercent: number;
  matchedSkills: string[];
  missingSkills: string[];
  highlights?: {
    jdMatches?: Array<{ term: string; context: string }>;
    resumeMatches?: Array<{ term: string; context: string }>;
  } | null;
  warnings?: string[] | null;
  jobTitle?: string | null;
  company?: string | null;
  breakdown?: Breakdown | null;
  ats?: AtsReport | null;
  /** features hidden by the user's plan, e.g. "breakdown", "ats_details" */
  locked?: string[];
  usage?: { used: number; limit: number } | null;
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
  /** machine-readable error code from the API, e.g. "quota_exceeded" */
  errorCode?: string | null;
};

// ============ Authentication Types ============

export type PlanId = 'free' | 'pro' | 'pass' | 'coach';

export type User = {
  id: string;
  email: string;
  name: string;
  created_at: string;
  email_verified?: boolean;
  plan?: PlanId;
  auth_provider?: 'password' | 'google';
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
  loginWithGoogle: (credential: string) => Promise<void>;
  /** Sign in with tokens returned by another auth endpoint (e.g. password reset) */
  acceptTokens: (response: LoginResponse) => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

// ============ Billing & plans ============

export type Entitlements = {
  id: PlanId;
  name: string;
  scans_per_month: number;
  ai_actions_per_month: number;
  history_limit: number;
  saved_resumes: number;
  breakdown: boolean;
  ats_details: boolean;
  rewrites: boolean;
  cover_letter: boolean;
  interview_prep: boolean;
  export: boolean;
  job_url_import: boolean;
  tracker: boolean;
  bulk_rank: boolean;
  bulk_max_resumes: number;
};

export type BillingStatus = {
  plan: PlanId;
  plan_name: string;
  subscription_status: string | null;
  cancel_at_period_end: boolean;
  plan_expires_at: string | null;
  usage: { scans: number; ai_actions: number };
  limits: { scans: number; ai_actions: number };
  entitlements: Entitlements;
  has_billing_account: boolean;
  billing_enabled: boolean;
};

export type CheckoutProduct = 'pro_monthly' | 'pro_yearly' | 'pass' | 'coach_monthly';

// ============ History, resumes, AI tools ============

export type HistoryItem = {
  id: string;
  job_title: string | null;
  company: string | null;
  resume_name: string | null;
  match_percent: number;
  ats_score: number | null;
  matched_count: number;
  missing_count: number;
  created_at: string;
  locked: boolean;
};

export type HistoryList = { items: HistoryItem[]; total: number; history_limit: number };

export type SavedResume = {
  id: string;
  name: string;
  filename: string | null;
  file_type: string | null;
  words: number;
  created_at: string;
};

export type Rewrite = { original: string; suggested: string; reason: string; keywords: string[] };
export type SkillGap = { skill: string; advice: string };
export type RewriteResult = { rewrites: Rewrite[]; gaps: SkillGap[] };
export type CoverLetter = { letter: string; tone: string };
export type InterviewQuestion = { question: string; why: string; answer_outline: string; category: string };

export type SavedAiOutputs = {
  rewrites: RewriteResult | null;
  cover_letter: CoverLetter | null;
  interview_prep: InterviewQuestion[] | null;
};

export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

export type Application = {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  url: string | null;
  notes: string | null;
  comparison_id: string | null;
  match_percent: number | null;
  applied_on: string | null;
  created_at: string;
  updated_at: string;
};

export type ApplicationInput = {
  company: string;
  role: string;
  status?: ApplicationStatus;
  url?: string | null;
  notes?: string | null;
  comparison_id?: string | null;
  applied_on?: string | null;
};

export type BulkRankResponse = {
  ranked: Array<{ rank: number; name: string; matchPercent: number; matchedSkills: string[]; missingSkills: string[] }>;
  errors: Array<{ name: string; error: string }>;
};
