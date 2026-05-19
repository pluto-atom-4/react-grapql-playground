import { BasicTracerProvider } from '@opentelemetry/sdk-trace-web';
import { trace, type Tracer } from '@opentelemetry/api';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';

// Enable access to global crypto object (Web Crypto API)
declare const crypto: Crypto;

/**
 * W3C Traceparent Header Format
 * Format: 00-trace-id-parent-id-trace-flags
 * - 00: Version (always 00 for W3C Trace Context v1)
 * - trace-id: 64-character hex string (32-byte value in hex)
 * - parent-id: 16-character hex string (8-byte value in hex)
 * - trace-flags: 2-character hex (00 = not sampled, 01 = sampled)
 *
 * Example: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
 */

interface W3CTraceparentContext {
  traceId: string;
  spanId: string;
  flags: string;
  traceparent: string;
}

interface TraceContextOptions {
  serviceName?: string;
}

/**
 * Initialize the OpenTelemetry tracer and set up instrumentation
 * This should be called once at application startup
 */
function initializeTracer(options: TraceContextOptions = {}): Tracer {
  const { serviceName = 'frontend' } = options;

  // Create a tracer provider
  const tracerProvider = new BasicTracerProvider();

  // Set the global tracer provider
  trace.setGlobalTracerProvider(tracerProvider);

  // Instrument fetch requests to automatically add traceparent headers
  const fetchInstrumentation = new FetchInstrumentation();
  fetchInstrumentation.enable();

  // Return a tracer instance
  return trace.getTracer(serviceName);
}

/**
 * Generate a W3C-compliant trace ID (64-character hex string)
 * Using crypto.getRandomValues for cryptographically secure randomness
 */
function generateTraceId(): string {
  const buffer = new Uint8Array(16); // 16 bytes = 128 bits = 32 hex chars for trace ID
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 32);
}

/**
 * Generate a W3C-compliant span ID (16-character hex string)
 * Using crypto.getRandomValues for cryptographically secure randomness
 */
function generateSpanId(): string {
  const buffer = new Uint8Array(8); // 8 bytes = 64 bits = 16 hex chars
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validate W3C traceparent header format
 * Pattern: 00-{32-char-hex}-{16-char-hex}-{2-char-hex}
 * Flags must be 00 (not sampled) or 01 (sampled)
 * @param traceparent - The traceparent header value
 * @returns true if valid, false otherwise
 */
function isValidTraceparent(traceparent: string): boolean {
  const pattern = /^00-[0-9a-f]{32}-[0-9a-f]{16}-0[0-1]$/i;
  return pattern.test(traceparent);
}

/**
 * Extract or create W3C traceparent context
 * This function ensures a consistent trace ID across a session
 */
function getOrCreateTraceparentContext(): W3CTraceparentContext {
  // Try to get existing trace ID from session storage
  const existingTraceparent = globalThis.sessionStorage?.getItem('otel_trace_id');

  let traceId: string;
  if (existingTraceparent && isValidTraceparent(existingTraceparent)) {
    // Parse existing traceparent to extract trace ID
    const parts = existingTraceparent.split('-');
    traceId = parts[1].toLowerCase();
  } else {
    // Generate new trace ID
    traceId = generateTraceId();
  }

  // Generate new span ID for this request
  const spanId = generateSpanId();
  const flags = '01'; // Always sampled in this phase

  const traceparent = `00-${traceId}-${spanId}-${flags}`;

  // Store the traceparent for future requests
  globalThis.sessionStorage?.setItem('otel_trace_id', traceparent);

  return { traceId, spanId, flags, traceparent };
}

/**
 * Extract traceparent header from OpenTelemetry context
 * Falls back to generated context if none exists
 */
function extractTraceparentHeader(): string {
  const span = trace.getActiveSpan();

  if (span) {
    const spanContext = span.spanContext();
    if (spanContext.traceId && spanContext.spanId) {
      const traceparent = `00-${spanContext.traceId}-${spanContext.spanId}-${spanContext.traceFlags === undefined ? '01' : spanContext.traceFlags.toString(16).padStart(2, '0')}`;
      if (isValidTraceparent(traceparent)) {
        return traceparent;
      }
    }
  }

  // Fallback: generate or retrieve from session
  const contextData = getOrCreateTraceparentContext();
  return contextData.traceparent;
}

/**
 * Get the current trace context with persistence
 * Same trace ID across multiple requests in a session
 */
function getCurrentTraceContext(): W3CTraceparentContext {
  return getOrCreateTraceparentContext();
}

/**
 * Reset trace context (useful for testing or starting a new session)
 */
function resetTraceContext(): void {
  globalThis.sessionStorage?.removeItem('otel_trace_id');
}

// Initialize tracer on module load
let tracerInstance: Tracer | null = null;

/**
 * Get the global tracer instance (lazy-initialized)
 */
function getTracer(): Tracer {
  if (!tracerInstance) {
    tracerInstance = initializeTracer({ serviceName: 'frontend' });
  }
  return tracerInstance;
}

export {
  extractTraceparentHeader,
  getCurrentTraceContext,
  getTracer,
  getOrCreateTraceparentContext,
  generateTraceId,
  generateSpanId,
  isValidTraceparent,
  initializeTracer,
  resetTraceContext,
  type W3CTraceparentContext,
  type TraceContextOptions,
};
