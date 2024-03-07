const envConfig = require('../../config/env.config')
const Joi = require('joi')
const _ = require('lodash')
const Menu = require('../../model/Menu')
const collect = require('collect.js')
const { Types } = require('mongoose')

const listMenu = async (req, res) => {
    try {
        const menus = await Menu.find({
            brand: req.authUser?.brand?._id,
            country: req.authUser?.brand?.country,
        }).sort({ position: 1 })
        res.render(`admin-njk/cms/menu/listing`, { menulist: menus })
    } catch (e) {
        console.log(e)
        return res.render(`admin-njk/error-500`)
    }
}

const addSection = async (req, res) => {
    try {
        session = req.authUser
        const schema = Joi.object({
            menu_position_new: Joi.string().required(),
        })

        const validationResult = schema.validate(req.body, {
            abortEarly: false,
        })

        if (validationResult.error) {
            return res.status(422).json(validationResult.error)
        }
        // Form data
        let body = req.body
        // object to insert

        await Menu.create({
            nav_label: body.menu_position || body.menu_position_new,
            nav_position: body.menu_position || body.menu_position_new,
            brand: req.authUser?.brand?._id,
            country: req.authUser?.brand?.country,
        })

        return res.status(200).json({
            message: `New Menu Section added`,
            redirect_to: '/admin/cms/menu',
        })
    } catch (error) {
        console.log(error)
        return res.status(400).json({ error: 'Something went wrong' })
    }
}

const addMenu = async (req, res) => {
    // console.log(req.body)
    try {
        session = req.authUser
        let labelValidationObj = {}
        let pathValidationObj = {}
        req.authUser.brand.languages.forEach((lang) => {
            _.assign(labelValidationObj, {
                [lang.prefix]: eval(`Joi.string().required()`),
            })
            _.assign(pathValidationObj, {
                [lang.prefix]: eval(`Joi.string().required()`),
            })
        })
        const schema = Joi.object({
            label: Joi.object({
                ...labelValidationObj,
            }),
            path: Joi.object({
                ...pathValidationObj,
            }),
            external: Joi.string().allow('', null, 'true'),
            menu_position: Joi.string().optional().allow(null, ''),
        })

        const validationResult = schema.validate(req.body, {
            abortEarly: false,
        })

        if (validationResult.error) {
            res.status(422).json(validationResult.error)
            return
        }
        // Form data
        let body = req.body
        let label = {}
        let path = {}
        req.authUser.brand.languages.forEach((lang) => {
            _.assign(label, {
                [lang.prefix]: body.label[lang.prefix],
            })
            _.assign(path, {
                [lang.prefix]: body.path[lang.prefix],
            })
        })

        // object to insert
        const obj = {
            _id: Types.ObjectId(),
            label,
            url: path,
            external: body.external == 'true',
        }

        const nav = await Menu.findOne({
            _id: body.menu_position,
        })

        if (!nav) {
            return res.status(400).json({ error: 'Nav not found' })
        }
        // Push the obj to nav_items
        const update = await Menu.findOneAndUpdate(
            {
                _id: body.menu_position,
            },
            {
                $push: {
                    nav_items: obj,
                },
            }
        )
        // console.log(req.body)
        // console.log(update)
        // If menu position not found
        if (!update?._id) {
            return res
                .status(400)
                .json({ error: 'Select a valid Menu position' })
        }

        return res.status(200).json({
            message: `New Menu added`,
            item: update,
            redirect_to: '/admin/cms/menu',
        })
    } catch (error) {
        console.log(error)
        return res.status(400).json({ error: 'Something went wrong' })
    }
}

const editMenu = async (req, res) => {
    try {
        let { position, id, level } = req.params
        let parentIndex = req.query?.parent_index
        let secParentIndex = req.query?.sec_parent_index
        // Finding all menus from DB
        const menus = await Menu.find({
            brand: req.authUser?.brand?._id,
            country: req.authUser?.brand?.country,
        }).sort({ position: 1 })
        // Finding menu with menu position
        const menuDetail = menus.find((menu) => menu.nav_position == position)
        let menuItem = {}
        // Finding menu item w.r.t the menu child level
        if (menuDetail?._id) {
            if (level == '0') {
                menuItem = menuDetail.nav_items.find(
                    (item) => item._id.toString() == id
                )
            } else if (level == '1') {
                menuItem = menuDetail.nav_items[parentIndex]?.child?.find(
                    (item) => item._id.toString() == id
                )
                if (menuItem) menuItem.parent_index = req.query.parent_index
            } else if (level == '2') {
                menuItem = menuDetail.nav_items[parentIndex]?.child[
                    secParentIndex
                ]?.child?.find((item) => item._id.toString() == id)
                if (menuItem) {
                    menuItem.parent_index = req.query.parent_index
                    menuItem.sec_parent_index = req.query.sec_parent_index
                }
            }
        }
        // add level value to menuItem
        if (menuItem?._id) menuItem.level = level
        res.render(`admin-njk/cms/menu/edit-form`, {
            menulist: menus,
            navPosition: position,
            menuItem: menuItem ? menuItem : {},
        })
    } catch (error) {
        console.log(error)
        return res.render(`admin-njk/error-500`)
    }
}

const saveEditMenu = async (req, res) => {
    try {
        session = req.authUser
        let labelValidationObj = {}
        let pathValidationObj = {}
        req.authUser.brand.languages.forEach((lang) => {
            _.assign(labelValidationObj, {
                [lang.prefix]: eval(`Joi.string().required()`),
            })
            _.assign(pathValidationObj, {
                [lang.prefix]: eval(`Joi.string().required()`),
            })
        })
        const schema = Joi.object({
            id: Joi.string().required(),
            level: Joi.string().required(),
            parent_index: Joi.optional(),
            sec_parent_index: Joi.optional(),
            label: Joi.object({
                ...labelValidationObj,
            }),
            path: Joi.object({
                ...pathValidationObj,
            }),
            external: Joi.string().allow('', null, 'true'),
        })

        const validationResult = schema.validate(req.body, {
            abortEarly: false,
        })

        if (validationResult.error) {
            return res.status(422).json(validationResult.error)
        }
        // Destructuring values from req.body
        const { id, level } = req.body
        const { position } = req.params

        let update
        let body = req.body
        let label = {}
        let path = {}
        req.authUser.brand.languages.forEach((lang) => {
            _.assign(label, {
                [lang.prefix]: body.label[lang.prefix],
            })
            _.assign(path, {
                [lang.prefix]: body.path[lang.prefix],
            })
        })
        // Checking the level of the child
        if (level == '0') {
            // Find menu with position
            // FInding the menu item with child level and index of the menu item in child array
            // After finding delete the menu item from the child array then push the new menu item to the index position
            const menu = await Menu.findOne({
                brand: req.authUser?.brand?._id,
                country: req.authUser?.brand?.country,
                nav_position: position,
            })
            let menuItem = {}
            let menuIndex = 0
            if (menu?._id) {
                menuItem = menu.nav_items.find(
                    (item) => item._id.toString() == id
                )
                menuIndex = menu.nav_items.findIndex(
                    (item) => item._id.toString() == id
                )
            }
            let obj = {
                _id: id,
                label,
                url: path,
                external: req.body.external == 'true',
                child: menuItem.child,
            }
            let deleteItem = await Menu.findOneAndUpdate(
                {
                    // brand: req.authUser?.brand?._id,
                    // country: req.authUser?.brand?.country,
                    nav_position: position,
                },
                {
                    $pull: {
                        nav_items: {
                            _id: id,
                        },
                    },
                }
            )
            if (!deleteItem?._id) {
                return res.status(400).json({ error: 'Something went wrong' })
            }

            update = await Menu.findOneAndUpdate(
                {
                    nav_position: position,
                    // brand: req.authUser?.brand?._id,
                    // country: req.authUser?.brand?.country,
                    'nav_items.$._id': id,
                },
                {
                    $push: {
                        nav_items: { $each: [obj], $position: menuIndex },
                    },
                },
                {
                    new: true,
                }
            )
        } else if (level == '1') {
            const menu = await Menu.findOne({
                nav_position: position,
                // brand: req.authUser?.brand?._id,
                // country: req.authUser?.brand?.country,
            })
            let menuItem = {}
            let menuIndex
            if (menu?._id) {
                menuItem = menu.nav_items[body.parent_index].child.find(
                    (item) => item._id.toString() == id
                )
                menuIndex = menu.nav_items[body.parent_index].child.findIndex(
                    (item) => item._id.toString() == id
                )
            }

            let obj = {
                _id: id,
                label,
                url: path,
                external: req.body.external == 'true',
                child: menuItem.child,
            }
            let deleteItem = await Menu.findOneAndUpdate(
                {
                    nav_position: position,
                    // brand: req.authUser?.brand?._id,
                    // country: req.authUser?.brand?.country,
                },
                {
                    $pull: {
                        [`nav_items.$[].child`]: {
                            _id: id,
                        },
                    },
                }
            )
            if (!deleteItem?._id) {
                return res.status(400).json({ error: 'Something went wrong' })
            }

            update = await Menu.findOneAndUpdate(
                {
                    nav_position: position,
                    // brand: req.authUser?.brand?._id,
                    // country: req.authUser?.brand?.country,
                    [`nav_items.${body.parent_index}.child.$._id`]: id,
                },
                {
                    $push: {
                        [`nav_items.${body.parent_index}.child`]: {
                            $each: [obj],
                            $position: menuIndex,
                        },
                    },
                },
                {
                    new: true,
                }
            )
        } else if (level == '2') {
            const menu = await Menu.findOne({
                nav_position: position,
                // brand: req.authUser?.brand?._id,
                // country: req.authUser?.brand?.country,
            })
            let menuItem = {}
            let menuIndex
            if (menu?._id) {
                menuItem = menu.nav_items[body.parent_index].child[
                    body.sec_parent_index
                ].child.find((item) => item._id.toString() == id)
                menuIndex = menu.nav_items[body.parent_index].child[
                    body.sec_parent_index
                ].child.findIndex((item) => item._id.toString() == id)
            }

            let obj = {
                _id: id,
                label,
                url: path,
                external: req.body.external == 'true',
                child: menuItem.child,
            }
            let deleteItem = await Menu.findOneAndUpdate(
                {
                    nav_position: position,
                    // brand: req.authUser?.brand?._id,
                    // country: req.authUser?.brand?.country,
                },
                {
                    $pull: {
                        [`nav_items.$[].child.$[].child`]: {
                            _id: id,
                        },
                    },
                }
            )
            if (!deleteItem?._id) {
                return res.status(400).json({ error: 'Something went wrong' })
            }

            update = await Menu.findOneAndUpdate(
                {
                    nav_position: position,
                    // brand: req.authUser?.brand?._id,
                    // country: req.authUser?.brand?.country,
                    [`nav_items.${body.parent_index}.child.${body.sec_parent_index}.child.$._id`]:
                        id,
                },
                {
                    $push: {
                        [`nav_items.${body.parent_index}.child.${body.sec_parent_index}.child`]:
                            { $each: [obj], $position: menuIndex },
                    },
                },
                {
                    new: true,
                }
            )
        }

        // If menu  not found
        if (!update?._id) {
            return res.status(400).json({ error: 'Select a valid Menu ' })
        }

        return res.status(200).json({
            message: `Menu updated`,
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

const deletePosition = async (req, res) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
        })

        const validationResult = schema.validate(req.body, {
            abortEarly: false,
        })

        if (validationResult.error) {
            return res.status(422).json({ error: 'Something went wrong' })
        }
        // Destructuring values from req.body
        const { id } = req.body

        await Menu.deleteOne({
            _id: id,
        })

        return res.status(200).json({
            message: `Menu Section deleted`,
        })
    } catch (error) {
        console.log('error :>> ', error)
        return res.status(400).json({ error: 'Something went wrong' })
    }
}

const deleteMenu = async (req, res) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            nav_position: Joi.string().required(),
            level: Joi.string().required(),
        })

        const validationResult = schema.validate(req.body, {
            abortEarly: false,
        })

        if (validationResult.error) {
            return res.status(422).json({ error: 'Something went wrong' })
        }
        // Destructuring values from req.body
        const { id, nav_position, level } = req.body

        let update
        // Checking the level of the child
        if (level == '0') {
            update = await Menu.findOneAndUpdate(
                {
                    nav_position,
                    brand: req.authUser?.brand?._id,
                    country: req.authUser?.brand?.country,
                },
                {
                    $pull: {
                        nav_items: {
                            _id: id,
                        },
                    },
                }
            )
        } else if (level == '1') {
            update = await Menu.findOneAndUpdate(
                {
                    nav_position,
                    brand: req.authUser?.brand?._id,
                    country: req.authUser?.brand?.country,
                },
                {
                    $pull: {
                        [`nav_items.$[].child`]: {
                            _id: id,
                        },
                    },
                }
            )
        } else if (level == '2') {
            update = await Menu.findOneAndUpdate(
                {
                    nav_position,
                    brand: req.authUser?.brand?._id,
                    country: req.authUser?.brand?.country,
                },
                {
                    $pull: {
                        [`nav_items.$[].child.$[].child`]: {
                            _id: id,
                        },
                    },
                }
            )
        }
        // If menu  not found
        if (!update?._id) {
            return res.status(400).json({ error: 'Select a valid Menu ' })
        }

        return res.status(200).json({
            message: `Menu deleted`,
        })
    } catch (error) {
        console.log('error :>> ', error)
        return res.status(400).json({ error: 'Something went wrong' })
    }
}

// Handle position change of menu items
const saveMenu = async (req, res) => {
    try {
        let navName = req.body.name
        if (!navName) {
            return res.status(400).json({ error: 'Invalid data' })
        }
        // console.log(req.body.menu)
        const dataToSave = []
        const treeData = collect(JSON.parse(req.body.menu))
        const root_items = treeData.where('parent', '#').all()
        root_items.forEach((rootElement, rootIndex) => {
            // console.log(JSON.parse(JSON.stringify(rootElement.li_attr.label)))
            const parent = {
                _id: rootElement.li_attr.data_id,
                position: rootIndex,
                label: JSON.parse(rootElement.li_attr.label),
                url: JSON.parse(rootElement.li_attr.url),
            }
            parent.child = []
            treeData
                .where('parent', rootElement.id)
                .all()
                .forEach((firstChildElement, fcIndex) => {
                    const firstChild = {
                        _id: firstChildElement.li_attr.data_id,
                        position: fcIndex,
                        label: JSON.parse(firstChildElement.li_attr.label),
                        url: JSON.parse(firstChildElement.li_attr.url),
                    }
                    firstChild.child = []
                    treeData
                        .where('parent', firstChildElement.id)
                        .all()
                        .forEach((secondChildElement, scIndex) => {
                            const secondChild = {
                                _id: secondChildElement.li_attr.data_id,
                                position: scIndex,
                                label: JSON.parse(
                                    secondChildElement.li_attr.label
                                ),
                                url: JSON.parse(secondChildElement.li_attr.url),
                            }
                            firstChild.child.push(secondChild)
                        })
                    parent.child.push(firstChild)
                })
            dataToSave.push(parent)
        })

        // console.log(dataToSave)
        // return

        const save = await Menu.findOneAndUpdate(
            {
                nav_position: navName,
                // brand: req.authUser?.brand?._id,
                // country: req.authUser?.brand?.country,
            },
            {
                $set: {
                    nav_items: dataToSave,
                },
            }
        )
        if (!save?._id) {
            return res.status(400).json({ error: 'Menu not found' })
        }
        return res.status(200).json({
            message: `Menu position changed`,
            item: save,
        })
    } catch (error) {
        console.log(error)
        return res.status(400).json({ error: 'Something went wrong' })
    }
}

module.exports = {
    listMenu,
    addSection,
    addMenu,
    editMenu,
    saveEditMenu,
    deletePosition,
    deleteMenu,
    saveMenu,
}
