const Joi = require('joi')
const Config = require('../../model/Config')
const { encryptData, decryptData } = require('../../helper/Operations.helper')
const { logError } = require('../../helper/Logger.helper')

const list = async (req, res) => {
    try {
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
            ...configs.media_drive?.imagekit,
            public_key: configs.media_drive?.imagekit?.public_key
                ? await decryptData(configs.media_drive.imagekit.public_key)
                : '',
            private_key: configs.media_drive?.imagekit?.private_key
                ? await decryptData(configs.media_drive.imagekit.private_key)
                : '',
        }
        configs.media_drive.cloudinary = {
            ...configs.media_drive?.cloudinary,
            api_key: configs.media_drive?.cloudinary?.api_key
                ? await decryptData(configs.media_drive.cloudinary.api_key)
                : '',
            api_secret: configs.media_drive?.cloudinary?.api_secret
                ? await decryptData(configs.media_drive.cloudinary.api_secret)
                : '',
        }
        configs.media_drive.azure_blob = {
            ...configs.media_drive?.azure_blob,
            connection_string: configs.media_drive?.azure_blob?.connection_string
                ? await decryptData(configs.media_drive.azure_blob.connection_string)
                : '',
        }
        configs.media_drive.s3 = {
            ...configs.media_drive?.s3,
            access_key_id: configs.media_drive?.s3?.access_key_id
                ? await decryptData(configs.media_drive.s3.access_key_id)
                : '',
            secret_access_key: configs.media_drive?.s3?.secret_access_key
                ? await decryptData(configs.media_drive.s3.secret_access_key)
                : '',
        }
        configs.email_settings.local = {
            ...configs.email_settings.local,
            auth_password: configs.email_settings.local.auth_password
                ? await decryptData(configs.email_settings.local.auth_password)
                : '',
        }
        configs.email_settings.mailgun = {
            ...configs.email_settings.mailgun,
            api_key: configs.email_settings.mailgun.api_key
                ? await decryptData(configs.email_settings.mailgun.api_key)
                : '',
        }
        configs.email_settings.sendgrid = {
            ...configs.email_settings.sendgrid,
            api_key: configs.email_settings.sendgrid.api_key
                ? await decryptData(configs.email_settings.sendgrid.api_key)
                : '',
        }
        return res.render('admin-njk/config/app-settings/listing', {
            // schema_fields: Config.schema,
            configs,
        })
    } catch (error) {
        logError(error)
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

const save = async (req, res) => {
    try {
        const schema = Joi.object({
            client_name: Joi.string().required(),
            frontend_url: Joi.string().optional().allow(null, ''),
            user_email_verification: Joi.boolean().optional().allow(null, ''),
            media_drive: Joi.string()
                .required()
                .valid('local', 'imagekit', 'cloudinary', 'azure_blob', 's3'),
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
            az_connection_string: Joi.string().when('media_drive', {
                is: 'azure_blob',
                then: Joi.required(),
                otherwise: Joi.optional().allow(null, ''),
            }),
            az_container_name: Joi.string().when('media_drive', {
                is: 'azure_blob',
                then: Joi.required(),
                otherwise: Joi.optional().allow(null, ''),
            }),
            az_folder: Joi.string().optional().allow(null, ''),
            az_cdn_url: Joi.string().optional().allow(null, ''),
            s3_access_key_id: Joi.string().when('media_drive', {
                is: 's3',
                then: Joi.required(),
                otherwise: Joi.optional().allow(null, ''),
            }),
            s3_secret_access_key: Joi.string().when('media_drive', {
                is: 's3',
                then: Joi.required(),
                otherwise: Joi.optional().allow(null, ''),
            }),
            s3_bucket_name: Joi.string().when('media_drive', {
                is: 's3',
                then: Joi.required(),
                otherwise: Joi.optional().allow(null, ''),
            }),
            s3_region: Joi.string().when('media_drive', {
                is: 's3',
                then: Joi.required(),
                otherwise: Joi.optional().allow(null, ''),
            }),
            s3_folder: Joi.string().optional().allow(null, ''),
            s3_cdn_url: Joi.string().optional().allow(null, ''),
            email_channel: Joi.string()
                .required()
                .valid('none', 'local', 'mailgun', 'sendgrid'),
            local_from: Joi.string().when('email_channel', {
                is: 'local',
                then: Joi.required(),
                otherwise: Joi.optional().allow(null, ''),
            }),
            local_host: Joi.string().when('email_channel', {
                is: 'local',
                then: Joi.required(),
                otherwise: Joi.optional().allow(null, ''),
            }),
            local_port: Joi.number().when('email_channel', {
                is: 'local',
                then: Joi.required(),
                otherwise: Joi.optional().allow(null, ''),
            }),
            local_secure: Joi.string().when('email_channel', {
                is: 'local',
                then: Joi.required(),
                otherwise: Joi.optional().allow(null, ''),
            }),
            local_auth_user: Joi.string().when('email_channel', {
                is: 'local',
                then: Joi.required(),
                otherwise: Joi.optional().allow(null, ''),
            }),
            local_auth_password: Joi.string().when('email_channel', {
                is: 'local',
                then: Joi.required(),
                otherwise: Joi.optional().allow(null, ''),
            }),
            mg_from: Joi.string().when('email_channel', {
                is: 'mailgun',
                then: Joi.required(),
                otherwise: Joi.optional().allow(null, ''),
            }),
            mg_domain: Joi.string().when('email_channel', {
                is: 'mailgun',
                then: Joi.required(),
                otherwise: Joi.optional().allow(null, ''),
            }),
            mg_api_key: Joi.string().when('email_channel', {
                is: 'mailgun',
                then: Joi.required(),
                otherwise: Joi.optional().allow(null, ''),
            }),
            sg_from: Joi.string().when('email_channel', {
                is: 'sendgrid',
                then: Joi.required(),
                otherwise: Joi.optional().allow(null, ''),
            }),
            sg_domain: Joi.string().when('email_channel', {
                is: 'sendgrid',
                then: Joi.required(),
                otherwise: Joi.optional().allow(null, ''),
            }),
            sg_api_key: Joi.string().when('email_channel', {
                is: 'sendgrid',
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

        await Config.deleteMany()
        let imkit_config = {}
        let cldnry_config = {}
        let az_config = {}
        let s3_config = {}
        let local_mail_config = {}
        let mailgun_config = {}
        let sendgrid_config = {}
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
        } else if (req.body.media_drive == 'azure_blob') {
            const connection_string = await encryptData(req.body.az_connection_string)
            az_config = {
                connection_string: connection_string,
                container_name: req.body.az_container_name,
                folder: req.body.az_folder,
                cdn_url: req.body.az_cdn_url,
            }
        } else if (req.body.media_drive == 's3') {
            const access_key_id = await encryptData(req.body.s3_access_key_id)
            const secret_access_key = await encryptData(req.body.s3_secret_access_key)
            s3_config = {
                access_key_id: access_key_id,
                secret_access_key: secret_access_key,
                bucket_name: req.body.s3_bucket_name,
                region: req.body.s3_region,
                folder: req.body.s3_folder,
                cdn_url: req.body.s3_cdn_url,
            }
        }
        if (req.body.email_channel == 'local') {
            const auth_password = await encryptData(
                req.body.local_auth_password
            )
            local_mail_config = {
                from: req.body.local_from,
                host: req.body.local_host,
                port: req.body.local_port,
                secure: req.body.local_secure,
                auth_user: req.body.local_auth_user,
                auth_password: auth_password,
            }
        } else if (req.body.email_channel == 'mailgun') {
            const api_key = await encryptData(req.body.mg_api_key)
            mailgun_config = {
                from: req.body.mg_from,
                domain: req.body.mg_domain,
                api_key: api_key,
            }
        } else if (req.body.email_channel == 'sendgrid') {
            const api_key = await encryptData(req.body.sg_api_key)
            sendgrid_config = {
                from: req.body.sg_from,
                domain: req.body.sg_domain,
                api_key: api_key,
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
                azure_blob: az_config,
                s3: s3_config,
            },
            email_settings: {
                default_channel: req.body.email_channel,
                local: local_mail_config,
                mailgun: mailgun_config,
                sendgrid: sendgrid_config,
            },
        })
        // return res.status(200).json('done')
        return res.status(200).json({
            message: 'Config updated',
            // url: `/config/app-settingss`,
        })
    } catch (e) {
        logError(e)
        if (e.errors) {
            return res.status(422).json({
                details: e.errors,
            })
        }
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

module.exports = {
    list,
    save,
}
