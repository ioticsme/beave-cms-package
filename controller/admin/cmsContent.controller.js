require('dotenv').config()
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
            return res.render(`admin-njk/error-404`)
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

        // const groupedArray = _.groupBy(contentDetail.content, 'language')
        // for (const language in groupedArray) {
        //     groupedArray[language] = _.groupBy(
        //         groupedArray[language],
        //         'group_name'
        //     )
        //     for (const group_name in groupedArray[language]) {
        //         groupedArray[language][group_name] = _.groupBy(
        //             groupedArray[language][group_name],
        //             'field'
        //         )
        //     }
        // }

        // const groupedData = _.groupBy(contentDetail.content, (item) => {
        //     return item.language
        // })

        // const groupNameGroup = {}
        // const findalContentFieldsGroup = {}

        // Object.keys(groupedData).forEach((key) => {
        //     findalContentFieldsGroup[key] = _.groupBy(
        //         groupedData[key],
        //         'group_name'
        //     )
        // })

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

        // return res.send(contentDetail)

        res.render(`admin-njk/cms/content/detail`, {
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
                published: true,
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
        return res.render(`admin-njk/cms/content/add`, {
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
                published: true,
                type_slug: { $in: req.contentType.allowed_type },
            })
            const collection = collect(data)
            const grouped = collection.groupBy('type_slug')
            allowed_content = JSON.parse(JSON.stringify(grouped.items))
        }
        const has_common_field_groups = collect(req.contentType.field_groups)
            .where('localisation', false)
            .count()

        // return res.json(contentDetail)
        return res.render(`admin-njk/cms/content/edit`, {
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
        // Update
        const update = await Content.findOneAndUpdate(
            {
                _id: id,
                // brand: req.authUser.brand._id,
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
            message: 'Content status changed',
            url: `/cms/${slug}`,
        })
    } catch (error) {
        return res.status(404).json({ error: 'Something went wrong' })
    }
}

const save = async (req, res) => {
    try {
        const language_codes = collect(req.authUser.brand.languages)
            .pluck('prefix')
            .toArray()
        // console.log(req.contentType.field_groups)
        const validationSchema = {}

        _.forEach(req.contentType.field_groups, (row) => {
            _.forEach(row.fields, (field) => {
                validationSchema[field.field_name] = Joi.object({
                    en: Joi.string()
                        .required(field.validation.required)
                        .min(field.validation.min_length)
                        .max(field.validation.max_length),
                })
            })
        })
        console.log(validationSchema)

        // createValidationSchema(req.contentType.field_groups)

        // const customValidationResult = createValidationSchema(
        //     req.contentType.field_groups
        // ).validate(req.body, {
        //     abortEarly: false,
        // })

        // if (customValidationResult.error) {
        //     console.log(customValidationResult.error)
        //     return res.status(422).json(customValidationResult.error)
        // }

        // return false

        // console.log(req.files)
        session = req.authUser
        // BEGIN:: Generating default field validation rule for content type (title, description)
        // let defaultValidationObj = {}
        // let metaValidationObj = {}
        // const titleValidationRules = `Joi.string().required()`
        // const descriptionValidationRules = `Joi.string().required().min(10)`
        // const excerptValidationRules = `Joi.string().allow('',null)`
        // const metaValidationRules = 'Joi.optional()'
        // const titleValidationObj = {}
        // const descriptionValidationObj = {}
        // const excerptValidationObj = {}
        // const metaTitleValidationObj = {}
        // const metaDescriptionValidationObj = {}
        // const metaKeywordsValidationObj = {}
        // req.authUser.brand.languages.forEach((lang) => {
        //     _.assign(titleValidationObj, {
        //         [lang.prefix]: eval(titleValidationRules),
        //     })
        //     _.assign(descriptionValidationObj, {
        //         [lang.prefix]: eval(descriptionValidationRules),
        //     })
        //     _.assign(excerptValidationObj, {
        //         [lang.prefix]: eval(excerptValidationRules),
        //     })
        //     // _.assign(metaTitleValidationObj, {
        //     //     [lang.prefix]: eval(metaValidationRules),
        //     // })
        //     // _.assign(metaDescriptionValidationObj, {
        //     //     [lang.prefix]: eval(metaValidationRules),
        //     // })
        //     // _.assign(metaKeywordsValidationObj, {
        //     //     [lang.prefix]: eval(metaValidationRules),
        //     // })
        // })

        // defaultValidationObj['title'] = Joi.object(titleValidationObj)
        // defaultValidationObj['body_content'] = Joi.object(
        //     descriptionValidationObj
        // )
        // defaultValidationObj['excerpt'] = Joi.object(excerptValidationObj)
        // metaValidationObj['meta_title'] = Joi.object(metaTitleValidationObj)
        // metaValidationObj['meta_description'] = Joi.object(
        //     metaDescriptionValidationObj
        // )
        // metaValidationObj['meta_keywords'] = Joi.object(
        //     metaKeywordsValidationObj
        // )
        // ========= Output of the above code is : ==========
        // title: Joi.object({
        // 	en: Joi.string().required().max(200),
        // 	ar: Joi.string().required().max(200),
        // }),
        // body_content: Joi.object({
        // 	en: Joi.string().required().min(50).max(2000),`
        // 	ar: Joi.string().required().min(50).max(2000),
        // }),

        // BEGIN:: Generating custom field group validation rule for content type
        // let cfgValidationObj = {}
        // req.contentType.custom_field_groups.forEach((element) => {
        //     if (element.localisation) {
        //         element.fields.forEach((field) => {
        //             const validationObject = {}
        //             const URLvalidationObject = {}
        //             if (element.field_type == 'file') {
        //                 req.authUser.brand.languages.forEach(
        //                     (lang) => {
        //                         _.assign(validationObject, {
        //                             [lang.prefix]: eval(
        //                                 req.body.method == 'add'
        //                                     ? field.addValidation ||
        //                                           'Joi.optional().allow(null,"")'
        //                                     : field.editValidation ||
        //                                           'Joi.optional().allow(null,"")'
        //                             ),
        //                         })
        //                         _.assign(URLvalidationObject, {
        //                             [lang.prefix]: eval(`Joi.optional()`),
        //                         })
        //                     }
        //                 )
        //                 cfgValidationObj[field.field_name] =
        //                     Joi.object(validationObject)
        //                 cfgValidationObj[`${field.field_name}-url`] =
        //                     Joi.object(URLvalidationObject)
        //             } else {
        //                 req.authUser.brand.languages.forEach(
        //                     (lang) => {
        //                         _.assign(validationObject, {
        //                             [lang.prefix]: eval(`${field.validation}`),
        //                         })
        //                     }
        //                 )
        //                 cfgValidationObj[field.field_name] =
        //                     Joi.object(validationObject)
        //             }
        //         })
        //     } else {
        //         element.fields.forEach((field) => {
        //             cfgValidationObj[field.field_name] = eval(field.validation)
        //         })
        //     }
        // })
        // END:: Generating custom field group validation rule for content type

        // BEGIN:: Validation rule
        // const schema = Joi.object({
        //     _id: Joi.optional(),
        //     method: Joi.string().valid('add', 'edit'),
        //     // ...defaultValidationObj,
        //     // ...metaValidationObj,
        //     ...cfgValidationObj,
        //     slug: Joi.object({
        //         en: Joi.optional(),
        //         ar: Joi.optional(),
        //     }),
        //     banner: Joi.optional(),
        //     gallery: Joi.optional(),
        //     attached_type: Joi.optional(),
        //     published: Joi.string().required().valid('true', 'false'),
        //     in_home: Joi.string().required().valid('true', 'false'),
        //     position: Joi.number().required(),
        //     repeater_field: Joi.array(),
        // })
        // END:: Validation rule

        const validationResult = validationSchema.validate(req.body, {
            abortEarly: false,
        })

        if (validationResult.error) {
            // console.log(validationResult.error)
            return res.status(422).json(validationResult.error)
        }

        let isEdit = false
        let body = req.body
        if (body._id) {
            isEdit = true
        }
        let type = req.contentType
        // const country = await Country.findOne({
        //     code: session.brand.country_code,
        // })

        let fieldGroupData = {}
        let metaData = {}

        let content_fields_to_insert = []
        session?.brand?.languages.map((lang, langIndex) => {
            // Field group
            req.contentType.custom_field_groups?.map((cfg, cfgIndex) => {
                cfg.fields?.map((cf) => {
                    if (cfg.localisation) {
                        content_fields_to_insert = [
                            ...content_fields_to_insert,
                            {
                                language: lang.prefix,
                                group_name: `${cfg.row_name}`,
                                is_repeated: cfg.repeater_group ? true : false,
                                field: `${cf.field_name}`,
                                value: body[cf.field_name]?.[lang.prefix],
                            },
                        ]
                    } else {
                        content_fields_to_insert = [
                            ...content_fields_to_insert,
                            {
                                language: 'common',
                                group_name: `${cfg.row_name}`,
                                is_repeated: cfg.repeater_group ? true : false,
                                field: `${cf.field_name}`,
                                value: body[cf.field_name],
                            },
                        ]
                    }
                })
            })
            // content_fields_to_insert = [
            //     ...content_fields_to_insert,
            //     {
            //         language: lang.prefix,
            //         group_name: 'general',
            //         field: 'title',
            //         value: body.title[lang.prefix],
            //     },
            //     {
            //         language: lang.prefix,
            //         group_name: 'general',
            //         field: 'description',
            //         value: body.body_content[lang.prefix],
            //     },
            //     {
            //         language: lang.prefix,
            //         group_name: 'general',
            //         field: 'description',
            //         value: body.excerpt[lang.prefix],
            //     },
            // ]
        })

        // console.log('content', content_fields_to_insert)

        // Data object to insert
        let data = {
            type_id: type._id,
            type_slug: type.slug,
            author: session.admin_id,
            // banner: body?.banner || null, // If Requested content type has banner required
            // gallery: body?.gallery || null, // If Requested content type has gallery required
            brand: req.authUser.brand._id,
            country: req.authUser.brand.country,
            published: body.published === 'true',
            position: body.position,
            // template_name: type.template_name,
            custom_fields: type.custom_fields,
            content: content_fields_to_insert,
            // group_content: fieldGroupData,
            // meta: metaData,
            in_home: body.in_home || false,
        }
        console.log('fieldGroupData :>> ', fieldGroupData)
        console.log(data)
        // getting attached contents
        // TODO Find Permanent solution for issue
        // ISSUE : Sometime the data get in the form of array sometime in the form of string
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
        const brandCode = req.authUser.brand?.code
        const countryCode = req.authUser.brand?.country_code

        if (isEdit) {
            data.slug = body.slug?.en
                ? slugify(body.slug?.en?.toLowerCase())
                : slugify(body.title.en.toLowerCase())
            const cache_key = `content-${brandCode}-${countryCode}-${type.slug}-${data.slug}`
            // Update content
            const update = await Content.updateOne({ _id: body._id }, data)
            Redis.removeCache([cache_key])
            return res.status(201).json({
                message: 'Content updated successfully',
                redirect_to: `/admin/cms/${type.slug}/detail/${req.body._id}`,
            })
        } else {
            data.slug = slugify(body.title.en.toLowerCase())
            // Create content
            const save = await Content.create(data)
            if (!save?._id) {
                return res.status(400).json({ error: 'Something went wrong' })
            }
            const cache_key = `content-${brandCode}-${countryCode}-${type.slug}`
            Redis.removeCache([cache_key])
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

const saveTemp = async (req, res) => {
    // console.log(req.body)
    // return false
    try {
        // Data object to insert
        let type = req.contentType
        let body = req.body
        let content_to_insert = _.omit(body, [
            '_id',
            'slug',
            'published',
            'in_home',
            'position',
            'meta',
        ])

        // BEGIN:: Generating content field validation rule for content type
        let validationSchema = {}

        const validTypes = {
            text: 'string()',
            textarea: 'string()',
            richtext: 'string()',
            media: 'string()',
            dropdown: 'string()',
            email: 'string()',
            number: 'number()',
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

                        _.assign(fieldsValidationObject, {
                            [field.field_name]: eval(
                                ` Joi.${
                                    validTypes[field.field_type]
                                }${min}${max}${required}.label('${
                                    field.field_label
                                }')`
                            ),
                        })
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

                        _.assign(fieldsValidationObject, {
                            [field.field_name]: eval(
                                ` Joi.array().items(Joi.${
                                    validTypes[field.field_type]
                                }${min}${max}${required}).label('${
                                    field.field_label
                                }')`
                            ),
                        })
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
            slug: req.contentType.has_cms
                ? Joi.string().required()
                : Joi.string().optional(),
            ...validationSchema,
            attached_type: Joi.optional(),
            meta: Joi.object().optional().allow(null, ''),
            published: Joi.string().required().valid('true', 'false'),
            in_home: Joi.string().required().valid('true', 'false'),
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
            // banner: body?.banner || null, // If Requested content type has banner required
            // gallery: body?.gallery || null, // If Requested content type has gallery required
            // brand: req.authUser.brand._id,
            country: req.authUser.brand.country,
            published: body.published === 'true',
            position: body.position || 0,
            // template_name: type.template_name,
            content: content_to_insert,
            meta: body.meta,
            // group_content: fieldGroupData,
            // meta: metaData,
            in_home: body.in_home || false,
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
            data.slug = req.body.slug ? slugify(req.body.slug) : undefined
            // console.log(data)
            // data.slug = body.slug?.en
            //     ? slugify(body.slug?.en?.toLowerCase())
            //     : slugify(body.title?.en?.toLowerCase())
            const existingContent = await Content.findOne({
                _id: req.body._id,
            })
            const cache_key = `content-${countryCode}-${type.slug}-${existingContent.slug}`
            // Update content
            await Content.updateOne({ _id: req.body._id }, data)
            Redis.removeCache([cache_key])
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
            const cache_key = `content-${countryCode}-${type.slug}`
            Redis.removeCache([cache_key])
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

const saveTempOld = async (req, res) => {
    // console.log(req.body)
    // return false
    try {
        // Data object to insert
        let type = req.contentType
        let body = req.body
        let content_to_insert = _.omit(body, [
            '_id',
            'published',
            'in_home',
            'position',
        ])

        // console.log(req.body)
        const restructuredJson = []

        _.forEach(content_to_insert, (group, groupName) => {
            const group_info = collect(type.field_groups)
                .where('row_name', groupName)
                .first()

            // console.log(group_info)
            if (group_info?.localisation) {
                _.forEach(group, (field, fieldName) => {
                    _.forEach(field, (value, language) => {
                        // console.log(fieldName)
                        // console.log(typeof value)
                        // console.log(isObjectId(value))
                        let value_to_insert = isObjectId(value)
                        if (typeof value == 'object') {
                            value_to_insert = value.map((item) => {
                                return isObjectId(item)
                            })
                        }
                        restructuredJson.push({
                            language: language || 'common',
                            group_name: groupName,
                            is_repeated: group_info['repeater_group'] || false,
                            field: fieldName,
                            value: value_to_insert,
                        })
                        // console.log(restructuredJson)
                    })
                })
            } else {
                if (group_info && group_info['repeater_group']) {
                    _.forEach(group, (field, fieldName) => {
                        _.forEach(field, (value) => {
                            let value_to_insert = isObjectId(value)
                            if (typeof value == 'object') {
                                value_to_insert = value.map((item) => {
                                    return isObjectId(item)
                                })
                            }
                            restructuredJson.push({
                                language: 'common',
                                group_name: groupName,
                                is_repeated:
                                    group_info['repeater_group'] || false,
                                field: fieldName,
                                value: value_to_insert,
                            })
                        })
                    })
                } else {
                    _.forEach(group, (field, fieldName) => {
                        let value_to_insert = isObjectId(field)
                        if (typeof field == 'object') {
                            value_to_insert = field.map((item) => {
                                return isObjectId(item)
                            })
                        }
                        restructuredJson.push({
                            language: 'common',
                            group_name: groupName,
                            is_repeated:
                                group_info && group_info['repeater_group']
                                    ? group_info['repeater_group']
                                    : false,
                            field: fieldName,
                            value: value_to_insert,
                        })
                    })
                }
            }
        })

        let data = {
            type_id: type._id,
            type_slug: type.slug,
            author: req.authUser.admin_id,
            // banner: body?.banner || null, // If Requested content type has banner required
            // gallery: body?.gallery || null, // If Requested content type has gallery required
            // brand: req.authUser.brand._id,
            country: req.authUser.brand.country,
            published: body.published === 'true',
            position: body.position,
            // template_name: type.template_name,
            content: restructuredJson,
            // group_content: fieldGroupData,
            // meta: metaData,
            in_home: body.in_home || false,
        }

        // console.log(data)
        //  console.log(req.body)
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
        const brandCode = req.authUser.brand?.code
        const countryCode = req.authUser.brand?.country_code

        if (req.body._id) {
            console.log(data)
            // data.slug = body.slug?.en
            //     ? slugify(body.slug?.en?.toLowerCase())
            //     : slugify(body.title?.en?.toLowerCase())
            const existingContent = await Content.findOne({
                _id: req.body._id,
            })
            const cache_key = `content-${brandCode}-${countryCode}-${type.slug}-${existingContent.slug}`
            // Update content
            await Content.updateOne({ _id: body._id }, data)
            Redis.removeCache([cache_key])
            return res.status(201).json({
                message: 'Content updated successfully',
                redirect_to: `/admin/cms/${type.slug}/detail/${req.body._id}`,
            })
        } else {
            data.slug = slugify(restructuredJson[0].value.toLowerCase())
            // Create content
            const save = await Content.create(data)
            if (!save?._id) {
                return res.status(400).json({ error: 'Something went wrong' })
            }
            const cache_key = `content-${brandCode}-${countryCode}-${type.slug}`
            Redis.removeCache([cache_key])
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

module.exports = {
    list,
    detail,
    edit,
    deleteContent,
    changeStatus,
    add,
    save,
    saveTemp,
}
