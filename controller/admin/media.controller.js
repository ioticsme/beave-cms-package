const envConfig = require('../../config/env.config')
const { uploadMedia } = require('../../helper/FileUpload.helper')
const fs = require('fs')
const Media = require('../../model/Media')

const list = async (req, res) => {
    try {
        const media = await Media.find().sort({ created_at: -1 })
        return res.render('admin-njk/cms/media/listing', { media })
    } catch (error) {
        return res.render(`admin-njk/error-404`)
    }
}

const jsonList = async (req, res) => {
    try {
        const media = await Media.find().sort({ created_at: -1 })
        return res.status(200).json(media)
    } catch (error) {
        return res.render(`admin-njk/error-404`)
    }
}

const jsonDetail = async (req, res) => {
    try {
        const media = await Media.findOne({
            _id: req.params.id,
        })
        return res.status(200).json(media)
    } catch (error) {
        return res.render(`admin-njk/error-404`)
    }
}

const fileUpload = async (req, res) => {
    //BEGIN:: Media upload
    let images = {}
    if (req.files && req.files.length) {
        for (i = 0; i < req.files.length; i++) {
            let file = req.files[i]
            // Creating base64 from file
            const base64 = Buffer.from(fs.readFileSync(file.path)).toString(
                'base64'
            )
            let fieldName = req.files[i].fieldname.split('.')[0]
            let fieldLang = req.files[i].fieldname.split('.')[1]
            const media = await uploadMedia(base64, 'media', file) //file.originalname
            // Deleting the image saved to uploads/
            fs.unlinkSync(`temp/${file.filename}`)
            if (media && media._id) {
                images[fieldName] = {
                    ...images[fieldName],
                    [fieldLang]: {
                        media_url: media.url,
                        media_id: media._id,
                    },
                }
                // console.log(media)
            } else {
                return res.status(503).json({
                    error: 'Some error occured while uploading the image',
                })
            }
        }
    }
    //END:: Media upload
    return res.status(200).json('uploaded')
}

const deleteMedia = async (req, res) => {
    try {
        const { id } = req.body
        // If id not found
        if (!id) {
            return res.status(404).json({ error: 'Id not found' })
        }

        await Media.deleteOne({
            _id: id,
        })

        return res.status(200).json({
            message: 'Media deleted',
            url: `/cms/media`,
        })
    } catch (error) {
        console.log(error)
        return res.status(404).json({ error: 'Something went wrong' })
    }
}

const addMetaInfo = async (req, res) => {
    try {
        const { id, title, alt_text } = req.body
        // If id not found
        if (!id) {
            return res.status(404).json({ error: 'Id not found' })
        }

        await Media.updateOne(
            {
                _id: id,
            },
            {
                meta: {
                    title: req.body.title,
                    alt_text: req.body.alt_text,
                },
            }
        )

        return res.status(200).json({
            message: 'Media updated',
            url: `/cms/media`,
        })
    } catch (error) {
        console.log(error)
        return res.status(404).json({ error: 'Something went wrong' })
    }
}

module.exports = {
    list,
    jsonList,
    jsonDetail,
    addMetaInfo,
    fileUpload,
    deleteMedia,
}
