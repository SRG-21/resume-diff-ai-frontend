import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiTools } from '../components/AiTools';
import { ResultsView } from '../components/ResultsView';
import { AtsPanel } from '../components/AtsPanel';
import { BreakdownBars } from '../components/BreakdownBars';
import { renderWithProviders } from './utils';
import * as endpoints from '../api/endpoints';
import { ApiError } from '../api/client';
import type { CompareResponse } from '../types/api';

vi.mock('../api/endpoints', () => ({
  getSavedAi: vi.fn(),
  generateRewrites: vi.fn(),
  generateCoverLetter: vi.fn(),
  generateInterviewPrep: vi.fn(),
  exportTailored: vi.fn(),
}));

const base: CompareResponse = { matchPercent: 60, matchedSkills: ['Python'], missingSkills: ['AWS'] };

describe('AiTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(endpoints.getSavedAi).mockResolvedValue({ rewrites: null, cover_letter: null, interview_prep: null });
  });

  it('shows an upgrade prompt and makes no AI calls on the free plan', () => {
    renderWithProviders(<AiTools comparisonId="c1" />, { plan: 'free' });
    expect(screen.getByTestId('upgrade-prompt')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See plans' })).toHaveAttribute('href', '/pricing');
    expect(endpoints.getSavedAi).not.toHaveBeenCalled();
    expect(endpoints.generateRewrites).not.toHaveBeenCalled();
  });

  it('generates rewrites for Pro users and refreshes usage', async () => {
    const refresh = vi.fn(async () => {});
    vi.mocked(endpoints.generateRewrites).mockResolvedValueOnce({
      rewrites: [{ original: 'Worked on apps', suggested: 'Built Python services', reason: 'More specific', keywords: ['Python'] }],
      gaps: [{ skill: 'AWS', advice: 'Deploy a side project' }],
    });
    renderWithProviders(<AiTools comparisonId="c1" />, { plan: 'pro', billingRefresh: refresh });

    await userEvent.click(await screen.findByRole('button', { name: 'Suggest rewrites' }));

    expect(await screen.findByText('Built Python services')).toBeInTheDocument();
    expect(screen.getByText(/Deploy a side project/)).toBeInTheDocument();
    expect(endpoints.generateRewrites).toHaveBeenCalledWith('c1');
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /download tailored resume/i })).toBeInTheDocument();
  });

  it('exports only the rewrites that are still checked', async () => {
    vi.mocked(endpoints.generateRewrites).mockResolvedValueOnce({
      rewrites: [
        { original: 'a', suggested: 'A+', reason: '', keywords: [] },
        { original: 'b', suggested: 'B+', reason: '', keywords: [] },
      ],
      gaps: [],
    });
    vi.mocked(endpoints.exportTailored).mockResolvedValueOnce(new Blob(['x']));
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();

    renderWithProviders(<AiTools comparisonId="c1" />, { plan: 'pro' });
    await userEvent.click(await screen.findByRole('button', { name: 'Suggest rewrites' }));
    await userEvent.click(await screen.findByLabelText('Use rewrite 2')); // uncheck the second
    await userEvent.click(screen.getByRole('button', { name: /download tailored resume/i }));

    await waitFor(() => expect(endpoints.exportTailored).toHaveBeenCalled());
    expect(endpoints.exportTailored).toHaveBeenCalledWith('c1', [{ original: 'a', suggested: 'A+' }]);
  });

  it('restores previously generated output without calling the AI again', async () => {
    vi.mocked(endpoints.getSavedAi).mockResolvedValueOnce({
      rewrites: { rewrites: [{ original: 'x', suggested: 'Saved suggestion', reason: '', keywords: [] }], gaps: [] },
      cover_letter: null,
      interview_prep: null,
    });
    renderWithProviders(<AiTools comparisonId="c1" />, { plan: 'pro' });
    expect(await screen.findByText('Saved suggestion')).toBeInTheDocument();
    expect(endpoints.generateRewrites).not.toHaveBeenCalled();
  });

  it('points to pricing when the monthly AI quota is used up', async () => {
    vi.mocked(endpoints.generateRewrites).mockRejectedValueOnce(
      new ApiError(402, 'You have used all 200 ai actions included in the Pro plan this month.', 'quota_exceeded'),
    );
    renderWithProviders(<AiTools comparisonId="c1" />, { plan: 'pro' });
    await userEvent.click(await screen.findByRole('button', { name: 'Suggest rewrites' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('used all 200');
    expect(alert.querySelector('a')).toHaveAttribute('href', '/pricing');
  });

  it('writes a cover letter in the chosen tone', async () => {
    vi.mocked(endpoints.generateCoverLetter).mockResolvedValueOnce({ letter: 'Dear [Hiring Manager], hello', tone: 'friendly' });
    renderWithProviders(<AiTools comparisonId="c1" />, { plan: 'pro' });
    await userEvent.click(await screen.findByRole('tab', { name: 'Cover letter' }));
    await userEvent.selectOptions(screen.getByLabelText('Tone'), 'friendly');
    await userEvent.click(screen.getByRole('button', { name: 'Write cover letter' }));

    expect(await screen.findByLabelText('Cover letter')).toHaveValue('Dear [Hiring Manager], hello');
    expect(endpoints.generateCoverLetter).toHaveBeenCalledWith('c1', 'friendly', false);
  });
});

describe('ResultsView plan shaping', () => {
  it('shows upgrade prompts instead of locked sections', () => {
    renderWithProviders(
      <ResultsView
        data={{ ...base, locked: ['breakdown', 'ats_details'], ats: { score: 70, issues: [], passed: [], locked: true, issue_count: 3 } }}
      />,
    );
    expect(screen.getAllByTestId('upgrade-prompt')).toHaveLength(2);
    expect(screen.getByText('3 formatting issues found')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
  });

  it('shows the breakdown, ATS issues and job title for paid users', () => {
    renderWithProviders(
      <ResultsView
        data={{
          ...base,
          jobTitle: 'Backend Engineer',
          company: 'Acme',
          breakdown: { hardSkills: 80, softSkills: 60, experience: 70, education: 50, titleMatch: 90, keywords: 40 },
          ats: { score: 85, locked: false, passed: ['Email address found'], issues: [{ severity: 'warning', title: 'Tables detected', detail: 'Use plain paragraphs.' }] },
          usage: { used: 2, limit: 300 },
        }}
      />,
    );
    expect(screen.getByText('Backend Engineer · Acme')).toBeInTheDocument();
    expect(screen.getByText('Job title match')).toBeInTheDocument();
    expect(screen.getByText('Tables detected')).toBeInTheDocument();
    expect(screen.getByText('2 of 300 scans used this month')).toBeInTheDocument();
    expect(screen.queryByTestId('upgrade-prompt')).not.toBeInTheDocument();
  });

  it('hides "New comparison" when no handler is given (history view)', () => {
    renderWithProviders(<ResultsView data={base} />);
    expect(screen.queryByRole('button', { name: /new comparison/i })).not.toBeInTheDocument();
  });
});

describe('small display components', () => {
  it('BreakdownBars renders each category with its percentage', () => {
    renderWithProviders(<BreakdownBars breakdown={{ hardSkills: 80, softSkills: 60, experience: 70, education: 50, titleMatch: 90, keywords: 40 }} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('AtsPanel uses singular wording for a single hidden issue', () => {
    renderWithProviders(<AtsPanel ats={{ score: 90, issues: [], passed: [], locked: true, issue_count: 1 }} />);
    expect(screen.getByText('1 formatting issue found')).toBeInTheDocument();
  });
});
