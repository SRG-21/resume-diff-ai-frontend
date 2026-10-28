import React, { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BillingContext } from './billing-context';
import { getBillingStatus } from '../api/endpoints';
import { useAuth } from './useAuth';
import type { BillingStatus, Entitlements } from '../types/api';

export const BillingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setStatus(null);
      return;
    }
    setLoading(true);
    try {
      setStatus(await getBillingStatus());
    } catch {
      // Billing info is non-critical for browsing; keep the previous value
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Reload when the signed-in user changes
  useEffect(() => {
    void refresh();
  }, [refresh, user?.id]);

  const value = useMemo(
    () => ({
      status,
      loading,
      refresh,
      can: (feature: keyof Entitlements) => Boolean(status?.entitlements[feature]),
    }),
    [status, loading, refresh],
  );

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
};
