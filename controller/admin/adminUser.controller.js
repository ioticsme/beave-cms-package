const Joi = require('joi') // Import Joi for input validation
const { joiPasswordExtendCore } = require('joi-password') // Import joiPassword extension for advanced password validation
const joiPassword = Joi.extend(joiPasswordExtendCore) // Extend Joi with the joiPassword extension
const bcrypt = require('bcryptjs') // Import bcrypt for hashing and comparing passwords
const Admin = require('../../model/Admin') // Import the Admin model

// Fetches and renders the profile details of the currently authenticated admin user
const userDetail = async (req, res) => {
    const userDetails = await Admin.findOne({
        _id: req.authUser.admin_id, // Get the admin ID from the request
    })

    if (!userDetails) {
        // If the user is not found, return a 404 error
        res.status(404).json('Not Found')
        return
    }

    // Render the profile page with the fetched user details
    res.render('admin-njk/admin-user/profile', { userDetails })
}

// Fetches and renders the form for updating the profile details of the authenticated admin user
const profileUpdate = async (req, res) => {
    const userDetails = await Admin.findOne({
        _id: req.authUser.admin_id, // Get the admin ID from the request
    })

    if (!userDetails) {
        // If the user is not found, return a 404 error
        res.status(404).json('Not Found')
        return
    }

    // Render the update profile form with the fetched user details
    res.render('admin-njk/admin-user/update-profile', { userDetails })
}

// Saves the updated profile information for the authenticated admin user
const profileUpdateSave = async (req, res) => {
    // Define a Joi schema for validating the profile update input
    const schema = Joi.object({
        name: Joi.string().required(), // Name is required
        email: Joi.string().email().required(), // Email is required and must be a valid email format
        password: Joi.string().required(), // Password is required for verification
    })

    // Validate the request body against the schema
    const validationResult = schema.validate(req.body, {
        abortEarly: false, // Show all validation errors at once, not just the first one
    })

    if (validationResult.error) {
        // If validation fails, return a 422 error with the validation error details
        return res.status(422).json(validationResult.error)
    }

    try {
        const admin = await Admin.findOne({
            _id: req.authUser.admin_id, // Find the current authenticated admin user by ID
        })

        // Check if the provided password matches the admin's stored hashed password
        if (bcrypt.compareSync(req.body.password, admin.password)) {
            // Update the admin's name and email if the password matches
            admin.name = req.body.name
            admin.email = req.body.email
            admin.save()

            // Return a success message after the profile is updated
            return res.status(200).json({
                message: 'Profile details updated successfully',
            })
        } else {
            // If the password doesn't match, return a 401 Unauthorized error
            return res.status(401).json({ error: 'Invalid email or password' })
        }
    } catch (error) {
        // Catch any errors that occur and return a 404 error
        return res.status(404).json({ error: 'Something went wrong' })
    }
}

// Fetches and renders the change password form for the authenticated admin user
const changePassword = async (req, res) => {
    const userDetails = await Admin.findOne({
        _id: req.authUser.admin_id, // Get the admin ID from the request
    })

    if (!userDetails) {
        // If the user is not found, return a 404 error
        res.status(404).json('Not Found')
        return
    }

    // Render the change password form with the fetched user details
    res.render('admin-njk/admin-user/change-password', { userDetails })
}

// Handles the password change functionality for the authenticated admin user
const changePasswordSave = async (req, res) => {
    // Define a Joi schema for validating the password change input
    const schema = Joi.object({
        password: Joi.string().required(), // Current password is required
        new_password: joiPassword
            .string()
            .minOfSpecialCharacters(1) // New password must have at least one special character
            .minOfLowercase(1) // New password must have at least one lowercase letter
            .minOfUppercase(1) // New password must have at least one uppercase letter
            .minOfNumeric(1) // New password must have at least one numeric character
            .noWhiteSpaces() // No whitespace allowed in the new password
            .required()
            .min(8) // Minimum length of the new password
            .max(15), // Maximum length of the new password
        confirm_password: Joi.any()
            .valid(Joi.ref('new_password')) // Confirm password must match the new password
            .required()
            .messages({
                'any.only':
                    'New password and confirm password must be the same', // Custom error message for mismatched passwords
            }),
    })

    // Validate the request body against the schema
    const validationResult = schema.validate(req.body, {
        abortEarly: false, // Show all validation errors at once, not just the first one
    })

    if (validationResult.error) {
        // If validation fails, return a 422 error with the validation error details
        return res.status(422).json(validationResult.error)
    }

    try {
        const admin = await Admin.findOne({
            _id: req.authUser.admin_id, // Find the current authenticated admin user by ID
        })

        // Check if the provided current password matches the admin's stored hashed password
        if (bcrypt.compareSync(req.body.password, admin.password)) {
            const saltRounds = 10
            const salt = await bcrypt.genSaltSync(saltRounds) // Generate a new salt for hashing the new password

            // Hash the new password and update the admin's password
            admin.password = await bcrypt.hashSync(req.body.new_password, salt)
            await admin.save()

            // Destroy the current session to force re-login after password change
            req.session.destroy()

            // Return a success message after the password is updated
            return res.status(200).json({
                message: 'Admin password updated successfully',
            })
        } else {
            // If the current password doesn't match, return a 401 Unauthorized error
            return res.status(401).json({ error: 'Invalid password' })
        }
    } catch (error) {
        console.log(error) // Log any errors that occur
        // Catch any errors and return a 404 error
        return res.status(404).json({ error: 'Something went wrong' })
    }
}

module.exports = {
    userDetail, // Export the userDetail function
    profileUpdate, // Export the profileUpdate function
    profileUpdateSave, // Export the profileUpdateSave function
    changePassword, // Export the changePassword function
    changePasswordSave, // Export the changePasswordSave function
}
