import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiJson, jsonBody } from '../api/client';
import { useAuth } from '../context/useAuth';
import type { LoginResponse } from '../types/api';

const Shell: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center px-4 py-12">
    <div className="max-w-md w-full">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
      </div>
      <div className="auth-card">{children}</div>
    </div>
  </div>
);

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    setError(null);
    try {
      await apiJson('/auth/forgot-password', jsonBody({ email: email.trim().toLowerCase() }));
      setState('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setState('idle');
    }
  };

  return (
    <Shell title="Forgot your password?" subtitle="We’ll email you a link to choose a new one">
      {state === 'sent' ? (
        <p className="text-gray-700" role="status">
          If an account exists for <strong>{email}</strong>, a reset link is on its way. It expires in one hour.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <div>
            <label htmlFor="email" className="auth-label">Email address</label>
            <input id="email" type="email" required className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button className="btn-primary w-full" disabled={state === 'sending' || !email.trim()}>
            {state === 'sending' ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm"><Link to="/login" className="auth-link">Back to sign in</Link></p>
    </Shell>
  );
};

export const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const { acceptTokens } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weak =
    password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (weak) return setError('Use at least 8 characters with upper-case, lower-case and a number');
    if (password !== confirm) return setError('Passwords do not match');
    setBusy(true);
    setError(null);
    try {
      acceptTokens(await apiJson<LoginResponse>('/auth/reset-password', jsonBody({ token, password })));
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <Shell title="Reset link missing">
        <p className="text-gray-700">This link is incomplete. <Link to="/forgot-password" className="auth-link">Request a new one</Link>.</p>
      </Shell>
    );
  }

  return (
    <Shell title="Choose a new password">
      <form onSubmit={submit} className="space-y-5">
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error} {/expired|invalid/i.test(error) && <Link to="/forgot-password" className="underline">Request a new link</Link>}
          </p>
        )}
        <div>
          <label htmlFor="password" className="auth-label">New password</label>
          <input id="password" type="password" autoComplete="new-password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <label htmlFor="confirm" className="auth-label">Confirm password</label>
          <input id="confirm" type="password" autoComplete="new-password" className="input-field" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Reset password'}</button>
      </form>
    </Shell>
  );
};

export const VerifyEmailPage: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const { isAuthenticated, refreshUser } = useAuth();
  const [state, setState] = useState<'working' | 'ok' | 'failed'>(token ? 'working' : 'failed');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    apiJson('/auth/verify-email', jsonBody({ token }))
      .then(async () => {
        if (isAuthenticated) await refreshUser();
        if (!cancelled) setState('ok');
      })
      .catch(() => !cancelled && setState('failed'));
    return () => {
      cancelled = true;
    };
    // verify once per token
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <Shell title={state === 'ok' ? 'Email confirmed' : state === 'working' ? 'Confirming…' : 'Link not valid'}>
      <p className="text-gray-700 text-center">
        {state === 'ok' && 'Thanks – your email address is confirmed.'}
        {state === 'working' && 'One moment.'}
        {state === 'failed' && 'This confirmation link is invalid or has expired. Sign in and request a new one from the banner at the top.'}
      </p>
      <p className="mt-6 text-center">
        <Link to={isAuthenticated ? '/app' : '/login'} className="btn-primary inline-flex items-center">
          {isAuthenticated ? 'Go to the app' : 'Sign in'}
        </Link>
      </p>
    </Shell>
  );
};
