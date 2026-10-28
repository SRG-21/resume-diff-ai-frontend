import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createApplication } from '../api/endpoints';
import { useBilling } from '../context/useBilling';

interface TrackButtonProps {
  comparisonId: string;
  company: string;
  role: string;
}

/** Adds the job from a comparison to the application tracker (paid feature) */
export const TrackButton: React.FC<TrackButtonProps> = ({ comparisonId, company, role }) => {
  const { can } = useBilling();
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  if (!can('tracker')) return null;

  if (state === 'saved') {
    return (
      <Link to="/tracker" className="btn-secondary inline-flex items-center">
        ✓ Tracked – open tracker
      </Link>
    );
  }

  return (
    <button
      className="btn-secondary"
      disabled={state === 'saving'}
      onClick={async () => {
        setState('saving');
        try {
          await createApplication({
            company: company || 'Unknown company',
            role: role || 'Unknown role',
            comparison_id: comparisonId,
          });
          setState('saved');
        } catch {
          setState('error');
        }
      }}
    >
      {state === 'error' ? 'Could not save – retry' : state === 'saving' ? 'Saving…' : 'Track this application'}
    </button>
  );
};
