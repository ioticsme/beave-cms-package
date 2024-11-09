const envConfig = require('../../config/env.config')
const _ = require('lodash')
const { getCache, setCache } = require('../../helper/Redis.helper')
const ContentType = require('../../model/ContentType')
const Content = require('../../model/Content')
const ContentResource = require('../../resources/api/content.resource')
const ContentPathResource = require('../../resources/api/contentPath.resource')
const { default: collect } = require('collect.js')
const { default: mongoose } = require('mongoose')
const { filteringScheduledCMSItems } = require('../../helper/Operations.helper')

// const listOld = async (req, res) => {
//     try {
//         const cache_key = `data-content-${req.brand.country_code}-${req.params.contentType}`

//         const contentType = await ContentType.findOne({
//             slug: req.params.contentType,
//         })
//         const contents = await getCache(cache_key)
//             .then(async (data) => {
//                 if (envConfig.cache.ACTIVE == 'true' && data) {
//                     return JSON.parse(data)
//                 } else {
//                     let allContents
//                     let liveData

//                     allContents = await Content.aggregate([
//                         {
//                             $match: {
//                                 type_id: {
//                                     $ne: mongoose.Types.ObjectId(
//                                         contentType?._id
//                                     ),
//                                 },
//                                 country: mongoose.Types.ObjectId(
//                                     req.country._id
//                                 ),
//                                 published: true,
//                             },
//                         },
//                         {
//                             $lookup: {
//                                 from: 'countries',
//                                 localField: 'country',
//                                 foreignField: '_id',
//                                 as: 'country',
//                             },
//                         },
//                         // {
//                         //     $lookup: {
//                         //         from: 'brands',
//                         //         localField: 'brand',
//                         //         foreignField: '_id',
//                         //         as: 'brand',
//                         //     },
//                         // },
//                         { $unwind: '$content' },
//                         {
//                             $match: {
//                                 'content.language': {
//                                     $in: [req.language, 'common'],
//                                 },
//                             },
//                         },
//                         {
//                             $lookup: {
//                                 from: 'beave_medias',
//                                 localField: 'content.value',
//                                 foreignField: '_id',
//                                 as: 'content.related_model',
//                             },
//                         },
//                         {
//                             $group: {
//                                 _id: '$_id',
//                                 slug: { $first: '$slug' },
//                                 type_slug: { $first: '$type_slug' },
//                                 type_id: { $first: '$type_id' },
//                                 author: { $first: '$author' },
//                                 brand: { $first: '$brand' },
//                                 country: { $first: '$country' },
//                                 position: { $first: '$position' },
//                                 attached_content: {
//                                     $first: '$attached_content',
//                                 },
//                                 fields: {
//                                     $push: '$content',
//                                 },
//                             },
//                         },
//                         {
//                             $project: {
//                                 _id: 1,
//                                 slug: 1,
//                                 type_id: 1,
//                                 type_slug: 1,
//                                 author: 1,
//                                 published: 1,
//                                 position: 1,
//                                 'country._id': 1,
//                                 'country.name': 1,
//                                 'country.code': 1,
//                                 'fields.language': 1,
//                                 'fields.group_name': 1,
//                                 'fields.field': 1,
//                                 'fields.value': 1,
//                                 'fields.related_model': 1,
//                                 attached_type: 1,
//                                 // 'content.language': 1,
//                                 // 'content.group_name': 1,
//                                 // 'content.field': 1,
//                                 // 'content.value': 1,
//                             },
//                         },
//                     ]).exec()

//                     liveData = await Content.aggregate([
//                         {
//                             $match: {
//                                 type_id: mongoose.Types.ObjectId(
//                                     contentType?._id
//                                 ),
//                                 country: mongoose.Types.ObjectId(
//                                     req.country._id
//                                 ),
//                                 published: true,
//                             },
//                         },
//                         {
//                             $lookup: {
//                                 from: 'countries',
//                                 localField: 'country',
//                                 foreignField: '_id',
//                                 as: 'country',
//                             },
//                         },
//                         // {
//                         //     $lookup: {
//                         //         from: 'brands',
//                         //         localField: 'brand',
//                         //         foreignField: '_id',
//                         //         as: 'brand',
//                         //     },
//                         // },
//                         { $unwind: '$content' },
//                         {
//                             $match: {
//                                 'content.language': {
//                                     $in: [req.language, 'common'],
//                                 },
//                             },
//                         },
//                         {
//                             $lookup: {
//                                 from: 'beave_medias',
//                                 localField: 'content.value',
//                                 foreignField: '_id',
//                                 as: 'content.related_model',
//                             },
//                         },
//                         {
//                             $group: {
//                                 _id: '$_id',
//                                 slug: { $first: '$slug' },
//                                 type_slug: { $first: '$type_slug' },
//                                 type_id: { $first: '$type_id' },
//                                 author: { $first: '$author' },
//                                 brand: { $first: '$brand' },
//                                 country: { $first: '$country' },
//                                 position: { $first: '$position' },
//                                 attached_content: {
//                                     $first: '$attached_content',
//                                 },
//                                 fields: {
//                                     $push: '$content',
//                                 },
//                             },
//                         },
//                         {
//                             $project: {
//                                 _id: 1,
//                                 slug: 1,
//                                 type_id: 1,
//                                 type_slug: 1,
//                                 author: 1,
//                                 published: 1,
//                                 position: 1,
//                                 'country._id': 1,
//                                 'country.name': 1,
//                                 'country.code': 1,
//                                 'fields.language': 1,
//                                 'fields.group_name': 1,
//                                 'fields.field': 1,
//                                 'fields.value': 1,
//                                 'fields.related_model': 1,
//                                 attached_type: 1,
//                                 // 'content.language': 1,
//                                 // 'content.group_name': 1,
//                                 // 'content.field': 1,
//                                 // 'content.value': 1,
//                             },
//                         },
//                     ]).exec()

//                     let liveContent = []
//                     if (liveData?.length) {
//                         // Looping through contents
//                         for (i = 0; i < liveData.length; i++) {
//                             let addedContent = []
//                             // if content has attached type array
//                             // then looping through the attached type array
//                             if (liveData[i].attached_type?.length) {
//                                 let attachedType = liveData[i].attached_type
//                                 for (j = 0; j < attachedType.length; j++) {
//                                     const items = attachedType[j].items
//                                     let addedItems = []
//                                     // looping through the items array containing the id of the contents
//                                     for (k = 0; k < items.length; k++) {
//                                         // finding the matched content from all content
//                                         const content = await allContents.find(
//                                             (content) =>
//                                                 content._id.toString() ==
//                                                 items[k].toString()
//                                         )
//                                         // pushing the matched content to an array
//                                         addedItems.push(
//                                             new ContentResource(content).exec()
//                                         )
//                                     }
//                                     let obj = {
//                                         content_type:
//                                             attachedType[j].content_type,
//                                         items: addedItems,
//                                     }
//                                     // pushing the obj to array
//                                     addedContent.push(obj)
//                                 }
//                                 // adding the attched content array to content
//                                 let contentObj = {
//                                     ...liveData[i]?._doc,
//                                     attached_content: addedContent,
//                                 }
//                                 liveContent.push(contentObj)
//                             } else {
//                                 liveContent.push(liveData[i])
//                             }
//                         }
//                     }
//                     const liveDataCollection = await ContentResource.collection(
//                         liveContent
//                     )

//                     // return res.json(liveContent)

//                     if (
//                         envConfig.cache.ACTIVE == 'true' &&
//                         liveContent?.length
//                     ) {
//                         // console.log(JSON.stringify(liveDataCollection))
//                         setCache(
//                             cache_key,
//                             JSON.stringify(liveDataCollection),
//                             60 * 60 * 24 * 30
//                         )
//                     }

//                     return liveDataCollection
//                 }
//             })
//             .catch((err) => {
//                 console.log(err)
//                 // TODO:: Send slack notification for redis connection fail on authentication
//             })

//         return res.status(200).json({
//             [req.params.contentType]: contentType.single_type ? contents[0] : contents,
//             navigation: contentType.nav_on_collection_api
//                 ? req.navigation
//                 : undefined,
//         })
//     } catch (error) {
//         return res.status(500).json({ error: `Something went wrong` })
//     }
// }

const list = async (req, res) => {
    try {
        const cache_key = `data-content-${req.brand.code}-${req.brand.country_code}-${req.params.contentType}`

        const contentType = await ContentType.findOne({
            active: true,
            slug: req.params.contentType,
            brand: { $in: [req.brand._id] },
        })

        if (!contentType) {
            return res.status(404).json({ error: `Content Type not exist` })
        }

        const contents = await getCache(cache_key)
            .then(async (data) => {
                if (envConfig.cache.ACTIVE == 'true' && data) {
                    return JSON.parse(data)
                } else {
                    let allContents
                    let liveData

                    allContents = await Content.find({
                        type_id: {
                            $ne: mongoose.Types.ObjectId(contentType?._id),
                        },
                        country: mongoose.Types.ObjectId(req.country._id),
                        $or: [{ status: 'published' }, { status: 'scheduled' }],
                    })
                        .sort('position')
                        .populate('author')
                        .populate('country')

                    liveData = await Content.find({
                        type_id: mongoose.Types.ObjectId(contentType?._id),
                        country: mongoose.Types.ObjectId(req.country._id),
                        brand: mongoose.Types.ObjectId(req.brand._id),
                        $or: [
                            { status: 'published' },
                            {
                                status: 'scheduled',
                                // $and: [
                                //     {
                                //         $or: [
                                //             {
                                //                 'scheduled_at.start': {
                                //                     $exists: false,
                                //                 }, // start date is empty
                                //             },
                                //             {
                                //                 'scheduled_at.start': null, // start date is null
                                //             },
                                //             {
                                //                 'scheduled_at.start': {
                                //                     $lte: new Date(),
                                //                 },
                                //             }, // scheduled_at is a valid date and less than or equal to the current date
                                //         ],
                                //     },
                                //     {
                                //         $or: [
                                //             {
                                //                 'scheduled_at.end': {
                                //                     $exists: false,
                                //                 }, // end date is empty
                                //             },
                                //             {
                                //                 'scheduled_at.end': null, // end date is null
                                //             },
                                //             {
                                //                 'scheduled_at.end': {
                                //                     $gte: new Date(),
                                //                 },
                                //             }, // scheduled_at is a valid date and greater than or equal to the current date
                                //         ],
                                //     },
                                // ],
                            },
                        ],
                    })
                        .sort('position')
                        .populate('author')
                        .populate('country')
                        .select(contentType.has_meta ? {} : '-meta')

                    let liveContent = []
                    if (liveData?.length) {
                        // Looping through contents
                        for (i = 0; i < liveData.length; i++) {
                            let addedContent = []
                            // if content has attached type array
                            // then looping through the attached type array
                            if (liveData[i].attached_type?.length) {
                                let attachedType = liveData[i].attached_type
                                for (let each_attach_type of attachedType) {
                                    const items = each_attach_type.items
                                    // console.log(attachedType)
                                    // console.log(items)
                                    let addedItems = []
                                    // looping through the items array containing the id of the contents
                                    for (let each_attach_content of each_attach_type.items) {
                                        // finding the matched content from all content
                                        const content = await allContents.find(
                                            (content) =>
                                                content._id.toString() ==
                                                each_attach_content.toString()
                                        )
                                        // pushing the matched content to an array
                                        addedItems.push(
                                            new ContentResource(content).exec()
                                        )
                                    }
                                    let obj = {
                                        content_type:
                                            each_attach_type.content_type,
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

                    // return res.json(liveContent)

                    if (
                        envConfig.cache.ACTIVE == 'true' &&
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

        if (contentType.single_type && !contents.length) {
            return res.status(404).json({ error: `Not Found` })
        }
        // BEGIN::Filtering scheduled items
        const filteredData = await filteringScheduledCMSItems(contents)
        // END::Filtering scheduled items

        // return res.json(filteredData)
        return res.status(200).json({
            [req.params.contentType]: contentType.single_type
                ? filteredData[0]
                : filteredData,
            collection_meta: contentType.has_meta
                ? contentType.meta
                : undefined,
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
            active: true,
            slug: req.params.contentType,
            brand: { $in: [req.brand._id] },
        })

        if (!contentType) {
            return res.status(404).json({ error: `Content Type not exist` })
        }

        const content = await getCache(cache_key)
            .then(async (data) => {
                if (envConfig.cache.ACTIVE == 'true' && data) {
                    return JSON.parse(data)
                } else {
                    let liveData = await Content.findOne({
                        type_id: mongoose.Types.ObjectId(contentType?._id),
                        country: mongoose.Types.ObjectId(req.country._id),
                        brand: mongoose.Types.ObjectId(req.brand._id),
                        slug: req.params.slug,
                        $or: [{ status: 'published' }, { status: 'scheduled' }],
                    })
                        .populate('author')
                        .populate('country')

                    if (!liveData?._id) {
                        return false
                    }
                    // BEGIN:: Fetching Attached Contents
                    let attached_contents
                    if (liveData?.attached_type?.length) {
                        const attach_content_ids = collect(
                            liveData.attached_type
                        )
                            .pluck('items')
                            .toArray()
                            .flat()
                        const attached_contents_db_data = await Content.find({
                            _id: { $in: attach_content_ids },
                            brand: req.brand._id,
                        }).select('-meta')
                        const mapped_attached_data = ContentResource.collection(
                            attached_contents_db_data
                        )
                        attached_contents = collect(mapped_attached_data)
                            .groupBy('type')
                            .all()
                    }
                    // END:: Fetching Attached Contents

                    if (contentType.has_meta == false) {
                        liveData.meta = undefined
                    }
                    const liveDataCollection = new ContentResource(
                        liveData
                    ).exec()

                    if (
                        envConfig.cache.ACTIVE == 'true' &&
                        liveData &&
                        liveData.status == 'published'
                    ) {
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

        // BEGIN::Filtering scheduled items
        // const filteredData = await filteringScheduledCMSItems(contents)
        // return res.json(contents)
        // END::Filtering scheduled items

        if (!content) {
            return res.status(404).json({ error: `Not Found` })
        }
        res.status(200).json({
            [req.params.contentType]: content,
            navigation: contentType.nav_on_single_api
                ? req.navigation
                : undefined,
        })
    } catch (error) {
        // console.log(error)
        return res.status(500).json({ error: `Something went wrong` })
    }
}

const generateStaticPath = async (req, res) => {
    try {
        const contentType = await ContentType.findOne({
            active: true,
            slug: req.params.contentType,
            brand: { $in: [req.brand._id] },
        })

        if (!contentType) {
            return res.status(404).json({ error: `Content Type not exist` })
        }

        const contents = await Content.find({
            type_id: contentType._id,
            //brand: req.brand._id,
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
