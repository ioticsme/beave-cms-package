const envConfig = require('../../config/env.config')
const Joi = require('joi')
const { joiPasswordExtendCore } = require('joi-password')
const joiPassword = Joi.extend(joiPasswordExtendCore)
const User = require('../../model/User')
const UserResource = require('../../resources/api/user.resource')
const collect = require('collect.js')
const bcrypt = require('bcryptjs')
const { setCache, getCache, removeCache } = require('../../helper/Redis.helper')

// user detail
const detail = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.authPublicUser._id })
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }
        res.status(200).json({
            user: new UserResource(user).exec(),
        })
    } catch (error) {
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

// Edit user detail
const editUser = async (req, res) => {
    try {
        const schema = Joi.object({
            first_name: Joi.string()
                .regex(/^[,. a-zA-Z]+$/)
                .required()
                .min(3)
                .max(20)
                .messages({
                    'string.pattern.base':
                        'First Name should contain only alphabets',
                }),
            last_name: Joi.string()
                .regex(/^[,. a-zA-Z]+$/)
                .required()
                .min(3)
                .max(20)
                .messages({
                    'string.pattern.base':
                        'Last Name should contain only alphabets',
                }),
            email: Joi.string().email().required().max(60),
            mobile: Joi.string().required().min(7).max(15),
        })

        const validationResult = schema.validate(req.body, {
            abortEarly: false,
        })

        if (validationResult.error) {
            return res.status(422).json({
                details: validationResult.error.details,
            })
        }
        // Finding user
        let mobile = req.body.mobile.replace(/\D/g, '').replace(/^0+/, '')
        const user = await User.findOne({ mobile })
        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        // Checking the email already exist with other users
        const isEmailExist = await User.findOne({
            _id: { $ne: user._id },
            email: req.body.email,
        })
        if (isEmailExist) {
            return res.status(422).json({
                details: [
                    {
                        message: 'User already exist with this email',
                        path: ['email'],
                        type: 'any.exist',
                        context: {
                            label: 'email',
                            key: 'email',
                        },
                    },
                ],
            })
        }
        // Updating user data
        const update = await User.findOneAndUpdate(
            {
                _id: user._id,
            },
            {
                $set: {
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    email: req.body.email,
                    mobile: user.mobile,
                },
            },
            {
                new: true,
            }
        )
        if (!update?._id) {
            return res
                .status(400)
                .json({ error: 'User details submission error' })
        }

        res.status(200).json({
            message: 'User details updated',
            user: new UserResource(update).exec(),
        })
    } catch (error) {
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

// change user password
const changePassword = async (req, res) => {
    try {
        const schema = Joi.object({
            current_password: Joi.string().required().min(4).max(20),
            new_password: joiPassword
                .string()
                .minOfSpecialCharacters(1)
                .minOfLowercase(1)
                .minOfUppercase(1)
                .minOfNumeric(1)
                .noWhiteSpaces()
                .required()
                .min(8)
                .max(20),
            new_confirm_password: Joi.any()
                .valid(Joi.ref('new_password'))
                .required()
                .messages({
                    'any.only': 'password and confirm password must be same',
                }),
        })

        const validationResult = schema.validate(req.body, {
            abortEarly: false,
        })

        if (validationResult.error) {
            return res.status(422).json({
                details: validationResult.error.details,
            })
        }
        // Finding user
        const user = await User.findOne({ _id: req.authPublicUser._id })

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }
        // comparing current password
        if (bcrypt.compareSync(req.body.current_password, user.password)) {
            const saltRounds = 10
            const salt = bcrypt.genSaltSync(saltRounds)
            // updating password
            const update = await User.findOneAndUpdate(
                { _id: user._id },
                {
                    $set: {
                        password: bcrypt.hashSync(req.body.new_password, salt),
                    },
                },
                {
                    new: true,
                }
            )
            if (!update?._id) {
                return res.status(400).json({ error: 'Password not changed' })
            }
            return res.status(200).json({
                message: 'Password changed',
                user: new UserResource(user).exec(),
            })
        } else {
            return res.status(422).json({
                details: [
                    {
                        message: '"current_password" is not valid',
                        path: ['current_password'],
                        type: 'any.invalid',
                        context: {
                            label: 'current_password',
                            key: 'current_password',
                        },
                    },
                ],
            })
        }
    } catch (error) {
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

module.exports = {
    detail,
    editUser,
    changePassword,
}
