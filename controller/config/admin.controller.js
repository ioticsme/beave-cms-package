// import * as dotenv from 'dotenv'
// dotenv.config({ path: '../../../../.env' })
// const mongoose = require("mongoose");
const path = require('path')
const express = require('express')
const Joi = require('joi')
const bcrypt = require('bcryptjs')

const Admin = require('../../model/Admin')
const { object } = require('joi')
const { privileges } = require('../../config/userPrivilege.config')

const list = async (req, res) => {
    // return res.sendFile('./views/index.html', {root: './node_modules/cms-installer'});
    const admins = await Admin.find()
    return res.render('admin-njk/config/admin/listing', {
        admins,
    })
}

const add = async (req, res) => {
    try {
        const config_privilege_routes = await privileges(req)
        return res.render('admin-njk/config/admin/form', {
            isEdit: false,
            admin: {},
            current_privileges: [],
            config_privilege_routes,
        })
    } catch (error) {
        console.log(error)
    }
}

const edit = async (req, res) => {
    const config_privilege_routes = await privileges(req)
    const admin = await Admin.findOne({
        _id: req.params.id,
    })

    return res.render('admin-njk/config/admin/form', {
        admin,
        current_privileges: admin.privileges?.split(',') ?? [],
        config_privilege_routes,
        isEdit: true,
    })
}

const save = async (req, res) => {
    const saltRounds = 10
    const salt = bcrypt.genSaltSync(saltRounds)

    const schema = Joi.object({
        name: Joi.string().required().min(3).max(60),
        email: Joi.string().required().min(3).max(60),
        password: Joi.string().allow('', null),
        role: Joi.string().required().valid('super_admin', 'admin', 'editor'),
        status: Joi.boolean().required(),
        privileges: Joi.string().required(),
        id: Joi.optional(),
    })

    const validationResult = schema.validate(req.body, {
        abortEarly: false,
    })

    if (validationResult.error) {
        res.status(422).json(validationResult.error)
        return
    }

    let options = {
        email: req.body.email,
    }
    if (req.body.id) {
        options._id = { $ne: req.body.id }
    }
    const adminExist = await Admin.findOne(options)
    if (adminExist) {
        return res.status(422).json({
            details: [
                {
                    message: '"email" is already taken',
                    path: ['email'],
                    type: 'string.duplicate',
                    context: {
                        label: 'email',
                        value: req.body.email,
                        key: 'email',
                    },
                },
            ],
        })
    }

    let data = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        active: req.body.status || false,
        privileges: req.body.privileges,
    }

    if (req.body.id) {
        if (req.body.password) {
            data['password'] = bcrypt.hashSync(req.body.password, salt)
        }
        await Admin.updateOne(
            {
                _id: req.body.id,
            },
            data
        )
    } else {
        data['password'] = bcrypt.hashSync(req.body.password, salt)
        await Admin.create(data)
    }

    return res.status(200).json('done')
}

const changeStatus = async (req, res) => {
    try {
        const { status, id } = req.body
        // If id not found
        if (!id) {
            return res.status(404).json({ error: 'Invalid data' })
        }

        // Upadte status field
        const update = await Admin.findOneAndUpdate(
            { _id: id, role: { $ne: 'super_admin' } },
            {
                $set: {
                    active: !status,
                },
            }
        )
        // If not updated
        if (!update?._id) {
            return res.status(404).json({ error: 'Activation error' })
        }
        return res.status(200).json({
            message: `Admin status changed`,
        })
    } catch (error) {
        return res.status(404).json({ error: 'Something went wrong' })
    }
}

const deleteItem = async (req, res) => {
    try {
        const { id } = req.body
        // If id not found
        if (!id) {
            return res.status(404).json({ error: 'Id not found' })
        }

        //soft delete item
        await Admin.deleteOne({ _id: id, role: { $ne: 'super_admin' } })
        return res.status(200).json({
            message: `Admin Deleted`,
        })
    } catch (error) {
        return res.status(404).json({ error: 'Something went wrong' })
    }
}

module.exports = {
    list,
    add,
    edit,
    save,
    changeStatus,
    deleteItem,
}
