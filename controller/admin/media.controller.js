require('dotenv').config()
const { uploadMedia } = require('../../helper/FileUpload.helper')
const Media = require('../../model/Media')


const list = async (req, res) => {
    try {
        const media = await Media.find()
        return res.render('admin/cms/media/listing', { media })
    } catch (error) {
        return res.render(`admin/error-404`)
    }
}

const fileUpload = async(req, res) => {
    console.log(req.files)
    const uploaded = uploadMedia(req.files[0],'iocms_test', 'dz_upload')
    console.log(uploaded)
    return res.json('uploaded')
}

module.exports = {
    list,
    fileUpload,
}
