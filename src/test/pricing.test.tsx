import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route, useLocation } from 'react-router-dom';
import { PricingPage } from '../pages/PricingPage';
import { renderWithProviders } from './utils';
import * as endpoints from '../api/endpoints';

vi.mock('../api/endpoints', () => ({ startCheckout: vi.fn() }));

const Where = () => {
  const loc = useLocation();
  return <div data-testid="where">{loc.pathname + loc.search}</div>;
};

const page = (
  <Routes>
    <Route path="/pricing" element={<PricingPage />} />
    <Route path="*" element={<Where />} />
  </Routes>
);

describe('PricingPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows all four plans with yearly pricing by default', () => {
    renderWithProviders(page, { route: '/pricing', auth: { isAuthenticated: false, user: null }, plan: null });
    for (const name of ['Free', 'Pro', 'Job Hunt Pass', 'Coach']) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument();
    }
    expect(screen.getByText('$6.58')).toBeInTheDocument(); // 79 / 12
    expect(screen.getByText(/billed \$79\/year/)).toBeInTheDocument();
  });

  it('switches to monthly pricing', async () => {
    renderWithProviders(page, { route: '/pricing', auth: { isAuthenticated: false, user: null }, plan: null });
    await userEvent.click(screen.getByRole('button', { name: 'Monthly' }));
    expect(screen.getByText('$12')).toBeInTheDocument();
  });

  it('sends visitors to signup with the chosen product', async () => {
    renderWithProviders(page, { route: '/pricing', auth: { isAuthenticated: false, user: null }, plan: null });
    await userEvent.click(screen.getByRole('button', { name: 'Buy pass' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/signup?plan=pass');
  });

  it('starts Stripe checkout for signed-in users', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });
    vi.mocked(endpoints.startCheckout).mockResolvedValueOnce({ url: 'https://checkout.stripe.test/abc' });

    renderWithProviders(page, { route: '/pricing', plan: 'free' });
    await userEvent.click(screen.getByRole('button', { name: 'Choose Pro' }));

    expect(endpoints.startCheckout).toHaveBeenCalledWith('pro_yearly');
    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://checkout.stripe.test/abc'));
    vi.unstubAllGlobals();
  });

  it('shows checkout errors and marks the current plan', async () => {
    vi.mocked(endpoints.startCheckout).mockRejectedValueOnce(new Error('This plan is not available yet'));
    renderWithProviders(page, { route: '/pricing', plan: 'pro' });
    expect(screen.getByRole('button', { name: 'Your current plan' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Buy pass' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('not available yet');
  });
});
