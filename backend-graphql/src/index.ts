import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
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

    // Initialize Express app
    const app = express();

    // Configure CORS middleware BEFORE Apollo middleware
    // This ensures CORS headers are set correctly for credentials
    app.use(
      cors({
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );

    // Parse JSON bodies
    app.use(express.json());

    // Start Apollo Server
    await server.start();

    // Mount Apollo GraphQL middleware
    app.use(
      '/graphql',
      expressMiddleware(server, {
        context: async ({ req }) => {
          // Extract user from JWT token, handling errors gracefully
          let user = null;
          try {
            user = extractUserFromToken(req.headers.authorization as string);
          } catch (error) {
            console.error(
              'Failed to extract user from token:',
              error instanceof Error ? error.message : error
            );
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
      })
    );

    // Health check endpoint
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', service: 'graphql', port: PORT });
    });

    // Start listening
    const listener = app.listen(PORT, () => {
      console.warn(`
╔════════════════════════════════════════╗
║   🚀 Apollo GraphQL Server Running    ║
╠════════════════════════════════════════╣
║ Server: http://localhost:${PORT}
║ GraphQL: http://localhost:${PORT}/graphql
║ Port: ${PORT}
║ Database: ${process.env.DATABASE_URL?.split('@')[1] || 'postgresql://...'}
╚════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      listener.close();
      await server.stop();
      await prisma.$disconnect();
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

main();
