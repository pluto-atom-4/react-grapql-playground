import DataLoader from 'dataloader';
import { PrismaClient } from '@prisma/client';
import type { AuthUser } from './middleware/auth';

/**
 * Part type returned from DataLoader
 */
export interface PartData {
  id: string;
  buildId: string;
  name: string;
  sku: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * TestRun type returned from DataLoader
 */
export interface TestRunData {
  id: string;
  buildId: string;
  status: string;
  result?: string | null;
  fileUrl?: string | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GraphQL resolver context with data loaders, database client, and authenticated user.
 * User is extracted from JWT token in context factory; null if no valid token.
 * Exported as both names for compatibility with existing imports
 */
export interface BuildContext {
  user: AuthUser | null;
  prisma: PrismaClient;
  buildPartLoader: DataLoader<string, PartData[]>;
  buildTestRunLoader: DataLoader<string, TestRunData[]>;
}

// Alias for backward compatibility
export type GraphQLContext = BuildContext;

/**
 * Type for resolver parent object (Build)
 */
export interface BuildParent {
  id: string;
  name: string;
  status: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Type for mutation arguments with pagination
 */
export interface PaginationArgs {
  limit: number;
  offset: number;
}
