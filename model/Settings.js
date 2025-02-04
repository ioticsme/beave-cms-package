const { formatInTimeZone } = require('date-fns-tz')
const { mongoose, Schema } = require('mongoose')
const Double = require('@mongoosejs/double');
const Brand = require('./Brand')
const Country = require('./Country')
const Admin = require('./Admin')

const SettingsSchema = new mongoose.Schema(
    {
        brand: {
            type: Schema.ObjectId,
            ref: Brand,
        },
        country: {
            type: Schema.ObjectId,
            ref: Country,
        },
        notification_settings: {
            mailgun: {
                from: {
                    type: String,
                    default: '',
                },
                domain: {
                    type: String,
                    default: '',
                },
                api_key: {
                    type: String,
                    default: '',
                },
                otp_template: {
                    type: String,
                    default: '',
                },
                forgot_password_template: {
                    type: String,
                    default: '',
                },
                forgot_password_thankyou_template: {
                    type: String,
                    default: '',
                },
                order_complete_template: {
                    type: String,
                    default: '',
                },
                welcome_template: {
                    type: String,
                    default: '',
                },
            },
            sms: {
                sender_id: {
                    type: String,
                    default: '',
                },
                username: {
                    type: String,
                    default: '',
                },
                password: {
                    type: String,
                    default: '',
                },
            },
            communication_channels: {
                email: String,
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

SettingsSchema.virtual('date_updated').get(() => {
    return formatInTimeZone(
        this.updated_at,
        'Asia/Dubai',
        'dd/MM/yyyy HH:mm:ss'
    )
})

module.exports = mongoose.model('Settings', SettingsSchema)
