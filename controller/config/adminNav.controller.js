const Joi = require('joi')
const { logError } = require('../../helper/Logger.helper')
const AdminNav = require('../../model/AdminNav')

const list = async (req, res) => {
    try {
        const admin_navs = await AdminNav.find()
        return res.render('admin-njk/config/admin-nav/listing', {
            admin_navs,
        })
    } catch (error) {
        logError(error)
        return res.render(`admin-njk/app-error-500`)
    }
}

const saveSection = async (req, res) => {
    try {
        // console.log(req.body)
        const schema = Joi.object({
            section: Joi.string().required().min(3).max(60),
            position: Joi.number().required(),
        })

        const validationResult = schema.validate(req.body, {
            abortEarly: false,
        })

        if (validationResult.error) {
            res.status(422).json(validationResult.error)
            return
        }

        let data = {
            section: req.body.section,
            position: req.body.position,
        }

        await AdminNav.create(data)

        return res.status(200).json({
            message: 'Section added successfully',
            redirect_to: '/admin/config/admin-nav',
        })
    } catch (error) {
        logError(error)
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

const saveItem = async (req, res) => {
    try {
        // console.log(req.body)
        const schema = Joi.object({
            section: Joi.string().required(),
            label: Joi.string().required(),
            expandable: Joi.boolean().optional().allow(null, ''),
            icon: Joi.string().required(),
            path: Joi.string().required(),
        })

        const validationResult = schema.validate(req.body, {
            abortEarly: false,
        })

        if (validationResult.error) {
            res.status(422).json(validationResult.error)
            return
        }

        await AdminNav.updateOne(
            { section: req.body.section, isDeleted: false },
            {
                $push: {
                    items: {
                        label: req.body.label,
                        expandable: req.body.expandable || false,
                        icon: req.body.icon || 'ico',
                        position: 0,
                        path: req.body.path || '#',
                    },
                },
            }
        )

        return res.status(200).json({
            message: 'Item added successfully',
            redirect_to: '/admin/config/admin-nav',
        })
    } catch (error) {
        logError(error)
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

const saveChild = async (req, res) => {
    try {
        // console.log(req.body)
        const schema = Joi.object({
            section: Joi.string().required(),
            item: Joi.string().required(),
            label: Joi.string().required(),
            path: Joi.string().required(),
        })

        const validationResult = schema.validate(req.body, {
            abortEarly: false,
        })

        if (validationResult.error) {
            res.status(422).json(validationResult.error)
            return
        }

        const newItem = {
            label: req.body.label,
            path: req.body.path || '#',
        }

        await AdminNav.updateOne(
            {
                _id: req.body.section,
                'items._id': req.body.item,
                isDeleted: false,
            },
            { $push: { 'items.$.child': newItem } }
        )

        return res.status(200).json({
            message: 'Child added successfully',
            redirect_to: '/admin/config/admin-nav',
        })
    } catch (error) {
        logError(error)
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

const deleteSection = async (req, res) => {
    try {
        await AdminNav.updateOne(
            {
                _id: req.params.id,
            },
            { isDeleted: true, deletedAt: new Date() }
        )
        return res.redirect('/admin/config/admin-nav')
    } catch (error) {
        logError(error)
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

const deleteItem = async (req, res) => {
    try {
        await AdminNav.updateOne(
            {
                _id: req.params.section,
                'items._id': req.params.id,
                isDeleted: false,
            },
            { $pull: { items: { _id: req.params.id } } }
        )
        return res.redirect('/admin/config/admin-nav')
    } catch (error) {
        logError(error)
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

const deleteChild = async (req, res) => {
    try {
        const itemToRemove = { _id: req.params.id }
        await AdminNav.updateOne(
            {
                _id: req.params.section,
                'items._id': req.params.item,
                isDeleted: false,
            },
            { $pull: { 'items.0.child': itemToRemove } }
        )
        return res.redirect('/admin/config/admin-nav')
    } catch (error) {
        logError(error)
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

module.exports = {
    list,
    saveSection,
    saveItem,
    saveChild,
    deleteSection,
    deleteItem,
    deleteChild,
}
