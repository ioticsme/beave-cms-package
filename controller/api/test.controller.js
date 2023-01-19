const ContentType = require('../../model/ContentType')
const Content = require('../../model/Content')
const ContentResource = require('../../resources/api/content.resource')
const populateTest = async (req, res) => {
    console.log("Call");
    let cf = await Content.aggregate([
        { $match: { type_slug: 'test', published: true } },
        {
            $lookup: {
                from: 'countries',
                localField: 'country',
                foreignField: '_id',
                as: 'country',
            },
        },
        {
            $lookup: {
                from: 'brands',
                localField: 'brand',
                foreignField: '_id',
                as: 'brand',
            },
        },
        { $unwind: '$content' },
        {
            $match: {
                'content.language': {
                    $in: ['en', 'common'],
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
                'brand._id': 1,
                'brand.name': 1,
                'brand.code': 1,
                'country._id': 1,
                'country.name': 1,
                'country.code': 1,
                // 'fields.language': 1,
                // 'fields.group_name': 1,
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
