import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonPulse } from '../SkeletonLoader/SkeletonPulse';

describe('SkeletonPulse', () => {
  it('renders with default props', () => {
    const { container } = render(<SkeletonPulse />);
    const skeleton = container.querySelector('[aria-hidden="true"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('applies custom width class', () => {
    const { container } = render(<SkeletonPulse width="w-32" />);
    const skeleton = container.querySelector('[aria-hidden="true"]');
    expect(skeleton).toHaveClass('w-32');
  });

  it('applies custom height class', () => {
    const { container } = render(<SkeletonPulse height="h-8" />);
    const skeleton = container.querySelector('[aria-hidden="true"]');
    expect(skeleton).toHaveClass('h-8');
  });

  it('applies custom className', () => {
    const { container } = render(<SkeletonPulse className="custom-class" />);
    const skeleton = container.querySelector('[aria-hidden="true"]');
    expect(skeleton).toHaveClass('custom-class');
  });

  it('includes shimmer animation class', () => {
    const { container } = render(<SkeletonPulse />);
    const skeleton = container.querySelector('[aria-hidden="true"]');
    expect(skeleton).toHaveClass('animate-shimmer');
  });

  it('has gradient background for shimmer effect', () => {
    const { container } = render(<SkeletonPulse />);
    const skeleton = container.querySelector('[aria-hidden="true"]');
    expect(skeleton).toHaveClass('bg-gradient-to-r', 'from-gray-200', 'via-gray-300', 'to-gray-200');
  });

  it('is hidden from screen readers', () => {
    const { container } = render(<SkeletonPulse />);
    const skeleton = container.querySelector('[aria-hidden="true"]');
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  it('combines all classes correctly', () => {
    const { container } = render(
      <SkeletonPulse width="w-48" height="h-10" className="rounded-lg" />
    );
    const skeleton = container.querySelector('[aria-hidden="true"]');
    expect(skeleton).toHaveClass('w-48', 'h-10', 'rounded-lg', 'animate-shimmer');
  });
});
