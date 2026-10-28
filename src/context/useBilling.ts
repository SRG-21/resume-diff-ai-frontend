import { useContext } from 'react';
import { BillingContext } from './billing-context';

export const useBilling = () => useContext(BillingContext);
