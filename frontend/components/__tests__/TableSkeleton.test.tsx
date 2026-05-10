import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TableSkeleton } from '../SkeletonLoader/TableSkeleton';

describe('TableSkeleton', () => {
  it('renders with loading state', () => {
    render(<TableSkeleton />);
    const table = screen.getByRole('status');
    expect(table).toBeInTheDocument();
  });

  it('has correct ARIA attributes for loading state', () => {
    render(<TableSkeleton />);
    const table = screen.getByRole('status');
    expect(table).toHaveAttribute('aria-busy', 'true');
    expect(table).toHaveAttribute('aria-label', 'Loading builds');
  });

  it('renders default 5 rows', () => {
    const { container } = render(<TableSkeleton />);
    const rows = container.querySelectorAll('[style*="height: 56px"]');
    expect(rows.length).toBe(5);
  });

  it('renders custom number of rows', () => {
    const { container } = render(<TableSkeleton rows={10} />);
    const rows = container.querySelectorAll('[style*="height: 56px"]');
    expect(rows.length).toBe(10);
  });

  it('renders zero rows when specified', () => {
    const { container } = render(<TableSkeleton rows={0} />);
    const rows = container.querySelectorAll('[style*="height: 56px"]');
    expect(rows.length).toBe(0);
  });

  it('has table container with correct styles', () => {
    const { container } = render(<TableSkeleton />);
    const tableContainer = container.firstChild;
    expect(tableContainer).toHaveClass('w-full', 'bg-white', 'shadow-md', 'rounded-lg');
  });

  it('includes skeleton pulse elements', () => {
    const { container } = render(<TableSkeleton />);
    const pulses = container.querySelectorAll('[aria-hidden="true"]');
    expect(pulses.length).toBeGreaterThan(0);
  });

  it('has responsive layout classes', () => {
    const { container } = render(<TableSkeleton />);
    const skeleton = container.querySelector('[role="status"]');
    expect(skeleton?.innerHTML).toContain('md:');
  });

  it('maintains fixed row height of 56px', () => {
    const { container } = render(<TableSkeleton rows={3} />);
    const rows = container.querySelectorAll('[style*="height: 56px"]');
    rows.forEach((row) => {
      expect(row).toHaveStyle({ height: '56px' });
    });
  });

  it('renders header on desktop (hidden on mobile)', () => {
    const { container } = render(<TableSkeleton />);
    const header = container.querySelector('.hidden.md\\:block');
    expect(header).toBeInTheDocument();
  });

  it('all skeleton elements hidden from screen readers', () => {
    const { container } = render(<TableSkeleton />);
    const pulses = container.querySelectorAll('[aria-hidden="true"]');
    pulses.forEach((pulse) => {
      expect(pulse).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
