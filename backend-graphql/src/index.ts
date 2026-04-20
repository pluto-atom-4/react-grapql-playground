import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { prisma } from './db/client';
import { createLoaders } from './dataloaders';
import type { BuildContext } from './types';
import { queryResolver } from './resolvers/Query';
import { mutationResolver } from './resolvers/Mutation';
import { buildResolver } from './resolvers/Build';
import { extractUserFromToken } from './middleware/auth';

const PORT = parseInt(process.env.GRAPHQL_PORT || '4000', 10);

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read GraphQL schema SDL
const schemaPath = path.join(__dirname, 'schema.graphql');
const typeDefs = fs.readFileSync(schemaPath, 'utf-8');

// Combine all resolvers
const resolvers = [queryResolver, mutationResolver, buildResolver];

// Initialize Apollo Server
const server = new ApolloServer<BuildContext>({
  typeDefs,
  resolvers,
});

// Start server
async function main() {
  try {
    // Verify database connection
    await prisma.$queryRaw`SELECT 1`;
    console.warn('✅ Database connection verified');

    // Start Apollo Server
    const { url } = await startStandaloneServer(server, {
      listen: { port: PORT },
      context: async ({ req }) => {
        // Extract user from JWT token, handling errors gracefully
        let user = null;
        try {
          user = extractUserFromToken(req.headers.authorization);
        } catch (error) {
          console.error('Failed to extract user from token:', error instanceof Error ? error.message : error);
          // Continue with null user; protected resolvers will reject the request
        }

        const loaders = createLoaders(prisma);

        return {
          user,
          prisma,
          buildPartLoader: loaders.buildPartLoader,
          buildTestRunLoader: loaders.buildTestRunLoader,
        };
      },
    });

    console.warn(`
╔════════════════════════════════════════╗
║   🚀 Apollo GraphQL Server Running    ║
╠════════════════════════════════════════╣
║ Server: ${url}
║ GraphQL: ${url}
║ Port: ${PORT}
║ Database: ${process.env.DATABASE_URL?.split('@')[1] || 'postgresql://...'}
╚════════════════════════════════════════╝
    `);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

main();
