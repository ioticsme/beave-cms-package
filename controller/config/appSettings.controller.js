const path = require('path')
const express = require('express')
const Joi = require('joi')
const bcrypt = require('bcryptjs')

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
    return res.render('admin-njk/config/app-settings/listing', {
        // schema_fields: Config.schema,
        configs,
    })
}

const save = async (req, res) => {
    // console.log(req.body)
    const schema = Joi.object({
        client_name: Joi.string().required(),
        frontend_url: Joi.string().optional(),
        user_email_verification: Joi.boolean().optional().allow(null, ''),
        local_upload: Joi.boolean().optional().allow(null, ''),
        ik_public_key: Joi.string().optional().allow(null, ''),
        ik_private_key: Joi.string().optional().allow(null, ''),
        ik_url: Joi.string().optional().allow(null, ''),
        ik_folder: Joi.string().optional().allow(null, ''),
        ik_active: Joi.boolean().optional().allow(null, ''),
        cdry_api_key: Joi.string().optional().allow(null, ''),
        cdry_api_secret: Joi.string().optional().allow(null, ''),
        cdry_cloud_name: Joi.string().optional().allow(null, ''),
        cdry_folder: Joi.string().optional().allow(null, ''),
        cdry_active: Joi.boolean().optional().allow(null, ''),
        default_drive: Joi.string().optional().allow(null, '').valid('imagekit', 'cloudinary'),
    })

    const validationResult = schema.validate(req.body, {
        abortEarly: false,
    })

    if (validationResult.error) {
        return res.status(422).json(validationResult.error)
    }

    try {
        await Config.deleteMany()
        await Config.create({
            general: {
                client_name: req.body.client_name,
                frontend_url: req.body.frontend_url,
                user_email_verification: req.body.user_email_verification,
            },
            media_drive: {
                local_upload: req.body.local_upload,
                imagekit: {
                    public_key: req.body.ik_public_key,
                    private_key: req.body.ik_private_key,
                    url: req.body.ik_url,
                    folder: req.body.ik_folder,
                    default: req.body.default_drive == 'imagekit' ? true : false,
                    active: req.body.ik_active,
                },
                cloudinary: {
                    api_key: req.body.cdry_api_key,
                    api_secret: req.body.cdry_api_secret,
                    cloud_name: req.body.cdry_cloud_name,
                    folder: req.body.cdry_folder,
                    default: req.body.default_drive == 'cloudinary' ? true : false,
                    active: req.body.cdry_active,
                },
            },
        })
        // return res.status(200).json('done')
        return res.status(200).json({
            message: 'Config updated',
            // url: `/config/app-settingss`,
        })
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
