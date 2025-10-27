const { mongoose, Schema } = require('mongoose')
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

AdminNavSchema.plugin(uniqueValidator)

module.exports = mongoose.model('AdminNav', AdminNavSchema)
