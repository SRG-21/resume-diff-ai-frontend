import React from 'react';
import type { Breakdown } from '../types/api';

const LABELS: Record<keyof Breakdown, string> = {
  hardSkills: 'Hard skills',
  softSkills: 'Soft skills',
  experience: 'Experience',
  education: 'Education',
  titleMatch: 'Job title match',
  keywords: 'Keywords',
};

const barColor = (value: number) => (value >= 75 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500');

export const BreakdownBars: React.FC<{ breakdown: Breakdown }> = ({ breakdown }) => (
  <ul className="space-y-3" aria-label="Score breakdown">
    {(Object.keys(LABELS) as Array<keyof Breakdown>).map((key) => (
      <li key={key}>
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">{LABELS[key]}</span>
          <span className="text-gray-600">{breakdown[key]}%</span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-gray-100" role="presentation">
          <div className={`h-2 rounded-full ${barColor(breakdown[key])}`} style={{ width: `${breakdown[key]}%` }} />
        </div>
      </li>
    ))}
  </ul>
);
