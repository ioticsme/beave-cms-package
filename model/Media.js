const { mongoose } = require('mongoose')

const MediaSchema = new mongoose.Schema(
    {
        drive: {
            type: String,
            required: true,
            enum: ['local', 'imagekit', 'cloudinary'],
        },
        url: {
            type: String,
            required: true,
        },
        meta: {
            title: String,
            alt_text: String,
            local_drive: Boolean,
        },
        response: {
            type: Object,
        },
        file: {
            type: Object,
        },
        file_type: {
            type: String,
            required: true,
            default: 'image',
            enum: ['pdf', 'image'],
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
)

module.exports = mongoose.model('Media', MediaSchema)
