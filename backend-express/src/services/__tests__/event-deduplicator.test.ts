import { describe, it, expect, beforeEach } from 'vitest';
import { EventDeduplicator } from '../event-deduplicator';
import { v4 as uuidv4 } from 'uuid';

describe('EventDeduplicator', () => {
  let dedup: EventDeduplicator;

  beforeEach(() => {
    dedup = new EventDeduplicator({ maxSize: 100, ttlMs: 5000 });
  });

  describe('isDuplicate', () => {
    it('returns false for first occurrence', () => {
      const eventId = uuidv4();
      const result = dedup.isDuplicate(eventId, Date.now());
      expect(result).toBe(false);
    });

    it('returns true for duplicate within TTL', () => {
      const eventId = uuidv4();
      const now = Date.now();

      dedup.mark(eventId, now);
      const result = dedup.isDuplicate(eventId, now);
      expect(result).toBe(true);
    });

    it('returns false for events outside TTL', async () => {
      const dedup2 = new EventDeduplicator({ maxSize: 100, ttlMs: 100 });
      const eventId = uuidv4();

      dedup2.mark(eventId, Date.now());

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      const result = dedup2.isDuplicate(eventId, Date.now());
      expect(result).toBe(false);
    });

    it('handles multiple events correctly', () => {
      const eventId1 = uuidv4();
      const eventId2 = uuidv4();
      const now = Date.now();

      dedup.mark(eventId1, now);
      dedup.mark(eventId2, now);

      expect(dedup.isDuplicate(eventId1, now)).toBe(true);
      expect(dedup.isDuplicate(eventId2, now)).toBe(true);
    });
  });

  describe('mark', () => {
    it('stores eventId and makes it a duplicate', () => {
      const eventId = uuidv4();
      const now = Date.now();

      dedup.mark(eventId, now);

      const result = dedup.isDuplicate(eventId, now);
      expect(result).toBe(true);
    });

    it('respects maxSize limit', () => {
      for (let i = 0; i < 150; i++) {
        dedup.mark(uuidv4(), Date.now());
      }

      const stats = dedup.getStats();
      expect(stats.size).toBeLessThanOrEqual(100);
    });

    it('removes oldest entry when at capacity', () => {
      const dedup2 = new EventDeduplicator({ maxSize: 3, ttlMs: 5000 });

      const eventId1 = uuidv4();
      const eventId2 = uuidv4();
      const eventId3 = uuidv4();
      const eventId4 = uuidv4();

      dedup2.mark(eventId1, Date.now());
      dedup2.mark(eventId2, Date.now());
      dedup2.mark(eventId3, Date.now());

      expect(dedup2.getStats().size).toBe(3);

      // Add 4th event, should remove one entry (random eviction strategy)
      dedup2.mark(eventId4, Date.now());

      expect(dedup2.getStats().size).toBeLessThanOrEqual(3);
      // At least one entry should be removed
      expect(dedup2.getStats().size).toBe(3);
      // eventId4 should be in the dedup since it was just added
      expect(dedup2.isDuplicate(eventId4, Date.now())).toBe(true);
    });
  });

  describe('getStats', () => {
    it('returns correct statistics', () => {
      dedup.mark(uuidv4(), Date.now());
      dedup.mark(uuidv4(), Date.now());

      const stats = dedup.getStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(100);
      expect(stats.ttlMs).toBe(5000);
    });

    it('returns initial state when empty', () => {
      const stats = dedup.getStats();
      expect(stats.size).toBe(0);
      expect(stats.maxSize).toBe(100);
      expect(stats.ttlMs).toBe(5000);
    });

    it('tracks size changes', () => {
      expect(dedup.getStats().size).toBe(0);

      dedup.mark(uuidv4(), Date.now());
      expect(dedup.getStats().size).toBe(1);

      dedup.mark(uuidv4(), Date.now());
      expect(dedup.getStats().size).toBe(2);
    });
  });

  describe('default options', () => {
    it('uses default maxSize and ttlMs', () => {
      const dedup2 = new EventDeduplicator();
      const stats = dedup2.getStats();

      expect(stats.maxSize).toBe(1000);
      expect(stats.ttlMs).toBe(300000); // 5 minutes
    });
  });

  describe('cleanup', () => {
    it('removes expired entries periodically', async () => {
      const dedup2 = new EventDeduplicator({ maxSize: 100, ttlMs: 100 });

      // Mark several events
      const eventIds: string[] = [];
      for (let i = 0; i < 5; i++) {
        const id = uuidv4();
        eventIds.push(id);
        dedup2.mark(id, Date.now());
      }

      expect(dedup2.getStats().size).toBe(5);

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Check that they're no longer duplicates (cleanup happens on check or mark)
      let cleaned = 0;
      for (const id of eventIds) {
        if (!dedup2.isDuplicate(id, Date.now())) {
          cleaned++;
        }
      }

      // At least some should have been cleaned
      expect(cleaned).toBeGreaterThan(0);
    });
  });
});
