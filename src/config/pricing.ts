import type { CheckoutProduct, PlanId } from '../types/api';

/**
 * Display prices. They must match the Stripe Prices configured on the backend
 * (STRIPE_PRICE_* env vars); Stripe is the source of truth for what is charged.
 */
export const PRICES: Record<CheckoutProduct, { amount: number; period: string }> = {
  pro_monthly: { amount: 12, period: 'month' },
  pro_yearly: { amount: 79, period: 'year' },
  pass: { amount: 29, period: '90 days, one-time' },
  coach_monthly: { amount: 49, period: 'month' },
};

export const PLAN_LABEL: Record<PlanId, string> = {
  free: 'Free',
  pro: 'Pro',
  pass: 'Job Hunt Pass',
  coach: 'Coach',
};

export const SUPPORT_EMAIL = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) || 'support@example.com';
