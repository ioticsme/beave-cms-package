const { mongoose } = require('mongoose')

const MediaSchema = new mongoose.Schema(
    {
        drive: {
            type: String,
            required: true,
            default: 'imagekit',
            enum: ['embed', 'imagekit', 'cloudinary'],
        },
        url: {
            type: String,
            required: true,
        },
        meta: {
            title: String,
            alt_text: String,
        },
        response: {
            type: Object,
        },
        file: {
            type: Object,
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
)

module.exports = mongoose.model('beave_Media', MediaSchema)
