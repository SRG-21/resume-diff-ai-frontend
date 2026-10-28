import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useBilling } from '../context/useBilling';
import { startCheckout } from '../api/endpoints';
import { PRICES } from '../config/pricing';
import { track } from '../analytics';
import type { CheckoutProduct, PlanId } from '../types/api';

type Card = {
  id: PlanId;
  name: string;
  tagline: string;
  features: string[];
};

const CARDS: Card[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Try it on a real job',
    features: ['3 scans per month', 'Match score and skill gaps', 'ATS readiness score', 'Last 5 comparisons', '1 saved resume'],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For an active job search',
    features: [
      '300 scans per month',
      'Score breakdown by category',
      'Full ATS issue list',
      'AI bullet rewrites and tailored DOCX',
      'Cover letters and interview prep',
      'Import jobs from a link',
      'Unlimited history, 10 saved resumes',
      'Application tracker',
    ],
  },
  {
    id: 'pass',
    name: 'Job Hunt Pass',
    tagline: 'All of Pro for 90 days, pay once',
    features: ['Everything in Pro', 'No subscription, no renewal', 'Stack passes to extend'],
  },
  {
    id: 'coach',
    name: 'Coach',
    tagline: 'For career coaches',
    features: ['Everything in Pro', '1,500 scans per month', 'Rank up to 10 resumes against one job', '50 saved resumes'],
  },
];

export const PricingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { status } = useBilling();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [yearly, setYearly] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const productFor = (id: PlanId): CheckoutProduct | null => {
    if (id === 'pro') return yearly ? 'pro_yearly' : 'pro_monthly';
    if (id === 'pass') return 'pass';
    if (id === 'coach') return 'coach_monthly';
    return null;
  };

  const choose = async (id: PlanId) => {
    const product = productFor(id);
    if (!product) {
      navigate(isAuthenticated ? '/app' : '/signup');
      return;
    }
    track('checkout_started', { product });
    if (!isAuthenticated) {
      navigate(`/signup?plan=${product}`);
      return;
    }
    setBusy(id);
    setError(null);
    try {
      const { url } = await startCheckout(product);
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout');
      setBusy(null);
    }
  };

  const priceLabel = (id: PlanId) => {
    if (id === 'free') return { big: '$0', small: 'forever' };
    const p = PRICES[productFor(id)!];
    if (id === 'pro' && yearly) return { big: `$${(p.amount / 12).toFixed(2).replace(/\.00$/, '')}`, small: `per month, billed $${p.amount}/year` };
    if (id === 'pass') return { big: `$${p.amount}`, small: '90 days, one-time' };
    return { big: `$${p.amount}`, small: 'per month' };
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">Pick your plan</h1>
      <p className="mt-3 text-center text-gray-600">Start free. Upgrade when you’re applying seriously.</p>

      {params.get('checkout') === 'cancelled' && (
        <p className="mx-auto mt-6 max-w-xl rounded-lg bg-yellow-50 p-3 text-center text-sm text-yellow-800">
          Checkout was cancelled – you haven’t been charged.
        </p>
      )}
      {error && <p className="mx-auto mt-6 max-w-xl rounded-lg bg-red-50 p-3 text-center text-sm text-red-700" role="alert">{error}</p>}

      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1" role="group" aria-label="Billing period">
          {[false, true].map((y) => (
            <button
              key={String(y)}
              onClick={() => setYearly(y)}
              aria-pressed={yearly === y}
              className={`rounded-md px-4 py-2 text-sm font-medium ${yearly === y ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
            >
              {y ? 'Yearly (save 45%)' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card) => {
          const { big, small } = priceLabel(card.id);
          const current = status?.plan === card.id;
          return (
            <section
              key={card.id}
              className={`flex flex-col rounded-2xl bg-white p-6 shadow-md ${card.id === 'pro' ? 'ring-2 ring-blue-600' : ''}`}
              aria-label={card.name}
            >
              {card.id === 'pro' && <span className="mb-2 w-fit rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">Most popular</span>}
              <h2 className="text-xl font-bold text-gray-900">{card.name}</h2>
              <p className="text-sm text-gray-500">{card.tagline}</p>
              <p className="mt-4">
                <span className="text-4xl font-bold text-gray-900">{big}</span>
                <span className="ml-1 text-sm text-gray-500">{small}</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-gray-700">
                {card.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-green-600" aria-hidden="true">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-6 ${card.id === 'pro' ? 'btn-primary' : 'btn-secondary'} w-full`}
                disabled={current || busy !== null || (status ? !status.billing_enabled && card.id !== 'free' : false)}
                onClick={() => choose(card.id)}
              >
                {current ? 'Your current plan' : busy === card.id ? 'Redirecting…' : card.id === 'free' ? 'Start free' : card.id === 'pass' ? 'Buy pass' : `Choose ${card.name}`}
              </button>
            </section>
          );
        })}
      </div>

      <p className="mt-8 text-center text-sm text-gray-500">
        Prices in USD. Subscriptions renew until cancelled; manage or cancel any time from{' '}
        <Link to="/billing" className="underline">your billing page</Link>. See our <Link to="/terms" className="underline">terms</Link> for refunds.
      </p>
    </div>
  );
};

export default PricingPage;
