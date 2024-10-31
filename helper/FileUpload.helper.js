const envConfig = require('../config/env.config')
const { imageKitUploadMedia } = require('../adaptors/ImageKit.adaptor.js')
const {
    bunnyCDNUploadMedia,
    bunnyCDNUploadMediaFromURL,
} = require('../adaptors/BunnyCdn.adaptor.js')
const {
    localUploadMedia,
    localDeleteMedia,
} = require('../adaptors/localUpload.adaptor.js')

// Upload function internally uses the ImageKit.io javascript SDK
const uploadMedia = async (media, folder, file, req = {}) => {
    if (envConfig.media_drive == 'bunny_cdn') {
        return await bunnyCDNUploadMedia(media, folder, file, req)
    } else if (envConfig.media_drive == 'imagekit') {
        return await imageKitUploadMedia(media, folder, file, req)
    } else if (envConfig.media_drive == 'cloudinary') {
        return await imageKitUploadMedia(media, folder, file, req)
    } else if (envConfig.media_drive == 'local') {
        const res = await localUploadMedia(media, folder, file, req)
        // console.log(res)
        return res
    } else {
        return 'No Drive Configured'
    }
}

const uploadMediaFromURL = async (media_url, folder, req = {}) => {
    if (envConfig.media_drive == 'bunny_cdn') {
        return await bunnyCDNUploadMediaFromURL(media_url, folder)
    } else {
        return {}
    }
}

const deleteMediaFile = async (folder, file) => {
    if (envConfig.media_drive == 'bunny_cdn') {
        // TODO: Delete file from storage should be done
        return true
    } else if (envConfig.media_drive == 'imagekit') {
        // TODO: Delete file from storage should be done
        return true
    } else if (envConfig.media_drive == 'cloudinary') {
        // TODO: Delete file from storage should be done
        return true
    } else if (envConfig.media_drive == 'local') {
        const res = await localDeleteMedia(folder, file)
        return res
    } else {
        return 'No Drive Configured'
    }
}

module.exports = { uploadMedia, uploadMediaFromURL, deleteMediaFile }
