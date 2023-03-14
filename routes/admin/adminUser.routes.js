const express = require('express')
require('express-group-routes')
const router = express.Router()
const adminUserController = require('../../controller/admin/adminUser.controller')

router.group('/', (router) => {
    router.get('/', adminUserController.userDetail)
    router.get('/update-profile', adminUserController.profileUpdate)
    router.post('/update-profile', adminUserController.profileUpdateSave)
    router.get('/change-password', adminUserController.changePassword)
    router.post('/change-password', adminUserController.changePasswordSave)
})
// router.post('/', adminUserController.verifyOtp)

module.exports = router
