const { mongoose, Schema } = require('mongoose')

const ConfigSchema = new mongoose.Schema(
    {
        general: {
            client_name: {
                type: String,
                // required: true,
            },
            frontend_url: {
                type: String,
                // required: true,
            },
            user_email_verification: {
                type: Boolean,
                default: false,
            },
        },
        media_drive: {
            local_upload: {
                type: Boolean,
                default: false,
            },
            imagekit: {
                public_key: String,
                private_key: String,
                url: String,
                folder: String,
                default: Boolean,
                active: Boolean,
            },
            cloudinary: {
                api_key: String,
                api_secret: String,
                cloud_name: String,
                folder: String,
                default: Boolean,
                active: Boolean,
            },
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
)

module.exports = mongoose.model('beave_Config', ConfigSchema)
