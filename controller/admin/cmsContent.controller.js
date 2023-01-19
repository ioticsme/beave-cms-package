require('dotenv').config()
const _ = require('lodash')
const slugify = require('slugify')
const Joi = require('joi')
const Content = require('../../model/Content')
const Country = require('../../model/Country')
const fs = require('fs')
const { uploadMedia } = require('../../helper/FileUpload.helper')
const { formatInTimeZone } = require('date-fns-tz')
const Banner = require('../../model/Banner')
const Gallery = require('../../model/Gallery')
const { default: collect } = require('collect.js')
const Redis = require('../../helper/Redis.helper')

let session

const list = async (req, res) => {
    try {
        session = req.authUser
        const contentList = await Content.find({
            type_id: req.contentType._id,
            brand: session.selected_brand._id,
            country: session.selected_brand.country,
        }).sort('position')
        res.render(`admin/cms/content/listing`, {
            reqContentType: req.contentType,
            data: contentList,
        })
    } catch (error) {
        return res.render(`admin/error-404`)
    }
}

const detail = async (req, res) => {
    try {
        session = req.authUser
        const contentDetail = await Content.findOne({
            _id: req.params.id,
            type_id: req.contentType._id,
            brand: session.selected_brand._id,
            country: session.selected_brand.country,
        }).populate('author')
        res.render(`admin/cms/content/detail`, {
            reqContentType: req.contentType,
            contentDetail,
        })
    } catch (error) {
        return res.render(`admin/error-404`)
    }
}

const add = async (req, res) => {
    try {
        session = req.authUser
        let allowed_content = {}
        const banners = await Banner.find({
            brand: session?.selected_brand?._id,
            country: session?.selected_brand?.country,
            banner_type: 'web',
            published: true,
        })
        const gallery = await Gallery.find({
            brand: session?.selected_brand?._id,
            country: session?.selected_brand?.country,
            published: true,
        })
        if (req.contentType?.allowed_type?.length) {
            const data = await Content.find({
                brand: session?.selected_brand?._id,
                country: session?.selected_brand?.country,
                published: true,
                type_slug: { $in: req.contentType.allowed_type },
            })
            const collection = collect(data)
            const grouped = collection.groupBy('type_slug')
            allowed_content = JSON.parse(JSON.stringify(grouped.items))
        }
        const has_common_field_groups = collect(
            req.contentType.custom_field_groups
        )
            .where('bilingual', false)
            .count()
        res.render(`admin/cms/content/add`, {
            reqContentType: req.contentType,
            has_common_field_groups: has_common_field_groups ? true : false,
            allowed_content,
            banners,
            gallery,
        })
    } catch (error) {
        return res.render(`admin/error-500`)
    }
}

const edit = async (req, res) => {
    try {
        session = req.authUser
        let allowed_content = {}
        const banners = await Banner.find({
            brand: session?.selected_brand?._id,
            country: session?.selected_brand?.country,
            banner_type: 'web',
            published: true,
        })
        const gallery = await Gallery.find({
            brand: session?.selected_brand?._id,
            country: session?.selected_brand?.country,
            published: true,
        })
        const contentDetail = await Content.findOne({
            _id: req.params.id,
            type_id: req.contentType._id,
            brand: session.selected_brand._id,
            country: session.selected_brand.country,
        })
        if (req.contentType?.allowed_type?.length) {
            const data = await Content.find({
                brand: session?.selected_brand?._id,
                country: session?.selected_brand?.country,
                published: true,
                type_slug: { $in: req.contentType.allowed_type },
            })
            const collection = collect(data)
            const grouped = collection.groupBy('type_slug')
            allowed_content = JSON.parse(JSON.stringify(grouped.items))
        }
        const has_common_custom_fields = collect(req.contentType.custom_fields)
            .where('bilingual', false)
            .count()
        res.render(`admin/cms/content/edit`, {
            reqContentType: req.contentType,
            has_common_custom_fields: has_common_custom_fields ? true : false,
            contentDetail,
            allowed_content,
            banners,
            gallery,
        })
    } catch (error) {
        return res.render(`admin/error-404`)
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
            brand: req.authUser.selected_brand._id,
            country: req.authUser.selected_brand.country,
        })
        return res.status(200).json({
            message: 'Content deleted',
            url: `/cms/${slug}`,
        })
    } catch (error) {
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
                brand: req.authUser.selected_brand._id,
                country: req.authUser.selected_brand.country,
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
        // console.log(req.body)
        // console.log(req.files)
        session = req.authUser
        // BEGIN:: Generating default field validation rule for content type (title, description)
        let defaultValidationObj = {}
        const titleValidationRules = `Joi.string().required()`
        const descriptionValidationRules = `Joi.string().required().min(10)`
        const excerptValidationRules = `Joi.string().allow('',null)`
        const titleValidationObj = {}
        const descriptionValidationObj = {}
        const excerptValidationObj = {}
        req.authUser.selected_brand.languages.forEach((lang) => {
            _.assign(titleValidationObj, {
                [lang.prefix]: eval(titleValidationRules),
            })
            _.assign(descriptionValidationObj, {
                [lang.prefix]: eval(descriptionValidationRules),
            })
            _.assign(excerptValidationObj, {
                [lang.prefix]: eval(excerptValidationRules),
            })
        })

        defaultValidationObj['title'] = Joi.object(titleValidationObj)
        defaultValidationObj['body_content'] = Joi.object(
            descriptionValidationObj
        )
        defaultValidationObj['excerpt'] = Joi.object(excerptValidationObj)
        // ========= Output of the above code is : ==========
        // title: Joi.object({
        // 	en: Joi.string().required().max(200),
        // 	ar: Joi.string().required().max(200),
        // }),
        // body_content: Joi.object({
        // 	en: Joi.string().required().min(50).max(2000),`
        // 	ar: Joi.string().required().min(50).max(2000),
        // }),

        // END:: Generating default field validation rule for content type (title, description)
        // BEGIN:: Generating custom field validation rule for content type
        // let cfValidationObj = {}
        // req.contentType.custom_fields.forEach((element) => {
        //     let validationRules = ''
        //     element.validation.forEach((validationRule) => {
        //         validationRules += `.${validationRule}`
        //     })
        //     if (validationRules) {
        //         if (element.bilingual) {
        //             const validationObject = {}
        //             const URLvalidationObject = {}
        //             if (element.field_type == 'file') {
        //                 req.authUser.selected_brand.languages.forEach(
        //                     (lang) => {
        //                         _.assign(validationObject, {
        //                             [lang.prefix]: eval(
        //                                 req.body.method == 'add'
        //                                     ? element.addValidation ||
        //                                           'Joi.optional().allow(null,"")'
        //                                     : element.editValidation ||
        //                                           'Joi.optional().allow(null,"")'
        //                             ),
        //                         })
        //                         _.assign(URLvalidationObject, {
        //                             [lang.prefix]: eval(`Joi.optional()`),
        //                         })
        //                     }
        //                 )
        //                 cfValidationObj[element.field_name] =
        //                     Joi.object(validationObject)
        //                 cfValidationObj[`${element.field_name}-url`] =
        //                     Joi.object(URLvalidationObject)
        //             } else {
        //                 req.authUser.selected_brand.languages.forEach(
        //                     (lang) => {
        //                         _.assign(validationObject, {
        //                             [lang.prefix]: eval(
        //                                 `Joi${validationRules}`
        //                             ),
        //                         })
        //                     }
        //                 )
        //                 cfValidationObj[element.field_name] =
        //                     Joi.object(validationObject)
        //             }
        //         } else {
        //             cfValidationObj[element.field_name] = eval(
        //                 `Joi${validationRules}`
        //             )
        //         }
        //     }
        // })
        // END:: Generating custom field validation rule for content type
        // BEGIN:: Generating custom field group validation rule for content type
        let cgfValidationObj = {}
        req.contentType.custom_field_groups.forEach((element) => {
            if (element.bilingual) {
                element.fields.forEach((field) => {
                    const validationObject = {}
                    const URLvalidationObject = {}
                    if (element.field_type == 'file') {
                        req.authUser.selected_brand.languages.forEach(
                            (lang) => {
                                _.assign(validationObject, {
                                    [lang.prefix]: eval(
                                        req.body.method == 'add'
                                            ? field.addValidation ||
                                                  'Joi.optional().allow(null,"")'
                                            : field.editValidation ||
                                                  'Joi.optional().allow(null,"")'
                                    ),
                                })
                                _.assign(URLvalidationObject, {
                                    [lang.prefix]: eval(`Joi.optional()`),
                                })
                            }
                        )
                        // cfValidationObj[field.field_name] =
                        //     Joi.object(validationObject)
                        // cfValidationObj[`${field.field_name}-url`] =
                        //     Joi.object(URLvalidationObject)
                    } else {
                        req.authUser.selected_brand.languages.forEach(
                            (lang) => {
                                _.assign(validationObject, {
                                    [lang.prefix]: eval(`${field.validation}`),
                                })
                            }
                        )
                        // cfValidationObj[field.field_name] =
                        //     Joi.object(validationObject)
                    }
                })
            } else {
                // element.fields.forEach((field) => {
                //     cfValidationObj[field.field_name] = eval(field.validation)
                // })
            }
        })
        // END:: Generating custom field group validation rule for content type

        // BEGIN:: Validation rule
        const schema = Joi.object({
            _id: Joi.optional(),
            method: Joi.string().valid('add', 'edit'),
            ...defaultValidationObj,
            // ...cfValidationObj,
            // ...cgfValidationObj,
            slug: Joi.object({
                en: Joi.optional(),
                ar: Joi.optional(),
            }),
            banner: Joi.optional(),
            gallery: Joi.optional(),
            attached_type: Joi.optional(),
            published: Joi.string().required().valid('true', 'false'),
            in_home: Joi.string().required().valid('true', 'false'),
            position: Joi.number().required(),
            repeater_field: Joi.array(),
            meta_title: Joi.object({
                en: Joi.optional(),
                ar: Joi.optional(),
            }),
            meta_description: Joi.object({
                en: Joi.optional(),
                ar: Joi.optional(),
            }),
            meta_keywords: Joi.object({
                en: Joi.optional(),
                ar: Joi.optional(),
            }),
        })
        // END:: Validation rule

        const validationResult = schema.validate(req.body, {
            abortEarly: false,
        })

        if (validationResult.error) {
            // if (req.files && req.files.length) {
            //     for (i = 0; i < req.files.length; i++) {
            //         let file = req.files[i]
            //         // Deleting the image saved to uploads/
            //         fs.unlinkSync(`temp/${file.filename}`)
            //     }
            // }
            console.log(validationResult.error)
            return res.status(422).json(validationResult.error)
        }
        let isEdit = false
        let body = req.body
        if (body._id) {
            isEdit = true
        }
        let type = req.contentType
        const country = await Country.findOne({
            code: session.selected_brand.country_code,
        })
        let customData = {}
        let fieldGroupData = {}
        let metaData = {}
        let images = {}
        // Upload image to imagekit
        // if (req.files && req.files.length) {
        //     let files = collect(req.files).groupBy('fieldname')
        //     files = JSON.parse(JSON.stringify(files))
        //     for (let key in files) {
        //         let imagesToUpload = files[key]
        //         let uploaded = []
        //         for (i = 0; i < imagesToUpload.length; i++) {
        //             let file = imagesToUpload[i]
        //             const base64 = Buffer.from(
        //                 fs.readFileSync(file.path)
        //             ).toString('base64')
        //             const media = await uploadMedia(
        //                 base64,
        //                 'Content',
        //                 file.filename
        //             )
        //             if (media?._id) {
        //                 uploaded.push({
        //                     media_url: media.url,
        //                     media_id: media._id,
        //                 })
        //             }
        //         }
        //         let keyName = key.split('.')[0]
        //         let keyLang = key.split('.')[1]
        //         if (keyLang) {
        //             images[keyName] = {
        //                 ...images[keyName],
        //                 [keyLang]:
        //                     uploaded.length == 1 ? uploaded[0] : uploaded,
        //             }
        //         } else {
        //             images = {
        //                 ...images,
        //                 [keyName]:
        //                     uploaded.length == 1 ? uploaded[0] : uploaded,
        //             }
        //         }
        //     }
        // }
        // console.log('images :>> ', images)
        let customErrors = []
        // If image files are present

        let content_fields_to_insert = []
        session?.selected_brand?.languages.map((lang, langIndex) => {
            req.contentType.custom_fields?.map((cf, cfIndex) => {
                if (cf.bilingual) {
                    customData[lang.prefix] = {
                        ...customData[lang.prefix],
                        field_name: cf.field_name || '',
                        field_value: body?.[cf.field_name]?.[lang.prefix] || '',
                        [cf.field_name]:
                            body?.[cf.field_name]?.[lang.prefix] || '',
                    }
                } else {
                    customData['common'] = {
                        ...customData['common'],
                        field_name: cf.field_name || '',
                        field_value: body?.[cf.field_name]?.[lang.prefix] || '',
                        [cf.field_name]: body[cf.field_name] || '',
                    }
                }
            })

            content_fields_to_insert = [
                ...content_fields_to_insert,
                {
                    language: lang.prefix,
                    group_name: 'general',
                    field: 'title',
                    value: body.title[lang.prefix],
                },
                {
                    language: lang.prefix,
                    group_name: 'general',
                    field: 'description',
                    value: body.body_content[lang.prefix],
                },
                {
                    language: lang.prefix,
                    group_name: 'general',
                    field: 'description',
                    value: body.excerpt[lang.prefix],
                },
            ]

            // Field group
            // req.contentType.custom_field_groups?.map((cfg, cfgIndex) => {
            //     if (cfg.repeater_group) {
            //         if (cfg.bilingual) {
            //             fieldGroupData[lang.prefix] = {
            //                 ...fieldGroupData[lang.prefix],
            //                 [cfg.row_name]: {
            //                     is_repeater: true,
            //                     values: {},
            //                 },
            //             }
            //         } else {
            //             fieldGroupData['common'] = {
            //                 ...fieldGroupData['common'],
            //                 [cfg.row_name]: {
            //                     is_repeater: false,
            //                     values: {},
            //                 },
            //             }
            //         }
            //     } else {
            //         if (cfg.bilingual) {
            //             fieldGroupData[lang.prefix] = {
            //                 ...fieldGroupData[lang.prefix],
            //                 [cfg.row_name]: {
            //                     is_repeater: false,
            //                     values: {},
            //                 },
            //             }
            //         } else {
            //             fieldGroupData['common'] = {
            //                 ...fieldGroupData['common'],
            //                 [cfg.row_name]: {
            //                     is_repeater: false,
            //                     values: {},
            //                 },
            //             }
            //         }
            //     }
            //     cfg.fields?.map((cf) => {
            //         if (cf.field_type === 'file') {
            //             // Image editing start
            //             if (isEdit) {
            //                 if (cfg.bilingual) {
            //                     // if user upload new image
            //                     if (images?.[cf.field_name]?.[lang.prefix]) {
            //                         fieldGroupData[lang.prefix] = {
            //                             ...fieldGroupData[lang.prefix],
            //                             [cf.field_name]:
            //                                 images[cf.field_name][
            //                                     lang.prefix
            //                                 ] || '',
            //                         }
            //                         // if image content have already uploaded image
            //                     } else if (
            //                         body?.[`${[cf.field_name]}-url`]?.[
            //                             lang.prefix
            //                         ]
            //                     ) {
            //                         // this image data is in stringified form so it is parsing to json
            //                         let val = JSON.parse(
            //                             body[`${[cf.field_name]}-url`][
            //                                 lang.prefix
            //                             ]
            //                         )
            //                         fieldGroupData[lang.prefix] = {
            //                             ...fieldGroupData[lang.prefix],
            //                             [cf.field_name]: val || '',
            //                         }
            //                     } else {
            //                         // If no image is uploaded and content have no image then the error object will push to customError array
            //                         customErrors.push({
            //                             message: `${cf.field_name}.${lang.prefix} is not allowed to be empty`,
            //                             path: [
            //                                 `${cf.field_name}`,
            //                                 `${lang.prefix}`,
            //                             ],
            //                         })
            //                     }
            //                 } else {
            //                     // Single language
            //                     // if user upload new image
            //                     if (images?.[cf.field_name]) {
            //                         fieldGroupData['common'] = {
            //                             ...fieldGroupData['common'],
            //                             [cf.field_name]:
            //                                 images[cf.field_name] || '',
            //                         }
            //                         // if image content have already uploaded image
            //                     } else if (body?.[`${[cf.field_name]}-url`]) {
            //                         // this image data is in stringified form so it is parsing to json
            //                         let val = JSON.parse(
            //                             body[`${[cf.field_name]}-url`]
            //                         )
            //                         fieldGroupData['common'] = {
            //                             ...fieldGroupData['common'],
            //                             [cf.field_name]: val || '',
            //                         }
            //                     } else {
            //                         // If no image is uploaded and content have no image then the error object will push to customError array
            //                         customErrors.push({
            //                             message: `${cf.field_name}.${lang.prefix} is not allowed to be empty`,
            //                             path: [
            //                                 `${cf.field_name}`,
            //                                 `${lang.prefix}`,
            //                             ],
            //                         })
            //                     }
            //                 }
            //             }
            //         } else {
            //             if (cfg.bilingual) {
            //                 fieldGroupData[lang.prefix][cfg.row_name][
            //                     'values'
            //                 ] = {
            //                     ...fieldGroupData[lang.prefix]?.[
            //                         cfg.row_name
            //                     ]?.['values'],
            //                     [cf.field_name]:
            //                         body[cf.field_name]?.[lang.prefix] || '',
            //                 }
            //             } else {
            //                 fieldGroupData['common'][cfg.row_name]['values'] = {
            //                     ...fieldGroupData['common']?.[cfg.row_name]?.[
            //                         'values'
            //                     ],
            //                     [cf.field_name]: body[cf.field_name] || '',
            //                 }
            //             }
            //         }
            //     })
            // })
            customData = [
                {
                    // ...customData[lang.prefix],
                    lang: lang.prefix,
                    field_group: {
                        // name: 'test',
                        rows: [
                            {
                                fields: [
                                    {
                                        name: 'title',
                                        value: body.title[lang.prefix],
                                    },
                                    {
                                        name: 'body_content',
                                        value: body.body_content[lang.prefix],
                                    },
                                    {
                                        name: 'excerpt',
                                        value: body.excerpt[lang.prefix],
                                        model_ref: 'User',
                                    },
                                    // title: body.title?.[lang.prefix],
                                    // body_content: body.body_content?.[lang.prefix],
                                    // excerpt: body.excerpt?.[lang.prefix],
                                ],
                            },
                        ],
                    },
                },
            ]

            if (req.contentType.hide_meta == false) {
                metaData[lang.prefix] = {
                    title: body.meta_title[lang.prefix] || undefined,
                    description:
                        body.meta_description[lang.prefix] || undefined,
                    keywords: body.meta_keywords?.[lang.prefix],
                }
            }
        })
        if (customErrors?.length) {
            return res.status(422).json({
                _original: req.body,
                details: customErrors,
            })
        }
        // console.log(content_fields_to_insert)
        // return false
        // Data object to insert
        let data = {
            type_id: type._id,
            type_slug: type.slug,
            author: session.admin_id,
            // brand: session.selected_brand._id,
            banner: body?.banner || null, // If Requested content type has banner required
            gallery: body?.gallery || null, // If Requested content type has gallery required
            brand: req.authUser.selected_brand._id,
            country: req.authUser.selected_brand.country,
            published: body.published === 'true',
            position: body.position,
            // template_name: type.template_name,
            custom_fields: type.custom_fields,
            content: content_fields_to_insert,
            group_content: fieldGroupData,
            meta: metaData,
            in_home: body.in_home || false,
        }
        // console.log('fieldGroupData :>> ', fieldGroupData)
        // console.log(data)
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
        const brandCode = req.authUser.selected_brand?.code
        const countryCode = req.authUser.selected_brand?.country_code

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

module.exports = {
    list,
    detail,
    edit,
    deleteContent,
    changeStatus,
    add,
    save,
}
