const path = require('path')
const express = require('express')
const Joi = require('joi')
const bcrypt = require('bcrypt')
const ContentType = require('../../model/ContentType')
const { default: slugify } = require('slugify')

const list = async (req, res) => {
    const contentTypes = await ContentType.find()
    return res.render('admin/config/content-type/listing', {
        contentTypes,
    })
}

const add = async (req, res) => {
    const contentTypes = await ContentType.find()
    return res.render('admin/config/content-type/form', {
        isEdit: false,
        contentTypes,
    })
}

const edit = async (req, res) => {
    const contentType = await ContentType.findOne({
        _id: req.params.id,
    })
    // console.log('contentType :>> ', contentType)
    const contentTypes = await ContentType.find()
    return res.render('admin/config/content-type/form', {
        contentType,
        isEdit: true,
        contentTypes,
    })
}

const view = async (req, res) => {
    const contentType = await ContentType.findOne({
        _id: req.params.id,
    })
    // console.log('contentType :>> ', contentType)
    // const contentTypes = await ContentType.find()
    return res.render('admin/config/content-type/view', {
        contentType,
        // contentTypes,
    })
}

const save = async (req, res) => {
    try {
        // console.log(req.body.kt_docs_repeater_nested_outer)
        const schema = Joi.object({
            title: Joi.string().required().min(3).max(60),
            slug: Joi.string().required().min(3).max(60),
            // template_name: Joi.string().required().min(3).max(60),
            position: Joi.number().required(),
            admin_icon: Joi.string().required(),
            in_use: Joi.boolean().optional(),
            nav_on_collection_api: Joi.boolean().optional(),
            nav_on_single_api: Joi.boolean().optional(),
            has_form: Joi.boolean().optional(),
            hide_meta: Joi.boolean().optional(),
            has_api_endpoint: Joi.boolean().optional(),
            attachable_type: Joi.array(),
            id: Joi.optional(),
        })

        const validationResult = schema.validate(req.body, {
            abortEarly: false,
        })

        if (validationResult.error) {
            res.status(422).json(validationResult.error)
            return
        }

        let data = {
            title: req.body.title,
            slug: slugify(req.body.slug.toLowerCase()),
            // template_name: req.body.template_name,
            position: req.body.position,
            admin_icon: req.body.admin_icon,
            allowed_type: req.body.allowed_type || [],
            has_form: req.body?.has_form || false,
            in_use: req.body.in_use || false,
            hide_meta: req.body.hide_meta || false,
            nav_on_collection_api: req.body.nav_on_collection_api || false,
            nav_on_single_api: req.body.nav_on_single_api || false,
            allowed_type: req.body.attachable_type?.length
                ? req.body.attachable_type
                : null,
        }
        if (req.body.id) {
            await ContentType.updateOne(
                {
                    _id: req.body.id,
                },
                data
            )
        } else {
            await ContentType.create(data)
        }

        return res.status(200).json({ message: 'Content Type added' })
    } catch (e) {
        // console.log(e)
        if (e.errors) {
            return res.status(422).json({
                details: e.errors,
            })
        }
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

const deleteItem = async (req, res) => {
    try {
        const { id } = req.body
        // If id not found
        if (!id) {
            return res.status(404).json({ error: 'Id not found' })
        }

        //soft delete item
        await ContentType.deleteOne({ _id: id })
        return res.status(200).json({
            message: `Content Type Deleted`,
        })
    } catch (error) {
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

const addFields = async (req, res) => {
    const contentType = await ContentType.findOne({
        _id: req.params.id,
    })
    return res.render('admin/config/content-type/field-config-form', {
        contentType,
    })
}

const saveFields = async (req, res) => {
    try {
        // console.log(req.body.kt_docs_repeater_nested_outer)
        const schema = Joi.object({
            id: Joi.string().required(),
            fieldSchemaJson: Joi.array().items(
                Joi.object({
                    section: Joi.string().required(),
                    repeater: Joi.boolean().required(),
                    fields: Joi.array().optional(),
                })
            ),
        })

        const validationResult = schema.validate(req.body, {
            abortEarly: false,
        })

        if (validationResult.error) {
            return res.status(422).json(validationResult.error)
        }

        let customFieldGroups = []
        req.body.kt_docs_repeater_nested_outer?.map((repeater) => {
            let fields = []
            repeater.kt_docs_repeater_nested_inner?.map((inner) => {
                let obj = {
                    field_label: inner.field_label,
                    field_name: inner.field_name,
                    placeholder: inner.placeholder,
                    validation: inner.validation,
                    bilingual: inner.bilingual || false,
                    field_type: inner.field_type,
                }
                let options = []
                for (
                    let j = 0;
                    j < inner.option_label?.split(',').length;
                    j++
                ) {
                    if (inner.option_value?.split(',')?.[j]) {
                        options.push({
                            label: inner.option_label?.split(',')?.[j],
                            value: inner.option_value.split(',')[j],
                        })
                    }
                }
                if (options.length) {
                    obj.options = options
                }
                fields.push(obj)
            })
            customFieldGroups.push({
                row_name: repeater.name,
                row_label: repeater.label,
                repeater_group:
                    repeater.repeater_group == 'true' ? true : false,
                bilingual: repeater.bilingual == 'true' ? true : false,
                fields: fields,
            })
        })

        const fields_to_update = []
        req.body.fieldSchemaJson.forEach((eachGroup)=> {
            const fields = []
            eachGroup.fields.forEach((field) => {
                fields.push({
                    field_label: field.label,
                    field_name: field.name,
                    field_type: field.type,
                    placeholder: field.label,
                    position: field.position,
                    validation: field.validation,
                    options: field.options,
                })
            })
            const group = {
                row_name: eachGroup.section,
                row_label: eachGroup.section,
                repeater_group: eachGroup.repeater,
                bilingual: true,
                fields: fields,
            }
            fields_to_update.push(group)
        })
        // console.log(fields_to_update)
        // return false
        let update = {
            $set: {
                'field_groups': fields_to_update
              }
        }

        await ContentType.updateOne(
            {
                _id: req.body.id,
            },
            {
                $set: update,
            }
        )

        return res.status(200).json({ message: 'Content Type added' })
    } catch (e) {
        console.log(e)
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
    add,
    edit,
    view,
    save,
    deleteItem,
    addFields,
    saveFields,
}
