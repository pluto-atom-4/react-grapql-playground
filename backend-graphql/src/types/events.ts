/**
 * Event Type Definitions for Issue #7: Cross-Layer Event Bus (GraphQL ↔ Express ↔ Frontend)
 *
 * This imports event types from backend-express (single source of truth)
 * and re-exports them for use in GraphQL resolvers.
 *
 * All events include:
 * - eventId: UUID for deduplication across three layers
 * - eventType: Machine-readable event name
 * - timestamp: Unix milliseconds for ordering
 * - sourceLayer: Where the event originated
 * - userId: Optional user context
 * - metadata: Optional additional context
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Event type constants - use these to prevent typos and ensure consistency
 * All events must use one of these eventType values
 */
export const EVENT_TYPES = {
  BUILD_CREATED: 'buildCreated',
  BUILD_STATUS_CHANGED: 'buildStatusChanged',
  PART_ADDED: 'partAdded',
  PART_REMOVED: 'partRemoved',
  TEST_RUN_SUBMITTED: 'testRunSubmitted',
  TEST_RUN_UPDATED: 'testRunUpdated',
  FILE_UPLOADED: 'fileUploaded',
  WEBHOOK: 'webhook',
  CI_RESULTS: 'ciResults',
  SENSOR_DATA: 'sensorData',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

/**
 * Base event structure wrapping all events
 * Contains metadata common to all events for routing, deduplication, and ordering
 */
export interface EventEnvelope {
  /**
   * Unique event identifier (UUID v4)
   * Used for deduplication across three layers (GraphQL → Express → Frontend)
   */
  eventId: string;

  /**
   * Machine-readable event type name
   * Examples: 'buildCreated', 'buildStatusChanged', 'partAdded', 'fileUploaded'
   */
  eventType: string;

  /**
   * Unix milliseconds timestamp for event ordering and TTL-based deduplication
   * Generated at source layer (GraphQL or Express webhook handler)
   */
  timestamp: number;

  /**
   * Source layer that emitted the event
   * - 'graphql': Event from GraphQL resolver (Build, Part, TestRun mutations)
   * - 'express': Event from Express route handler (file uploads, webhooks)
   * - 'webhook': Event from external system (CI/CD, sensors)
   */
  sourceLayer: 'graphql' | 'express' | 'webhook';

  /**
   * Optional user context (JWT sub, employee ID)
   * Used for audit trail and permission checks
   */
  userId?: string;

  /**
   * Optional metadata for filtering and context
   * Example: { buildType: 'production', correlationId: 'req-123' }
   */
  metadata?: Record<string, unknown>;
}

/**
 * Payload: Build Created
 * Emitted when a new Build is created via createBuild mutation
 */
export interface BuildCreatedPayload extends EventEnvelope {
  /**
   * The ID of the newly created Build
   */
  buildId: string;

  /**
   * Full Build object snapshot at creation
   */
  build: {
    id: string;
    name: string;
    description?: string;
    status: string; // 'PENDING'
    createdAt: string;
  };
}

/**
 * Payload: Build Status Changed
 * Emitted when Build status changes (PENDING → RUNNING → COMPLETE/FAILED)
 */
export interface BuildStatusChangedPayload extends EventEnvelope {
  /**
   * The ID of the Build that changed
   */
  buildId: string;

  /**
   * Previous status value
   */
  oldStatus: string;

  /**
   * New status value
   */
  newStatus: string;

  /**
   * Full Build object snapshot after status change
   */
  build: {
    id: string;
    status: string;
    updatedAt: string;
  };
}

/**
 * Payload: Part Added to Build
 * Emitted when a Part is added via addPart mutation
 */
export interface PartAddedPayload extends EventEnvelope {
  /**
   * The Build ID this part belongs to
   */
  buildId: string;

  /**
   * The newly created Part ID
   */
  partId: string;

  /**
   * Full Part object snapshot
   */
  part: {
    id: string;
    buildId: string;
    name: string;
    sku: string;
    quantity: number;
    createdAt: string;
  };
}

/**
 * Payload: Part Removed from Build
 * Emitted when a Part is removed (if removePart mutation exists)
 */
export interface PartRemovedPayload extends EventEnvelope {
  /**
   * The Build ID from which part was removed
   */
  buildId: string;

  /**
   * The Part ID that was removed
   */
  partId: string;

  /**
   * Part data before removal (for audit trail)
   */
  part: {
    id: string;
    name: string;
    sku: string;
  };
}

/**
 * Payload: Test Run Submitted
 * Emitted when a TestRun is created via submitTestRun mutation
 */
export interface TestRunSubmittedPayload extends EventEnvelope {
  /**
   * The Build ID this test run belongs to
   */
  buildId: string;

  /**
   * The newly created TestRun ID
   */
  testRunId: string;

  /**
   * Full TestRun object snapshot
   */
  testRun: {
    id: string;
    buildId: string;
    status: string;
    result?: string;
    fileUrl?: string;
    completedAt?: string;
    createdAt: string;
  };
}

/**
 * Payload: Test Run Updated
 * Emitted when a TestRun status or results change
 */
export interface TestRunUpdatedPayload extends EventEnvelope {
  /**
   * The Build ID this test run belongs to
   */
  buildId: string;

  /**
   * The TestRun ID that was updated
   */
  testRunId: string;

  /**
   * Previous test status
   */
  oldStatus: string;

  /**
   * New test status
   */
  newStatus: string;

  /**
   * Full TestRun object snapshot after update
   */
  testRun: {
    id: string;
    status: string;
    result?: string;
    updatedAt: string;
  };
}

/**
 * Payload: File Uploaded
 * Emitted when a file is uploaded via Express POST /upload endpoint
 */
export interface FileUploadedPayload extends EventEnvelope {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  buildId?: string;
  mimeType?: string;
  uploadedAt: string;
}

/**
 * Payload: Webhook Event (Generic)
 * Generic envelope for external webhooks
 */
export interface WebhookEventPayload extends EventEnvelope {
  webhookType: string;
  payload: Record<string, unknown>;
  buildId?: string;
  statusCode?: number;
}

/**
 * Payload: CI/CD Test Results
 * Specialized webhook for CI/CD systems reporting test results
 */
export interface CIResultsPayload extends EventEnvelope {
  buildId: string;
  ciJobId: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'CANCELLED';
  results: {
    passed: number;
    failed: number;
    skipped?: number;
  };
  ciJobUrl?: string;
  revision?: string;
  completedAt: string;
}

/**
 * Payload: Sensor Data
 * Event from manufacturing floor sensors
 */
export interface SensorDataPayload extends EventEnvelope {
  buildId: string;
  sensorId: string;
  sensorType: string;
  reading: unknown;
  unit?: string;
  sensorTimestamp: string;
}

/**
 * Union type of all possible event payloads
 * Use this for type narrowing when processing events
 */
export type EventPayload =
  | BuildCreatedPayload
  | BuildStatusChangedPayload
  | PartAddedPayload
  | PartRemovedPayload
  | TestRunSubmittedPayload
  | TestRunUpdatedPayload
  | FileUploadedPayload
  | WebhookEventPayload
  | CIResultsPayload
  | SensorDataPayload;

/**
 * Type guard to check if an event is of a specific type
 * Usage: if (isBuildCreatedEvent(event)) { event.build; }
 */
export function isBuildCreatedEvent(event: EventPayload): event is BuildCreatedPayload {
  return event.eventType === 'buildCreated';
}

export function isBuildStatusChangedEvent(
  event: EventPayload
): event is BuildStatusChangedPayload {
  return event.eventType === 'buildStatusChanged';
}

export function isPartAddedEvent(event: EventPayload): event is PartAddedPayload {
  return event.eventType === 'partAdded';
}

export function isPartRemovedEvent(event: EventPayload): event is PartRemovedPayload {
  return event.eventType === 'partRemoved';
}

export function isTestRunSubmittedEvent(event: EventPayload): event is TestRunSubmittedPayload {
  return event.eventType === 'testRunSubmitted';
}

export function isTestRunUpdatedEvent(event: EventPayload): event is TestRunUpdatedPayload {
  return event.eventType === 'testRunUpdated';
}

export function isFileUploadedEvent(event: EventPayload): event is FileUploadedPayload {
  return event.eventType === 'fileUploaded';
}

export function isWebhookEvent(event: EventPayload): event is WebhookEventPayload {
  return event.eventType === 'webhook';
}

export function isCIResultsEvent(event: EventPayload): event is CIResultsPayload {
  return event.eventType === 'ciResults';
}

export function isSensorDataEvent(event: EventPayload): event is SensorDataPayload {
  return event.eventType === 'sensorData';
}

/**
 * Function signature for event emitters
 * Used to type the emitEvent() function in GraphQL and Express
 */
export type EventEmitterFunction = (
  eventType: string,
  payload: Omit<EventPayload, keyof EventEnvelope>,
  options?: {
    userId?: string;
    metadata?: Record<string, unknown>;
    sourceLayer?: 'graphql' | 'express' | 'webhook';
  }
) => Promise<void>;

/**
 * Helper function to create an EventEnvelope with defaults
 * Ensures consistency across all event emissions
 * Always generates a UUID for eventId
 */
export function createEventEnvelope(
  eventType: string,
  sourceLayer: 'graphql' | 'express' | 'webhook' = 'graphql',
  userId?: string,
  metadata?: Record<string, unknown>
): EventEnvelope {
  return {
    eventId: uuidv4(),
    eventType,
    timestamp: Date.now(),
    sourceLayer,
    userId,
    metadata,
  };
}
