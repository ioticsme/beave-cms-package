const { gql } = require('apollo-server-express')
const { GraphQLJSON } = require('graphql-type-json')
const ContentType = require('../model/ContentType') // Adjust the path based on your project structure
const Content = require('../model/Content') // Adjust the path based on your project structure
const Admin = require('../model/Admin') // Assuming Author is a separate model
const { getContentListFromDB, getContentSingleFromDB } = require('./data-fetch')

// Define your GraphQL types and queries
const typeDefs = gql`
    scalar JSON
    type Admin {
        id: ID!
        name: String!
        email: String
        role: String
        active: String
    }

    type Content {
        id: ID!
        title: String!
        type_slug: String
        author: Admin
        content: JSON
        createdAt: String
        updatedAt: String
    }

    type Query {
        contents: [Content]
        content(id: ID!): Content
        admins: [Admin]
    }
`

// Define resolvers to handle the queries
const resolvers = {
    JSON: GraphQLJSON, // Add JSON scalar resolver
    Query: {
        contents: async () => {
            return await getContentListFromDB()
        },
        content: async (_, { id }) => {
            return await getContentSingleFromDB(id)
        },
        admins: async () => {
            return await Admin.find()
        },
    },
}

module.exports = { typeDefs, resolvers }
