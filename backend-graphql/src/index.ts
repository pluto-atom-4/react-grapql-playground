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
console.log('GraphQL server defined')
