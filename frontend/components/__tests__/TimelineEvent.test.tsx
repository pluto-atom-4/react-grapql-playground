import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BuildStatus } from '../../lib/generated/graphql';
import type { BuildEvent } from '../../lib/types/activity-types';
import { TimelineEvent } from '../TimelineEvent';

describe('TimelineEvent', () => {
  const mockEvent: BuildEvent = {
    id: 'event-1',
    buildId: 'build-123',
    eventType: 'status_change',
    timestamp: new Date('2026-01-15T10:00:00'),
    description: 'Build status changed to RUNNING',
    metadata: {
      previousStatus: BuildStatus.Pending,
      newStatus: BuildStatus.Running,
      changedBy: 'system',
    },
  };

  it('should render event with description', () => {
    render(
      <TimelineEvent event={mockEvent} />,
    );
    expect(screen.getByText('Build status changed to RUNNING')).toBeInTheDocument();
  });

  it('should display event type badge', () => {
    render(
      <TimelineEvent event={mockEvent} />,
    );
    expect(screen.getByText('Status Changed')).toBeInTheDocument();
  });

  it('should display timestamp', () => {
    render(
      <TimelineEvent event={mockEvent} />,
    );
    const timeElement = screen.getByRole('img', { hidden: true });
    expect(timeElement).toBeInTheDocument();
  });

  it('should have role="listitem"', () => {
    const { container } = render(
      <TimelineEvent event={mockEvent} />,
    );
    expect(container.querySelector('[role="listitem"]')).toBeInTheDocument();
  });

  it('should show status badge for status change events', () => {
    render(
      <TimelineEvent event={mockEvent} />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should toggle expanded state on button click', async () => {
    const user = userEvent.setup();
    render(
      <TimelineEvent event={mockEvent} />,
    );

    const expandButton = screen.getByText('▶ Show details');
    expect(expandButton).toBeInTheDocument();

    await user.click(expandButton);
    expect(screen.getByText('▼ Hide details')).toBeInTheDocument();

    // Check that metadata is displayed
    expect(screen.getByText('Changed by:')).toBeInTheDocument();
  });

  it('should call onExpand callback when toggling', async () => {
    const user = userEvent.setup();
    const onExpand = vi.fn();
    render(
      <TimelineEvent event={mockEvent} onExpand={onExpand} />,
    );

    const expandButton = screen.getByText('▶ Show details');
    await user.click(expandButton);

    expect(onExpand).toHaveBeenCalledWith(mockEvent.id, true);
  });

  it('should display metadata when expanded', () => {
    render(
      <TimelineEvent event={mockEvent} expanded={true} />,
    );

    expect(screen.getByText('From:')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('Changed by:')).toBeInTheDocument();
    expect(screen.getByText('system')).toBeInTheDocument();
  });

  it('should show connector line when not last event', () => {
    const { container } = render(
      <TimelineEvent event={mockEvent} index={0} totalEvents={3} />,
    );
    const connector = container.querySelector('[aria-hidden="true"]');
    expect(connector).toBeInTheDocument();
    expect(connector).toHaveClass('h-12');
  });

  it('should not show connector line for last event', () => {
    const { container } = render(
      <TimelineEvent event={mockEvent} index={2} totalEvents={3} />,
    );
    const connectors = container.querySelectorAll('[aria-hidden="true"]');
    // Only the icon should be hidden, not a connector
    expect(connectors.length).toBeLessThanOrEqual(1);
  });

  it('should handle different event types', () => {
    const testRunEvent: BuildEvent = {
      ...mockEvent,
      eventType: 'test_run',
      description: 'Test run completed',
      metadata: {
        testRunId: 'test-123',
        testResult: 'PASSED',
      },
    };

    render(
      <TimelineEvent event={testRunEvent} />,
    );
    expect(screen.getByText('Test Run')).toBeInTheDocument();
  });

  it('should display accessibility attributes', () => {
    render(
      <TimelineEvent event={mockEvent} />,
    );
    const expandDetails = screen.getByText('▶ Show details');
    expect(expandDetails).toHaveAttribute('aria-expanded', 'false');
    expect(expandDetails).toHaveAttribute('aria-controls', `event-details-${mockEvent.id}`);
  });

  it('should handle events without metadata', () => {
    const simpleEvent: BuildEvent = {
      id: 'event-2',
      buildId: 'build-123',
      eventType: 'system_event',
      timestamp: new Date(),
      description: 'System event occurred',
    };

    render(
      <TimelineEvent event={simpleEvent} />,
    );
    expect(screen.getByText('System event occurred')).toBeInTheDocument();
    expect(screen.queryByText('Show details')).not.toBeInTheDocument();
  });

  it('should format ISO timestamp correctly', () => {
    const { container } = render(
      <TimelineEvent event={mockEvent} />,
    );
    const timeElement = container.querySelector('time');
    expect(timeElement).toHaveAttribute('datetime', expect.stringContaining('2026-01-15'));
  });

  it('should have proper semantic HTML structure', () => {
    const { container } = render(
      <TimelineEvent event={mockEvent} />,
    );

    // Check for semantic elements
    expect(container.querySelector('time')).toBeInTheDocument();
    expect(container.querySelector('button')).toBeInTheDocument();
  });
});
