const envConfig = require('../config/env.config')
const {
    imageKitUploadMedia,
    imageKitUploadProductMedia,
} = require('../adaptors/ImageKit.adaptor.js')
const {
    bunnyCDNUploadMedia,
    bunnyCDNUploadProductMedia,
    bunnyCDNUploadMediaFromURL,
} = require('../adaptors/BunnyCdn.adaptor.js')

// Upload function internally uses the ImageKit.io javascript SDK
const uploadMedia = async (media, folder, file, req = {}) => {
    if (envConfig.media_drive == 'bunny_cdn') {
        return await bunnyCDNUploadMedia(media, folder, file, req)
    } else {
        return await imageKitUploadMedia(media, folder, file, req)
    }
}

const uploadMediaFromURL = async (media_url, folder, req = {}) => {
    if (envConfig.media_drive == 'bunny_cdn') {
        return await bunnyCDNUploadMediaFromURL(media_url, folder)
    } else {
        return {}
    }
}

const uploadProductMedia = async (media, folder, file) => {
    if (envConfig.media_drive == 'bunny_cdn') {
        return await bunnyCDNUploadProductMedia(media, folder, file)
    } else {
        return await imageKitUploadProductMedia(media, folder, file)
    }
}

module.exports = { uploadMedia, uploadMediaFromURL, uploadProductMedia }