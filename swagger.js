const swaggerUi = require('swagger-ui-express')
const swaggerJsdoc = require('swagger-jsdoc')

// Define options for Swagger
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Beave CMS API with Swagger',
            version: '0.1.0',
            description:
                'This is a simple CRUD API application made with Express and documented with Swagger',
            // license: {
            //     name: 'MIT',
            //     url: 'https://spdx.org/licenses/MIT.html',
            // },
            // contact: {
            //     name: 'LogRocket',
            //     url: 'https://logrocket.com',
            //     email: 'info@email.com',
            // },
        },
        servers: [
            {
                url: 'http://localhost:8081',
            },
        ],
    },
    apis: ['./routes/api/*.js'],
}

const specs = swaggerJsdoc(options)
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

// Export a function that sets up Swagger middleware
module.exports = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))
}
