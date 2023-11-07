const express = require('express')
require('express-group-routes')
const router = express.Router()
const accessController = require('../../controller/admin/access.controller')

router.group('/', (router) => {
    router.group('/users', (router) => {
        router.get('/', accessController.list)
        router.get('/add', accessController.add)
        router.get('/edit/:id', accessController.edit)
        router.post('/save', accessController.save)
        router.post('/change-status', accessController.changeStatus)
        router.post('/delete', accessController.deleteItem)
    })
})

module.exports = router
