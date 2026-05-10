import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModalSkeleton } from '../SkeletonLoader/ModalSkeleton';

describe('BuildDetailModal - Skeleton Integration', () => {
  it('shows modal skeleton component', () => {
    render(<ModalSkeleton />);
    const modal = screen.getByRole('status');
    expect(modal).toBeInTheDocument();
  });

  it('skeleton has correct ARIA attributes during loading', () => {
    render(<ModalSkeleton />);
    const skeleton = screen.getByLabelText('Loading build details');
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
  });

  it('renders modal with correct structure', () => {
    const { container } = render(<ModalSkeleton />);
    const modalContent = container.querySelector('.bg-white.rounded-lg');
    expect(modalContent).toBeInTheDocument();
  });

  it('has all main sections', () => {
    const { container } = render(<ModalSkeleton />);
    const sections = container.querySelectorAll('section');
    expect(sections.length).toBe(3);
  });

  it('displays modal with backdrop', () => {
    const { container } = render(<ModalSkeleton />);
    const backdrop = container.querySelector('.fixed.inset-0.bg-black');
    expect(backdrop).toBeInTheDocument();
  });
});

