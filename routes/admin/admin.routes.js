require('dotenv').config()
const express = require('express')
const fs = require('fs')
const router = express.Router()
require('express-group-routes')

// BEGIN:: Route Groups
const configRoutes = require('./config.routes')
const authRoutes = require('./auth.routes')
const dashboardRoutes = require('./dashboard.routes')
const cmsRoutes = require('./cms.routes')
const settingsRoutes = require('./settings.routes')
const customFormsRoutes = require('./customForm.routes')
const logRoutes = require('./log.routes')
const userRoutes = require('./user.routes')
// END:: Route Groups

// BEGIN::Admin Middleware
const {
    authCheck,
    checkSuperAdmin,
} = require('../../middleware/cms.middleware')
// END::Admin Middleware

// BEGIN:: Routes
router.use('/auth', authRoutes)
router.get('/', (req, res) => {
    res.redirect('/admin/dashboard')
})
router.use('/dashboard', [authCheck], dashboardRoutes)

// router.use('/ecommerce', [authCheck], ecommerceRoutes)

router.use('/cms', [authCheck], cmsRoutes)

router.use('/settings', [authCheck], settingsRoutes)
router.use('/custom-forms', [authCheck], customFormsRoutes)
router.use('/log', [authCheck], logRoutes)
router.use('/user', [authCheck], userRoutes)
router.use('/config', [authCheck, checkSuperAdmin], configRoutes)
// END:: Routes

module.exports = router
