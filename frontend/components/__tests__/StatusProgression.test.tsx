import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { StatusHistoryItem } from '../StatusProgression';
import { StatusProgression } from '../StatusProgression';

describe('StatusProgression', () => {
  const mockStatuses: StatusHistoryItem[] = [
    {
      status: 'PENDING',
      timestamp: new Date('2026-01-15T10:00:00'),
      duration: 1800000, // 30 minutes
    },
    {
      status: 'RUNNING',
      timestamp: new Date('2026-01-15T10:30:00'),
      duration: 900000, // 15 minutes
    },
    {
      status: 'COMPLETE',
      timestamp: new Date('2026-01-15T10:45:00'),
    },
  ];

  it('should render all status nodes', () => {
    render(
      <StatusProgression buildId="build-123" statuses={mockStatuses} />,
    );

    expect(screen.getByText('PE')).toBeInTheDocument(); // PENDING
    expect(screen.getByText('RU')).toBeInTheDocument(); // RUNNING
    expect(screen.getByText('CO')).toBeInTheDocument(); // COMPLETE
  });

  it('should display status progression figure', () => {
    const { container } = render(
      <StatusProgression buildId="build-123" statuses={mockStatuses} />,
    );

    const figure = container.querySelector('[role="figure"]');
    expect(figure).toBeInTheDocument();
    expect(figure).toHaveAttribute('aria-label', expect.stringContaining('status progression'));
  });

  it('should display arrow connectors', () => {
    const { container } = render(
      <StatusProgression buildId="build-123" statuses={mockStatuses} />,
    );

    const arrows = screen.getAllByText('→');
    expect(arrows.length).toBe(mockStatuses.length - 1); // n-1 arrows for n statuses
  });

  it('should show status nodes with correct size class', () => {
    const { container } = render(
      <StatusProgression buildId="build-123" statuses={mockStatuses} size="medium" />,
    );

    const nodes = container.querySelectorAll('[class*="w-12"]');
    expect(nodes.length).toBeGreaterThan(0);
  });

  it('should support small size', () => {
    const { container } = render(
      <StatusProgression buildId="build-123" statuses={mockStatuses} size="small" />,
    );

    const nodes = container.querySelectorAll('[class*="w-8"]');
    expect(nodes.length).toBeGreaterThan(0);
  });

  it('should support large size', () => {
    const { container } = render(
      <StatusProgression buildId="build-123" statuses={mockStatuses} size="large" />,
    );

    const nodes = container.querySelectorAll('[class*="w-16"]');
    expect(nodes.length).toBeGreaterThan(0);
  });

  it('should handle empty status array', () => {
    render(
      <StatusProgression buildId="build-123" statuses={[]} />,
    );

    expect(screen.getByText('No status history available')).toBeInTheDocument();
  });

  it('should display node titles on hover', () => {
    const { container } = render(
      <StatusProgression buildId="build-123" statuses={mockStatuses} />,
    );

    const buttons = container.querySelectorAll('button[title*="Pending"]');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should make nodes interactive when interactive prop is true', async () => {
    const user = userEvent.setup();
    const onStatusClick = vi.fn();

    render(
      <StatusProgression
        buildId="build-123"
        statuses={mockStatuses}
        interactive={true}
        onStatusClick={onStatusClick}
      />,
    );

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);

    expect(onStatusClick).toHaveBeenCalledWith(mockStatuses[0], 0);
  });

  it('should not make nodes clickable when interactive prop is false', async () => {
    const user = userEvent.setup();
    const onStatusClick = vi.fn();

    render(
      <StatusProgression
        buildId="build-123"
        statuses={mockStatuses}
        interactive={false}
        onStatusClick={onStatusClick}
      />,
    );

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);

    expect(onStatusClick).not.toHaveBeenCalled();
  });

  it('should display tooltip with timestamp', () => {
    const { container } = render(
      <StatusProgression buildId="build-123" statuses={mockStatuses} />,
    );

    const button = container.querySelector('button[title*="2026"]');
    expect(button).toBeInTheDocument();
  });

  it('should be responsive with hidden and sm:flex classes', () => {
    const { container } = render(
      <StatusProgression buildId="build-123" statuses={mockStatuses} />,
    );

    // Desktop view
    const desktopView = container.querySelector('.hidden.sm\\:flex');
    expect(desktopView).toBeInTheDocument();

    // Mobile view
    const mobileView = container.querySelector('.sm\\:hidden');
    expect(mobileView).toBeInTheDocument();
  });

  it('should have focus management on buttons', () => {
    const { container } = render(
      <StatusProgression buildId="build-123" statuses={mockStatuses} interactive={true} />,
    );

    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-offset-2');
      expect(button).toHaveClass('focus:ring-blue-500');
    });
  });

  it('should display status labels in aria-label', () => {
    const { container } = render(
      <StatusProgression buildId="build-123" statuses={mockStatuses} />,
    );

    const buttons = container.querySelectorAll('button[aria-label*="Status"]');
    expect(buttons.length).toBeGreaterThanOrEqual(mockStatuses.length);
  });

  it('should handle single status', () => {
    const singleStatus: StatusHistoryItem[] = [
      {
        status: 'PENDING',
        timestamp: new Date(),
      },
    ];

    render(
      <StatusProgression buildId="build-123" statuses={singleStatus} />,
    );

    expect(screen.getByText('PE')).toBeInTheDocument();
    expect(screen.queryByText('→')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <StatusProgression buildId="build-123" statuses={mockStatuses} className="custom-class" />,
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should have proper semantic structure', () => {
    const { container } = render(
      <StatusProgression buildId="build-123" statuses={mockStatuses} />,
    );

    expect(container.querySelector('[role="figure"]')).toBeInTheDocument();
    expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
  });

  it('should render different colors for different statuses', () => {
    const { container } = render(
      <StatusProgression buildId="build-123" statuses={mockStatuses} />,
    );

    // Check for color classes from STATUS_NODE_COLORS
    const bgColors = container.innerHTML;
    expect(bgColors).toContain('bg-yellow'); // PENDING
    expect(bgColors).toContain('bg-blue'); // RUNNING
    expect(bgColors).toContain('bg-green'); // COMPLETE
  });
});
