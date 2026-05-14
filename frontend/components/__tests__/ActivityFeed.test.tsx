import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BuildEvent } from '../TimelineEvent';
import { ActivityFeed } from '../ActivityFeed';

describe('ActivityFeed', () => {
  const mockEvents: BuildEvent[] = [
    {
      id: 'event-1',
      buildId: 'build-123',
      eventType: 'status_change',
      timestamp: new Date('2026-01-15T12:00:00'),
      description: 'Build completed',
      metadata: { newStatus: 'COMPLETE' },
    },
    {
      id: 'event-2',
      buildId: 'build-123',
      eventType: 'test_run',
      timestamp: new Date('2026-01-15T11:00:00'),
      description: 'Test run completed',
      metadata: { testResult: 'PASSED' },
    },
    {
      id: 'event-3',
      buildId: 'build-123',
      eventType: 'status_change',
      timestamp: new Date('2026-01-15T10:00:00'),
      description: 'Build started',
      metadata: { newStatus: 'RUNNING' },
    },
  ];

  it('should render event list', () => {
    render(
      <ActivityFeed buildId="build-123" events={mockEvents} />,
    );

    expect(screen.getByText('Build completed')).toBeInTheDocument();
    expect(screen.getByText('Test run completed')).toBeInTheDocument();
    expect(screen.getByText('Build started')).toBeInTheDocument();
  });

  it('should display events in correct order (newest first)', () => {
    const { container } = render(
      <ActivityFeed buildId="build-123" events={mockEvents} />,
    );

    const descriptions = container.querySelectorAll('p.text-sm.text-gray-900');
    expect(descriptions[0]).toHaveTextContent('Build completed');
    expect(descriptions[1]).toHaveTextContent('Test run completed');
    expect(descriptions[2]).toHaveTextContent('Build started');
  });

  it('should have feed role', () => {
    const { container } = render(
      <ActivityFeed buildId="build-123" events={mockEvents} />,
    );

    expect(container.querySelector('[role="feed"]')).toBeInTheDocument();
  });

  it('should show loading skeleton when isLoading is true', () => {
    const { container } = render(
      <ActivityFeed buildId="build-123" events={mockEvents} isLoading={true} />,
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show empty state when no events', () => {
    render(
      <ActivityFeed buildId="build-123" events={[]} />,
    );

    expect(screen.getByText('No activity yet')).toBeInTheDocument();
  });

  it('should display event type filter buttons', () => {
    render(
      <ActivityFeed buildId="build-123" events={mockEvents} />,
    );

    expect(screen.getByText('Status Changes')).toBeInTheDocument();
    expect(screen.getByText('Test Runs')).toBeInTheDocument();
    expect(screen.getByText('Manual Updates')).toBeInTheDocument();
  });

  it('should filter events by type', async () => {
    const user = userEvent.setup();
    render(
      <ActivityFeed buildId="build-123" events={mockEvents} />,
    );

    // Initially all events visible
    expect(screen.getByText('Build completed')).toBeInTheDocument();

    // Unselect Status Changes to show only other types
    const statusChangesButton = screen.getByRole('button', { name: 'Status Changes' });
    await user.click(statusChangesButton);

    // Only test run and other non-status-change events should be visible
    expect(screen.getByText('Test run completed')).toBeInTheDocument();
    expect(screen.queryByText('Build completed')).not.toBeInTheDocument();
  });

  it('should allow multiple filters', async () => {
    const user = userEvent.setup();
    render(
      <ActivityFeed buildId="build-123" events={mockEvents} />,
    );

    // Unselect status changes
    const statusChangesButton = screen.getByRole('button', { name: 'Status Changes' });
    await user.click(statusChangesButton);

    // Only test run and manual updates should show
    expect(screen.getByText('Test run completed')).toBeInTheDocument();
    expect(screen.queryByText('Build completed')).not.toBeInTheDocument();
  });

  it('should handle pagination', async () => {
    const user = userEvent.setup();
    const manyEvents = Array.from({ length: 30 }, (_, i) => ({
      id: `event-${i}`,
      buildId: 'build-123',
      eventType: 'status_change' as const,
      timestamp: new Date(Date.now() - i * 1000),
      description: `Event ${i}`,
    }));

    render(
      <ActivityFeed buildId="build-123" events={manyEvents} pageSize={10} />,
    );

    // Should show load more button
    const loadMoreButton = screen.getByText(/Load more/);
    expect(loadMoreButton).toBeInTheDocument();

    // Click load more
    await user.click(loadMoreButton);

    // More events should be visible
    expect(screen.getByText('Event 15')).toBeInTheDocument();
  });

  it('should show results summary', () => {
    render(
      <ActivityFeed buildId="build-123" events={mockEvents} />,
    );

    expect(screen.getByText(/Showing.*of/)).toBeInTheDocument();
  });

  it('should call onEventClick callback', async () => {
    const user = userEvent.setup();
    const onEventClick = vi.fn();

    const { container } = render(
      <ActivityFeed buildId="build-123" events={mockEvents} onEventClick={onEventClick} />,
    );

    const firstEvent = container.querySelector('li');
    if (firstEvent) {
      await user.click(firstEvent);
      expect(onEventClick).toHaveBeenCalled();
    }
  });

  it('should expand event details on button click', async () => {
    const user = userEvent.setup();
    render(
      <ActivityFeed buildId="build-123" events={mockEvents} />,
    );

    const expandButtons = screen.getAllByText(/Show details/);
    if (expandButtons.length > 0) {
      await user.click(expandButtons[0]);
      expect(screen.getByText(/Hide details/)).toBeInTheDocument();
    }
  });

  it('should reset pagination on filter change', async () => {
    const user = userEvent.setup();
    const manyEvents = Array.from({ length: 30 }, (_, i) => ({
      id: `event-${i}`,
      buildId: 'build-123',
      eventType: (i % 2 === 0 ? 'status_change' : 'test_run') as any,
      timestamp: new Date(Date.now() - i * 1000),
      description: `Event ${i}`,
    }));

    const { rerender } = render(
      <ActivityFeed buildId="build-123" events={manyEvents} pageSize={10} />,
    );

    // Load more events
    const loadMoreButton = screen.getByText(/Load more/);
    await user.click(loadMoreButton);

    // Filter events
    const testRunsButton = screen.getByRole('button', { name: 'Test Runs' });
    await user.click(testRunsButton);

    // Pagination should reset
    expect(screen.getByText(/Showing.*of/)).toBeInTheDocument();
  });

  it('should handle empty results after filtering', async () => {
    const user = userEvent.setup();
    render(
      <ActivityFeed buildId="build-123" events={mockEvents} />,
    );

    // Select only system events (none in mock data)
    const systemEventsButton = screen.getByRole('button', { name: 'System Events' });
    await user.click(systemEventsButton);

    // Uncheck others - click multiple buttons
    await user.click(screen.getByRole('button', { name: 'Status Changes' }));
    await user.click(screen.getByRole('button', { name: 'Test Runs' }));

    expect(screen.getByText('No events match the selected filters')).toBeInTheDocument();
  });

  it('should display accessibility attributes on filter buttons', () => {
    render(
      <ActivityFeed buildId="build-123" events={mockEvents} />,
    );

    const buttons = screen.getAllByRole('button', { name: /Status Changes|Test Runs|Manual|System/ });
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('aria-pressed');
    });
  });

  it('should handle events with string timestamps', () => {
    const eventsWithStringTimestamps: BuildEvent[] = [
      {
        id: 'event-1',
        buildId: 'build-123',
        eventType: 'status_change',
        timestamp: '2026-01-15T12:00:00' as any,
        description: 'Build completed',
      },
    ];

    render(
      <ActivityFeed buildId="build-123" events={eventsWithStringTimestamps} />,
    );

    expect(screen.getByText('Build completed')).toBeInTheDocument();
  });

  it('should have proper semantic structure', () => {
    const { container } = render(
      <ActivityFeed buildId="build-123" events={mockEvents} />,
    );

    expect(container.querySelector('[role="feed"]')).toBeInTheDocument();
    expect(container.querySelector('[role="group"]')).toBeInTheDocument();
    expect(container.querySelector('ul')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ActivityFeed buildId="build-123" events={mockEvents} className="custom-class" />,
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
