import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { AuthContext, initialAuthState } from '../context/auth-context';
import { BillingContext } from '../context/billing-context';
import type { AuthContextType, BillingStatus, Entitlements, PlanId } from '../types/api';

const FREE: Entitlements = {
  id: 'free', name: 'Free', scans_per_month: 3, ai_actions_per_month: 0, history_limit: 5, saved_resumes: 1,
  breakdown: false, ats_details: false, rewrites: false, cover_letter: false, interview_prep: false,
  export: false, job_url_import: false, tracker: false, bulk_rank: false, bulk_max_resumes: 0,
};

const PRO: Entitlements = {
  ...FREE, id: 'pro', name: 'Pro', scans_per_month: 300, ai_actions_per_month: 200, history_limit: 0, saved_resumes: 10,
  breakdown: true, ats_details: true, rewrites: true, cover_letter: true, interview_prep: true,
  export: true, job_url_import: true, tracker: true,
};

export const billingStatus = (plan: PlanId = 'free', overrides: Partial<BillingStatus> = {}): BillingStatus => {
  const entitlements = plan === 'free' ? FREE : { ...PRO, id: plan, name: plan === 'coach' ? 'Coach' : 'Pro', bulk_rank: plan === 'coach', bulk_max_resumes: plan === 'coach' ? 10 : 0 };
  return {
    plan,
    plan_name: entitlements.name,
    subscription_status: plan === 'free' ? null : 'active',
    cancel_at_period_end: false,
    plan_expires_at: null,
    usage: { scans: 1, ai_actions: 0 },
    limits: { scans: entitlements.scans_per_month, ai_actions: entitlements.ai_actions_per_month },
    entitlements,
    has_billing_account: plan !== 'free',
    billing_enabled: true,
    ...overrides,
  };
};

interface Options {
  route?: string;
  plan?: PlanId | null;
  auth?: Partial<AuthContextType>;
  billingRefresh?: () => Promise<void>;
}

/** Render inside a router with auth and billing context supplied directly */
export const renderWithProviders = (ui: React.ReactElement, { route = '/', plan = 'free', auth = {}, billingRefresh }: Options = {}) => {
  const status = plan ? billingStatus(plan) : null;
  const authValue: AuthContextType = {
    ...initialAuthState,
    isLoading: false,
    isAuthenticated: true,
    user: { id: 'u1', email: 'a@example.com', name: 'Ann', created_at: '2026-01-01', email_verified: true, plan: plan ?? 'free' },
    ...auth,
  };
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthContext.Provider value={authValue}>
        <BillingContext.Provider
          value={{
            status,
            loading: false,
            refresh: billingRefresh ?? (async () => {}),
            can: (feature) => Boolean(status?.entitlements[feature]),
          }}
        >
          {ui}
        </BillingContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>,
  );
};
