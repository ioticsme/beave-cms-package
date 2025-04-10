const { typeDefs, resolvers } = require('../graphql/graphQLschema')
const { ApolloServer } = require('apollo-server-express')
const apolloServer = new ApolloServer({ typeDefs, resolvers })

module.exports = (app) => {
    // apolloServer.applyMiddleware({ app })
    // Start the Apollo server
    ;(async () => {
        await apolloServer.start() // Make sure to start the server
        // Apply Apollo middleware to the Express app
        apolloServer.applyMiddleware({ app })
    })()
}
