import fs from 'fs'
import path from 'path'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { prisma } from './db/client'
import { createLoaders, BuildContext } from './dataloaders'
import { queryResolver } from './resolvers/Query'
import { mutationResolver } from './resolvers/Mutation'
import { buildResolver } from './resolvers/Build'

const PORT = parseInt(process.env.GRAPHQL_PORT || '4000', 10)

// Read GraphQL schema SDL
const schemaPath = path.join(__dirname, 'schema.graphql')
const typeDefs = fs.readFileSync(schemaPath, 'utf-8')

// Combine all resolvers
const resolvers = [queryResolver, mutationResolver, buildResolver]

// Initialize Apollo Server
const server = new ApolloServer<BuildContext>({
  typeDefs,
  resolvers,
})

// Start server
async function main() {
  try {
    // Verify database connection
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ Database connection verified')

    // Start Apollo Server
    const { url } = await startStandaloneServer(server, {
      listen: { port: PORT },
      context: async () => ({
        prisma,
        ...createLoaders(prisma),
      }),
    })

    console.log(`
╔════════════════════════════════════════╗
║   🚀 Apollo GraphQL Server Running    ║
╠════════════════════════════════════════╣
║ Server: ${url}
║ GraphQL: ${url}
║ Port: ${PORT}
║ Database: ${process.env.DATABASE_URL?.split('@')[1] || 'postgresql://...'}
╚════════════════════════════════════════╝
    `)
  } catch (err) {
    console.error('❌ Failed to start server:', err)
    process.exit(1)
  }
}

main()
