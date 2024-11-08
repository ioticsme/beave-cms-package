const envConfig = require('../../config/env.config')
const _ = require('lodash')
const slugify = require('slugify')
const Joi = require('joi')
const formData = require('form-data')
const { v4: uuidv4 } = require('uuid')
const Mailgun = require('mailgun.js')
const CustomForm = require('../../model/CustomForm')
const ContentType = require('../../model/ContentType')
const CustomFormData = require('../../model/CustomFormData')
const { mailGunTemplates } = require('../../helper/Mailgun.helper')

let session

const FIELD_TYPES = [
    {
        label: 'Textfield',
        type: 'textfield',
    },
    {
        label: 'Email',
        type: 'email',
    },
    {
        label: 'Phone',
        type: 'phone',
    },
    {
        label: 'Date',
        type: 'date',
    },
    {
        label: 'Dropdown',
        type: 'dropdown',
    },
    {
        label: 'Textarea',
        type: 'textarea',
    },
    {
        label: 'Radio',
        type: 'radio',
    },
    {
        label: 'Checkbox',
        type: 'checkbox',
    },
    {
        label: 'Terms',
        type: 'terms',
    },
    {
        label: 'Hidden',
        type: 'hidden',
    },
    {
        label: 'Content Type',
        type: 'content_type',
    },
]

const list = async (req, res) => {
    try {
        session = req.authUser

        const forms = await CustomForm.find({
            brand: session.brand._id,
            country: session.brand.country,
        })
        return res.render(`admin-njk/custom-forms/listing`, {
            data: forms,
        })
    } catch (error) {
        return res.render(`admin-njk/app-error-500`)
    }
}

const edit = async (req, res) => {
    try {
        session = req.authUser
        const form = await CustomForm.findOne({
            _id: req.params.id,
            brand: session.brand._id,
            country: session.brand.country,
            isDeleted: false,
        })
        const contentTypes = await ContentType.find()
        // const domainTemplates = await mailGunTemplates(
        //     req.brand?.settings?.notification_settings?.mailgun
        // )
        return res.render(`admin-njk/custom-forms/edit`, {
            form,
            // domainTemplates,
            field_types: FIELD_TYPES,
            contentTypes,
        })
    } catch (error) {
        console.log(error)
        return res.render(`admin-njk/app-error-500`)
    }
}

const add = async (req, res) => {
    try {
        session = req.authUser
        let domainTemplates = []
        // domainTemplates = await mailGunTemplates()
        domainTemplates = []
        const contentTypes = await ContentType.find()
        return res.render(`admin-njk/custom-forms/add`, {
            field_types: FIELD_TYPES,
            domainTemplates,
            contentTypes,
        })
    } catch (error) {
        console.log(error)
        return res.render(`admin-njk/app-error-500`)
    }
}

const save = async (req, res) => {
    try {
        // console.log(req.body)
        session = req.authUser
        // BEGIN:: Validation rule
        const schema = Joi.object({
            id: Joi.optional().allow(null, ''),
            // custom_fields: Joi.optional(),
            form_name: Joi.object({
                en: Joi.string().required(),
                ar: Joi.string().required(),
            }).required(),
            description: Joi.object({
                en: Joi.string().optional().allow(null, ''),
                ar: Joi.string().optional().allow(null, ''),
            })
                .optional()
                .allow(null, ''),
            cta_label: Joi.object({
                en: Joi.string().required(),
                ar: Joi.string().required(),
            }).required(),
            tnc: Joi.object({
                en: Joi.string().optional().allow(null, ''),
                ar: Joi.string().optional().allow(null, ''),
            })
                .optional()
                .allow(null, ''),
            auto_reply_email_template: Joi.string().optional().allow(null, ''),
            auto_reply_email_subject: Joi.string().optional().allow(null, ''),
            store_in_db: Joi.boolean().optional().allow(null, ''),
            recipient_emails: Joi.string().optional().allow(null, ''),
            recipient_email_template: Joi.string().optional().allow(null, ''),
            recipient_email_subject: Joi.string().optional().allow(null, ''),
            slack_url: Joi.string().optional().allow(null, ''),
            web_hook: Joi.string().optional().allow(null, ''),
            form_load_mode: Joi.string().optional().allow(null, ''),
            enable_captcha: Joi.boolean().optional().allow(null, ''),
            redirect_url: Joi.string().optional().allow(null, ''),
            field_label: Joi.object({
                en: Joi.array().items(Joi.string()).required(),
                ar: Joi.array().items(Joi.string()).required(),
            }).required(),
            field_name: Joi.array().items(Joi.string().allow('')),
            field_type: Joi.array().items(Joi.optional()).required(),
            content_type: Joi.array().items(Joi.optional()).required(),
            field_default_val: Joi.object({
                en: Joi.array().items(Joi.optional()).optional(),
                ar: Joi.array().items(Joi.optional()).optional(),
            }).optional(),
            field_values: Joi.object({
                en: Joi.array().items(Joi.optional()).optional(),
                ar: Joi.array().items(Joi.optional()).optional(),
            }).optional(),
            field_show_in_list: Joi.array()
                .items(Joi.boolean().optional())
                .optional(),
            use_for_notification: Joi.array()
                .items(Joi.boolean().optional())
                .optional(),
            position: Joi.array().items(Joi.number().optional()).optional(),
            field_validation_mandatory: Joi.array()
                .items(Joi.string().required())
                .required(),
            field_validation_type: Joi.array().items(Joi.string()).required(),
            field_validation_min_length: Joi.array()
                .items(Joi.string().allow(null, ''))
                .optional()
                .allow(null, ''),
            field_validation_max_length: Joi.array()
                .items(Joi.string().allow(null, ''))
                .optional()
                .allow(null, ''),
            field_enable: Joi.array()
                .items(Joi.boolean().allow(null, ''))
                .optional()
                .allow(null, ''),
        })

        const validationResult = schema.validate(req.body, {
            abortEarly: false,
        })

        if (validationResult.error) {
            res.status(422).json(validationResult.error)
            return
        }

        const form_fields = []
        const input = req.body
        for (let i = 0; i < input.field_name.length; i++) {
            let field_obj = {
                field_label: {
                    en: input.field_label.en[i],
                    ar: input.field_label.ar[i],
                },
                field_name: input.field_name[i]
                    ? input.field_name[i]
                    : uuidv4().replace(/-/g, '_'),
                field_type: input.field_type[i],
                field_default_val: {
                    en: input.field_default_val.en[i],
                    ar: input.field_default_val.ar[i],
                },
                field_values: {
                    en: input.field_values.en[i],
                    ar: input.field_values.ar[i],
                },
                content_type: input.content_type[i]
                    ? input.content_type[i]
                    : null,
                field_show_in_list: input.field_show_in_list?.[i] ?? false,
                use_for_notification: input.use_for_notification?.[i] ?? false,
                position: input.position?.[i] ?? 0,
                validation: {
                    required: input.field_validation_mandatory[i],
                    data_type: input.field_validation_type[i],
                    min_length: input.field_validation_min_length[i],
                    max_length: input.field_validation_max_length[i],
                },
            }
            form_fields.push(field_obj)
        }

        // console.log(form_fields)

        let body = req.body
        let isEdit = body.id ? true : false

        if (!isEdit) {
            const isExist = await CustomForm.findOne({
                type: slugify(body.form_name.en.toLowerCase()),
                isDeleted: false,
            })
            if (isExist) {
                return res
                    .status(404)
                    .json({ error: 'Custom Form already exist' })
            }
        }

        // Data object to insert
        let data = {
            form_name: input.form_name,
            description: input.description,
            tnc: input.tnc,
            cta_label: input.cta_label,
            type: slugify(input.form_name.en.toLowerCase()),
            auto_reply_email_template: input.auto_reply_email_template,
            auto_reply_email_subject: input.auto_reply_email_subject,
            store_in_db: input.store_in_db ?? false,
            recipient_emails: input.recipient_emails,
            recipient_email_template: input.recipient_email_template,
            recipient_email_subject: input.recipient_email_subject,
            slack_url: input.slack_url,
            web_hook: input.web_hook,
            form_load_mode: input.form_load_mode,
            fields: form_fields,
            brand: session.brand._id,
            country: session.brand.country,
        }

        if (isEdit) {
            // Update banner
            const update = await CustomForm.updateOne({ _id: body.id }, data)
            return res
                .status(201)
                .json({ message: 'Custom Form updated successfully' })
        } else {
            // Create CustomForm
            const save = await CustomForm.create(data)
            if (!save?._id) {
                return res.status(400).json({ error: 'Something went wrong' })
            }
            return res
                .status(200)
                .json({ message: 'Custom Form added successfully' })
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

const changeStatus = async (req, res) => {
    try {
        const { status, id } = req.body
        // If id not found
        if (!id) {
            return res.status(404).json({ error: 'Invalid data' })
        }
        // Update
        const update = await CustomForm.findOneAndUpdate(
            {
                _id: id,
                brand: req.authUser.brand._id,
                country: req.authUser.brand.country,
            },
            {
                $set: {
                    published: !status,
                },
            }
        )
        // If not updated
        if (!update?._id) {
            return res.status(404).json({ error: 'Something went wrong' })
        }
        return res.status(200).json({
            message: 'Custom Form status changed',
        })
    } catch (error) {
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

const deleteForm = async (req, res) => {
    try {
        const { id } = req.body
        // If id not found
        if (!id) {
            return res.status(404).json({ error: 'Id not found' })
        }

        await CustomForm.softDelete({
            _id: id,
            brand: req.authUser.brand._id,
            country: req.authUser.brand.country,
        })
        return res.status(200).json({
            message: 'Custom form deleted',
        })
    } catch (error) {
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

const viewSubmissions = async (req, res) => {
    try {
        session = req.authUser

        const reqForm = await CustomForm.findOne({
            _id: req.params.id,
        })
        const submissions = await CustomFormData.find({
            form_id: req.params.id,
            brand: session.brand._id,
            country: session.brand.country,
        }).sort({ _id: -1 })
        res.render(`admin-njk/custom-forms/submissions`, {
            data: submissions,
            reqForm: reqForm,
        })
    } catch (error) {
        return res.render(`admin-njk/app-error-500`)
    }
}

module.exports = {
    list,
    edit,
    add,
    save,
    changeStatus,
    deleteForm,
    viewSubmissions,
}
