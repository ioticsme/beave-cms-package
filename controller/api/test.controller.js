const { default: mongoose } = require('mongoose')

const ContentType = require('../../model/ContentType')
const Content = require('../../model/Content')
const ContentResource = require('../../resources/api/content.resource')
const populateTest = async (req, res) => {
    // console.log("Call");
    // const testData = await Content.findOne({
    //     _id: '63a3e86334101cb21d6cc75a',
    // })
    // testData.content = [
    //     {
    //         language: 'en',
    //         group_name: 'general',
    //         is_repeated: true,
    //         field: 'name',
    //         value: 'Ebrahim',
    //     },
    //     {
    //         language: 'en',
    //         group_name: 'general',
    //         is_repeated: true,
    //         field: 'thumb',
    //         value: mongoose.Types.ObjectId('63c657873f7bb4fd6a91956e'),
    //     },
    //     {
    //         language: 'en',
    //         group_name: 'features',
    //         is_repeated: true,
    //         field: 'points',
    //         value: ['Point 1', 'Point 2'],
    //     },
    //     {
    //         language: 'en',
    //         group_name: 'features',
    //         is_repeated: true,
    //         field: 'featured_image',
    //         value: [
    //             mongoose.Types.ObjectId('63c61ee9bd299f576dd6b2c0'),
    //             mongoose.Types.ObjectId('63c657873f7bb4fd6a91956e'),
    //         ],
    //     },
    // ]
    // await testData.save()
    // return res.json(testData)
    let cf = await Content.aggregate([
        { $match: { type_slug: 'store', published: true } },
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
                attached_content: { $first: '$attached_content' },
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
    // const cf = await Content.find().populate({
    //     path: 'field',
    //     model: ContentType,
    // })

    cf = ContentResource.collection(cf)
    return res.json(cf)
}

module.exports = {
    populateTest,
}
