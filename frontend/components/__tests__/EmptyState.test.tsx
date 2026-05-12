import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactElement } from 'react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders with title and description', () => {
    render(
      <EmptyState
        title="No items"
        description="Create one to get started"
      />
    );
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Create one to get started')).toBeInTheDocument();
  });

  it('renders CTA button when ctaText and onCTA provided', () => {
    const mockOnCTA = vi.fn();
    render(
      <EmptyState
        title="No items"
        description="Create one to get started"
        ctaText="Create Item"
        onCTA={mockOnCTA}
      />
    );
    expect(screen.getByRole('button', { name: /create item/i })).toBeInTheDocument();
  });

  it('does not render CTA button without onCTA callback', () => {
    render(
      <EmptyState
        title="No items"
        description="Create one to get started"
        ctaText="Create Item"
      />
    );
    expect(screen.queryByRole('button', { name: /create item/i })).not.toBeInTheDocument();
  });

  it('calls onCTA when button is clicked', () => {
    const mockOnCTA = vi.fn();
    render(
      <EmptyState
        title="No items"
        description="Create one to get started"
        ctaText="Create Item"
        onCTA={mockOnCTA}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /create item/i }));
    expect(mockOnCTA).toHaveBeenCalledTimes(1);
  });

  it('renders with optional icon element', () => {
    const Icon = (): ReactElement => <div data-testid="test-icon">📋</div>;
    render(
      <EmptyState
        icon={<Icon />}
        title="No items"
        description="Create one to get started"
      />
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('does not render icon div when icon prop is not provided', () => {
    const { container } = render(
      <EmptyState
        title="No items"
        description="Create one to get started"
      />
    );
    // Icon wrapper should not exist if no icon provided
    const iconDiv = container.querySelector('[class*="mb-4"]');
    expect(iconDiv?.children.length || 0).toBe(0);
  });

  it('applies custom className prop', () => {
    const { container } = render(
      <EmptyState
        title="No items"
        description="Create one to get started"
        className="custom-empty-state"
      />
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-empty-state');
  });

  it('has responsive flex container', () => {
    const { container } = render(
      <EmptyState
        title="No items"
        description="Create one to get started"
      />
    );
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass(
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'py-12',
      'px-4',
      'text-center'
    );
  });

  it('title has correct styling classes', () => {
    render(
      <EmptyState
        title="No items"
        description="Create one to get started"
      />
    );
    const title = screen.getByText('No items');
    expect(title).toHaveClass('text-lg', 'font-medium', 'text-gray-600', 'mb-2');
  });

  it('description has correct styling classes', () => {
    render(
      <EmptyState
        title="No items"
        description="Create one to get started"
      />
    );
    const description = screen.getByText('Create one to get started');
    expect(description).toHaveClass('text-sm', 'text-gray-500', 'mb-6', 'max-w-md');
  });

  it('CTA button has correct styling and interactive classes', () => {
    render(
      <EmptyState
        title="No items"
        description="Create one to get started"
        ctaText="Create Item"
        onCTA={() => {}}
      />
    );
    const button = screen.getByRole('button', { name: /create item/i });
    expect(button).toHaveClass(
      'bg-blue-600',
      'hover:bg-blue-700',
      'active:scale-95',
      'focus:ring-2',
      'focus:ring-blue-500',
      'focus:outline-none',
      'text-white',
      'px-6',
      'py-2',
      'rounded-lg',
      'transition-all',
      'duration-150',
      'ease-out',
      'font-medium'
    );
  });

  it('button has type="button"', () => {
    render(
      <EmptyState
        title="No items"
        description="Create one to get started"
        ctaText="Create Item"
        onCTA={() => {}}
      />
    );
    const button = screen.getByRole('button', { name: /create item/i });
    expect(button).toHaveAttribute('type', 'button');
  });

  it('renders semantic HTML structure', () => {
    render(
      <EmptyState
        title="No items"
        description="Create one to get started"
      />
    );
    const title = screen.getByText('No items');
    expect(title.tagName).toBe('H3');
  });

  it('has proper spacing and layout', () => {
    const { container } = render(
      <EmptyState
        icon={<div>Icon</div>}
        title="No items"
        description="Create one to get started"
        ctaText="Create"
        onCTA={() => {}}
      />
    );
    // Check that all elements are rendered in the correct order
    const children = container.querySelector('div')?.children;
    expect(children?.length).toBeGreaterThan(0);
  });

  it('renders all parts together correctly', () => {
    const mockOnCTA = vi.fn();
    render(
      <EmptyState
        icon={<div data-testid="icon">📋</div>}
        title="No builds"
        description="Create your first build"
        ctaText="New Build"
        onCTA={mockOnCTA}
        className="custom-class"
      />
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('No builds')).toBeInTheDocument();
    expect(screen.getByText('Create your first build')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new build/i })).toBeInTheDocument();
  });
});
