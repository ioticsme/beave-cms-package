const { gql } = require('apollo-server-express')
const { GraphQLJSON } = require('graphql-type-json')
const ContentType = require('../model/ContentType') // Adjust the path based on your project structure
const Content = require('../model/Content') // Adjust the path based on your project structure
const Admin = require('../model/Admin') // Assuming Author is a separate model
const { getContentListFromDB, getContentSingleFromDB } = require('./data-fetch')

// Define your GraphQL types and queries
const typeDefs = gql`
    scalar JSON
    input ContentTypeInput {
        type_slug: String
    }

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
        contents(where: ContentTypeInput): [Content!]
        content(id: ID!): Content
        admins: [Admin]
    }
`

// Define resolvers to handle the queries
const resolvers = {
    JSON: GraphQLJSON, // Add JSON scalar resolver
    Query: {
        // Adding a `where` filter to the contents query
        contents: async (_, { where }) => {
            // Build the filter object based on the `where` input
            const filter = {}

            if (where?.type_slug) {
                filter.type_slug = where.type_slug
            }
            // Query the database using the filter
            return await getContentListFromDB(filter)
        },

        // Single content by ID
        content: async (_, { id }) => {
            return await getContentSingleFromDB(id)
        },

        // Fetching all admins
        admins: async () => {
            return await Admin.find()
        },
    },
}

module.exports = { typeDefs, resolvers }
