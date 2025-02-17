const { formatInTimeZone } = require('date-fns-tz')
const { mongoose, Schema } = require('mongoose')
// const { softDeletePlugin } = require('soft-delete-plugin-mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const UserSchema = new Schema(
    {
        first_name: {
            type: String,
            required: true,
        },
        last_name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
        },
        mobile: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        new_user: {
            type: Boolean,
            default: true, //TODO:: This value should be false when user is submitting first order
        },
        avatar: {
            type: String,
        },
        email_verified: {
            type: Boolean,
            default: false,
        },
        mobile_verified: {
            type: Boolean,
            default: false,
        },
        failed_attempt: {
            login: {
                type: Number,
                default: 0,
            },
            otp: {
                type: Number,
                default: 0,
            },
        },
        security_freezed_at: {
            type: Date,
        },
        otp_freez_until: {
            type: Date,
        },
        social_auth: {
            type: Boolean,
            default: false,
        },
        consent_marketing: {
            type: Boolean,
            default: false,
        },
        social_auth_key: {
            type: String,
        },
        log: {
            last_login: {
                brand: String,
                country: String,
                lang: String,
                ip: String,
                user_agent: {},
            },
            signup: {
                brand: String,
                country: String,
                lang: String,
                ip: String,
                user_agent: {},
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

// UserSchema.plugin(softDeletePlugin)
UserSchema.plugin(mongoosePaginate)

UserSchema.virtual('full_name').get(function () {
    return `${this.first_name} ${this.last_name}`
})

UserSchema.virtual('date_created').get(function () {
    return formatInTimeZone(
        this.created_at,
        'Asia/Dubai',
        'dd/MM/yyyy HH:mm:ss'
    )
})

UserSchema.virtual('date_updated').get(function () {
    return formatInTimeZone(
        this.updated_at,
        'Asia/Dubai',
        'dd/MM/yyyy HH:mm:ss'
    )
})

module.exports = mongoose.model('User', UserSchema)
