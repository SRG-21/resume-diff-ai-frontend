import React from 'react';
import type { AtsReport } from '../types/api';
import { UpgradePrompt } from './UpgradePrompt';

const SEVERITY_STYLE = {
  error: 'border-red-300 bg-red-50 text-red-800',
  warning: 'border-yellow-300 bg-yellow-50 text-yellow-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
} as const;

export const AtsPanel: React.FC<{ ats: AtsReport }> = ({ ats }) => (
  <div>
    <div className="flex items-baseline gap-3">
      <span className="text-3xl font-bold text-gray-900">{ats.score}</span>
      <span className="text-sm text-gray-600">/ 100 ATS readiness</span>
    </div>

    {ats.locked ? (
      <div className="mt-4">
        <UpgradePrompt
          compact
          source="ats_details"
          title={`${ats.issue_count ?? 0} formatting ${ats.issue_count === 1 ? 'issue' : 'issues'} found`}
          message="See exactly what applicant tracking systems struggle to read in your resume and how to fix it."
        />
      </div>
    ) : (
      <>
        {ats.issues.length > 0 && (
          <ul className="mt-4 space-y-2">
            {ats.issues.map((issue) => (
              <li key={issue.title} className={`rounded-lg border p-3 text-sm ${SEVERITY_STYLE[issue.severity]}`}>
                <p className="font-medium">{issue.title}</p>
                <p className="mt-0.5">{issue.detail}</p>
              </li>
            ))}
          </ul>
        )}
        {ats.passed.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {ats.passed.map((item) => (
              <li key={item} className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                ✓ {item}
              </li>
            ))}
          </ul>
        )}
      </>
    )}
  </div>
);
