const path = require('path')
const express = require('express')
const Joi = require('joi')
const bcrypt = require('bcrypt')

const AdminNav = require('../../model/AdminNav')

const list = async (req, res) => {
    // return res.sendFile('./views/index.html', {root: './node_modules/cms-installer'});
    const admin_navs = await AdminNav.find()
    return res.render('admin-njk/config/admin-nav/listing', {
        admin_navs,
    })
}

const saveSection = async (req, res) => {
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
        message: 'Content added successfully',
        redirect_to: '/admin/config/admin-nav',
    })
}

const saveItem = async (req, res) => {
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
        { section: req.body.section },
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
        message: 'Content added successfully',
        redirect_to: '/admin/config/admin-nav',
    })
}

const saveChild = async (req, res) => {
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
        { _id: req.body.section, 'items._id': req.body.item },
        { $push: { 'items.$.child': newItem } }
    )

    return res.status(200).json({
        message: 'Content added successfully',
        redirect_to: '/admin/config/admin-nav',
    })
}

const deleteSection = async (req, res) => {
    // return res.sendFile('./views/index.html', {root: './node_modules/cms-installer'});
    await AdminNav.deleteOne({
        _id: req.params.id,
    })
    return res.redirect('/admin/config/admin-nav')
}

const deleteItem = async (req, res) => {
    // return res.sendFile('./views/index.html', {root: './node_modules/cms-installer'});
    await AdminNav.updateOne(
        { section: req.params.section },
        { $pull: { items: { _id: req.params.id } } }
    )
    return res.redirect('/admin/config/admin-nav')
}

const deleteChild = async (req, res) => {
    // return res.sendFile('./views/index.html', {root: './node_modules/cms-installer'});
    const itemToRemove = { _id: req.params.id }
    await AdminNav.updateOne(
        { _id: req.params.section },
        { $pull: { 'items.0.child': itemToRemove } }
    )
    return res.redirect('/admin/config/admin-nav')
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
