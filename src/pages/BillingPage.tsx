import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { deleteAccount, openBillingPortal } from '../api/endpoints';
import { useAuth } from '../context/useAuth';
import { useBilling } from '../context/useBilling';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { track } from '../analytics';

const Meter: React.FC<{ label: string; used: number; limit: number }> = ({ label, used, limit }) => {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">{limit > 0 ? `${used} / ${limit}` : 'Not included'}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-gray-100">
        <div className={`h-2 rounded-full ${pct >= 90 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export const BillingPage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const { status, refresh } = useBilling();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const justPaid = params.get('checkout') === 'success';

  // Stripe confirms the payment by webhook, which can land a moment after the redirect
  useEffect(() => {
    if (!justPaid) return;
    track('checkout_completed');
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      void refresh();
      void refreshUser();
      if (tries >= 6) clearInterval(timer);
    }, 2500);
    void refresh();
    return () => clearInterval(timer);
  }, [justPaid, refresh, refreshUser]);

  if (!status) return <div className="p-16"><LoadingSpinner message="Loading…" /></div>;

  const portal = async () => {
    setBusy(true);
    setError(null);
    try {
      window.location.assign((await openBillingPortal()).url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open the billing portal');
      setBusy(false);
    }
  };

  const remove = async () => {
    const typed = window.prompt('This permanently deletes your account, resumes, history and cancels any subscription.\n\nType DELETE to confirm.');
    if (typed !== 'DELETE') return;
    try {
      await deleteAccount();
      await logout();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the account');
    }
  };

  const expires = status.plan_expires_at ? new Date(status.plan_expires_at.endsWith('Z') ? status.plan_expires_at : `${status.plan_expires_at}Z`) : null;
  const paid = status.plan !== 'free';

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Account & billing</h1>

      {justPaid && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800" role="status">
          Thanks! {paid ? `You’re on ${status.plan_name}.` : 'We’re confirming your payment – this page updates in a few seconds.'}
        </p>
      )}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}

      <section className="rounded-xl bg-white p-6 shadow-md">
        <h2 className="text-lg font-semibold text-gray-900">Plan</h2>
        <p className="mt-2 text-2xl font-bold text-gray-900">{status.plan_name}</p>
        {paid && expires && (
          <p className="text-sm text-gray-600">
            {status.plan === 'pass'
              ? `Access until ${expires.toLocaleDateString()}`
              : status.cancel_at_period_end
                ? `Cancels on ${expires.toLocaleDateString()}`
                : `Renews on ${expires.toLocaleDateString()}`}
            {status.subscription_status === 'past_due' && ' · payment failed, please update your card'}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          {status.has_billing_account && status.plan !== 'pass' && (
            <button className="btn-secondary" disabled={busy} onClick={portal}>Manage subscription</button>
          )}
          {(!paid || status.plan === 'pass') && <Link to="/pricing" className="btn-primary inline-flex items-center">{paid ? 'Extend or upgrade' : 'Upgrade'}</Link>}
        </div>
      </section>

      <section className="space-y-4 rounded-xl bg-white p-6 shadow-md">
        <h2 className="text-lg font-semibold text-gray-900">Usage this month</h2>
        <Meter label="Scans" used={status.usage.scans} limit={status.limits.scans} />
        <Meter label="AI actions (rewrites, cover letters, interview prep)" used={status.usage.ai_actions} limit={status.limits.ai_actions} />
      </section>

      <section className="rounded-xl bg-white p-6 shadow-md">
        <h2 className="text-lg font-semibold text-gray-900">Account</h2>
        <dl className="mt-3 space-y-1 text-sm text-gray-700">
          <div className="flex gap-2"><dt className="w-24 text-gray-500">Name</dt><dd>{user?.name}</dd></div>
          <div className="flex gap-2"><dt className="w-24 text-gray-500">Email</dt><dd>{user?.email}{user?.email_verified === false && ' (unconfirmed)'}</dd></div>
          <div className="flex gap-2"><dt className="w-24 text-gray-500">Sign-in</dt><dd>{user?.auth_provider === 'google' ? 'Google' : 'Email and password'}</dd></div>
        </dl>
        <button className="mt-6 text-sm text-red-600 hover:underline" onClick={remove}>Delete my account and data</button>
      </section>
    </div>
  );
};
