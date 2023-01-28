const { mongoose, Schema } = require('mongoose')
// const { softDeletePlugin } = require('soft-delete-plugin-mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const AdminNavSchema = new mongoose.Schema(
    {
        section: {
            type: String,
            required: true,
            unique: true,
        },
        position: {
            type: Number,
            default: 0,
        },
        items: [
            {
                label: {
                    type: String,
                },
                expandable: Boolean,
                icon: String,
                position: Number,
                path: String,
                child: [
                    {
                        label: {
                            type: String,
                        },
                        path: String,
                    },
                ],
            },
        ],
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
)

// AdminSchema.plugin(softDeletePlugin)
AdminNavSchema.plugin(uniqueValidator)

module.exports = mongoose.model('beave_AdminNav', AdminNavSchema)
