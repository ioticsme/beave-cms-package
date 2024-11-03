const envConfig = require('../../config/env.config')
const {
    uploadMedia,
    deleteMediaFile,
} = require('../../helper/FileUpload.helper')
const fs = require('fs')
const Media = require('../../model/Media')

// List all media files, sorted by creation date (newest first)
const list = async (req, res) => {
    try {
        const media = await Media.find().sort({ created_at: -1 }) // Fetch media and sort
        let hasPdfUpload = envConfig.general.HAS_PDF_UPLOAD // Check if PDF upload is enabled
        return res.render('admin-njk/cms/media/listing', {
            media,
            hasPdfUpload,
        })
    } catch (error) {
        console.log('error :>> ', error)
        return res.render(`admin-njk/app-error-500`) // Render error page
    }
}

// Return media list in JSON format excluding PDFs
const jsonList = async (req, res) => {
    try {
        const media = await Media.find({ file_type: { $ne: 'pdf' } }).sort({
            created_at: -1,
        })
        return res.status(200).json(media) // Send media as JSON response
    } catch (error) {
        return res.render(`admin-njk/app-error-500`) // Render error page
    }
}

// Return details of a single media file by ID in JSON format
const jsonDetail = async (req, res) => {
    try {
        const media = await Media.findOne({
            _id: req.params.id,
        })
        return res.status(200).json(media) // Send media details as JSON response
    } catch (error) {
        return res.render(`admin-njk/app-error-500`) // Render error page
    }
}

// Handle media file uploads
const fileUpload = async (req, res) => {
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
            const media = await uploadMedia(base64, 'media', file) // Upload media
            // Deleting the image saved to temp/ folder after upload
            fs.unlinkSync(`temp/${file.filename}`)
            if (media && media._id) {
                images[fieldName] = {
                    ...images[fieldName],
                    [fieldLang]: {
                        media_url: media.url,
                        media_id: media._id,
                    },
                }
            } else {
                return res.status(503).json({
                    error: 'Some error occurred while uploading the image',
                })
            }
        }
    }
    return res.status(200).json('uploaded') // Respond with success message
}

// Handle article image uploads (specific to articles)
const articleImageUpload = async (req, res) => {
    try {
        let images = {}
        if (!(req.files && req.files.length)) {
            return res.status(400).json({ error: 'No media files found' })
        }
        let file = req.files[0]
        // Creating base64 from file
        const base64 = Buffer.from(fs.readFileSync(file.path)).toString(
            'base64'
        )
        const media = await uploadMedia(base64, 'article', file, req) // Upload media
        // If upload fails, return an error
        if (!(media && media._id)) {
            return res.status(503).json({
                error: 'Some error occurred while uploading the image',
            })
        }
        let baseUrl = ''
        if (media.drive == 'local') {
            baseUrl = `${req.protocol}://${req.headers.host}/`
        }

        return res.status(200).json({
            file: {
                url: `${baseUrl}${media.url}`,
                id: media._id,
            },
        }) // Respond with media info
    } catch (error) {
        console.log(error)
        return res.status(404).json({ error: 'Something went wrong' }) // Respond with error
    }
}

// Handle CKEditor file uploads
const ckEditorFileUpload = async (req, res) => {
    let images = {}
    if (!(req.files && req.files.length)) {
        return res.status(400).json({ error: 'No media files found' }) // Return error if no files
    }
    let file = req.files[0]
    // Creating base64 from file
    const base64 = Buffer.from(fs.readFileSync(file.path)).toString('base64')
    const media = await uploadMedia(base64, 'media', file) // Upload media
    // Deleting the image saved to temp/ folder after upload
    fs.unlinkSync(`temp/${file.filename}`)
    // If upload fails, return error
    if (!(media && media._id)) {
        return res.status(503).json({
            error: 'Some error occurred while uploading the image',
        })
    }
    let baseUrl = ''
    if (media.drive == 'local') {
        baseUrl = `${req.protocol}://${req.headers.host}/`
    }
    return res.status(200).json({
        urls: {
            default: `${baseUrl}${media.url}`,
        },
    }) // Return uploaded media URL
}

// Delete a media file by ID
const deleteMedia = async (req, res) => {
    try {
        const { id } = req.body
        // If id is not provided
        if (!id) {
            return res.status(404).json({ error: 'Id not found' })
        }

        const media = await Media.findOne({
            _id: id,
        })

        if (!media) {
            return res.status(404).json({ error: 'Not Found' }) // Return error if media not found
        }

        const deleteFile = await deleteMediaFile('media', media) // Delete media file

        if (deleteFile) {
            await Media.deleteOne({
                _id: id,
            }) // Remove media from database
        }

        return res.status(200).json({
            message: 'Media deleted',
            url: `/cms/media`,
        }) // Return success message
    } catch (error) {
        console.log(error)
        return res.status(404).json({ error: 'Something went wrong' }) // Return error
    }
}

// Add metadata (title and alt text) to a media file
const addMetaInfo = async (req, res) => {
    try {
        const { id, title, alt_text, drive } = req.body
        // If id is not provided
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
                    drive: req.body.drive,
                },
            }
        )

        return res.status(200).json({
            message: 'Media updated',
            url: `/cms/media`,
        }) // Return success message
    } catch (error) {
        console.log(error)
        return res.status(404).json({ error: 'Something went wrong' }) // Return error
    }
}

module.exports = {
    list, // List media
    jsonList, // Return media list in JSON
    jsonDetail, // Return media details in JSON
    addMetaInfo, // Add metadata to media
    fileUpload, // Handle file uploads
    articleImageUpload, // Handle article image uploads
    ckEditorFileUpload, // Handle CKEditor file uploads
    deleteMedia, // Delete media file
}
