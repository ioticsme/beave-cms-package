const collect = require('collect.js')
const Content = require('../../model/Content')
const Brand = require('../../model/Brand')

// Home
const homePage = async (req, res) => {
    try {
        const contents = await Content.find({
            country: req.country._id,
            published: true,
            in_home: true,
            // [`content.${req.language || 'en'}.in_home`]: true,
        })
            .sort('position')
            .select(
                '-brand -attached_type -in_home -author -country -custom_fields -__v -created_at -updated_at -published -isDeleted -deletedAt -meta -type_slug'
            )
            .populate('type_id', '-_id slug')
        const collection = collect(contents)
        const grouped = collection.groupBy('type_id.slug')
        const data = grouped.all()

        const brands = await Brand.find({
            // _id: { $ne: req.brand._id },
            active: true,
        }).select(
            ' -languages -domains -created_at -updated_at -published -isDeleted -deletedAt -__v'
        )
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
        const navigation = req.navigation
        const home = {
            ...data,
            brands,
            navigation,
            meta: newGlobalMeta,
        }

        return res.status(200).json(home)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: `Something went wrong` })
    }
}

module.exports = {
    homePage,
}
