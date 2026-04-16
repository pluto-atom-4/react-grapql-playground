import { ApolloServer } from '@apollo/server'

const typeDefs = `
  type Query {
    hello: String
  }
`

const resolvers = {
  Query: {
    hello: () => 'Hello world!'
  }
}

void new ApolloServer({ typeDefs, resolvers })
const PORT = process.env.GRAPHQL_PORT || 4000
console.log(`GraphQL server configured for port ${PORT}`)
