const Joi = require('joi')
const axios = require('axios')
const collect = require('collect.js')
const { verifyCaptcha } = require('../../helper/Captcha.helper')
const { sendEmail } = require('../../helper/Mail.helper')
// const Content = require('../../node_modules/@ioticsme/cms/model/Content')
const CustomForm = require('../../model/CustomForm')
const CustomFormData = require('../../model/CustomFormData')

const customFormSubmit = async (req, res) => {
    try {
        // console.log(req.body)
        // Finding custom form with type
        let customForm = await CustomForm.findOne({
            type: req.body.type,
            brand: req.brand,
            country: req.country,
            published: true,
            isDeleted: false,
        })
        if (!customForm?._id) {
            return res.status(422).json({ error: 'Invalid custom form' })
        }
        // Creating dynamic validation rules
        let cfValidationObj = {}
        // const joiStart = `Joi.`
        customForm?.fields.forEach((element) => {
            let validation_eval_string = `Joi.${element.validation.data_type}().${element.validation.required}()`
            if (element.validation.min_length > 0) {
                validation_eval_string = `${validation_eval_string}.min(${element.validation.min_length})`
            }
            if (element.validation.max_length > 0) {
                validation_eval_string = `${validation_eval_string}.max(${element.validation.max_length})`
            }
            // console.log(validation_eval_string)
            cfValidationObj[element.field_name] = eval(
                `${validation_eval_string}.label('${element.field_label?.en}')`
            )
        })

        // BEGIN:: Validation rule
        const schema = Joi.object({
            type: Joi.string().required(),
            ...cfValidationObj,
        })
        // END:: Validation rule

        const validationResult = schema.validate(req.body, {
            abortEarly: false,
        })

        if (validationResult.error) {
            return res.status(422).json({
                details: validationResult.error.details,
            })
        }

        // Verifying captcha with token
        if (
            customForm.is_captcha_required &&
            (process.env.NODE_ENV == 'production' ||
                process.env.NODE_ENV == 'staging') &&
            req.source == 'web'
        ) {
            const isVerified = await verifyCaptcha(req.body.captcha_token)
            if (!isVerified) {
                return res
                    .status(400)
                    .json({ error: 'captcha token not verified' })
            }
        }

        let { captcha_token, ...input } = req.body
        // Dynamic custom field values
        let cfValues = {}
        for (i = 0; i < customForm.fields?.length; i++) {
            let cf = customForm.fields[i]
            let value = input?.[cf.field_name]
            // if (cf.field_type) {
            //     let ObjectId = mongoose.Types.ObjectId
            //     if (!ObjectId.isValid(req.body?.[cf.field_name])) {
            //         return res.status(422).json({ error: 'Invalid content' })
            //     }
            //     let content = await Content.findOne({
            //         _id: req.body?.[cf.field_name],
            //     })
            //     value = new ContentResource(content).exec()
            // }
            cfValues = {
                ...cfValues,
                [cf.field_name]: value,
            }
        }

        // Data to insert
        const data = {
            form_id: customForm._id,
            type: req.body.type,
            field_values: cfValues,
            brand: req.brand._id,
            country: req.country._id,
        }

        let save
        if (customForm.store_in_db) {
            save = await CustomFormData.create(data)

            if (!save?._id) {
                return res.status(400).json({ error: 'Submission error' })
            }
        }

        let field_map_for_email = {}
        customForm.fields.forEach((field) => {
            // TODO: .en should be replaced with middleware language
            field_map_for_email[field.field_label.en] =
                data.field_values[field.field_name]
        })

        if (customForm.recipient_emails) {
            // BEGIN:: Sending Email to admin
            sendEmail(
                customForm.recipient_emails?.split(','),
                `${customForm.form_name} Form Submission`,
                customForm.recipient_email_template,
                data
            )
        }
        // BEGIN::Calling webhook
        if (customForm.web_hook) {
            // call webhook
            // console.log(customForm.web_hook)
            axios
                .post(customForm.web_hook, {
                    form_id: save.data.form_id,
                    form_type: save.data.type,
                    form_name: customForm.form_name,
                    fields: save.data.fields,
                })
                // .then((response) => displayOutput(response))
                .catch((err) => console.log(err))
        }
        // END::Calling webhook

        return res
            .status(200)
            .json({ message: 'Custom Form Submitted', data: save })
    } catch (error) {
        console.log(error)
        return res
            .status(500)
            .json({ error: error ? error : 'Something went wrong' })
    }
}

module.exports = {
    customFormSubmit,
}
