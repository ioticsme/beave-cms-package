const Joi = require('joi')
const bcrypt = require('bcryptjs')

const Admin = require('../../model/Admin')

// List all admins excluding the super admin
const list = async (req, res) => {
    const admins = await Admin.find({
        role: {
            $ne: 'super_admin', // Exclude 'super_admin' from the results
        },
    })
    return res.render('admin-njk/access-control/users/listing', {
        admins, // Pass the list of admins to the view
    })
}

// Render the form to add a new admin
const add = async (req, res) => {
    return res.render('admin-njk/access-control/users/form', {
        isEdit: false, // Specify that it's not an edit operation
    })
}

// Render the form to edit an existing admin
const edit = async (req, res) => {
    const admin = await Admin.findOne({
        _id: req.params.id, // Find the admin by ID from the URL
    })
    return res.render('admin-njk/access-control/users/form', {
        admin, // Pass the admin data to the form for editing
        isEdit: true, // Specify that it's an edit operation
    })
}

// Save a new admin or update an existing admin
const save = async (req, res) => {
    try {
        const saltRounds = 10
        const salt = bcrypt.genSaltSync(saltRounds) // Generate salt for hashing password

        // Validation schema for admin data using Joi
        const schema = Joi.object({
            name: Joi.string().required().min(3).max(60), // Validate the name field
            email: Joi.string().required().min(3).max(60), // Validate the email field
            password: Joi.string().required().min(3).max(20), // Validate the password field
            role: Joi.string().required().valid('admin', 'editor', 'finance'), // Role validation
            status: Joi.boolean().required(), // Status must be boolean
            id: Joi.optional(), // Optional id field for updates
        })

        const validationResult = schema.validate(req.body, {
            abortEarly: false, // Return all validation errors at once
        })

        if (validationResult.error) {
            res.status(422).json(validationResult.error) // Send validation errors as response
            return
        }

        // Check if the email is already taken, excluding the current admin (if updating)
        let options = {
            email: req.body.email,
        }
        if (req.body.id) {
            options._id = { $ne: req.body.id } // Ensure we're not checking the same user during update
        }
        const adminExist = await Admin.findOne(options)
        if (adminExist) {
            return res.status(400).json({
                error: 'Email is already taken', // Email conflict error
            })
        }

        // Prepare admin data for creation or update
        let data = {
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, salt), // Hash the password
            role: req.body.role,
            active: req.body.status || false, // Default to false if no status provided
        }

        // Update existing admin if ID is provided, else create a new admin
        if (req.body.id) {
            await Admin.updateOne(
                {
                    _id: req.body.id, // Find the admin by ID for update
                },
                data
            )
        } else {
            await Admin.create(data) // Create a new admin
        }

        return res.status(200).json({
            message: `User ${req.body.id ? 'updated' : 'created'}`, // Success message depending on the operation
        })
    } catch (error) {
        console.log(error) // Log the error for debugging
        return res.status(500).json({ error: 'Something went wrong' }) // Return general error response
    }
}

// Change the activation status of an admin
const changeStatus = async (req, res) => {
    try {
        const { status, id } = req.body
        // Ensure id is provided
        if (!id) {
            return res.status(404).json({ error: 'Invalid data' })
        }

        // Toggle active status for the admin, excluding 'super_admin'
        const update = await Admin.findOneAndUpdate(
            { _id: id, role: { $ne: 'super_admin' } }, // Ensure 'super_admin' cannot be modified
            {
                $set: {
                    active: !status, // Toggle the current status
                },
            }
        )

        // If no matching admin was found, return an error
        if (!update?._id) {
            return res.status(404).json({ error: 'Activation error' })
        }
        return res.status(200).json({
            message: `User status changed`, // Success message on status change
        })
    } catch (error) {
        return res.status(404).json({ error: 'Something went wrong' }) // General error response
    }
}

// Soft delete an admin by ID
const deleteItem = async (req, res) => {
    try {
        const { id } = req.body
        // Ensure id is provided
        if (!id) {
            return res.status(404).json({ error: 'Id not found' }) // Return error if no ID provided
        }

        // Soft delete the admin (ensure 'super_admin' cannot be deleted)
        await Admin.deleteOne({ _id: id, role: { $ne: 'super_admin' } })
        return res.status(200).json({
            message: `User Deleted`, // Success message for deletion
        })
    } catch (error) {
        return res.status(404).json({ error: 'Something went wrong' }) // General error response
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
