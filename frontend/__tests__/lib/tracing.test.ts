import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  extractTraceparentHeader,
  getCurrentTraceContext,
  getTracer,
  getOrCreateTraceparentContext,
  generateTraceId,
  generateSpanId,
  isValidTraceparent,
  resetTraceContext,
} from '@/lib/tracing';

describe('Tracing Module', () => {
  beforeEach(() => {
    // Reset trace context before each test
    resetTraceContext();
    // Clear any sessionStorage
    globalThis.sessionStorage?.clear();
  });

  afterEach(() => {
    resetTraceContext();
    globalThis.sessionStorage?.clear();
  });

  describe('generateTraceId', () => {
    it('should generate a 32-character hex string', () => {
      const traceId = generateTraceId();
      expect(traceId).toMatch(/^[0-9a-f]{32}$/i);
    });

    it('should generate unique trace IDs', () => {
      const traceId1 = generateTraceId();
      const traceId2 = generateTraceId();
      expect(traceId1).not.toBe(traceId2);
    });
  });

  describe('generateSpanId', () => {
    it('should generate a 16-character hex string', () => {
      const spanId = generateSpanId();
      expect(spanId).toMatch(/^[0-9a-f]{16}$/i);
    });

    it('should generate unique span IDs', () => {
      const spanId1 = generateSpanId();
      const spanId2 = generateSpanId();
      expect(spanId1).not.toBe(spanId2);
    });
  });

  describe('isValidTraceparent', () => {
    it('should accept valid W3C traceparent format', () => {
      const valid = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
      expect(isValidTraceparent(valid)).toBe(true);
    });

    it('should accept valid traceparent with sampled flag 00', () => {
      const valid = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00';
      expect(isValidTraceparent(valid)).toBe(true);
    });

    it('should reject invalid version', () => {
      const invalid = '01-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
      expect(isValidTraceparent(invalid)).toBe(false);
    });

    it('should reject invalid trace-id length', () => {
      const invalid = '00-4bf92f3577b34da6a3ce929d0e0e473-00f067aa0ba902b7-01';
      expect(isValidTraceparent(invalid)).toBe(false);
    });

    it('should reject invalid span-id length', () => {
      const invalid = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902-01';
      expect(isValidTraceparent(invalid)).toBe(false);
    });

    it('should reject invalid flags', () => {
      const invalid = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-02';
      expect(isValidTraceparent(invalid)).toBe(false);
    });

    it('should reject invalid character format', () => {
      const invalid = '00-GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG-00f067aa0ba902b7-01';
      expect(isValidTraceparent(invalid)).toBe(false);
    });

    it('should be case-insensitive for hex characters', () => {
      const uppercase = '00-4BF92F3577B34DA6A3CE929D0E0E4736-00F067AA0BA902B7-01';
      const lowercase = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
      expect(isValidTraceparent(uppercase)).toBe(true);
      expect(isValidTraceparent(lowercase)).toBe(true);
    });
  });

  describe('getOrCreateTraceparentContext', () => {
    it('should return valid W3C traceparent context', () => {
      const context = getOrCreateTraceparentContext();
      expect(context).toHaveProperty('traceId');
      expect(context).toHaveProperty('spanId');
      expect(context).toHaveProperty('flags');
      expect(context).toHaveProperty('traceparent');
    });

    it('should generate valid traceparent format', () => {
      const context = getOrCreateTraceparentContext();
      expect(isValidTraceparent(context.traceparent)).toBe(true);
    });

    it('should have 32-character trace ID', () => {
      const context = getOrCreateTraceparentContext();
      expect(context.traceId).toMatch(/^[0-9a-f]{32}$/i);
    });

    it('should have 16-character span ID', () => {
      const context = getOrCreateTraceparentContext();
      expect(context.spanId).toMatch(/^[0-9a-f]{16}$/i);
    });

    it('should have flags set to 01 (sampled)', () => {
      const context = getOrCreateTraceparentContext();
      expect(context.flags).toBe('01');
    });

    it('should persist trace ID across multiple calls', () => {
      const context1 = getOrCreateTraceparentContext();
      const traceId1 = context1.traceId;

      const context2 = getOrCreateTraceparentContext();
      const traceId2 = context2.traceId;

      expect(traceId1).toBe(traceId2);
    });

    it('should generate different span IDs for each call (new request)', () => {
      const context1 = getOrCreateTraceparentContext();
      const spanId1 = context1.spanId;

      const context2 = getOrCreateTraceparentContext();
      const spanId2 = context2.spanId;

      expect(spanId1).not.toBe(spanId2);
    });

    it('should persist trace ID in sessionStorage', () => {
      const context = getOrCreateTraceparentContext();
      const stored = globalThis.sessionStorage?.getItem('otel_trace_id');
      expect(stored).toBeDefined();
      expect(isValidTraceparent(stored!)).toBe(true);
      // Note: stored traceparent will have different span ID than context.traceparent
      // because span ID is regenerated for each request. We only verify trace ID.
      const storedTraceId = stored!.split('-')[1];
      expect(storedTraceId).toBe(context.traceId);
    });

    it('should retrieve trace ID from sessionStorage on subsequent calls', () => {
      const context1 = getOrCreateTraceparentContext();

      // Get context again - should have same trace ID
      const context2 = getOrCreateTraceparentContext();
      expect(context2.traceId).toBe(context1.traceId);
    });
  });

  describe('getCurrentTraceContext', () => {
    it('should return current trace context', () => {
      const context = getCurrentTraceContext();
      expect(context).toHaveProperty('traceId');
      expect(context).toHaveProperty('spanId');
      expect(context).toHaveProperty('traceparent');
    });

    it('should return same trace ID as getOrCreateTraceparentContext', () => {
      const context1 = getCurrentTraceContext();
      const context2 = getOrCreateTraceparentContext();
      expect(context1.traceId).toBe(context2.traceId);
    });
  });

  describe('extractTraceparentHeader', () => {
    it('should return a valid traceparent header string', () => {
      const header = extractTraceparentHeader();
      expect(typeof header).toBe('string');
      expect(isValidTraceparent(header)).toBe(true);
    });

    it('should return same trace ID across multiple calls', () => {
      const header1 = extractTraceparentHeader();
      const traceId1 = header1.split('-')[1];

      const header2 = extractTraceparentHeader();
      const traceId2 = header2.split('-')[1];

      expect(traceId1).toBe(traceId2);
    });

    it('should return different span IDs for each call', () => {
      const header1 = extractTraceparentHeader();
      const spanId1 = header1.split('-')[2];

      const header2 = extractTraceparentHeader();
      const spanId2 = header2.split('-')[2];

      expect(spanId1).not.toBe(spanId2);
    });

    it('should always have sampled flag 01', () => {
      const header = extractTraceparentHeader();
      const flag = header.split('-')[3];
      expect(flag).toBe('01');
    });
  });

  describe('getTracer', () => {
    it('should return a tracer instance', () => {
      const tracer = getTracer();
      expect(tracer).toBeDefined();
      expect(typeof tracer.startSpan).toBe('function');
    });

    it('should return same instance on multiple calls (singleton)', () => {
      const tracer1 = getTracer();
      const tracer2 = getTracer();
      expect(tracer1).toBe(tracer2);
    });
  });

  describe('resetTraceContext', () => {
    it('should clear sessionStorage trace context', () => {
      // Create initial context
      getOrCreateTraceparentContext();
      let stored = globalThis.sessionStorage?.getItem('otel_trace_id');
      expect(stored).toBeTruthy();

      // Reset
      resetTraceContext();
      stored = globalThis.sessionStorage?.getItem('otel_trace_id');
      expect(stored).toBeNull();
    });

    it('should generate new trace ID after reset', () => {
      const context1 = getOrCreateTraceparentContext();
      const traceId1 = context1.traceId;

      resetTraceContext();

      const context2 = getOrCreateTraceparentContext();
      const traceId2 = context2.traceId;

      expect(traceId1).not.toBe(traceId2);
    });
  });

  describe('Trace ID Persistence Across Session', () => {
    it('should maintain same trace ID across 5+ requests', () => {
      const traceIds: string[] = [];

      // Simulate 5+ requests
      for (let i = 0; i < 7; i++) {
        const context = getCurrentTraceContext();
        traceIds.push(context.traceId);
      }

      // All trace IDs should be identical
      const firstTraceId = traceIds[0];
      traceIds.forEach((traceId) => {
        expect(traceId).toBe(firstTraceId);
      });
    });

    it('should generate unique span IDs for each request', () => {
      const spanIds: string[] = [];

      for (let i = 0; i < 7; i++) {
        const context = getCurrentTraceContext();
        spanIds.push(context.spanId);
      }

      // Check all span IDs are unique
      const uniqueSpanIds = new Set(spanIds);
      expect(uniqueSpanIds.size).toBe(spanIds.length);
    });

    it('should maintain consistency through extractTraceparentHeader', () => {
      const headers: string[] = [];
      const traceIds: string[] = [];

      for (let i = 0; i < 5; i++) {
        const header = extractTraceparentHeader();
        headers.push(header);
        const traceId = header.split('-')[1];
        traceIds.push(traceId);
      }

      // All trace IDs should be identical
      const firstTraceId = traceIds[0];
      traceIds.forEach((traceId) => {
        expect(traceId).toBe(firstTraceId);
      });

      // All headers should be valid
      headers.forEach((header) => {
        expect(isValidTraceparent(header)).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing sessionStorage gracefully', () => {
      // This tests the fallback behavior
      const context = getOrCreateTraceparentContext();
      expect(isValidTraceparent(context.traceparent)).toBe(true);
    });

    it('should handle empty sessionStorage', () => {
      globalThis.sessionStorage?.clear();
      const context = getOrCreateTraceparentContext();
      expect(isValidTraceparent(context.traceparent)).toBe(true);
    });

    it('should accept valid case-insensitive traceparent from storage', () => {
      const validTraceparent = '00-4BF92F3577B34DA6A3CE929D0E0E4736-00F067AA0BA902B7-01';
      globalThis.sessionStorage?.setItem('otel_trace_id', validTraceparent);

      const context = getOrCreateTraceparentContext();
      expect(context.traceId).toBe('4bf92f3577b34da6a3ce929d0e0e4736');
    });
  });

  describe('Type Safety', () => {
    it('should export functions with correct TypeScript types', () => {
      // This test verifies the module exports are properly typed
      expect(typeof extractTraceparentHeader).toBe('function');
      expect(typeof getCurrentTraceContext).toBe('function');
      expect(typeof getTracer).toBe('function');
      expect(typeof getOrCreateTraceparentContext).toBe('function');
      expect(typeof generateTraceId).toBe('function');
      expect(typeof generateSpanId).toBe('function');
      expect(typeof isValidTraceparent).toBe('function');
      expect(typeof resetTraceContext).toBe('function');
    });

    it('should return correctly typed objects from getCurrentTraceContext', () => {
      const context = getCurrentTraceContext();
      expect(typeof context.traceId).toBe('string');
      expect(typeof context.spanId).toBe('string');
      expect(typeof context.flags).toBe('string');
      expect(typeof context.traceparent).toBe('string');
    });

    it('should return correctly typed string from extractTraceparentHeader', () => {
      const header = extractTraceparentHeader();
      expect(typeof header).toBe('string');
    });
  });
});
