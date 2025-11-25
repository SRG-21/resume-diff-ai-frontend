import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultsView } from '../components/ResultsView';
import type { CompareResponse } from '../types/api';

describe('ResultsView', () => {
  const mockData: CompareResponse = {
    matchPercent: 75,
    matchedSkills: ['JavaScript', 'React', 'TypeScript'],
    missingSkills: ['Python', 'Django'],
    warnings: ['Some skills may not have been detected'],
  };

  const mockOnNewComparison = vi.fn();

  it('should render match percentage', () => {
    render(<ResultsView data={mockData} onNewComparison={mockOnNewComparison} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should render matched skills', () => {
    render(<ResultsView data={mockData} onNewComparison={mockOnNewComparison} />);
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('should render missing skills', () => {
    render(<ResultsView data={mockData} onNewComparison={mockOnNewComparison} />);
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('Django')).toBeInTheDocument();
  });

  it('should render warnings', () => {
    render(<ResultsView data={mockData} onNewComparison={mockOnNewComparison} />);
    expect(screen.getByText(/Some skills may not have been detected/i)).toBeInTheDocument();
  });

  it('should call onNewComparison when button is clicked', async () => {
    const user = userEvent.setup();
    render(<ResultsView data={mockData} onNewComparison={mockOnNewComparison} />);

    const newComparisonBtn = screen.getByRole('button', { name: /new comparison/i });
    await user.click(newComparisonBtn);

    expect(mockOnNewComparison).toHaveBeenCalledTimes(1);
  });

  it('should show export buttons when missing skills exist', () => {
    render(<ResultsView data={mockData} onNewComparison={mockOnNewComparison} />);
    expect(screen.getByRole('button', { name: /copy to clipboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
  });

  it('should not show export buttons when no missing skills', () => {
    const dataWithoutMissingSkills: CompareResponse = {
      ...mockData,
      missingSkills: [],
    };
    render(<ResultsView data={dataWithoutMissingSkills} onNewComparison={mockOnNewComparison} />);
    expect(screen.queryByRole('button', { name: /copy to clipboard/i })).not.toBeInTheDocument();
  });

  it('should toggle raw JSON view', async () => {
    const user = userEvent.setup();
    render(<ResultsView data={mockData} onNewComparison={mockOnNewComparison} />);

    const toggleBtn = screen.getByRole('button', { name: /show raw json/i });
    await user.click(toggleBtn);

    expect(screen.getByText(/hide raw json/i)).toBeInTheDocument();
    expect(screen.getByText(/"matchPercent": 75/)).toBeInTheDocument();
  });
});
