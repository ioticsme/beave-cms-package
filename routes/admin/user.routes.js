const express = require('express')
require('express-group-routes')
const router = express.Router()
const userController = require('../../controller/admin/user.controller')

router.group('/', (router) => {
    router.get('/', userController.list)
    // router.get('/update-profile', userController.profileUpdate)
    // router.post('/update-profile', userController.profileUpdateSave)
    // router.get('/change-password', userController.changePassword)
    // router.post('/change-password', userController.changePasswordSave)
    router.post('/change-status', userController.changeStatus)
})
// router.post('/', userController.verifyOtp)

module.exports = router
