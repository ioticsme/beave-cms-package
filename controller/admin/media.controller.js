require('dotenv').config()
const { uploadMedia } = require('../../helper/FileUpload.helper')
const fs = require('fs')
const Media = require('../../model/Media')

const list = async (req, res) => {
    try {
        const media = await Media.find()
        return res.render('admin-njk/cms/media/listing', { media })
    } catch (error) {
        return res.render(`admin-njk/error-404`)
    }
}

const jsonList = async (req, res) => {
    try {
        const media = await Media.find()
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
            const media = await uploadMedia(base64, 'Media', file.filename) //file.originalname
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

module.exports = {
    list,
    jsonList,
    fileUpload,
}
