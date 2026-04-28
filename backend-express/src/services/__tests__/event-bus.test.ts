import { describe, it, expect, beforeEach } from 'vitest';
import { EventBusMetricsCollector } from '../event-bus';
import { EVENT_TYPES } from '../../types/events';

describe('EventBusMetricsCollector', () => {
  let collector: EventBusMetricsCollector;

  beforeEach(() => {
    collector = new EventBusMetricsCollector();
  });

  describe('recordEmitted', () => {
    it('increments totalEmitted', () => {
      collector.recordEmitted(EVENT_TYPES.BUILD_CREATED);
      expect(collector.getMetrics().totalEmitted).toBe(1);
    });

    it('increments multiple emitted events', () => {
      collector.recordEmitted(EVENT_TYPES.BUILD_CREATED);
      collector.recordEmitted(EVENT_TYPES.BUILD_STATUS_CHANGED);
      expect(collector.getMetrics().totalEmitted).toBe(2);
    });

    it('tracks event type counts', () => {
      collector.recordEmitted(EVENT_TYPES.BUILD_CREATED);
      collector.recordEmitted(EVENT_TYPES.BUILD_CREATED);
      collector.recordEmitted(EVENT_TYPES.PART_ADDED);

      const metrics = collector.getMetrics();
      expect(metrics.eventCounts[EVENT_TYPES.BUILD_CREATED]).toBe(2);
      expect(metrics.eventCounts[EVENT_TYPES.PART_ADDED]).toBe(1);
    });

    it('handles custom event type strings', () => {
      collector.recordEmitted('customEvent');
      const metrics = collector.getMetrics();
      expect(metrics.eventCounts.customEvent).toBe(1);
    });
  });

  describe('recordBroadcasted', () => {
    it('increments totalBroadcasted and updates latency', () => {
      collector.recordBroadcasted(50, EVENT_TYPES.BUILD_CREATED);
      const metrics = collector.getMetrics();

      expect(metrics.totalBroadcasted).toBe(1);
      expect(metrics.averageLatencyMs).toBe(50);
      expect(metrics.maxLatencyMs).toBe(50);
      expect(metrics.minLatencyMs).toBe(50);
    });

    it('calculates average latency correctly', () => {
      collector.recordBroadcasted(10, EVENT_TYPES.BUILD_CREATED);
      collector.recordBroadcasted(20, EVENT_TYPES.BUILD_STATUS_CHANGED);
      collector.recordBroadcasted(30, EVENT_TYPES.PART_ADDED);

      const metrics = collector.getMetrics();
      expect(metrics.averageLatencyMs).toBe(20); // (10 + 20 + 30) / 3
    });

    it('tracks max latency correctly', () => {
      collector.recordBroadcasted(10, EVENT_TYPES.BUILD_CREATED);
      collector.recordBroadcasted(50, EVENT_TYPES.BUILD_STATUS_CHANGED);
      collector.recordBroadcasted(30, EVENT_TYPES.PART_ADDED);

      const metrics = collector.getMetrics();
      expect(metrics.maxLatencyMs).toBe(50);
    });

    it('tracks min latency correctly', () => {
      collector.recordBroadcasted(50, EVENT_TYPES.BUILD_CREATED);
      collector.recordBroadcasted(10, EVENT_TYPES.BUILD_STATUS_CHANGED);
      collector.recordBroadcasted(30, EVENT_TYPES.PART_ADDED);

      const metrics = collector.getMetrics();
      expect(metrics.minLatencyMs).toBe(10);
    });
  });

  describe('recordDuplicate', () => {
    it('increments totalDuplicates', () => {
      collector.recordDuplicate();
      expect(collector.getMetrics().totalDuplicates).toBe(1);
    });

    it('counts multiple duplicates', () => {
      collector.recordDuplicate();
      collector.recordDuplicate();
      collector.recordDuplicate();
      expect(collector.getMetrics().totalDuplicates).toBe(3);
    });
  });

  describe('recordBroadcastError', () => {
    it('increments totalErrors', () => {
      collector.recordBroadcastError();
      expect(collector.getMetrics().totalErrors).toBe(1);
    });
  });

  describe('recordFailedBroadcast', () => {
    it('increments failedBroadcasts', () => {
      collector.recordFailedBroadcast();
      expect(collector.getMetrics().failedBroadcasts).toBe(1);
    });
  });

  describe('setConnectedClients', () => {
    it('sets connected client count', () => {
      collector.setConnectedClients(5);
      expect(collector.getMetrics().connectedClients).toBe(5);
    });

    it('updates connected client count', () => {
      collector.setConnectedClients(5);
      expect(collector.getMetrics().connectedClients).toBe(5);

      collector.setConnectedClients(10);
      expect(collector.getMetrics().connectedClients).toBe(10);
    });
  });

  describe('metrics tracking integration', () => {
    it('tracks all metric types together', () => {
      collector.recordEmitted(EVENT_TYPES.BUILD_CREATED);
      collector.recordBroadcasted(50, EVENT_TYPES.BUILD_CREATED);
      collector.recordDuplicate();
      collector.recordBroadcastError();
      collector.recordFailedBroadcast();
      collector.setConnectedClients(5);

      const metrics = collector.getMetrics();
      expect(metrics.totalEmitted).toBe(1);
      expect(metrics.totalBroadcasted).toBe(1);
      expect(metrics.totalDuplicates).toBe(1);
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.failedBroadcasts).toBe(1);
      expect(metrics.connectedClients).toBe(5);
      expect(metrics.eventCounts[EVENT_TYPES.BUILD_CREATED]).toBe(1);
    });

    it('handles complex scenario with multiple events', () => {
      // Emit various events
      collector.recordEmitted(EVENT_TYPES.BUILD_CREATED);
      collector.recordEmitted(EVENT_TYPES.BUILD_CREATED);
      collector.recordEmitted(EVENT_TYPES.PART_ADDED);
      collector.recordEmitted(EVENT_TYPES.FILE_UPLOADED);

      // Broadcast some
      collector.recordBroadcasted(25, EVENT_TYPES.BUILD_CREATED);
      collector.recordBroadcasted(35, EVENT_TYPES.BUILD_CREATED);

      // Duplicates and errors
      collector.recordDuplicate();
      collector.recordDuplicate();
      collector.recordBroadcastError();

      const metrics = collector.getMetrics();
      expect(metrics.totalEmitted).toBe(4);
      expect(metrics.totalBroadcasted).toBe(2);
      expect(metrics.totalDuplicates).toBe(2);
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.averageLatencyMs).toBe(30); // (25 + 35) / 2
    });
  });

  describe('reset', () => {
    it('resets all metrics to default', () => {
      collector.recordEmitted(EVENT_TYPES.BUILD_CREATED);
      collector.recordBroadcasted(50, EVENT_TYPES.BUILD_CREATED);
      collector.setConnectedClients(10);

      collector.reset();

      const metrics = collector.getMetrics();
      expect(metrics.totalEmitted).toBe(0);
      expect(metrics.totalBroadcasted).toBe(0);
      expect(metrics.connectedClients).toBe(0);
      expect(metrics.averageLatencyMs).toBe(0);
      expect(metrics.maxLatencyMs).toBe(0);
      expect(metrics.minLatencyMs).toBe(Infinity);
      expect(Object.keys(metrics.eventCounts)).toHaveLength(0);
    });

    it('allows recording after reset', () => {
      collector.recordEmitted(EVENT_TYPES.BUILD_CREATED);
      collector.reset();
      collector.recordEmitted(EVENT_TYPES.PART_ADDED);

      const metrics = collector.getMetrics();
      expect(metrics.totalEmitted).toBe(1);
      expect(metrics.eventCounts[EVENT_TYPES.PART_ADDED]).toBe(1);
      expect(metrics.eventCounts[EVENT_TYPES.BUILD_CREATED]).toBeUndefined();
    });
  });

  describe('getMetrics', () => {
    it('returns a copy of metrics', () => {
      collector.recordEmitted(EVENT_TYPES.BUILD_CREATED);

      const metrics1 = collector.getMetrics();
      const metrics2 = collector.getMetrics();

      expect(metrics1).toEqual(metrics2);
      expect(metrics1).not.toBe(metrics2); // Should be different objects
    });
  });
});
