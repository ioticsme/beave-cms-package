const path = require('path')
const express = require('express')
const Joi = require('joi')
const bcrypt = require('bcrypt')

const Config = require('../../model/Config')
const { createFcmSwJS } = require('../../helper/Operations.helper')

const list = async (req, res) => {
    const configs = await Config.findOne().select(
        '-_id -__v -created_at -updated_at'
    )
    // console.log(configs.schema.path('general')?.instance || 'Mixed')
    // return false
    // console.log(configs.schema.path('order_no').options.Comment)
    // configs.schema.path(`${key}.${mixkey}`)?.instance || 'Mixed'
    // console.log(configs.schema.path('imagekit.public_key').instance)
    // const sd = await Config.schema.obj
    // for(const p in sd) {
    //     console.log(configs.schema.path(p)?.instance || 'Mixed')
    // }
    return res.render('admin/config/app-settings/listing', {
        schema_fields: Config.schema,
        configs,
    })
}

const save = async (req, res) => {
    // console.log(req.body)
    const schema = Joi.object({
        general: Joi.object({
            client_name: Joi.string().required(),
            frontend_url: Joi.string().optional(),
            push_notification: Joi.boolean(),
            slack: Joi.boolean(),
            user_email_verification: Joi.boolean(),
        }),
        imagekit: Joi.object().optional(),
        firebase: Joi.object().optional(),
        slack: Joi.object().optional(),
        // dir: Joi.string().required().valid('ltr', 'rtl'),
        // is_default: Joi.boolean().optional(),
        // id: Joi.optional(),
    })

    const validationResult = schema.validate(req.body, {
        abortEarly: false,
    })

    if (validationResult.error) {
        return res.status(422).json(validationResult.error)
    }

    try {
        await Config.deleteMany()
        const config = await Config.create(req.body)
        // console.log(config)
        globalModuleConfig = {
            // has_booknow: config.general?.has_booknow || false,
        }

        if (config?.general?.push_notification && config?.firebase?.admin_web) {
            createFcmSwJS(config.firebase)
            globalModuleConfig.firebase = config.firebase || false
        } else {
            globalModuleConfig.firebase = false
        }

        // await Config.updateOne(
        //     {
        //         _id: configRow.id,
        //     },
        //     req.body
        // )

        return res.status(200).json('done')
    } catch (e) {
        // console.log(e)
        if (e.errors) {
            return res.status(422).json({
                details: e.errors,
            })
        }
        return res.status(404).json({ error: 'Something went wrong' })
    }
}

module.exports = {
    list,
    save,
}
