const envConfig = require('../../config/env.config') // Import environment configuration
const Joi = require('joi') // Import Joi for input validation
const bcrypt = require('bcryptjs') // Import bcrypt for password hashing and comparison
const Admin = require('../../model/Admin') // Import the Admin model
const Brand = require('../../model/Brand') // Import the Brand model
var session = require('express-session') // Import express-session for session management
const Settings = require('../../model/Settings') // Import Settings model

// Handles the signup page rendering
const signup = async (req, res) => {
    try {
        const admin = await Admin.findOne() // Check if any admin user already exists
        if (admin) {
            // If an admin exists, redirect to the login page
            return res.redirect('/admin/auth/login')
        }
        // If no admin exists, render the signup form
        res.render(`admin-njk/authentication/sign-up`)
    } catch (error) {
        // Render the 500 error page in case of an exception
        res.render(`admin-njk/app-error-500`)
    }
}

// Handles form submission for signup
const signupSubmit = async (req, res) => {
    try {
        // Define Joi schema to validate the signup form data
        const schema = Joi.object({
            name: Joi.string().required().max(60), // Name field is required with a max length of 60 characters
            email: Joi.string().email().required().max(60), // Email must be valid and within 60 characters
            password: Joi.string().required().min(4).max(15), // Password must be between 4-15 characters
            confirm_password: Joi.string()
                .required()
                .valid(Joi.ref('password')), // Confirm password must match the password field
        })

        // Validate the form data against the schema
        const validationResult = schema.validate(req.body, {
            abortEarly: false, // Do not stop on first error, show all validation errors
        })

        if (validationResult.error) {
            // If validation fails, return the error with a 422 status code
            res.status(422).json(validationResult.error)
            return
        }

        const saltRounds = 10
        const salt = bcrypt.genSaltSync(saltRounds) // Generate salt for password hashing

        // Create a new admin with the validated data
        const admin = await Admin.create({
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, salt), // Hash the password
            role: 'super_admin', // Set the role as 'super_admin'
        })

        if (admin?._id) {
            // Destroy session and redirect to login if signup is successful
            req.session.destroy()
            return res.status(200).json({
                redirect_to: '/admin/auth/login', // Redirect to login page after successful signup
            })
        } else {
            return res.status(500).json({ error: 'Something went wrong' }) // Return 500 if signup fails
        }
    } catch (e) {
        // Handle validation errors specifically
        if (e.errors) {
            return res.status(422).json({
                details: e.errors,
            })
        }
        // Return a generic error message in case of other exceptions
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

// Handles the login page rendering
const login = async (req, res) => {
    try {
        const admin = await Admin.findOne() // Check if an admin exists
        if (!admin) {
            // If no admin exists, redirect to the signup page
            res.redirect('/admin/auth/signup')
            return
        }
        // Render the login page
        return res.render(`admin-njk/authentication/sign-in`)
    } catch (error) {
        console.log(error)
        // Render 500 error page in case of an exception
        return res.render(`admin-njk/app-error-500`)
    }
}

// Handles form submission for login
const loginSubmit = async (req, res) => {
    try {
        // Define Joi schema to validate the login form data
        const schema = Joi.object({
            email: Joi.string().email().required().max(60), // Email must be valid and within 60 characters
            password: Joi.string().required().min(4).max(15), // Password must be between 4-15 characters
        })

        // Validate the form data against the schema
        const validationResult = schema.validate(req.body, {
            abortEarly: false, // Do not stop on first error, show all validation errors
        })

        if (validationResult.error) {
            // If validation fails, return the error with a 422 status code
            res.status(422).json(validationResult.error)
            return
        }

        // Find the admin based on the submitted email
        const admin = await Admin.findOne({
            email: req.body.email,
        })

        if (!admin) {
            // Return an error if no admin is found with the provided email
            return res.status(401).json({ error: 'Invalid email or password' })
        }

        if (!admin?.active) {
            // Return an error if the admin account is inactive
            return res.status(401).json({
                error: 'An administrator has blocked you from this app',
            })
        }

        // Compare the submitted password with the stored hashed password
        if (bcrypt.compareSync(req.body.password, admin.password)) {
            // Fetch the brand details and populate related fields
            const brand = await Brand.findOne()
                .populate({
                    path: 'languages',
                    options: { sort: { is_default: -1 } }, // Sort by default language
                })
                .populate('domains.country')

            // Store admin details in the session
            session = req.session
            session.admin_id = admin._id
            session.admin_name = admin.name
            session.admin_role = admin.role

            // Fetch settings based on the brand and country details
            const settings = await Settings.findOne({
                brand: brand,
                country: brand.domains[0].country._id,
            }).select('-brand -country -__v -created_at -updated_at -author')

            // Set brand details in session
            session.brand = {
                _id: brand._id,
                name: brand.name,
                code: brand.code,
                languages: brand.languages,
                country: brand.domains[0].country._id,
                country_name: brand.domains[0].country.name.en,
                country_code: brand.domains[0].country.code,
                country_currency: brand.domains[0].country.currency,
                country_currency_symbol:
                    brand.domains[0].country.currency_symbol,
                settings: settings ? settings : {},
            }

            // Return a successful login response with redirection
            return res.status(200).json({
                redirect_to: envConfig.general.ADMIN_LANDING_URL, // Redirect to the admin landing page
            })
        } else {
            // Return an error if password comparison fails
            return res.status(401).json({ error: 'Invalid email or password' })
        }
    } catch (error) {
        console.log(error)
        // Return a generic error message in case of exception
        return res.status(404).json({ error: 'Something went wrong' })
    }
}

// Handles the forgot credentials (not yet implemented)
const forgotCredentials = async (req, res) => {
    res.status(200).json(`Login`) // Placeholder response
}

// Handles admin logout and session cleanup
const logout = async (req, res) => {
    try {
        // Delete admin details from session
        delete req.session.admin_id
        delete req.session.admin_name
        delete req.session.admin_role
        // Redirect to login page after logout
        res.redirect('/admin/auth/login')
    } catch (error) {
        // Render 500 error page in case of an exception
        res.render(`admin-njk/app-error-500`)
    }
}

module.exports = {
    signup, // Export signup handler
    signupSubmit, // Export signup form submission handler
    login, // Export login page rendering handler
    loginSubmit, // Export login form submission handler
    forgotCredentials, // Export forgot credentials handler (not implemented)
    logout, // Export logout handler
}
