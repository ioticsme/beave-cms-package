const express = require('express')
require('express-group-routes')
const router = express.Router()
const adminController = require('../../controller/config/admin.controller')
const countryController = require('../../controller/config/country.controller')
const languageController = require('../../controller/config/language.controller')
const brandController = require('../../controller/config/brand.controller')
const contentTypeController = require('../../controller/config/contentType.controller')
const appSettingsController = require('../../controller/config/appSettings.controller')

router.group('/', (router) => {
    router.group('/admin', (router) => {
        router.get('/', adminController.list)
        router.get('/add', adminController.add)
        router.get('/edit/:id', adminController.edit)
        router.post('/save', adminController.save)
        router.post('/change-status', adminController.changeStatus)
        router.post('/delete', adminController.deleteItem)
    })
    router.group('/country', (router) => {
        router.get('/', countryController.list)
        router.get('/add', countryController.add)
        router.get('/edit/:id', countryController.edit)
        router.post('/save', countryController.save)
        router.post('/delete', countryController.deleteItem)
    })
    router.group('/language', (router) => {
        router.get('/', languageController.list)
        router.get('/add', languageController.add)
        router.get('/edit/:id', languageController.edit)
        router.post('/save', languageController.save)
        router.post('/delete', languageController.deleteItem)
    })
    router.group('/brand', (router) => {
        router.get('/', brandController.list)
        router.get('/add', brandController.add)
        router.get('/edit/:id', brandController.edit)
        router.post('/save', brandController.save)
        router.post('/change-status', brandController.changeStatus)
        router.post('/delete', brandController.deleteItem)
    })
    router.group('/content-type', (router) => {
        router.get('', contentTypeController.list)
        router.get('/add', contentTypeController.add)
        router.get('/edit/:id', contentTypeController.edit)
        router.post('/save', contentTypeController.save)
        router.post('/delete', contentTypeController.deleteItem)
    })

    router.group('/app-settings', (router) => {
        router.get('', appSettingsController.list)
        router.post('/save', appSettingsController.save)
    })
})

module.exports = router
