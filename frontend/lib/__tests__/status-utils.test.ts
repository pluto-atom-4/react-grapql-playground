import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatStatusTransition,
  getStatusColor,
  getStatusNodeColor,
  calculateStatusDuration,
  formatDuration,
  formatRelativeTime,
  groupEventsByDate,
  filterEventsByType,
  filterEventsByDateRange,
  sortEventsByDate,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_NODE_COLORS,
} from '../status-utils';
import { BuildStatus } from '../generated/graphql';

describe('Status Utilities', () => {
  describe('formatStatusTransition', () => {
    it('should format transition from PENDING to RUNNING', () => {
      const result = formatStatusTransition(BuildStatus.Pending, BuildStatus.Running);
      expect(result).toBe('Started running');
    });

    it('should format transition from RUNNING to COMPLETE', () => {
      const result = formatStatusTransition(BuildStatus.Running, BuildStatus.Complete);
      expect(result).toBe('Completed successfully');
    });

    it('should format transition from RUNNING to FAILED', () => {
      const result = formatStatusTransition(BuildStatus.Running, BuildStatus.Failed);
      expect(result).toBe('Failed during execution');
    });

    it('should handle transition with no previous status', () => {
      const result = formatStatusTransition(undefined, BuildStatus.Pending);
      expect(result).toBe('Moved to Pending');
    });

    it('should handle same status', () => {
      const result = formatStatusTransition(BuildStatus.Running, BuildStatus.Running);
      expect(result).toBe('Remained in Running');
    });

    it('should handle unknown transition', () => {
      const result = formatStatusTransition(BuildStatus.Complete, BuildStatus.Failed);
      expect(result).toContain('Changed from');
    });
  });

  describe('Color functions', () => {
    it('should return correct status color for PENDING', () => {
      const color = getStatusColor(BuildStatus.Pending);
      expect(color).toBe(STATUS_COLORS[BuildStatus.Pending]);
    });

    it('should return correct node color for COMPLETE', () => {
      const color = getStatusNodeColor(BuildStatus.Complete);
      expect(color).toBe(STATUS_NODE_COLORS[BuildStatus.Complete]);
    });

    it('should include text and background in color', () => {
      const color = getStatusColor(BuildStatus.Failed);
      expect(color).toContain('bg-');
      expect(color).toContain('text-');
    });
  });

  describe('calculateStatusDuration', () => {
    it('should calculate duration between two dates', () => {
      const start = new Date('2026-01-01T10:00:00');
      const end = new Date('2026-01-01T11:00:00');
      const duration = calculateStatusDuration(start, end);
      expect(duration).toBe(3600000); // 1 hour in ms
    });

    it('should calculate duration to now if no end date', () => {
      const start = new Date(Date.now() - 60000); // 1 minute ago
      const duration = calculateStatusDuration(start, undefined);
      expect(duration).toBeGreaterThanOrEqual(60000);
      expect(duration).toBeLessThan(65000); // Allow 5 second tolerance
    });

    it('should handle zero duration', () => {
      const date = new Date('2026-01-01T10:00:00');
      const duration = calculateStatusDuration(date, date);
      expect(duration).toBe(0);
    });
  });

  describe('formatDuration', () => {
    it('should format seconds', () => {
      expect(formatDuration(30000)).toBe('30s');
    });

    it('should format minutes', () => {
      expect(formatDuration(120000)).toBe('2m 0s');
    });

    it('should format hours', () => {
      expect(formatDuration(3600000)).toBe('1h 0m');
    });

    it('should format days', () => {
      expect(formatDuration(86400000)).toBe('1d 0h');
    });

    it('should format complex duration', () => {
      // 1 day, 2 hours, 30 minutes, 45 seconds = 93645000 ms
      expect(formatDuration(93645000)).toBe('1d 2h');
    });
  });

  describe('formatRelativeTime', () => {
    let now: Date;

    beforeEach(() => {
      now = new Date();
    });

    it('should format "just now" for recent times', () => {
      const recent = new Date(now.getTime() - 30000); // 30 seconds ago
      const result = formatRelativeTime(recent);
      expect(result).toBe('just now');
    });

    it('should format minutes ago', () => {
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
      const result = formatRelativeTime(fiveMinutesAgo);
      expect(result).toBe('5m ago');
    });

    it('should format hours ago', () => {
      const twoHoursAgo = new Date(now.getTime() - 2 * 3600000);
      const result = formatRelativeTime(twoHoursAgo);
      expect(result).toBe('2h ago');
    });

    it('should format days ago', () => {
      const threeDaysAgo = new Date(now.getTime() - 3 * 86400000);
      const result = formatRelativeTime(threeDaysAgo);
      expect(result).toBe('3d ago');
    });

    it('should format weeks ago', () => {
      const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
      const result = formatRelativeTime(twoWeeksAgo);
      expect(result).toBe('2w ago');
    });
  });

  describe('groupEventsByDate', () => {
    it('should group events by date', () => {
      const today = new Date('2026-01-15T10:00:00');
      const tomorrow = new Date('2026-01-16T10:00:00');

      const events = [
        { timestamp: today, id: '1' },
        { timestamp: today, id: '2' },
        { timestamp: tomorrow, id: '3' },
      ];

      const grouped = groupEventsByDate(events);
      expect(grouped.size).toBe(2);
      
      // Check that both groups have the right event counts
      const values = Array.from(grouped.values());
      expect(values).toContainEqual(expect.arrayContaining([
        expect.objectContaining({ id: '1' }),
        expect.objectContaining({ id: '2' }),
      ]));
      expect(values).toContainEqual(expect.arrayContaining([
        expect.objectContaining({ id: '3' }),
      ]));
    });
  });

  describe('filterEventsByType', () => {
    it('should filter events by single type', () => {
      const events = [
        { eventType: 'status_change' },
        { eventType: 'test_run' },
        { eventType: 'status_change' },
      ];

      const filtered = filterEventsByType(events as any, ['status_change']);
      expect(filtered).toHaveLength(2);
    });

    it('should filter events by multiple types', () => {
      const events = [
        { eventType: 'status_change' },
        { eventType: 'test_run' },
        { eventType: 'manual_update' },
      ];

      const filtered = filterEventsByType(events as any, ['status_change', 'test_run']);
      expect(filtered).toHaveLength(2);
    });

    it('should return all events if no filter specified', () => {
      const events = [
        { eventType: 'status_change' },
        { eventType: 'test_run' },
      ];

      const filtered = filterEventsByType(events as any, []);
      expect(filtered).toHaveLength(2);
    });
  });

  describe('filterEventsByDateRange', () => {
    it('should filter events within date range', () => {
      const start = new Date('2026-01-10');
      const end = new Date('2026-01-20');

      const events = [
        { timestamp: new Date('2026-01-05') },
        { timestamp: new Date('2026-01-15') },
        { timestamp: new Date('2026-01-25') },
      ];

      const filtered = filterEventsByDateRange(events as any, start, end);
      expect(filtered).toHaveLength(1);
    });
  });

  describe('sortEventsByDate', () => {
    it('should sort events newest first by default', () => {
      const events = [
        { timestamp: new Date('2026-01-10'), id: '1' },
        { timestamp: new Date('2026-01-15'), id: '2' },
        { timestamp: new Date('2026-01-05'), id: '3' },
      ];

      const sorted = sortEventsByDate(events as any);
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
      expect(sorted[2].id).toBe('3');
    });

    it('should sort events oldest first when ascending is true', () => {
      const events = [
        { timestamp: new Date('2026-01-10'), id: '1' },
        { timestamp: new Date('2026-01-15'), id: '2' },
        { timestamp: new Date('2026-01-05'), id: '3' },
      ];

      const sorted = sortEventsByDate(events as any, true);
      expect(sorted[0].id).toBe('3');
      expect(sorted[1].id).toBe('1');
      expect(sorted[2].id).toBe('2');
    });
  });

  describe('Constants', () => {
    it('should have labels for all statuses', () => {
      expect(STATUS_LABELS.PENDING).toBe('Pending');
      expect(STATUS_LABELS.RUNNING).toBe('Running');
      expect(STATUS_LABELS.COMPLETE).toBe('Complete');
      expect(STATUS_LABELS.FAILED).toBe('Failed');
    });

    it('should have colors for all statuses', () => {
      expect(STATUS_COLORS.PENDING).toContain('yellow');
      expect(STATUS_COLORS.RUNNING).toContain('blue');
      expect(STATUS_COLORS.COMPLETE).toContain('green');
      expect(STATUS_COLORS.FAILED).toContain('red');
    });
  });
});
