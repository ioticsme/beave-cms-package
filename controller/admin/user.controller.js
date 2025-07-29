const Joi = require('joi')
const { joiPasswordExtendCore } = require('joi-password')
const joiPassword = Joi.extend(joiPasswordExtendCore)
const bcrypt = require('bcryptjs')
const Admin = require('../../model/Admin')
const User = require('../../model/User')
const { logError } = require('../../helper/Logger.helper')

const list = async (req, res) => {
    try {
        const userList = await User.find({ isDeleted: false }).sort({ _id: -1 })
        if (!userList) {
            return res.status(404).json('Not Found')
        }
        return res.render(`admin-njk/user/listing`, { userList })
    } catch (error) {
        logError(error)
        return res.status(404).json({ error: 'Something went wrong' })
    }
}

const changeStatus = async (req, res) => {
    try {
        const { status, id } = req.body
        // const slug = req.contentType?.slug
        // If id not found
        if (!id) {
            return res.status(404).json({ error: 'Invalid data' })
        }
        // Update
        const update = await User.findOneAndUpdate(
            {
                _id: id,
                isDeleted: false,
                // brand: req.authUser.brand._id,
                // country: req.authUser.brand.country,
            },
            {
                $set: {
                    active: !status,
                },
            }
        )
        // If not updated
        if (!update?._id) {
            return res.status(404).json({ error: 'Something went wrong' })
        }
        return res.status(200).json({
            message: 'User status changed',
            url: `/users/${id}`,
        })
    } catch (error) {
        logError(error)
        return res.status(404).json({ error: 'Something went wrong' })
    }
}

const userDetail = async (req, res) => {
    try {
        const userDetails = await Admin.findOne({
            _id: req.authUser.admin_id,
            isDeleted: false,
        })

        if (!userDetail) {
            return res.status(404).json('Not Found')
        }
        return res.render(`admin-njk/user/profile`, { userDetails })
    } catch (error) {
        logError(error)
        return res.status(404).json({ error: 'Something went wrong' })
    }
}

const profileUpdate = async (req, res) => {
    try {
        const userDetails = await Admin.findOne({
            _id: req.authUser.admin_id,
            isDeleted: false,
        })

        if (!userDetail) {
            res.status(404).json('Not Found')
            return
        }
        res.render(`admin-njk/user/update-profile`, { userDetails })
    } catch (error) {
        logError(error)
        return res.status(404).json({ error: 'Something went wrong' })
    }
}

const profileUpdateSave = async (req, res) => {
    const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    })

    const validationResult = schema.validate(req.body, {
        abortEarly: false,
    })

    if (validationResult.error) {
        return res.status(422).json(validationResult.error)
    }

    try {
        const admin = await Admin.findOne({
            _id: req.authUser.admin_id,
            isDeleted: false,
        })

        if (bcrypt.compareSync(req.body.password, admin.password)) {
            admin.name = req.body.name
            admin.email = req.body.email
            admin.save()

            return res.status(200).json({
                message: 'Profile details updated successfully',
            })
        } else {
            return res.status(401).json({ error: 'Invalid email or password' })
        }
    } catch (error) {
        return res.status(404).json({ error: 'Something went wrong' })
    }
}

const changePassword = async (req, res) => {
    const userDetails = await Admin.findOne({
        _id: req.authUser.admin_id,
        isDeleted: false,
    })

    if (!userDetail) {
        res.status(404).json('Not Found')
        return
    }
    res.render(`admin-njk/user/change-password`, { userDetails })
}

const changePasswordSave = async (req, res) => {
    const schema = Joi.object({
        password: Joi.string().required(),
        new_password: joiPassword
            .string()
            .minOfSpecialCharacters(1)
            .minOfLowercase(1)
            .minOfUppercase(1)
            .minOfNumeric(1)
            .noWhiteSpaces()
            .required()
            .min(8)
            .max(15),
        confirm_password: Joi.any()
            .valid(Joi.ref('new_password'))
            .required()
            .messages({
                'any.only': 'new password and confirm password must be same',
            }),
    })

    const validationResult = schema.validate(req.body, {
        abortEarly: false,
    })

    if (validationResult.error) {
        return res.status(422).json(validationResult.error)
    }

    try {
        const admin = await Admin.findOne({
            _id: req.authUser.admin_id,
            isDeleted: false,
        })

        if (bcrypt.compareSync(req.body.password, admin.password)) {
            const saltRounds = 10
            const salt = await bcrypt.genSaltSync(saltRounds)

            admin.password = await bcrypt.hashSync(req.body.new_password, salt)
            await admin.save()

            req.session.destroy()

            return res.status(200).json({
                message: 'Admin password updated successfully',
            })
        } else {
            return res.status(401).json({ error: 'Invalid password' })
        }
    } catch (error) {
        console.log(error)
        return res.status(404).json({ error: 'Something went wrong' })
    }
}

module.exports = {
    list,
    changeStatus,
    // userDetail,
    // profileUpdate,
    // profileUpdateSave,
    // changePassword,
    // changePasswordSave,
}
