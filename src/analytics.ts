/**
 * Privacy-friendly product analytics via Plausible (no cookies, no personal data).
 * Set VITE_PLAUSIBLE_DOMAIN to enable; otherwise every call is a no-op.
 */
type PlausibleFn = (event: string, options?: { props?: Record<string, string | number> }) => void;

const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined;
let loaded = false;

export const initAnalytics = (): void => {
  if (!domain || loaded || typeof document === 'undefined') return;
  loaded = true;
  const script = document.createElement('script');
  script.defer = true;
  script.dataset.domain = domain;
  script.src = (import.meta.env.VITE_PLAUSIBLE_SRC as string | undefined) || 'https://plausible.io/js/script.js';
  document.head.appendChild(script);
};

/** Record a named event, e.g. track('checkout_started', { plan: 'pro_monthly' }) */
export const track = (event: string, props?: Record<string, string | number>): void => {
  const plausible = (window as unknown as { plausible?: PlausibleFn }).plausible;
  if (domain && plausible) plausible(event, props ? { props } : undefined);
};
