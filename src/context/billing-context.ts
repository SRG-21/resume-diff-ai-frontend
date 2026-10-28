import { createContext } from 'react';
import type { BillingStatus, Entitlements } from '../types/api';

export type BillingContextType = {
  status: BillingStatus | null;
  loading: boolean;
  refresh: () => Promise<void>;
  /** true when the current plan includes a feature flag, e.g. can('rewrites') */
  can: (feature: keyof Entitlements) => boolean;
};

export const BillingContext = createContext<BillingContextType>({
  status: null,
  loading: false,
  refresh: async () => {},
  can: () => false,
});
