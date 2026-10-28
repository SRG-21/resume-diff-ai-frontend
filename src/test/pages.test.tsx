import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage } from '../pages/RecoveryPages';
import { TrackerPage } from '../pages/TrackerPage';
import { BillingPage } from '../pages/BillingPage';
import { LandingPage } from '../pages/LandingPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { renderWithProviders } from './utils';
import * as client from '../api/client';
import * as endpoints from '../api/endpoints';

vi.mock('../api/endpoints', () => ({
  listApplications: vi.fn(),
  createApplication: vi.fn(),
  updateApplication: vi.fn(),
  deleteApplication: vi.fn(),
  openBillingPortal: vi.fn(),
  deleteAccount: vi.fn(),
}));

describe('account recovery pages', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('forgot password shows the same confirmation for any address', async () => {
    const spy = vi.spyOn(client, 'apiJson').mockResolvedValueOnce({ message: 'ok' });
    renderWithProviders(<ForgotPasswordPage />, { auth: { isAuthenticated: false, user: null } });

    await userEvent.type(screen.getByLabelText('Email address'), 'Someone@Example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByRole('status')).toHaveTextContent('If an account exists for Someone@Example.com');
    expect(spy).toHaveBeenCalledWith('/auth/forgot-password', expect.objectContaining({ body: JSON.stringify({ email: 'someone@example.com' }) }));
  });

  it('reset password validates strength and confirmation before calling the API', async () => {
    const spy = vi.spyOn(client, 'apiJson');
    renderWithProviders(<ResetPasswordPage />, { route: '/reset-password?token=abc', auth: { isAuthenticated: false, user: null } });

    await userEvent.type(screen.getByLabelText('New password'), 'weak');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'weak');
    await userEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 8 characters/);

    await userEvent.clear(screen.getByLabelText('New password'));
    await userEvent.type(screen.getByLabelText('New password'), 'Strong1Pass');
    await userEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/do not match/);
    expect(spy).not.toHaveBeenCalled();
  });

  it('reset password signs the user in with the returned tokens', async () => {
    const tokens = { access_token: 'a', refresh_token: 'r', token_type: 'bearer', expires_in: 1, user: { id: 'u' } };
    vi.spyOn(client, 'apiJson').mockResolvedValueOnce(tokens);
    const acceptTokens = vi.fn();
    renderWithProviders(
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/app" element={<p>app home</p>} />
      </Routes>,
      { route: '/reset-password?token=abc', auth: { acceptTokens, isAuthenticated: false, user: null } },
    );

    await userEvent.type(screen.getByLabelText('New password'), 'Strong1Pass');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'Strong1Pass');
    await userEvent.click(screen.getByRole('button', { name: 'Reset password' }));

    await waitFor(() => expect(acceptTokens).toHaveBeenCalledWith(tokens));
    expect(await screen.findByText('app home')).toBeInTheDocument();
  });

  it('reset password asks for a new link when the token is missing', () => {
    renderWithProviders(<ResetPasswordPage />, { route: '/reset-password', auth: { isAuthenticated: false, user: null } });
    expect(screen.getByRole('link', { name: 'Request a new one' })).toHaveAttribute('href', '/forgot-password');
  });

  it('verify email reports success and failure', async () => {
    vi.spyOn(client, 'apiJson').mockResolvedValueOnce({});
    const { unmount } = renderWithProviders(<VerifyEmailPage />, { route: '/verify-email?token=t', auth: { isAuthenticated: false, user: null } });
    expect(await screen.findByText('Email confirmed')).toBeInTheDocument();
    unmount();

    vi.spyOn(client, 'apiJson').mockRejectedValueOnce(new Error('bad'));
    renderWithProviders(<VerifyEmailPage />, { route: '/verify-email?token=t', auth: { isAuthenticated: false, user: null } });
    expect(await screen.findByText('Link not valid')).toBeInTheDocument();
  });
});

describe('TrackerPage', () => {
  beforeEach(() => vi.clearAllMocks());

  const app = (over = {}) => ({
    id: 'a1', company: 'Acme', role: 'Backend Engineer', status: 'saved' as const, url: null, notes: null,
    comparison_id: 'c1', match_percent: 82, applied_on: null, created_at: '2026-10-01T00:00:00', updated_at: '2026-10-01T00:00:00', ...over,
  });

  it('shows an upgrade prompt on the free plan', async () => {
    vi.mocked(endpoints.listApplications).mockRejectedValueOnce(new client.ApiError(402, 'upgrade', 'upgrade_required'));
    renderWithProviders(<TrackerPage />, { plan: 'free' });
    expect(await screen.findByTestId('upgrade-prompt')).toBeInTheDocument();
  });

  it('lists applications in their status column with the linked match score', async () => {
    vi.mocked(endpoints.listApplications).mockResolvedValueOnce({ items: [app(), app({ id: 'a2', role: 'SRE', status: 'interview' })], statuses: [] });
    renderWithProviders(<TrackerPage />, { plan: 'pro' });

    const saved = await screen.findByRole('region', { name: 'Saved' });
    expect(saved).toHaveTextContent('Backend Engineer');
    expect(saved).toHaveTextContent('Match 82%');
    expect(screen.getByRole('region', { name: 'Interview' })).toHaveTextContent('SRE');
  });

  it('stamps the applied date when a job first moves to Applied', async () => {
    vi.mocked(endpoints.listApplications).mockResolvedValue({ items: [app()], statuses: [] });
    vi.mocked(endpoints.updateApplication).mockResolvedValue(app({ status: 'applied' }));
    renderWithProviders(<TrackerPage />, { plan: 'pro' });

    await userEvent.selectOptions(await screen.findByLabelText('Status for Backend Engineer at Acme'), 'applied');

    expect(endpoints.updateApplication).toHaveBeenCalledWith('a1', { status: 'applied', applied_on: new Date().toISOString().slice(0, 10) });
  });

  it('adds a new application', async () => {
    vi.mocked(endpoints.listApplications).mockResolvedValue({ items: [], statuses: [] });
    vi.mocked(endpoints.createApplication).mockResolvedValue(app());
    renderWithProviders(<TrackerPage />, { plan: 'pro' });

    await userEvent.type(await screen.findByLabelText('Company'), 'Globex');
    await userEvent.type(screen.getByLabelText('Role'), 'Data Engineer');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(endpoints.createApplication).toHaveBeenCalledWith({ company: 'Globex', role: 'Data Engineer' });
  });
});

describe('BillingPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows plan, usage meters and who the account belongs to', () => {
    renderWithProviders(<BillingPage />, { plan: 'pro' });
    expect(screen.getByText('Pro', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('1 / 300')).toBeInTheDocument();
    expect(screen.getByText('a@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Manage subscription' })).toBeInTheDocument();
  });

  it('offers an upgrade instead of the portal on the free plan', () => {
    renderWithProviders(<BillingPage />, { plan: 'free' });
    expect(screen.getByRole('link', { name: 'Upgrade' })).toHaveAttribute('href', '/pricing');
    expect(screen.queryByRole('button', { name: 'Manage subscription' })).not.toBeInTheDocument();
    expect(screen.getByText('Not included')).toBeInTheDocument(); // AI actions
  });

  it('requires typing DELETE before deleting the account', async () => {
    const logout = vi.fn(async () => {});
    const prompt = vi.spyOn(window, 'prompt');
    renderWithProviders(<BillingPage />, { plan: 'pro', auth: { logout } });

    prompt.mockReturnValueOnce('nope');
    await userEvent.click(screen.getByRole('button', { name: /delete my account/i }));
    expect(endpoints.deleteAccount).not.toHaveBeenCalled();

    prompt.mockReturnValueOnce('DELETE');
    vi.mocked(endpoints.deleteAccount).mockResolvedValueOnce({ message: 'Account deleted' });
    await userEvent.click(screen.getByRole('button', { name: /delete my account/i }));
    await waitFor(() => expect(endpoints.deleteAccount).toHaveBeenCalledTimes(1));
    expect(logout).toHaveBeenCalled();
  });
});

describe('routing', () => {
  it('landing page sends visitors to signup and members to the app', () => {
    const { unmount } = renderWithProviders(<LandingPage />, { auth: { isAuthenticated: false, user: null }, plan: null });
    expect(screen.getByRole('link', { name: 'Scan my resume free' })).toHaveAttribute('href', '/signup');
    unmount();
    renderWithProviders(<LandingPage />);
    expect(screen.getByRole('link', { name: 'Open the app' })).toHaveAttribute('href', '/app');
  });

  it('protected routes redirect anonymous visitors to login', () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<p>login page</p>} />
        <Route path="/history" element={<ProtectedRoute><p>secret</p></ProtectedRoute>} />
      </Routes>,
      { route: '/history', auth: { isAuthenticated: false, user: null }, plan: null },
    );
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });
});
