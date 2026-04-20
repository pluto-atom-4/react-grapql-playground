import DataLoader from 'dataloader';
import { PrismaClient, Part, TestRun } from '@prisma/client';
import type { AuthUser } from './middleware/auth';

/**
 * GraphQL resolver context with data loaders, database client, and authenticated user.
 * User is extracted from JWT token in context factory; null if no valid token.
 * Exported as both names for compatibility with existing imports
 */
export interface BuildContext {
  user: AuthUser | null;
  prisma: PrismaClient;
  buildPartLoader: DataLoader<string, Part[]>;
  buildTestRunLoader: DataLoader<string, TestRun[]>;
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
