const envConfig = require('../../config/env.config')
const _ = require('lodash')
const slugify = require('slugify')
const Joi = require('joi')
const Content = require('../../model/Content')
const Country = require('../../model/Country')
const fs = require('fs')
const { uploadMedia } = require('../../helper/FileUpload.helper')
const { formatInTimeZone } = require('date-fns-tz')
const { default: collect } = require('collect.js')
const Redis = require('../../helper/Redis.helper')
const { default: mongoose } = require('mongoose')
const { isObjectId } = require('../../helper/Operations.helper')
const { ObjectId } = require('mongodb')
const { group } = require('console')
const metaFields = require('../../config/meta-fields.config')

let session

const list = async (req, res) => {
    try {
        session = req.authUser
        // return res.send(req.contentType._id)
        const contentList = await Content.find({
            type_id: req.contentType._id,
            // brand: session.brand._id,
            country: session.brand.country,
            isDeleted: false,
        }).sort('position')

        if (req.contentType.single_type) {
            if (contentList.length) {
                // return res.send(contentList[0]._id)
                return res.redirect(
                    `/admin/cms/${req.contentType.slug}/detail/${contentList[0]._id}`
                )
            } else {
                return res.redirect(`/admin/cms/${req.contentType.slug}/add`)
            }
        }

        if (!contentList) {
            return res.render(`admin-njk/error-500`)
        }

        // const reqContentType = req.contentType
        const default_lang = _.find(
            req.authUser.brand.languages,
            function (item) {
                return item.is_default === true
            }
        )
        return res.render(`admin-njk/cms/content/listing`, {
            default_lang,
            reqContentType: req.contentType,
            data: contentList,
        })
    } catch (error) {
        console.log(error)
        return res.render(`admin-njk/error-500`)
    }
}

const detail = async (req, res) => {
    try {
        session = req.authUser
        const contentDetail = await Content.findOne({
            _id: req.params.id,
            type_id: req.contentType._id,
            // brand: session.brand._id,
            country: session.brand.country,
        }).populate('author')

        if (!contentDetail) {
            return res.render(`admin-njk/error-404`)
        }

        const has_common_field_groups = collect(req.contentType.field_groups)
            .where('localisation', false)
            .count()

        const default_lang = _.find(
            req.authUser.brand.languages,
            function (item) {
                return item.is_default === true
            }
        )

        // return res.send(metaFields)

        let template = `admin-njk/cms/content/detail`
        if (req.contentType?.page_builder) {
            template = `admin-njk/cms/content/html-builder/detail`
        }

        // console.log(contentDetail.meta.en.OG.url)

        res.render(template, {
            default_lang,
            has_common_field_groups: has_common_field_groups ? true : false,
            reqContentType: req.contentType,
            contentDetail,
            metaFields,
            // findalContentFieldsGroup,
        })
    } catch (error) {
        return res.render(`admin-njk/error-500`)
    }
}

const add = async (req, res) => {
    try {
        session = req.authUser
        let allowed_content = {}
        if (req.contentType?.allowed_type?.length) {
            const data = await Content.find({
                brand: session?.brand?._id,
                country: session?.brand?.country,
                status: 'published',
                type_slug: { $in: req.contentType.allowed_type },
            })
            const collection = collect(data)
            const grouped = collection.groupBy('type_slug')
            allowed_content = JSON.parse(JSON.stringify(grouped.items))
        }
        const has_common_field_groups = collect(req.contentType.field_groups)
            .where('localisation', false)
            .count()
        // return res.send(req.contentType._id)

        let template = `admin-njk/cms/content/add`
        if (req.contentType?.page_builder) {
            template = `admin-njk/cms/content/html-builder/form`
        }
        return res.render(template, {
            reqContentType: req.contentType,
            has_common_field_groups: has_common_field_groups ? true : false,
            allowed_content,
            metaFields,
        })
    } catch (error) {
        // console.log(error)
        return res.render(`admin-njk/error-500`)
    }
}

const edit = async (req, res) => {
    try {
        session = req.authUser
        let allowed_content = {}
        const contentDetail = await Content.findOne({
            _id: req.params.id,
            type_id: req.contentType._id,
            // brand: session.brand._id,
            country: session.brand.country,
        })

        if (!contentDetail) {
            return res.render(`admin-njk/error-404`)
        }
        // return res.send(findalContentFieldsGroup)

        if (req.contentType?.allowed_type?.length) {
            const data = await Content.find({
                // brand: session?.brand?._id,
                country: session?.brand?.country,
                status: 'published',
                type_slug: { $in: req.contentType.allowed_type },
            })
            const collection = collect(data)
            const grouped = collection.groupBy('type_slug')
            allowed_content = JSON.parse(JSON.stringify(grouped.items))
        }
        const has_common_field_groups = collect(req.contentType.field_groups)
            .where('localisation', false)
            .count()

        let template = `admin-njk/cms/content/edit`
        if (req.contentType?.page_builder) {
            template = `admin-njk/cms/content/html-builder/form`
        }
        // return res.json(contentDetail)
        return res.render(template, {
            reqContentType: req.contentType,
            has_common_field_groups: has_common_field_groups ? true : false,
            contentDetail,
            allowed_content,
            metaFields,
        })
    } catch (error) {
        console.log(error)
        return res.render(`admin-njk/error-500`)
    }
}

const deleteContent = async (req, res) => {
    try {
        const { id } = req.body
        const slug = req.contentType.slug
        // If id not found
        if (!id) {
            return res.status(404).json({ error: 'Id not found' })
        }

        await Content.softDelete({
            _id: id,
            // brand: req.authUser.brand._id,
            country: req.authUser.brand.country,
        })

        // :TODO: Remove cache
        const countryCode = req.authUser.brand?.country_code
        const collection_cache_key = `data-content-${req.authUser.brand.code}-${countryCode}-${slug}`
        // const single_item_cache_key = `data-content-${req.authUser.brand.code}-${countryCode}-${slug}-${update.slug || update._id}`
        Redis.removeCache([collection_cache_key])

        return res.status(200).json({
            message: 'Content deleted',
            url: `/cms/${slug}`,
        })
    } catch (error) {
        // console.log(error)
        return res.status(404).json({ error: 'Something went wrong' })
    }
}

const changeStatus = async (req, res) => {
    try {
        const { status, id } = req.body
        const slug = req.contentType?.slug
        // If id not found
        if (!id) {
            return res.status(404).json({ error: 'Invalid data' })
        }

        const newStatus = status ? 'unpublished' : 'published'
        // Update
        const update = await Content.findOneAndUpdate(
            {
                _id: id,
                // brand: req.authUser.brand._id,
                country: req.authUser.brand.country,
            },
            {
                $set: {
                    status: newStatus,
                },
            }
        )
        // If not updated
        if (!update?._id) {
            return res.status(404).json({ error: 'Something went wrong' })
        }

        // :TODO: @Ebrahim, commented this because of error with countryCode
        const countryCode = req.authUser.brand?.country_code
        const collection_cache_key = `data-content-${req.authUser.brand.code}-${countryCode}-${slug}`
        const single_item_cache_key = `data-content-${
            req.authUser.brand.code
        }-${countryCode}-${slug}-${update.slug || update._id}`
        Redis.removeCache([collection_cache_key, single_item_cache_key])

        return res.status(200).json({
            message: 'Content status changed',
            url: `/cms/${slug}`,
        })
    } catch (error) {
        return res.status(404).json({ error: 'Something went wrong' })
    }
}

const save = async (req, res) => {
    if (!req.contentType?.page_builder) {
        return await saveDefaultContent(req, res)
    } else {
        return await savePageBuilderContent(req, res)
    }
}

const savePageBuilderContent = async (req, res) => {
    // console.log(req.body)
    // return false
    try {
        // Data object to insert
        let type = req.contentType
        let body = req.body

        // BEGIN:: Validation rule
        const schema = Joi.object({
            _id: Joi.optional(),
            name: Joi.string().required(),
            slug: req.contentType.has_slug
                ? Joi.string().required()
                : Joi.string().optional(),
            attached_type: Joi.optional(),
            meta: Joi.object().optional().allow(null, ''),
            status: Joi.string()
                .valid('published', 'unpublished', 'scheduled')
                .required()
                .messages({
                    'any.only': 'Content status is a required field',
                }),
            cms_publish_start: Joi.date().allow(null, ''),
            cms_publish_end: Joi.date().allow(null, ''),
            position: Joi.number().optional(),
        }).unknown()
        // END:: Validation rule

        const validationResult = schema.validate(req.body, {
            abortEarly: false,
        })

        if (validationResult.error) {
            return res.status(422).json(validationResult.error)
        }

        // return false
        let data = {
            type_id: type._id,
            type_slug: type.slug,
            author: req.authUser.admin_id,
            // brand: req.authUser.brand._id,
            country: req.authUser.brand.country,
            status: body.status,
            scheduled_at: {
                start: req.body.cms_publish_start,
                end: req.body.cms_publish_end,
            },
            position: body.position || 0,
            'content.name': req.body.name,
            meta: req.body.meta,
            // in_home: body.in_home || false,
        }

        // console.log(data)
        // //  console.log(req.body)
        // return false

        if (
            Object?.keys(body.attached_type ? body.attached_type : {})?.length
        ) {
            attachedData = []
            Object.keys(body.attached_type).map((item) => {
                const itemDataType = typeof body.attached_type[item]
                if (body.attached_type?.[item]?.length) {
                    let obj = {
                        content_type: item,
                        items:
                            itemDataType == 'string'
                                ? body.attached_type[item].split(',')
                                : body.attached_type[item],
                    }
                    attachedData.push(obj)
                }
            })
            if (attachedData.length) {
                data.attached_type = attachedData
            }
        }
        // const brandCode = req.authUser.brand?.code
        const countryCode = req.authUser.brand?.country_code

        if (req.body._id) {
            data.slug = req.body.slug
                ? slugify(req.body.slug).toLowerCase()
                : undefined
            // console.log(data)
            // data.slug = body.slug?.en
            //     ? slugify(body.slug?.en?.toLowerCase())
            //     : slugify(body.title?.en?.toLowerCase())
            const existingContent = await Content.findOne({
                _id: req.body._id,
            })
            const collection_cache_key = `data-content-${req.authUser.brand.code}-${countryCode}-${type.slug}`
            const single_item_cache_key = `data-content-${req.authUser.brand.code}-${countryCode}-${type.slug}-${existingContent.slug}`
            // Update content
            await Content.updateOne({ _id: req.body._id }, data)
            Redis.removeCache([collection_cache_key, single_item_cache_key])
            return res.status(201).json({
                message: 'Content updated successfully',
                redirect_to: `/admin/cms/${type.slug}/detail/${req.body._id}`,
            })
        } else {
            data.slug = req.body.slug ? slugify(req.body.slug) : undefined
            // Create content
            const save = await Content.create(data)
            if (!save?._id) {
                return res.status(400).json({ error: 'Something went wrong' })
            }
            const collection_cache_key = `data-content-${req.authUser.brand.code}-${countryCode}-${type.slug}`
            Redis.removeCache([collection_cache_key])
            return res.status(200).json({
                message: 'Content added successfully',
                redirect_to: `/admin/cms/${type.slug}/detail/${save._id}`,
            })
        }
    } catch (error) {
        console.log(error)
        return res.status(400).json({ error: 'Something went wrong' })
    }
}

const saveDefaultContent = async (req, res) => {
    // console.log(req.body.common)
    // return false
    try {
        // Data object to insert
        let type = req.contentType
        let body = req.body
        let content_to_insert = _.omit(body, [
            '_id',
            'slug',
            'status',
            'cms_publish_start',
            'cms_publish_end',
            // 'in_home',
            'position',
            'meta',
        ])

        if (req.body.status != 'scheduled') {
            req.body.cms_publish_start = undefined
            req.body.cms_publish_end = undefined
        }

        // BEGIN:: Generating content field validation rule for content type
        let validationSchema = {}

        const validTypes = {
            text: 'string()',
            textarea: 'string()',
            richtext: 'string()',
            media: 'object()',
            dropdown: 'string()',
            email: 'string()',
            number: 'number()',
            date: 'date()',
        }

        const language_prefixes = _.map(req.authUser.brand.languages, 'prefix')
        language_prefixes.push('common')
        language_prefixes.forEach((lang) => {
            let fieldGroupValidationObj = {}
            let group_by_localisation
            if (lang != 'common') {
                group_by_localisation = _.filter(
                    req.contentType.field_groups,
                    function (o) {
                        return o.localisation == true
                    }
                )
            } else {
                group_by_localisation = _.filter(
                    req.contentType.field_groups,
                    function (o) {
                        return o.localisation == false
                    }
                )
            }
            group_by_localisation.forEach((group) => {
                let fieldsValidationObject = {}
                if (!group.repeater_group) {
                    group.fields.forEach((field) => {
                        const required = field.validation?.required
                            ? '.required()'
                            : `.optional().allow(null,'')`
                        const min = field.validation?.min_length
                            ? `.min(${field.validation.min_length})`
                            : ''
                        const max = field.validation?.max_length
                            ? `.max(${field.validation.max_length})`
                            : ''

                        if (field.field_type == 'media') {
                            _.assign(fieldsValidationObject, {
                                [field.field_name]: eval(
                                    ` Joi.object({
                                        url: Joi.string()${required}.label('${field.field_label}'),
                                        title: Joi.string().allow(null, ''),
                                        alt_text: Joi.string().allow(null, ''),
                                    })`
                                ),
                            })
                        } else {
                            _.assign(fieldsValidationObject, {
                                [field.field_name]: eval(
                                    ` Joi.${
                                        validTypes[field.field_type]
                                    }${min}${max}${required}.label('${
                                        field.field_label
                                    }')`
                                ),
                            })
                        }
                    })
                } else {
                    group.fields.forEach((field) => {
                        const required = field.validation?.required
                            ? '.required()'
                            : `.optional().allow(null,'')`
                        const min = field.validation?.min_length
                            ? `.min(${field.validation.min_length})`
                            : ''
                        const max = field.validation?.max_length
                            ? `.max(${field.validation.max_length})`
                            : ''

                        if (field.field_type == 'media') {
                            /*  ===== BEGIN:: Restructuring the media field array and validation ====
                                 --- Initial Structure ---
                                image: {
                                    url: [
                                        'https://ik.imagekit.io/3olumvfrg/IOTICS-CMS-TEST/Development/Media/72d545e3689a617965b5f03d30fbcbbb_x5VmamuTm',
                                        'https://ik.imagekit.io/iex/woohoo/development/media/4456e5e6f21abb7f6c9c5d93b16fc709_4EhnJgqKy'
                                    ],
                                    title: [ 'ssss', 'ffff' ],
                                    alt_text: [ 'dddd', 'ffff' ]
                                }

                                --- Converted Structure ---

                                image: [
                                    {
                                        url: https://ik.imagekit.io/3olumvfrg/IOTICS-CMS-TEST/Development/Media/72d545e3689a617965b5f03d30fbcbbb_x5VmamuTm',
                                        title: 'ssss',
                                        alt_text: 'ffff'
                                    },
                                    {
                                        url: 'https://ik.imagekit.io/iex/woohoo/development/media/4456e5e6f21abb7f6c9c5d93b16fc709_4EhnJgqKy'
                                        title: 'dddd',
                                        alt_text: 'ffff'
                                    }
                                ]
                            */
                            const mediaArray = []
                            for (
                                let i = 0;
                                i <
                                req.body[lang][group.row_name][
                                    field.field_name
                                ]['url'].length;
                                i++
                            ) {
                                const item = {
                                    url: req.body[lang][group.row_name][
                                        field.field_name
                                    ]['url'][i],
                                    title: req.body[lang][group.row_name][
                                        field.field_name
                                    ]['title'][i],
                                    alt_text:
                                        req.body[lang][group.row_name][
                                            field.field_name
                                        ]['alt_text'][i],
                                }
                                mediaArray.push(item) // Add the object to the array
                            }
                            req.body[lang][group.row_name][field.field_name] =
                                mediaArray
                            _.assign(fieldsValidationObject, {
                                [field.field_name]: eval(
                                    ` Joi.array().items(Joi.object({
                                        url: Joi.string()${required}.label('${field.field_label}'),
                                        title: Joi.string().allow(null, ''),
                                        alt_text: Joi.string().allow(null, ''),
                                    }))`
                                ),
                            })
                            // END:: Restructuring the media field array and validation
                        } else {
                            _.assign(fieldsValidationObject, {
                                [field.field_name]: eval(
                                    ` Joi.array().items(Joi.${
                                        validTypes[field.field_type]
                                    }${min}${max}${required}).label('${
                                        field.field_label
                                    }')`
                                ),
                            })
                        }
                    })
                }

                fieldGroupValidationObj[group.row_name] = Joi.object(
                    fieldsValidationObject
                )
            })
            validationSchema[lang] = Joi.object(fieldGroupValidationObj)
        })
        // END:: Generating content field validation rule for content type

        // BEGIN:: Validation rule
        const schema = Joi.object({
            _id: Joi.optional(),
            slug: req.contentType.has_slug
                ? Joi.string().required()
                : Joi.string().optional(),
            ...validationSchema,
            attached_type: Joi.optional(),
            meta: Joi.object().optional().allow(null, ''),
            status: Joi.string()
                .valid('published', 'unpublished', 'scheduled')
                .required()
                .messages({
                    'any.only': 'Content status is a required field',
                }),
            cms_publish_start: Joi.date().allow(null, ''),
            cms_publish_end: Joi.date().allow(null, ''),
            position: Joi.number().optional(),
        }).unknown()
        // END:: Validation rule

        const validationResult = schema.validate(req.body, {
            abortEarly: false,
        })

        if (validationResult.error) {
            return res.status(422).json(validationResult.error)
        }

        // BEGIN: Restructing repeating array fields to Array of Objects and replaing it to `request.body` object to insert.
        language_prefixes.forEach((lang) => {
            let fieldGroupValidationObj = {}
            let repeater_group_by_localisation
            if (lang != 'common') {
                repeater_group_by_localisation = _.filter(
                    req.contentType.field_groups,
                    function (o) {
                        return (
                            o.localisation == true && o.repeater_group == true
                        )
                    }
                )
            } else {
                repeater_group_by_localisation = _.filter(
                    req.contentType.field_groups,
                    function (o) {
                        return (
                            o.localisation == false && o.repeater_group == true
                        )
                    }
                )
            }

            repeater_group_by_localisation.forEach((eachFieldGroup) => {
                const repeater_field_keys = Object.keys(
                    content_to_insert[lang][eachFieldGroup.row_name]
                )
                const content_to_change = []
                const total_items_in_each_field =
                    content_to_insert[lang][eachFieldGroup.row_name][
                        repeater_field_keys[0]
                    ].length
                for (let i = 0; i < total_items_in_each_field; i++) {
                    const obj = {}
                    eachFieldGroup.fields.forEach((eachField) => {
                        obj[eachField.field_name] =
                            content_to_insert[lang][eachFieldGroup.row_name][
                                eachField.field_name
                            ][i]
                    })
                    content_to_change.push(obj)
                }
                content_to_insert[lang][eachFieldGroup.row_name] =
                    content_to_change
            })
        })
        // console.log(content_to_insert.ar.featured_blocks)
        // return false
        // END: Restructing repeating array fields to Array of Objects and replaing it to `request.body` object to insert.

        // return false
        let data = {
            type_id: type._id,
            type_slug: type.slug,
            author: req.authUser.admin_id,
            // banner: body?.banner || null, // If Requested content type has banner required
            // gallery: body?.gallery || null, // If Requested content type has gallery required
            // brand: req.authUser.brand._id,
            country: req.authUser.brand.country,
            status: body.status,
            scheduled_at: {
                start: req.body.cms_publish_start,
                end: req.body.cms_publish_end,
            },
            position: body.position || 0,
            // template_name: type.template_name,
            content: content_to_insert,
            meta: body.meta,
            // group_content: fieldGroupData,
            // meta: metaData,
            // in_home: body.in_home || false,
        }

        // console.log(data)
        // //  console.log(req.body)
        // return false

        if (
            Object?.keys(body.attached_type ? body.attached_type : {})?.length
        ) {
            attachedData = []
            Object.keys(body.attached_type).map((item) => {
                const itemDataType = typeof body.attached_type[item]
                if (body.attached_type?.[item]?.length) {
                    let obj = {
                        content_type: item,
                        items:
                            itemDataType == 'string'
                                ? body.attached_type[item].split(',')
                                : body.attached_type[item],
                    }
                    attachedData.push(obj)
                }
            })
            if (attachedData.length) {
                data.attached_type = attachedData
            }
        }
        // const brandCode = req.authUser.brand?.code
        const countryCode = req.authUser.brand?.country_code

        if (req.body._id) {
            data.slug = req.body.slug
                ? slugify(req.body.slug).toLowerCase()
                : undefined
            // console.log(data)
            // data.slug = body.slug?.en
            //     ? slugify(body.slug?.en?.toLowerCase())
            //     : slugify(body.title?.en?.toLowerCase())
            const existingContent = await Content.findOne({
                _id: req.body._id,
            })
            const collection_cache_key = `data-content-${req.authUser.brand.code}-${countryCode}-${type.slug}`
            const single_item_cache_key = `data-content-${req.authUser.brand.code}-${countryCode}-${type.slug}-${existingContent.slug}`
            // Update content
            await Content.updateOne({ _id: req.body._id }, data)
            Redis.removeCache([collection_cache_key, single_item_cache_key])
            return res.status(201).json({
                message: 'Content updated successfully',
                redirect_to: `/admin/cms/${type.slug}/detail/${req.body._id}`,
            })
        } else {
            data.slug = req.body.slug ? slugify(req.body.slug) : undefined
            // Create content
            const save = await Content.create(data)
            if (!save?._id) {
                return res.status(400).json({ error: 'Something went wrong' })
            }
            const collection_cache_key = `data-content-${req.authUser.brand.code}-${countryCode}-${type.slug}`
            Redis.removeCache([collection_cache_key])
            return res.status(200).json({
                message: 'Content added successfully',
                redirect_to: `/admin/cms/${type.slug}/detail/${save._id}`,
            })
        }
    } catch (error) {
        console.log(error)
        return res.status(400).json({ error: 'Something went wrong' })
    }
}

const loadEditorData = async (req, res) => {
    try {
        const contentDetail = await Content.findOne({
            _id: req.params.id,
            type_id: req.contentType._id,
            // brand: session.brand._id,
            country: req.authUser.brand.country,
        })
        // const html_data = await HtmlBuilder.findOne({
        //     _id: req.params.id,
        // })
        return res.status(200).json(contentDetail)
    } catch (error) {
        console.log(error)
        return res.status(500).json(`Something went wrong`)
    }
}

const pageBuildEditor = async (req, res) => {
    try {
        const page_id = req.params.id
        return res.render('admin-njk/cms/content/html-builder/editor', {
            reqContentType: req.contentType,
            page_id,
        })
    } catch (error) {
        return res.render(`admin-njk/error-500`)
    }
}

const savePageBuilderData = async (req, res) => {
    try {
        const page = await Content.findOne({
            _id: req.body.id,
        })
        if (!page) {
            return res.status(404).json({
                error: 'Not Found',
            })
        }
        page.content = {
            name: page.content.name,
            html: req.body.html,
            css: req.body.css,
        }
        await page.save()

        return res.status(200).json('Saved')
    } catch (error) {
        return res.status(500).json(`Something went wrong`)
    }
}

const previewPageBuildData = async (req, res) => {
    try {
        const html_data = await Content.findOne({
            _id: req.params.id,
        })
        return res.render('admin-njk/cms/content/html-builder/view', {
            html_data,
        })
    } catch (error) {
        return res.render(`admin-njk/error-500`)
    }
}

module.exports = {
    list,
    detail,
    edit,
    deleteContent,
    changeStatus,
    add,
    save,
    loadEditorData,
    pageBuildEditor,
    savePageBuilderData,
    previewPageBuildData,
}
