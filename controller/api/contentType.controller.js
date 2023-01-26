require('dotenv').config()
const _ = require('lodash')
const { getCache, setCache } = require('../../helper/Redis.helper')
const ContentType = require('../../model/ContentType')
const Content = require('../../model/Content')
const ContentResource = require('../../resources/api/content.resource')
const ContentPathResource = require('../../resources/api/contentPath.resource')
const { default: collect } = require('collect.js')
const { default: mongoose } = require('mongoose')

const list = async (req, res) => {
    try {
        const cache_key = `data-content-${req.brand.code}-${req.brand.country_code}-${req.params.contentType}`

        const contentType = await ContentType.findOne({
            slug: req.params.contentType,
        })
        const contents = await getCache(cache_key)
            .then(async (data) => {
                if (process.env.CACHE_LOCAL_DATA == 'true' && data) {
                    return JSON.parse(data)
                } else {
                    let allContents
                    let liveData

                    allContents = await Content.aggregate([
                        {
                            $match: {
                                type_id: {
                                    $ne: mongoose.Types.ObjectId(
                                        contentType?._id
                                    ),
                                },
                                country: mongoose.Types.ObjectId(
                                    req.country._id
                                ),
                                published: true,
                            },
                        },
                        {
                            $lookup: {
                                from: 'countries',
                                localField: 'country',
                                foreignField: '_id',
                                as: 'country',
                            },
                        },
                        // {
                        //     $lookup: {
                        //         from: 'brands',
                        //         localField: 'brand',
                        //         foreignField: '_id',
                        //         as: 'brand',
                        //     },
                        // },
                        { $unwind: '$content' },
                        {
                            $match: {
                                'content.language': {
                                    $in: [req.language, 'common'],
                                },
                            },
                        },
                        {
                            $lookup: {
                                from: 'media',
                                localField: 'content.value',
                                foreignField: '_id',
                                as: 'content.related_model',
                            },
                        },
                        {
                            $group: {
                                _id: '$_id',
                                slug: { $first: '$slug' },
                                type_slug: { $first: '$type_slug' },
                                type_id: { $first: '$type_id' },
                                author: { $first: '$author' },
                                brand: { $first: '$brand' },
                                country: { $first: '$country' },
                                position: { $first: '$position' },
                                attached_content: {
                                    $first: '$attached_content',
                                },
                                fields: {
                                    $push: '$content',
                                },
                            },
                        },
                        {
                            $project: {
                                _id: 1,
                                slug: 1,
                                type_id: 1,
                                type_slug: 1,
                                author: 1,
                                published: 1,
                                position: 1,
                                'country._id': 1,
                                'country.name': 1,
                                'country.code': 1,
                                'fields.language': 1,
                                'fields.group_name': 1,
                                'fields.field': 1,
                                'fields.value': 1,
                                'fields.related_model': 1,
                                attached_type: 1,
                                // 'content.language': 1,
                                // 'content.group_name': 1,
                                // 'content.field': 1,
                                // 'content.value': 1,
                            },
                        },
                    ]).exec()

                    liveData = await Content.aggregate([
                        {
                            $match: {
                                type_id: mongoose.Types.ObjectId(
                                    contentType?._id
                                ),
                                country: mongoose.Types.ObjectId(
                                    req.country._id
                                ),
                                published: true,
                            },
                        },
                        {
                            $lookup: {
                                from: 'countries',
                                localField: 'country',
                                foreignField: '_id',
                                as: 'country',
                            },
                        },
                        // {
                        //     $lookup: {
                        //         from: 'brands',
                        //         localField: 'brand',
                        //         foreignField: '_id',
                        //         as: 'brand',
                        //     },
                        // },
                        { $unwind: '$content' },
                        {
                            $match: {
                                'content.language': {
                                    $in: [req.language, 'common'],
                                },
                            },
                        },
                        {
                            $lookup: {
                                from: 'media',
                                localField: 'content.value',
                                foreignField: '_id',
                                as: 'content.related_model',
                            },
                        },
                        {
                            $group: {
                                _id: '$_id',
                                slug: { $first: '$slug' },
                                type_slug: { $first: '$type_slug' },
                                type_id: { $first: '$type_id' },
                                author: { $first: '$author' },
                                brand: { $first: '$brand' },
                                country: { $first: '$country' },
                                position: { $first: '$position' },
                                attached_content: {
                                    $first: '$attached_content',
                                },
                                fields: {
                                    $push: '$content',
                                },
                            },
                        },
                        {
                            $project: {
                                _id: 1,
                                slug: 1,
                                type_id: 1,
                                type_slug: 1,
                                author: 1,
                                published: 1,
                                position: 1,
                                'country._id': 1,
                                'country.name': 1,
                                'country.code': 1,
                                'fields.language': 1,
                                'fields.group_name': 1,
                                'fields.field': 1,
                                'fields.value': 1,
                                'fields.related_model': 1,
                                attached_type: 1,
                                // 'content.language': 1,
                                // 'content.group_name': 1,
                                // 'content.field': 1,
                                // 'content.value': 1,
                            },
                        },
                    ]).exec()

                    let liveContent = []
                    if (liveData?.length) {
                        // Looping through contents
                        for (i = 0; i < liveData.length; i++) {
                            let addedContent = []
                            // if content has attached type array
                            // then looping through the attached type array
                            if (liveData[i].attached_type?.length) {
                                let attachedType = liveData[i].attached_type
                                for (j = 0; j < attachedType.length; j++) {
                                    const items = attachedType[j].items
                                    let addedItems = []
                                    // looping through the items array containing the id of the contents
                                    for (k = 0; k < items.length; k++) {
                                        // finding the matched content from all content
                                        const content = await allContents.find(
                                            (content) =>
                                                content._id.toString() ==
                                                items[k].toString()
                                        )
                                        // pushing the matched content to an array
                                        addedItems.push(
                                            new ContentResource(content).exec()
                                        )
                                    }
                                    let obj = {
                                        content_type:
                                            attachedType[j].content_type,
                                        items: addedItems,
                                    }
                                    // pushing the obj to array
                                    addedContent.push(obj)
                                }
                                // adding the attched content array to content
                                let contentObj = {
                                    ...liveData[i]?._doc,
                                    attached_content: addedContent,
                                }
                                liveContent.push(contentObj)
                            } else {
                                liveContent.push(liveData[i])
                            }
                        }
                    }
                    const liveDataCollection = await ContentResource.collection(
                        liveContent
                    )

                    if (
                        process.env.CACHE_LOCAL_DATA == 'true' &&
                        liveContent?.length
                    ) {
                        // console.log(JSON.stringify(liveDataCollection))
                        setCache(
                            cache_key,
                            JSON.stringify(liveDataCollection),
                            60 * 60 * 24 * 30
                        )
                    }

                    return liveDataCollection
                }
            })
            .catch((err) => {
                console.log(err)
                // TODO:: Send slack notification for redis connection fail on authentication
            })

        res.status(200).json({
            [req.params.contentType]: contentType.single_type ? contents[0] : contents,
            navigation: contentType.nav_on_collection_api
                ? req.navigation
                : undefined,
        })
    } catch (error) {
        return res.status(500).json({ error: `Something went wrong` })
    }
}

const detail = async (req, res) => {
    try {
        const cache_key = `data-content-${req.brand.code}-${req.brand.country_code}-${req.params.contentType}-${req.params.slug}`
        const contentType = await ContentType.findOne({
            slug: req.params.contentType,
        })
        const contents = await getCache(cache_key)
            .then(async (data) => {
                if (process.env.CACHE_LOCAL_DATA == 'true' && data) {
                    return JSON.parse(data)
                } else {
                    const liveData = await Content.aggregate([
                        {
                            $match: {
                                type_id: mongoose.Types.ObjectId(
                                    contentType?._id
                                ),
                                slug: req.params.slug,
                                country: mongoose.Types.ObjectId(
                                    req.country._id
                                ),
                                published: true,
                                deletedAt: null,
                            },
                        },
                        {
                            $lookup: {
                                from: 'countries',
                                localField: 'country',
                                foreignField: '_id',
                                as: 'country',
                            },
                        },
                        // {
                        //     $lookup: {
                        //         from: 'brands',
                        //         localField: 'brand',
                        //         foreignField: '_id',
                        //         as: 'brand',
                        //     },
                        // },
                        { $unwind: '$content' },
                        {
                            $match: {
                                'content.language': {
                                    $in: [req.language, 'common'],
                                },
                            },
                        },
                        {
                            $lookup: {
                                from: 'media',
                                localField: 'content.value',
                                foreignField: '_id',
                                as: 'content.related_model',
                            },
                        },
                        {
                            $group: {
                                _id: '$_id',
                                slug: { $first: '$slug' },
                                type_slug: { $first: '$type_slug' },
                                type_id: { $first: '$type_id' },
                                author: { $first: '$author' },
                                brand: { $first: '$brand' },
                                country: { $first: '$country' },
                                position: { $first: '$position' },
                                attached_content: {
                                    $first: '$attached_content',
                                },
                                fields: {
                                    $push: '$content',
                                },
                            },
                        },
                        {
                            $project: {
                                _id: 1,
                                slug: 1,
                                type_id: 1,
                                type_slug: 1,
                                author: 1,
                                published: 1,
                                position: 1,
                                'country._id': 1,
                                'country.name': 1,
                                'country.code': 1,
                                'fields.language': 1,
                                'fields.group_name': 1,
                                'fields.field': 1,
                                'fields.value': 1,
                                'fields.related_model': 1,
                                attached_type: 1,
                                // 'content.language': 1,
                                // 'content.group_name': 1,
                                // 'content.field': 1,
                                // 'content.value': 1,
                            },
                        },
                    ]).exec()
                    // BEGIN:: Fetching Attached Contents
                    let attached_contents
                    if (liveData?.attached_type?.length) {
                        const attach_conetnt_ids = collect(
                            liveData.attached_type
                        )
                            .pluck('items')
                            .toArray()
                            .flat()
                        const attached_contents_db_data = await Content.find({
                            _id: { $in: attach_conetnt_ids },
                        }).select('-meta')
                        const mapped_attached_data = ContentResource.collection(
                            attached_contents_db_data
                        )
                        attached_contents = collect(mapped_attached_data)
                            .groupBy('type_slug')
                            .all()
                    }
                    // END:: Fetching Attached Contents

                    const liveDataCollection = new ContentResource(
                        liveData?.[0]
                    ).exec()

                    if (liveDataCollection?.meta) {
                        const globalMeta = req.brand?.domains?.meta
                        // If content has no meta tags then the global meta details will be added
                        let localMeta = {
                            en: {
                                title: liveDataCollection.meta?.en?.title
                                    ? liveDataCollection.meta.en.title
                                    : globalMeta.title?.en,
                                description: liveDataCollection.meta?.en
                                    ?.description
                                    ? liveDataCollection.meta.en.description
                                    : globalMeta.description?.en,
                                keywords: liveDataCollection.meta?.en?.keywords
                                    ? liveDataCollection.meta.en.keywords
                                    : globalMeta.keywords?.en,
                                og_image: liveDataCollection.meta?.en?.og_image
                                    ?.media_url
                                    ? liveDataCollection.meta.en.og_image
                                    : globalMeta.og_image?.en,
                            },
                            ar: {
                                title: liveDataCollection.meta?.ar?.title
                                    ? liveDataCollection.meta.ar.title
                                    : globalMeta.title?.ar,
                                description: liveDataCollection.meta?.ar
                                    ?.description
                                    ? liveDataCollection.meta.ar.description
                                    : globalMeta.description?.ar,
                                keywords: liveDataCollection.meta?.ar?.keywords
                                    ? liveDataCollection.meta.ar.keywords
                                    : globalMeta.keywords?.ar,
                                og_image: liveDataCollection.meta?.ar?.og_image
                                    ?.media_url
                                    ? liveDataCollection.meta.ar.og_image
                                    : globalMeta.og_image?.ar,
                            },
                        }
                        liveDataCollection.meta = localMeta
                    } else {
                        const globalMeta = req.brand?.domains?.meta
                        // Restructuring the global meta
                        const newGlobalMeta = {
                            en: {
                                title: globalMeta.title.en,
                                description: globalMeta.description.en,
                                keywords: globalMeta.keywords.en,
                                og_image: globalMeta.og_image.en,
                            },
                            ar: {
                                title: globalMeta.title.ar,
                                description: globalMeta.description.ar,
                                keywords: globalMeta.keywords.ar,
                                og_image: globalMeta.og_image.ar,
                            },
                        }
                        liveDataCollection.meta = newGlobalMeta
                    }

                    if (process.env.CACHE_LOCAL_DATA == 'true' && liveData) {
                        setCache(
                            cache_key,
                            JSON.stringify({
                                ...liveDataCollection,
                                attached_contents: attached_contents,
                            }),
                            60 * 60 * 24 * 30
                        )
                    }
                    return {
                        ...liveDataCollection,
                        attached_contents: attached_contents,
                    }
                }
            })
            .catch((err) => {
                console.log(err)
                // TODO:: Send slack notification for redis connection fail on authentication
            })

        res.status(200).json({
            [req.params.contentType]: contents,
            navigation: contentType.nav_on_collection_api
                ? req.navigation
                : undefined,
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: `Something went wrong` })
    }
}

const generateStaticPath = async (req, res) => {
    try {
        const contentType = await ContentType.findOne({
            slug: req.params.contentType,
        })
        const contents = await Content.find({
            type_id: contentType._id,
            brand: req.brand._id,
            // country: req.country._id,
            published: true,
        })
            .select('country slug')
            .populate('country')
        // res.status(200).json(contents)
        res.status(200).json(ContentPathResource.collection(contents))
    } catch (error) {
        return res.status(500).json({ error: `Something went wrong` })
    }
}

module.exports = {
    list,
    detail,
    generateStaticPath,
}
