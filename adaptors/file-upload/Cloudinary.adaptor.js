var envConfig = require('../../config/env.config.js')
var Media = require('../../model/Media.js')
const cloudinary = require('cloudinary').v2

// Upload function internally uses the Cloudinary javascript SDK

const cloudinaryUploadMedia = async (media, folder, file, cloudinaryConfig) => {
    // SDK initialization
    cloudinary.config({
        cloud_name: cloudinaryConfig.cloud_name,
        api_key: cloudinaryConfig.api_key,
        api_secret: cloudinaryConfig.api_secret,
    })

    // Construct the folder path based on the environment
    let baseFolder =
        `${envConfig.cloudinary?.FOLDER?.toLowerCase()}/${envConfig.general?.NODE_ENV?.toLowerCase()}` ||
        'Sample'

    // Check if media is base64 or a file path
    let uploadOptions = {
        folder: `${baseFolder}/${folder}`,
        public_id: file?.originalname?.toLowerCase() || 'sample-image',
        resource_type: 'auto', // Automatically detect the resource type
    }

    // If media is a base64 string, ensure it is formatted correctly
    if (media.startsWith('data:')) {
        // It's already in the correct format
        uploadOptions.file = media
    } else {
        // Assume it's a raw base64 string and prepend the correct data URI
        const mimeType = file.mimetype || 'image/jpeg' // Default to jpeg if no type is available
        uploadOptions.file = `data:${mimeType};base64,${media}`
    }

    try {
        const result = await cloudinary.uploader.upload(
            uploadOptions.file,
            uploadOptions
        )

        let fileType = 'image'
        if (file.mimetype === 'application/pdf') {
            fileType = 'pdf'
        }

        const insertedMedia = await Media.create({
            drive: 'cloudinary',
            url: result.secure_url,
            response: result,
            file: {
                name: file?.originalname?.toLowerCase() || 'sample-image',
            },
            file_type: fileType,
        })

        return insertedMedia
    } catch (error) {
        console.log('ERR', error)
        return false
    }
}

module.exports = { cloudinaryUploadMedia }
