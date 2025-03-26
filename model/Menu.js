const { mongoose, Schema } = require('mongoose')
const mongooseDelete = require('mongoose-delete')
const Brand = require('./Brand')
const Country = require('./Country')

const MenuSchema = new mongoose.Schema(
    {
        brand: {
            type: Schema.ObjectId,
            ref: Brand,
            required: true,
        },
        country: {
            type: Schema.ObjectId,
            ref: Country,
            required: true,
        },
        nav_label: {
            type: String,
            required: true,
        },
        nav_position: {
            type: String,
            required: true,
        },
        nav_items: [
            Schema({
                // _id: {
                //     type: Schema.ObjectId,
                //     required: true,
                // },
                label: {},
                position: {
                    type: Number,
                    default: 0,
                },
                url: {},
                external: {
                    type: Boolean,
                    default: false,
                },
                active: {
                    type: Boolean,
                    default: true,
                },
                child: [
                    Schema({
                        // _id: {
                        //     type: Schema.ObjectId,
                        //     required: true,
                        // },
                        label: {},
                        position: {
                            type: Number,
                            default: 0,
                        },
                        url: {},
                        external: {
                            type: Boolean,
                            default: false,
                        },
                        active: {
                            type: Boolean,
                            default: true,
                        },
                        child: [
                            Schema({
                                // _id: {
                                //     type: Schema.ObjectId,
                                //     required: true,
                                // },
                                label: {},
                                position: {
                                    type: Number,
                                    default: 0,
                                },
                                url: {},
                                external: {
                                    type: Boolean,
                                    default: false,
                                },
                                active: {
                                    type: Boolean,
                                    default: true,
                                },
                            }),
                        ],
                    }),
                ],
            }),
        ],
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
)

MenuSchema.plugin(mongooseDelete, { overrideMethods: true })

module.exports = mongoose.model('Menu', MenuSchema)
