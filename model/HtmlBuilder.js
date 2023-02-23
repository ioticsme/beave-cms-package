const { mongoose, Schema } = require('mongoose')
// const { softDeletePlugin } = require('soft-delete-plugin-mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const Brand = require('./Brand')
const Country = require('./Country')

const HtmlBuilderSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
        },
        content: {
            html: {
                type: String,
            },
            css: {
                type: String,
            },
        },
        brand: {
            brand: {
                type: Schema.ObjectId,
                ref: Brand,
            },
            country: {
                type: Schema.ObjectId,
                ref: Country,
            },
        },
        active: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
)

// AdminSchema.plugin(softDeletePlugin)
HtmlBuilderSchema.plugin(uniqueValidator)

module.exports = mongoose.model('beave_HtmlBuilder', HtmlBuilderSchema)
