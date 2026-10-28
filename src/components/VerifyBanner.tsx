import React, { useState } from 'react';
import { resendVerification } from '../api/endpoints';
import { useAuth } from '../context/useAuth';

/** Asks password-signup users to confirm their email address */
export const VerifyBanner: React.FC = () => {
  const { user } = useAuth();
  const [state, setState] = useState<'idle' | 'sent' | 'error'>('idle');

  if (!user || user.email_verified !== false) return null;

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-center text-sm text-yellow-900" role="status">
      Please confirm your email address ({user.email}).{' '}
      {state === 'sent' ? (
        <span>Check your inbox.</span>
      ) : (
        <button
          className="font-medium underline"
          onClick={async () => {
            try {
              await resendVerification();
              setState('sent');
            } catch {
              setState('error');
            }
          }}
        >
          {state === 'error' ? 'Could not send – try again' : 'Resend email'}
        </button>
      )}
    </div>
  );
};
