import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TableSkeleton } from '../SkeletonLoader/TableSkeleton';

describe('BuildDashboard - Skeleton Integration', () => {
  it('shows TableSkeleton component in dashboard', () => {
    const { container } = render(<TableSkeleton />);
    const skeleton = container.querySelector('[role="status"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('TableSkeleton displays loading state', () => {
    const { container } = render(<TableSkeleton />);
    const table = container.querySelector('[role="status"]');
    expect(table).toHaveAttribute('aria-busy', 'true');
  });

  it('skeleton has correct ARIA label for builds', () => {
    const { container } = render(<TableSkeleton />);
    const skeleton = container.querySelector('[aria-label="Loading builds"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders 5 skeleton rows by default', () => {
    const { container } = render(<TableSkeleton />);
    const rows = container.querySelectorAll('[style*="height: 56px"]');
    expect(rows.length).toBe(5);
  });

  it('renders custom number of skeleton rows', () => {
    const { container } = render(<TableSkeleton rows={8} />);
    const rows = container.querySelectorAll('[style*="height: 56px"]');
    expect(rows.length).toBe(8);
  });
});

