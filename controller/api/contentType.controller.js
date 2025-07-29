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
const { logError } = require('../../helper/Logger.helper')

const list = async (req, res) => {
    try {
        const cache_key = `${envConfig.cache.CACHE_KEY_PREFIX}-content-${req.brand.code}-${req.brand.country_code}-${req.params.contentType}`

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
                        isDeleted: false,
                    })
                        .sort('position')
                        .populate('author')
                        .populate('country')
                        .populate({
                            path: 'form',
                            // populate: {
                            //     path: 'fields.product',
                            //     populate: {
                            //         path: 'country',
                            //     },
                            // },
                        })

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
                        isDeleted: false,
                    })
                        .sort('position')
                        .populate('author')
                        .populate('country')
                        .populate({
                            path: 'form',
                            // populate: {
                            //     path: 'fields.product',
                            //     populate: {
                            //         path: 'country',
                            //     },
                            // },
                        })
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
        logError(error)
        return res.status(500).json({ error: `Something went wrong` })
    }
}

const detail = async (req, res) => {
    try {
        const cache_key = `${envConfig.cache.CACHE_KEY_PREFIX}-content-${req.brand.code}-${req.brand.country_code}-${req.params.contentType}-${req.params.slug}`
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
                        isDeleted: false,
                    })
                        .populate('author')
                        .populate('country')
                        .populate({
                            path: 'form',
                            // populate: {
                            //     path: 'fields.product',
                            //     populate: {
                            //         path: 'country',
                            //     },
                            // },
                        })

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
                            isDeleted: false,
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
        logError(error)
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
            isDeleted: false,
            published: true,
        })
            .select('country slug')
            .populate('country')
        // res.status(200).json(contents)
        res.status(200).json(ContentPathResource.collection(contents))
    } catch (error) {
        logError(error)
        return res.status(500).json({ error: `Something went wrong` })
    }
}

module.exports = {
    list,
    detail,
    generateStaticPath,
}
