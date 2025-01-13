const { formatInTimeZone } = require('date-fns-tz')
const { mongoose, Schema } = require('mongoose')
const { softDeletePlugin } = require('soft-delete-plugin-mongoose')
const Brand = require('../model/Brand')

const CustomFormSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
        },
        form_name: {
            type: Object,
            required: true,
        },
        description: {
            type: Object,
        },
        cta_label: {
            type: Object,
            required: true,
        },
        auto_reply_email_template: String,
        auto_reply_email_subject: String,
        store_in_db: {
            type: Boolean,
            default: false,
        },
        recipient_emails: String,
        recipient_email_template: String,
        recipient_email_subject: String,
        slack_url: String,
        web_hook: String,
        form_load_mode: {
            type: String,
            enum: ['inline', 'modal'],
            default: 'inline',
        },
        fields: [
            {
                field_label: {
                    type: Object,
                    required: true,
                },
                field_name: {
                    type: String,
                    required: true,
                },
                field_type: {
                    type: String,
                },
                content_type: {
                    type: Schema.ObjectId,
                    ref: 'ContentType',
                    default: null,
                },
                field_default_val: {
                    type: Object,
                },
                field_values: {
                    type: Object,
                },
                field_show_in_list: {
                    type: Boolean,
                    default: false,
                },
                use_for_notification: {
                    type: Boolean,
                    default: false,
                },
                position: {
                    type: Number,
                    default: 0,
                },
                validation: {
                    required: {
                        type: String,
                        default: 'required',
                    },
                    data_type: {
                        type: String,
                        default: 'string',
                    },
                    min_length: {
                        type: Number,
                        default: 0,
                    },
                    max_length: {
                        type: Number,
                        default: 100,
                    },
                },
            },
        ],
        tnc: {
            type: Object,
        },
        is_captcha_required: {
            type: Boolean,
            default: false,
        },
        published: {
            type: Boolean,
            default: true,
        },
        brand: {
            type: Schema.ObjectId,
            ref: 'Brand',
            required: true,
        },
        country: {
            type: Schema.ObjectId,
            ref: 'Country',
            required: true,
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
)

CustomFormSchema.plugin(softDeletePlugin)

CustomFormSchema.virtual('date_booked').get(function () {
    return formatInTimeZone(
        this.date ? this.date : new Date(),
        'Asia/Dubai',
        'dd/MM/yyyy'
    )
})
CustomFormSchema.virtual('date_created').get(function () {
    return formatInTimeZone(
        this.created_at,
        'Asia/Dubai',
        'dd/MM/yyyy HH:mm:ss'
    )
})

CustomFormSchema.virtual('date_updated').get(function () {
    return formatInTimeZone(
        this.updated_at,
        'Asia/Dubai',
        'dd/MM/yyyy HH:mm:ss'
    )
})

module.exports = mongoose.model('CustomForm', CustomFormSchema)
