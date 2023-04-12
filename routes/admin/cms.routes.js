const express = require('express')
require('express-group-routes')
const router = express.Router()

const cmsContentController = require('../../controller/admin/cmsContent.controller')
const customFormController = require('../../controller/admin/customForm.controller')
const menuController = require('../../controller/admin/menu.controller')
const mediaController = require('../../controller/admin/media.controller')
// const galleryController = require('../../controller/admin/gallery.controller')
const { contentTypeCheck } = require('../../middleware/cms.middleware')

const multer = require('multer')
const upload = multer({ dest: 'temp/' })

router.group('/', (router) => {
    
    router.group('/media', (router) => {
        router.get('/', mediaController.list)
        router.post('/add-meta', mediaController.addMetaInfo)
        router.get('/json', mediaController.jsonList)
        router.get('/view/:id', mediaController.jsonDetail)
        router.post('/upload', upload.any(), mediaController.fileUpload)
        router.post('/delete', mediaController.deleteMedia)
    })

    // Media management Routes
    router.group('/menu', (router) => {
        router.get('/', menuController.listMenu)
        router.post('/section/add', menuController.addSection)
        router.post('/add', menuController.addMenu)
        router.get('/:position/edit/:id/:level', menuController.editMenu)
        router.post('/:position/edit', menuController.saveEditMenu)
        router.post('/delete-position', menuController.deletePosition)
        router.post('/delete', menuController.deleteMenu)
        router.post('/save', menuController.saveMenu)
    })

    // Custom Forms
    router.group('/forms', (router) => {
        router.get('/', customFormController.list)
        router.get('/add', customFormController.add)
        router.post('/save', customFormController.save)
    })

    // Content Management Routes
    router.get('/:contentType', contentTypeCheck, cmsContentController.list)
    router.get(
        '/:contentType/detail/:id',
        contentTypeCheck,
        cmsContentController.detail
    )
    router.get(
        '/:contentType/edit/:id',
        contentTypeCheck,
        cmsContentController.edit
    )
    router.get('/:contentType/add', contentTypeCheck, cmsContentController.add)
    router.post(
        '/:contentType/save',
        contentTypeCheck,
        upload.any(),
        cmsContentController.save
    )
    router.post(
        '/:contentType/delete',
        contentTypeCheck,
        cmsContentController.deleteContent
    )
    router.post(
        '/:contentType/change-status',
        contentTypeCheck,
        cmsContentController.changeStatus
    )

    // Below routes are  for page builder (GrapeJs) editor
    router.get(
        '/:contentType/editor/preview/:id',
        contentTypeCheck,
        cmsContentController.previewPageBuildData
    )
    router.get(
        '/:contentType/editor/load-data/:id',
        contentTypeCheck,
        cmsContentController.loadEditorData
    )
    router.get(
        '/:contentType/editor/:id',
        contentTypeCheck,
        cmsContentController.pageBuildEditor
    )
    router.post(
        '/:contentType/editor/save',
        contentTypeCheck,
        cmsContentController.savePageBuilderData
    )
})

module.exports = router
