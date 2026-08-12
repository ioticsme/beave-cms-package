const express = require('express')
require('express-group-routes')
const router = express.Router()
const logController = require('../../controller/admin/log.controller')

router.group('/', (router) => {
    router.get('/server', logController.serverLogList)
    router.get('/server/json', logController.serverLogJsonList)
    // router.get('/queue', logController.queueList)
})
// router.post('/', userController.verifyOtp)

module.exports = router
