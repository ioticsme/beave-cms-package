const Joi = require('joi')

const Config = require('../../model/Config')
const { encryptData, decryptData } = require('../../helper/Operations.helper')

const list = async (req, res) => {
    const configs = await Config.findOne().select(
        '-_id -__v -created_at -updated_at'
    )
    // console.log(configs.schema.path('general')?.instance || 'Mixed')
    // console.log(await decryptData(configs.media_drive.imagekit.public_key))
    // return false
    // console.log(configs.schema.path('order_no').options.Comment)
    // configs.schema.path(`${key}.${mixkey}`)?.instance || 'Mixed'
    // console.log(configs.schema.path('imagekit.public_key').instance)
    // const sd = await Config.schema.obj
    // for(const p in sd) {
    //     console.log(configs.schema.path(p)?.instance || 'Mixed')
    // }
    configs.media_drive.imagekit = {
        ...configs.media_drive.imagekit,
        public_key: configs.media_drive.imagekit.public_key
            ? await decryptData(configs.media_drive.imagekit.public_key)
            : '',
        private_key: configs.media_drive.imagekit.private_key
            ? await decryptData(configs.media_drive.imagekit.private_key)
            : '',
    }
    configs.media_drive.cloudinary = {
        ...configs.media_drive.cloudinary,
        api_key: configs.media_drive.cloudinary.api_key
            ? await decryptData(configs.media_drive.cloudinary.api_key)
            : '',
        api_secret: configs.media_drive.cloudinary.api_secret
            ? await decryptData(configs.media_drive.cloudinary.api_secret)
            : '',
    }
    return res.render('admin-njk/config/app-settings/listing', {
        // schema_fields: Config.schema,
        configs,
    })
}

const save = async (req, res) => {
    // console.log(req.body)
    const schema = Joi.object({
        client_name: Joi.string().required(),
        frontend_url: Joi.string().optional().allow(null, ''),
        user_email_verification: Joi.boolean().optional().allow(null, ''),
        media_drive: Joi.string()
            .required()
            .valid('local', 'imagekit', 'cloudinary'),
        ik_public_key: Joi.string().when('media_drive', {
            is: 'imagekit',
            then: Joi.required(),
            otherwise: Joi.optional().allow(null, ''),
        }),
        ik_private_key: Joi.string().when('media_drive', {
            is: 'imagekit',
            then: Joi.required(),
            otherwise: Joi.optional().allow(null, ''),
        }),
        ik_url: Joi.string().when('media_drive', {
            is: 'imagekit',
            then: Joi.required(),
            otherwise: Joi.optional().allow(null, ''),
        }),
        ik_folder: Joi.string().when('media_drive', {
            is: 'imagekit',
            then: Joi.required(),
            otherwise: Joi.optional().allow(null, ''),
        }),
        cdry_api_key: Joi.string().when('media_drive', {
            is: 'cloudinary',
            then: Joi.required(),
            otherwise: Joi.optional().allow(null, ''),
        }),
        cdry_api_secret: Joi.string().when('media_drive', {
            is: 'cloudinary',
            then: Joi.required(),
            otherwise: Joi.optional().allow(null, ''),
        }),
        cdry_cloud_name: Joi.string().when('media_drive', {
            is: 'cloudinary',
            then: Joi.required(),
            otherwise: Joi.optional().allow(null, ''),
        }),
        cdry_folder: Joi.string().when('media_drive', {
            is: 'cloudinary',
            then: Joi.required(),
            otherwise: Joi.optional().allow(null, ''),
        }),
    })

    const validationResult = schema.validate(req.body, {
        abortEarly: false,
    })

    if (validationResult.error) {
        return res.status(422).json(validationResult.error)
    }

    try {
        await Config.deleteMany()
        let imkit_config = {}
        let cldnry_config = {}
        if (req.body.media_drive == 'imagekit') {
            const public_key = await encryptData(req.body.ik_public_key)
            const private_key = await encryptData(req.body.ik_private_key)
            imkit_config = {
                public_key: public_key,
                private_key: private_key,
                url: req.body.ik_url,
                folder: req.body.ik_folder,
            }
        } else if (req.body.media_drive == 'cloudinary') {
            const api_key = await encryptData(req.body.cdry_api_key)
            const api_secret = await encryptData(req.body.cdry_api_secret)
            cldnry_config = {
                api_key: api_key,
                api_secret: api_secret,
                cloud_name: req.body.cdry_cloud_name,
                folder: req.body.cdry_folder,
            }
        }
        await Config.create({
            general: {
                client_name: req.body.client_name,
                frontend_url: req.body.frontend_url,
                user_email_verification: req.body.user_email_verification,
            },
            media_drive: {
                local_upload: req.body.media_drive == 'local' ? true : false,
                default_drive: req.body.media_drive,
                imagekit: imkit_config,
                cloudinary: cldnry_config,
            },
        })
        // return res.status(200).json('done')
        return res.status(200).json({
            message: 'Config updated',
            // url: `/config/app-settingss`,
        })
    } catch (e) {
        console.log(e.errors)
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
