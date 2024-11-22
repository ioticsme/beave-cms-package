const envConfig = require('../config/env.config')
const Config = require('../model/Config')
const {
    imageKitUploadMedia,
} = require('../adaptors/file-upload/ImageKit.adaptor.js')
const {
    cloudinaryUploadMedia,
} = require('../adaptors/file-upload/Cloudinary.adaptor.js')
// const {
//     bunnyCDNUploadMedia,
//     bunnyCDNUploadMediaFromURL,
// } = require('../adaptors/file-upload/BunnyCdn.adaptor.js')
const {
    localUploadMedia,
    localDeleteMedia,
} = require('../adaptors/file-upload/localUpload.adaptor.js')

const getDriveConfig = async () => {
    const config = await Config.findOne()
    return config?.media_drive
}
// Upload function internally uses the ImageKit.io javascript SDK
const uploadMedia = async (media, folder, file) => {
    const media_drive_config = await getDriveConfig()
    if (media_drive_config.default_drive == 'local') {
        const res = await localUploadMedia(media, folder, file)
        return res
    } else {
        if (media_drive_config.default_drive == 'imagekit') {
            return await imageKitUploadMedia(
                media,
                folder,
                file,
                media_drive_config.imagekit
            )
        } else if (media_drive_config.default_drive == 'cloudinary') {
            // TODO: Replace it with cloudinary
            return await cloudinaryUploadMedia(
                media,
                folder,
                file,
                media_drive_config.cloudinary
            )
        } else {
            return 'No Drive Configured'
        }
    }
}

const uploadMediaFromURL = async (media_url, folder, req = {}) => {
    if (envConfig.default_drive == 'bunny_cdn') {
        return await bunnyCDNUploadMediaFromURL(media_url, folder)
    } else {
        return {}
    }
}

const deleteMediaFile = async (folder, mediaObj) => {
    if (mediaObj.drive == 'bunny_cdn') {
        // TODO: Delete file from storage should be done
        return true
    } else if (mediaObj.drive == 'imagekit') {
        // TODO: Delete file from storage should be done
        return true
    } else if (mediaObj.drive == 'cloudinary') {
        // TODO: Delete file from storage should be done
        return true
    } else if (mediaObj.drive == 'local') {
        const res = await localDeleteMedia(folder, mediaObj.file.name)
        return res
    } else {
        return 'No Drive Configured'
    }
}

module.exports = { uploadMedia, uploadMediaFromURL, deleteMediaFile }
