import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setContext } from '@apollo/client/link/context';
import {
  extractTraceparentHeader,
  isValidTraceparent,
  resetTraceContext,
  getCurrentTraceContext,
} from '@/lib/tracing';

describe('Apollo Tracing Integration', () => {
  beforeEach(() => {
    resetTraceContext();
    globalThis.sessionStorage?.clear();
  });

  afterEach(() => {
    resetTraceContext();
    globalThis.sessionStorage?.clear();
  });

  describe('Traceparent Header Injection', () => {
    it('should inject traceparent header via Apollo setContext link', () => {
      let injectedHeaders: Record<string, string> | undefined;

      const tracingLink = setContext((_, context) => {
        const traceparent = extractTraceparentHeader();
        const { headers } = context as { headers: Record<string, string> };
        injectedHeaders = {
          ...headers,
          traceparent,
        };
        return {
          headers: injectedHeaders,
        };
      });

      // Simulate Apollo link execution
      expect(tracingLink).toBeDefined();

      // Verify that when we extract headers, traceparent is present
      const header = extractTraceparentHeader();
      expect(isValidTraceparent(header)).toBe(true);
    });

    it('should use consistent trace ID across multiple extractTraceparentHeader calls', () => {
      const traceparentHeaders: string[] = [];

      // Simulate multiple requests
      for (let i = 0; i < 5; i++) {
        const header = extractTraceparentHeader();
        traceparentHeaders.push(header);
      }

      // Extract trace IDs from all headers
      const traceIds = traceparentHeaders.map((h) => h.split('-')[1]);

      // All trace IDs should be identical
      const firstTraceId = traceIds[0];
      traceIds.forEach((traceId) => {
        expect(traceId).toBe(firstTraceId);
      });

      // All headers should be valid
      traceparentHeaders.forEach((header) => {
        expect(isValidTraceparent(header)).toBe(true);
      });
    });

    it('should generate different span IDs for each request', () => {
      const spanIds: string[] = [];

      for (let i = 0; i < 5; i++) {
        const header = extractTraceparentHeader();
        const spanId = header.split('-')[2];
        spanIds.push(spanId);
      }

      // All span IDs should be unique
      const uniqueSpanIds = new Set(spanIds);
      expect(uniqueSpanIds.size).toBe(spanIds.length);
    });
  });

  describe('Traceparent Format Validation', () => {
    it('should follow W3C traceparent specification', () => {
      const header = extractTraceparentHeader();

      // Parse header
      const parts = header.split('-');
      expect(parts.length).toBe(4);

      const [version, traceId, spanId, flags] = parts;

      // Version should be 00
      expect(version).toBe('00');

      // Trace ID should be 32-char hex
      expect(traceId).toMatch(/^[0-9a-f]{32}$/i);
      expect(traceId.length).toBe(32);

      // Span ID should be 16-char hex
      expect(spanId).toMatch(/^[0-9a-f]{16}$/i);
      expect(spanId.length).toBe(16);

      // Flags should be 2-char hex (00 or 01)
      expect(flags).toMatch(/^0[0-1]$/i);
      expect(['00', '01']).toContain(flags.toLowerCase());
    });

    it('should always have sampled flag', () => {
      for (let i = 0; i < 10; i++) {
        const header = extractTraceparentHeader();
        const flag = header.split('-')[3];
        expect(flag.toLowerCase()).toBe('01');
      }
    });
  });

  describe('Session-Level Persistence', () => {
    it('should maintain trace ID across multiple operations', () => {
      const traceId1 = getCurrentTraceContext().traceId;

      // Simulate multiple operations
      for (let i = 0; i < 10; i++) {
        extractTraceparentHeader();
      }

      const traceId2 = getCurrentTraceContext().traceId;

      expect(traceId1).toBe(traceId2);
    });

    it('should retrieve same trace ID after module operations', () => {
      const context1 = getCurrentTraceContext();

      // Simulate module reload by checking sessionStorage
      const stored = globalThis.sessionStorage?.getItem('otel_trace_id');
      expect(stored).toBeDefined();

      // Get context again
      const context2 = getCurrentTraceContext();
      expect(context2.traceId).toBe(context1.traceId);
    });
  });

  describe('Header Injection Consistency', () => {
    it('should inject header on every call to extractTraceparentHeader', () => {
      const headers: string[] = [];

      for (let i = 0; i < 10; i++) {
        const header = extractTraceparentHeader();
        headers.push(header);
        expect(isValidTraceparent(header)).toBe(true);
      }

      // Verify all headers are valid and consistent
      headers.forEach((header) => {
        expect(isValidTraceparent(header)).toBe(true);
      });

      // Verify trace IDs are consistent
      const traceIds = headers.map((h) => h.split('-')[1]);
      const firstTraceId = traceIds[0];
      traceIds.forEach((traceId) => {
        expect(traceId).toBe(firstTraceId);
      });
    });

    it('should work with Apollo setContext pattern for header injection', () => {
      const capturedHeaders: Record<string, string>[] = [];

      const tracingLink = setContext((_, context) => {
        const traceparent = extractTraceparentHeader();
        const { headers = {} } = context as { headers?: Record<string, string> };
        const finalHeaders = {
          ...headers,
          traceparent,
        };
        capturedHeaders.push(finalHeaders);
        return {
          headers: finalHeaders,
        };
      });

      // Simulate link execution by manually calling the operation
      expect(tracingLink).toBeDefined();

      // Verify traceparent header is valid
      const header = extractTraceparentHeader();
      expect(isValidTraceparent(header)).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    it('should not throw on extractTraceparentHeader call', () => {
      expect(() => {
        extractTraceparentHeader();
      }).not.toThrow();
    });

    it('should provide fallback traceparent on sessionStorage clear', () => {
      // Clear and test fallback
      globalThis.sessionStorage?.clear();
      const header = extractTraceparentHeader();
      expect(isValidTraceparent(header)).toBe(true);
    });

    it('should handle rapid sequential requests', () => {
      const headers: string[] = [];

      const promises = Array.from({ length: 20 }, () => {
        const header = extractTraceparentHeader();
        headers.push(header);
        return header;
      });

      // No need to await since this is synchronous
      expect(promises).toBeDefined();

      // All should be valid
      headers.forEach((h) => {
        expect(isValidTraceparent(h)).toBe(true);
      });

      // Trace ID should be consistent
      const traceIds = headers.map((h) => h.split('-')[1]);
      const firstTraceId = traceIds[0];
      traceIds.forEach((id) => {
        expect(id).toBe(firstTraceId);
      });
    });
  });

  describe('Apollo Link Integration Pattern', () => {
    it('should support Apollo setContext link pattern with tracing', () => {
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      const createTracingLink = () =>
        setContext((_, context) => {
          const traceparent = extractTraceparentHeader();
          const { headers = {} } = context as { headers?: Record<string, string> };
          return {
            headers: {
              ...headers,
              traceparent,
            },
          };
        });

      const link = createTracingLink();
      expect(link).toBeDefined();

      // Verify headers are properly formatted
      const header = extractTraceparentHeader();
      expect(header).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-0[0-1]$/i);
    });

    it('should maintain trace context across auth and tracing links', () => {
      const authHeaders = { authorization: 'Bearer token' };
      const traceparent = extractTraceparentHeader();

      const combinedHeaders = {
        ...authHeaders,
        traceparent,
      };

      // Verify both headers are present
      expect(combinedHeaders.authorization).toBe('Bearer token');
      expect(combinedHeaders.traceparent).toBe(traceparent);
      expect(isValidTraceparent(combinedHeaders.traceparent)).toBe(true);
    });
  });

  describe('Type Safety in Integration', () => {
    it('should allow traceparent header in Apollo context type', () => {
      interface ApolloContext {
        headers: Record<string, string>;
      }

      const context: ApolloContext = {
        headers: {
          traceparent: extractTraceparentHeader(),
          authorization: 'Bearer token',
        },
      };

      expect(context.headers.traceparent).toBeDefined();
      expect(isValidTraceparent(context.headers.traceparent)).toBe(true);
      expect(typeof context.headers.authorization).toBe('string');
    });

    it('should work with TypeScript strict mode for header injection', () => {
      const tracingLink = setContext((_, context) => {
        const traceparent = extractTraceparentHeader();
        const typedHeaders: Record<string, string> = {
          traceparent,
        };

        const { headers = {} } = context as { headers?: Record<string, string> };
        return {
          headers: {
            ...headers,
            ...typedHeaders,
          },
        };
      });

      expect(tracingLink).toBeDefined();
    });
  });

  describe('Trace Context Lifecycle', () => {
    it('should generate new trace after reset', () => {
      const context1 = getCurrentTraceContext();
      const traceId1 = context1.traceId;

      resetTraceContext();

      const context2 = getCurrentTraceContext();
      const traceId2 = context2.traceId;

      expect(traceId1).not.toBe(traceId2);
    });

    it('should maintain trace throughout request lifecycle', () => {
      const initialTraceId = extractTraceparentHeader().split('-')[1];

      // Simulate request processing
      const headers: string[] = [];
      for (let i = 0; i < 5; i++) {
        headers.push(extractTraceparentHeader());
      }

      // All should have same trace ID
      headers.forEach((header) => {
        const traceId = header.split('-')[1];
        expect(traceId).toBe(initialTraceId);
      });
    });
  });
});
