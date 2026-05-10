import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModalSkeleton } from '../SkeletonLoader/ModalSkeleton';

describe('ModalSkeleton', () => {
  it('renders with loading state', () => {
    render(<ModalSkeleton />);
    const modal = screen.getByRole('status');
    expect(modal).toBeInTheDocument();
  });

  it('has correct ARIA attributes for loading state', () => {
    render(<ModalSkeleton />);
    const modal = screen.getByRole('status');
    expect(modal).toHaveAttribute('aria-busy', 'true');
    expect(modal).toHaveAttribute('aria-label', 'Loading build details');
  });

  it('has modal overlay with correct classes', () => {
    const { container } = render(<ModalSkeleton />);
    const overlay = container.firstChild;
    expect(overlay).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50', 'flex', 'z-50');
  });

  it('has modal content with correct dimensions', () => {
    const { container } = render(<ModalSkeleton />);
    const modalContent = container.querySelector('.bg-white.rounded-lg');
    expect(modalContent).toHaveClass('max-w-[700px]', 'w-11/12', 'max-h-[90vh]');
  });

  it('has modal header section', () => {
    const { container } = render(<ModalSkeleton />);
    const header = container.querySelector('.border-b.border-gray-200');
    expect(header).toBeInTheDocument();
  });

  it('has sections for build status, parts, and test runs', () => {
    const { container } = render(<ModalSkeleton />);
    const sections = container.querySelectorAll('section');
    expect(sections.length).toBe(3);
  });

  it('renders all skeleton pulse elements', () => {
    const { container } = render(<ModalSkeleton />);
    const pulses = container.querySelectorAll('[aria-hidden="true"]');
    expect(pulses.length).toBeGreaterThan(0);
  });

  it('all skeleton elements hidden from screen readers', () => {
    const { container } = render(<ModalSkeleton />);
    const pulses = container.querySelectorAll('[aria-hidden="true"]');
    pulses.forEach((pulse) => {
      expect(pulse).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('includes status button skeletons', () => {
    const { container } = render(<ModalSkeleton />);
    const buttonSkeletons = container.querySelectorAll('.w-24');
    expect(buttonSkeletons.length).toBeGreaterThan(0);
  });

  it('has modal footer with action buttons', () => {
    const { container } = render(<ModalSkeleton />);
    const footer = container.querySelector('.border-t.border-gray-200');
    expect(footer).toBeInTheDocument();
  });

  it('renders parts section with table structure', () => {
    const { container } = render(<ModalSkeleton />);
    const sections = container.querySelectorAll('section');
    const partsSection = sections[1];
    const tableRows = partsSection?.querySelectorAll('.flex.gap-2.py-2');
    expect(tableRows?.length).toBeGreaterThan(0);
  });

  it('renders test runs section with table structure', () => {
    const { container } = render(<ModalSkeleton />);
    const sections = container.querySelectorAll('section');
    const testRunsSection = sections[2];
    const tableRows = testRunsSection?.querySelectorAll('.flex.gap-2.py-2');
    expect(tableRows?.length).toBeGreaterThan(0);
  });

  it('has smooth responsive design', () => {
    const { container } = render(<ModalSkeleton />);
    const content = container.querySelector('.bg-white.rounded-lg');
    expect(content).toHaveClass('w-11/12');
  });
});
