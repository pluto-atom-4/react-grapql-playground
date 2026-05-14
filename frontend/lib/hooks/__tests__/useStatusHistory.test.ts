import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStatusHistory } from '../useStatusHistory';
import { useActivityFeed } from '../useActivityFeed';

describe('Hooks', () => {
  describe('useStatusHistory', () => {
    it('should fetch status history on mount', async () => {
      const { result } = renderHook(() => useStatusHistory('build-123'));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.statuses.length).toBeGreaterThan(0);
    });

    it('should return status history data', async () => {
      const { result } = renderHook(() => useStatusHistory('build-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.statuses).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            status: expect.stringMatching(/PENDING|RUNNING|COMPLETE|FAILED/),
            timestamp: expect.any(Date),
          }),
        ]),
      );
    });

    it('should have correct status order', async () => {
      const { result } = renderHook(() => useStatusHistory('build-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.statuses[0].status).toBe('PENDING');
      expect(result.current.statuses[1].status).toBe('RUNNING');
    });

    it('should provide refetch function', async () => {
      const { result } = renderHook(() => useStatusHistory('build-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialLength = result.current.statuses.length;

      await result.current.refetch();

      expect(result.current.statuses.length).toBe(initialLength);
    });

    it('should handle loading state', async () => {
      const { result } = renderHook(() => useStatusHistory('build-123'));

      expect(result.current.loading).toBe(true);
      expect(result.current.statuses.length).toBe(0);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should initialize with empty statuses', () => {
      const { result } = renderHook(() => useStatusHistory('build-123'));

      expect(result.current.statuses).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('useActivityFeed', () => {
    it('should fetch activity feed on mount', async () => {
      const { result } = renderHook(() => useActivityFeed('build-123'));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events.length).toBeGreaterThan(0);
    });

    it('should return activity feed events', async () => {
      const { result } = renderHook(() => useActivityFeed('build-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            buildId: 'build-123',
            eventType: expect.stringMatching(
              /status_change|test_run|manual_update|system_event/,
            ),
            timestamp: expect.any(Date),
            description: expect.any(String),
          }),
        ]),
      );
    });

    it('should include metadata in events', async () => {
      const { result } = renderHook(() => useActivityFeed('build-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const statusChangeEvent = result.current.events.find((e) => e.eventType === 'status_change');
      expect(statusChangeEvent?.metadata).toBeDefined();
    });

    it('should provide refetch function', async () => {
      const { result } = renderHook(() => useActivityFeed('build-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialLength = result.current.events.length;

      await result.current.refetch();

      expect(result.current.events.length).toBe(initialLength);
    });

    it('should handle loading state', async () => {
      const { result } = renderHook(() => useActivityFeed('build-123'));

      expect(result.current.loading).toBe(true);
      expect(result.current.events.length).toBe(0);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should initialize with empty events', () => {
      const { result } = renderHook(() => useActivityFeed('build-123'));

      expect(result.current.events).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should have events ordered by timestamp', async () => {
      const { result } = renderHook(() => useActivityFeed('build-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Events should be returned in order
      for (let i = 0; i < result.current.events.length - 1; i++) {
        const current = result.current.events[i].timestamp;
        const next = result.current.events[i + 1].timestamp;

        if (current instanceof Date && next instanceof Date) {
          expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
        }
      }
    });
  });
});
