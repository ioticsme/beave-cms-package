const express = require('express')
const router = express.Router()
require('express-group-routes')
const authController = require('../../controller/api/auth.controller')
const generalController = require('../../controller/api/general.controller')
const customFormController = require('../../controller/api/customForm.controller')
const checkoutController = require('../../controller/api/checkout.controller')
const userController = require('../../controller/api/user.controller')

// Middleware
// const { checkHasCMS } = require('../../middleware/global.middleware')
const {
    BrandWithCountryCheck,
    webDefaultHeader,
    UserAuthCheck,
    ecommerceModeCheck,
    userAgent,
} = require('../../middleware/api.middleware')
const { getNav } = require('../../middleware/api.middleware')
// const { app } = require('firebase-admin')

// BEGIN::Route Files
const cmsRoutes = require('./_cms.routes')
const ecommerceRoutes = require('./_ecommerce.routes')
// END::Route Files

router.use(BrandWithCountryCheck)
router.use(webDefaultHeader)
router.use(getNav)
router.use(userAgent)

router.group('/', (router) => {
    router.get('/', (req, res) => {
        res.redirect('/health')
    })

    // router.group('/test', (router) => {
    //     // router.get('/brand', testController.brandList)
    //     // router.get('/country', testController.countryList)
    //     router.get('/test', testController.test)
    //     router.get('/pdf', testController.pdfGenerate)
    // })

    // CMS Related Routes
    router.use('/cms', cmsRoutes)

    // // catalog
    // router.group('/catalog', (router) => {
    //     // Product
    //     router.get('/products', catalogController.productList)
    //     router.get('/products/:id', catalogController.productDetail)
    // })

    // General
    router.group('/general', (router) => {
        router.get('/menu', generalController.menuList)
        router.get('/brand', generalController.brandingDetail)
        router.get('/navigation', generalController.navList)
    })

    // Auth
    router.group('/auth', (router) => {
        router.group('/login', (router) => {
            router.post('/', authController.loginSubmit)
            router.post('/social', authController.socialLoginSubmit)
            router.post('/update-mobile', authController.updateMobileNo)
        })
        router.post('/signup', authController.signupSubmit)
        router.post('/verify', authController.otpVerification)
        router.post('/resend-otp', authController.resendOTP)

        // Forgot password
        router.group('/forgot', (router) => {
            router.post('/', authController.forgotCredentials)
            router.post('/verify', authController.verifyForgotOTP)
        })
    })
    // custom forms
    router.post('/custom-forms/submit', customFormController.customFormSubmit)
    router.group('/payfort-webhook', (router) => {
        router.all('/feedback', checkoutController.payfortWebHookFeedback)
        router.all(
            '/notification',
            checkoutController.payfortWebHookNotification
        )
    })
})

// user
router.group('/user', (router) => {
    router.get('/logout', [UserAuthCheck], authController.logout)
    // Account
    router.group('/account', (router) => {
        router.get('/', [UserAuthCheck], userController.detail)
        router.post('/edit', [UserAuthCheck], userController.editUser)
        router.post(
            '/change-password',
            [UserAuthCheck],
            userController.changePassword
        )
    })
    // Ecommerce related routes
    // router.use('/', [ecommerceModeCheck, UserAuthCheck], ecommerceRoutes)
})

module.exports = router
