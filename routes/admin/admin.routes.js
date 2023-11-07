const envConfig = require('../../config/env.config')
const express = require('express')
const fs = require('fs')
const router = express.Router()
require('express-group-routes')

// BEGIN:: Route Groups
const configRoutes = require('./config.routes')
const accessControlRoutes = require('./accessControl.routes')
const authRoutes = require('./auth.routes')
const dashboardRoutes = require('./dashboard.routes')
const cmsRoutes = require('./cms.routes')
const userRoutes = require('./user.routes')
const settingsRoutes = require('./settings.routes')
const customFormsRoutes = require('./customForm.routes')
const logRoutes = require('./log.routes')
const adminUserRoutes = require('./adminUser.routes')
// END:: Route Groups

// BEGIN::Admin Middleware
const {
    authCheck,
    checkSuperAdmin,
} = require('../../middleware/cms.middleware')
// END::Admin Middleware

// BEGIN:: Routes
router.use('/auth', authRoutes)
// router.get('/', (req, res) => {
//     res.redirect('/admin/dashboard')
// })
// router.use('/dashboard', [authCheck], dashboardRoutes)

// router.use('/ecommerce', [authCheck], ecommerceRoutes)

router.use('/access-control', [authCheck], accessControlRoutes)

router.use('/cms', [authCheck], cmsRoutes)

router.use('/users', [authCheck], userRoutes)

router.use('/settings', [authCheck], settingsRoutes)
router.use('/custom-forms', [authCheck], customFormsRoutes)
router.use('/log', [authCheck], logRoutes)
router.use('/admin-user', [authCheck], adminUserRoutes)
router.use('/config', [authCheck, checkSuperAdmin], configRoutes)
// END:: Routes

module.exports = router
