const envConfig = require('../../config/env.config')
const express = require('express')
const fs = require('fs')
const router = express.Router()
const multer = require('multer')
require('express-group-routes')

const upload = multer({ dest: 'uploads/' })

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
    checkRouteAccess,
} = require('../../middleware/cmsAuth.middleware')
// END::Admin Middleware

const {
    articleImageUpload,
} = require('../../controller/admin/media.controller')

// BEGIN:: Routes
router.use('/auth', authRoutes)
router.get('/', (req, res) => {
    res.redirect('/admin/dashboard')
})

router.use([authCheck, checkRouteAccess])

router.use('/dashboard', dashboardRoutes)

router.use('/access-control', accessControlRoutes)

router.use('/cms', cmsRoutes)

router.use('/users', userRoutes)

router.use('/settings', settingsRoutes)
router.use('/custom-forms', customFormsRoutes)
router.use('/log', logRoutes)
router.use('/admin-user', adminUserRoutes)

// Configuration routes --> Only for super admins
router.use('/config', checkSuperAdmin, configRoutes)

// END:: Routes

// BEGIN::Image Uploader Path for Article Editor
router.post('/upload-article-image', upload.any(), articleImageUpload)
// END::Image Uploader Path for Article Editor

module.exports = router
