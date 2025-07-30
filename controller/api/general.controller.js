const Menu = require('../../model/Menu')
const MenuResource = require('../../resources/api/menu.resource')
const { logError } = require('../../helper/Logger.helper')

// Menu
const menuList = async (req, res) => {
    try {
        const menus = await Menu.find({
            'nav_items.active': true,
            brand: req.brand,
            country: req.country,
            nav_position: req.query?.type,
            deleted: { $ne: true },
        })
        res.status(200).json(MenuResource.collection(menus))
    } catch (error) {
        logError(error)
        res.status(404).json('Not found')
    }
}

const brandingDetail = async (req, res) => {
    // console.log(req.brand)
    try {
        // const menus = await Menu.find({
        //     'nav_items.active': true,
        //     nav_position: req.query?.type,
        // })
        res.status(200).json(req.brand)
    } catch (error) {
        logError(error)
        return res.status(500).json({ error: `Something went wrong` })
    }
}

const navList = async (req, res) => {
    try {
        res.status(200).json({
            navigation: req.navigation,
        })
    } catch (error) {
        logError(error)
        return res.status(500).json({ error: `Something went wrong` })
    }
}

module.exports = {
    menuList,
    brandingDetail,
    navList,
}
