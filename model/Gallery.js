const { mongoose, Schema } = require('mongoose')
const { formatInTimeZone } = require('date-fns-tz')
const { softDeletePlugin } = require('soft-delete-plugin-mongoose')
const uniqueValidator = require('mongoose-unique-validator');

const GallerySchema = new mongoose.Schema(
    {
        slug: {
            type: String,
            required: true,
            unique: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: Object,
            required: true,
        },
        in_home: {
            type: Boolean,
            default: false,
            set: function (e) {
                if (e == 'true' || e == true) {
                    return true
                } else {
                    return false
                }
            },
        },
        author: {
            type: Schema.ObjectId,
            ref: 'Admin',
            required: false,
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
        published: {
            type: Boolean,
            default: false,
        },
        gallery_items: [
            {
                position: {
                    type: Number,
                    required: true,
                },
                image: { type: Object },
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

GallerySchema.plugin(softDeletePlugin)
GallerySchema.plugin(uniqueValidator)

GallerySchema.virtual('date_created').get(function () {
    return formatInTimeZone(
        this.created_at,
        'Asia/Dubai',
        'dd/MM/yyyy HH:mm:ss'
    )
})

GallerySchema.virtual('date_updated').get(function () {
    return formatInTimeZone(
        this.updated_at,
        'Asia/Dubai',
        'dd/MM/yyyy HH:mm:ss'
    )
})

module.exports = mongoose.model('Gallery', GallerySchema)
