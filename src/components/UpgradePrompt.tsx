import React from 'react';
import { Link } from 'react-router-dom';
import { track } from '../analytics';

interface UpgradePromptProps {
  title?: string;
  message: string;
  /** analytics label for where the prompt was shown */
  source: string;
  compact?: boolean;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  title = 'Upgrade to unlock this',
  message,
  source,
  compact = false,
}) => (
  <div
    className={`rounded-xl border border-blue-200 bg-blue-50 ${compact ? 'p-4' : 'p-6'}`}
    data-testid="upgrade-prompt"
  >
    <h3 className="font-semibold text-blue-900">{title}</h3>
    <p className="mt-1 text-sm text-blue-800">{message}</p>
    <Link
      to="/pricing"
      onClick={() => track('upgrade_prompt_clicked', { source })}
      className="btn-primary mt-3 inline-flex items-center text-sm py-2"
    >
      See plans
    </Link>
  </div>
);
