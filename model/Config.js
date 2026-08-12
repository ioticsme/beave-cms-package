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
            default_drive: {
                type: String,
                default: 'local',
                enum: ['local', 'imagekit', 'cloudinary', 'azure_blob', 's3'],
            },
            imagekit: {
                public_key: String,
                private_key: String,
                url: String,
                folder: String,
                active: Boolean,
            },
            cloudinary: {
                api_key: String,
                api_secret: String,
                cloud_name: String,
                folder: String,
                active: Boolean,
            },
            azure_blob: {
                connection_string: String,
                container_name: String,
                folder: String,
                cdn_url: String,
                active: Boolean,
            },
            s3: {
                access_key_id: String,
                secret_access_key: String,
                bucket_name: String,
                region: String,
                folder: String,
                cdn_url: String,
                active: Boolean,
            },
        },
        email_settings: {
            default_channel: {
                type: String,
                default: 'local',
                enum: ['none', 'local', 'mailgun', 'sendgrid'],
            },
            local: {
                from: String,
                host: String,
                port: Number,
                secure: Boolean,
                auth_user: String,
                auth_password: String,
            },
            mailgun: {
                from: String,
                domain: String,
                api_key: String,
            },
            sendgrid: {
                from: String,
                domain: String,
                api_key: String,
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

module.exports = mongoose.model('Config', ConfigSchema)
