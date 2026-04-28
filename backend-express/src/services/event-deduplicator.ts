/**
 * Event Deduplicator Service
 *
 * Prevents duplicate events from being broadcast across three layers:
 * GraphQL → Express → Frontend
 *
 * Uses a sliding window with TTL (Time-To-Live) to detect duplicates:
 * - Max 1000 events stored
 * - 5-minute expiration per event
 * - Automatic cleanup of expired entries
 *
 * Called during event broadcast to check if eventId has been seen recently.
 */

/**
 * Configuration options for the deduplicator
 */
export interface DeduplicatorOptions {
  /** Maximum number of events to store (default: 1000) */
  maxSize?: number;
  /** Time-to-live for events in milliseconds (default: 300000 = 5 minutes) */
  ttlMs?: number;
}

/**
 * Event Deduplicator using sliding window with TTL
 *
 * Maintains a Map of eventId → timestamp entries to detect duplicates.
 * Expired entries are cleaned up periodically.
 */
export class EventDeduplicator {
  private dedup: Map<string, number> = new Map();

  private maxSize: number;

  private ttlMs: number;

  private lastCleanup: number = Date.now();

  private cleanupIntervalMs = 60000; // Clean every 1 minute

  constructor(options: DeduplicatorOptions = {}) {
    this.maxSize = options.maxSize ?? 1000;
    this.ttlMs = options.ttlMs ?? 300000; // 5 minutes default
  }

  /**
   * Check if event is duplicate
   *
   * Returns true if eventId has been seen before and is still within TTL window.
   * If the event was seen but is now outside TTL, it's treated as a new event.
   *
   * @param eventId - Unique event identifier (UUID)
   * @param timestamp - Event timestamp (for reference; uses current time for TTL check)
   * @returns true if duplicate, false if new/expired
   */
  isDuplicate(eventId: string, timestamp: number): boolean {
    const lastSeen = this.dedup.get(eventId);
    if (!lastSeen) return false;

    // Still within TTL window
    if (Date.now() - lastSeen < this.ttlMs) {
      return true;
    }

    // Outside TTL, treat as new event
    this.dedup.delete(eventId);
    return false;
  }

  /**
   * Mark event as seen
   *
   * Stores eventId with current timestamp. Also triggers periodic cleanup
   * and enforces maxSize limit by removing oldest entry if at capacity.
   *
   * @param eventId - Unique event identifier (UUID)
   * @param timestamp - Event timestamp (for reference only)
   */
  mark(eventId: string, timestamp: number): void {
    // Cleanup expired entries periodically
    if (Date.now() - this.lastCleanup > this.cleanupIntervalMs) {
      this.cleanup();
    }

    // If at capacity, remove oldest entry
    if (this.dedup.size >= this.maxSize) {
      // Find entry with smallest (oldest) timestamp
      const oldest = Array.from(this.dedup.entries()).sort(([, a], [, b]) => a - b)[0];
      if (oldest) this.dedup.delete(oldest[0]);
    }

    this.dedup.set(eventId, Date.now());
  }

  /**
   * Remove expired entries from the deduplicator
   *
   * Called periodically (every 1 minute) to free memory from events
   * that have aged past their TTL. This ensures the deduplicator
   * doesn't grow unbounded over time.
   *
   * @private
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [eventId, lastSeenTime] of this.dedup.entries()) {
      if (now - lastSeenTime > this.ttlMs) {
        this.dedup.delete(eventId);
      }
    }
    this.lastCleanup = Date.now();
  }

  /**
   * Get statistics for debugging and monitoring
   *
   * Returns current state of the deduplicator including size,
   * maxSize, and TTL configuration.
   *
   * @returns Deduplicator statistics
   */
  getStats(): { size: number; maxSize: number; ttlMs: number } {
    return {
      size: this.dedup.size,
      maxSize: this.maxSize,
      ttlMs: this.ttlMs,
    };
  }
}
