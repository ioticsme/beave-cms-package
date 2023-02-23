require('dotenv').config()
const { uploadMedia } = require('../../helper/FileUpload.helper')
const fs = require('fs')
const Joi = require('joi')
const Media = require('../../model/Media')
const HtmlBuilder = require('../../model/HtmlBuilder')

const list = async (req, res) => {
    try {
        const html_datas = await HtmlBuilder.find()
        return res.render('admin-njk/cms/html-builder/list', { html_datas })
    } catch (error) {
        return res.render(`admin-njk/error-404`)
    }
}

const viewPage = async (req, res) => {
    try {
        const html_data = await HtmlBuilder.findOne({
            _id: req.params.id,
        })
        return res.render('admin-njk/cms/html-builder/view', {html_data})
    } catch (error) {
        return res.render(`admin-njk/error-404`)
    }
}

const add = async (req, res) => {
    try {
        return res.render('admin-njk/cms/html-builder/add')
    } catch (error) {
        return res.render(`admin-njk/error-404`)
    }
}

const save = async (req, res) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            slug: Joi.string().required(),
        })

        const validationResult = schema.validate(req.body, {
            abortEarly: false,
        })

        if (validationResult.error) {
            return res.status(422).json(validationResult.error)
        }

        const new_page = await HtmlBuilder.create(req.body)

        return res.json({
            redirect_to: `/admin/cms/html-builder/editor/${new_page._id}`,
        })
    } catch (error) {
        return res.render(`admin-njk/error-404`)
    }
}

const loadEditorData = async (req, res) => {
    try {
        const html_data = await HtmlBuilder.findOne({
            _id: req.params.id,
        })
        // console.log(html_data)
        return res.status(200).json(html_data)
    } catch (error) {
        return res.render(`admin-njk/error-404`)
    }
}

const editor = async (req, res) => {
    try {
        const page_id = req.params.id
        return res.render('admin-njk/cms/html-builder/editor', { page_id })
    } catch (error) {
        return res.render(`admin-njk/error-404`)
    }
}

const saveTemplate = async (req, res) => {
    try {
        const page = await HtmlBuilder.findOne({
            _id: req.body.id,
        })
        if (!page) {
            return res.status(404).json({
                error: 'Not Found',
            })
        }
        page.content = {
            html: req.body.html,
            css: req.body.css,
        }
        await page.save()

        return res.status(200).json('Saved')
    } catch (error) {
        return res.render(`admin-njk/error-500`)
    }
}

module.exports = {
    list,
    viewPage,
    add,
    save,
    loadEditorData,
    editor,
    saveTemplate,
}
