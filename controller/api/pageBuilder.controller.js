const HtmlBuilder = require('../../model/HtmlBuilder')

// Menu
const view = async (req, res) => {
    try {
        const page = await HtmlBuilder.findOne({
            slug: req.params.slug,
        }).select('-created_at -updated_at -deletedAt -isDeleted -__v -active')
        res.status(200).json(page)
    } catch (error) {
        res.status(404).json('Not found')
    }
}

module.exports = {
    view,
}
