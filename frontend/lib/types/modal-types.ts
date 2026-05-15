/**
 * Type definitions for BuildDetailModal and related components
 * Provides centralized type system for modal state, event handlers, and error handling
 */

import type { BuildStatus } from '@/lib/generated/graphql';

/**
 * Build data structure
 */
export interface BuildData {
  id: string;
  name: string;
  description?: string | null;
  status: BuildStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Part data structure
 */
export interface PartData {
  id: string;
  buildId: string;
  name: string;
  sku: string;
  quantity: number;
  status?: string;
  createdAt?: string;
}

/**
 * Test run data structure
 */
export interface TestRunData {
  id: string;
  buildId: string;
  status?: string;
  result?: string | null;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
  fileUrl?: string | null;
}

/**
 * Build history event structure
 */
export interface BuildHistoryEvent {
  id: string;
  buildId: string;
  eventType: string;
  timestamp: Date | string;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Modal state structure
 */
export interface BuildDetailModalState {
  buildId: string;
  build?: BuildData;
  parts: PartData[];
  testRuns: TestRunData[];
  events: BuildHistoryEvent[];
  activeTab: 'overview' | 'parts' | 'testRuns' | 'history';
  loading: boolean;
  error: Error | null;
  isUpdating: boolean;
  selectedPartId?: string;
  selectedTestRunId?: string;
}

/**
 * Event handler types for tab interactions
 */
export interface TabEventHandlers {
  onEditBuild?: (data: Partial<BuildData>) => Promise<void>;
  onEditPart?: (partId: string, data: Partial<PartData>) => Promise<void>;
  onAddPart?: (data: Partial<PartData>) => Promise<void>;
  onDeletePart?: (partId: string) => Promise<void>;
  onRerunTestRun?: (testRunId: string) => Promise<void>;
  onAddTestRun?: (data: Partial<TestRunData>) => Promise<void>;
  onDrillDownPart?: (partId: string) => void;
  onDrillDownTestRun?: (testRunId: string) => void;
}

/**
 * Props for tab components
 */
export interface TabComponentProps {
  data?: BuildData | PartData[] | TestRunData[] | BuildHistoryEvent[];
  isLoading?: boolean;
  error?: Error | null;
  onEdit?: (data: unknown) => Promise<void>;
  onAdd?: (data: unknown) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onDrillDown?: (id: string) => void;
  onAction?: (actionName: string, payload: unknown) => Promise<void>;
}

/**
 * Error boundary error info
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

/**
 * SSE event structure
 */
export interface SSEEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

/**
 * Real-time event types
 */
export type RealTimeEventType =
  | 'buildStatusChanged'
  | 'partAdded'
  | 'partUpdated'
  | 'partDeleted'
  | 'testRunSubmitted'
  | 'testRunCompleted'
  | 'buildUpdated';

/**
 * Real-time event handler
 */
export type RealTimeEventHandler = (event: SSEEvent) => void;
