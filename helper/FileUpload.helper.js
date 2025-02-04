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
const { decryptData } = require('./Operations.helper.js')

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
            const public_key = decryptData(
                media_drive_config?.imagekit?.public_key
            )
            const private_key = decryptData(
                media_drive_config?.imagekit?.private_key
            )
            let driveConfig = {
                public_key: public_key || envConfig.imagekit.PUBLIC_KEY,
                private_key: private_key || envConfig.imagekit.PRIVATE_KEY,
                url: media_drive_config?.imagekit?.url,
                folder: media_drive_config?.imagekit?.folder,
            }
            return await imageKitUploadMedia(media, folder, file, driveConfig)
        } else if (media_drive_config.default_drive == 'cloudinary') {
            const api_key = decryptData(media_drive_config?.api_key)
            const api_secret = decryptData(media_drive_config?.api_secret)
            let driveConfig = {
                api_key: api_key,
                api_secret: api_secret,
                cloud_name: media_drive_config?.cloud_name,
                folder: media_drive_config?.folder,
            }
            // TODO: Replace it with cloudinary
            return await cloudinaryUploadMedia(media, folder, file, driveConfig)
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
