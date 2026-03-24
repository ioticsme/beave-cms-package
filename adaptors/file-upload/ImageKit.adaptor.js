var envConfig = require('../../config/env.config.js')
const { logError } = require('../../helper/Logger.helper.js')
var Media = require('../../model/Media.js')
var ImageKit = require('imagekit')

// Upload function internally uses the ImageKit.io javascript SDK
const imageKitUploadMedia = async (media, folder, file, imagekitConfig) => {
    try {
        // SDK initialization
        const imagekit = new ImageKit({
            publicKey: imagekitConfig.public_key,
            privateKey: imagekitConfig.private_key,
            urlEndpoint: imagekitConfig.url,
            folder: imagekitConfig.folder,
        })

        // let nodeEnv = envConfig.general.NODE_ENV
        let baseFolder = `${imagekitConfig?.folder?.toLowerCase() || 'sample'}`
        if (
            envConfig.general.NODE_ENV == 'development' ||
            envConfig.general.NODE_ENV == 'staging'
        ) {
            baseFolder = `${baseFolder}/${envConfig.general.NODE_ENV.toLowerCase()}`
        }
        const uploaded = await imagekit
            .upload({
                folder: `${baseFolder}/${folder}`,
                file: media,
                fileName: file?.originalname?.toLowerCase() || 'sample-image',
                // tags : ["tag1"]
            })
            .then(async (result) => {
                // const rendered_url = await imagekit.url({
                //     src: result.url,
                //     transformation: [{ height: 300, width: 400 }],
                // })

                let fileType = 'image'
                if (file.mimetype == 'application/pdf') {
                    fileType = 'pdf'
                }

                const insertedMedia = await Media.create({
                    drive: 'imagekit',
                    url: result.url,
                    response: result,
                    file: {
                        name:
                            file?.originalname?.toLowerCase() || 'sample-image',
                    },
                    file_type: fileType,
                })

                // console.log(insertedMedia)

                return insertedMedia
            })
            .catch((error) => {
                logError(error)
                return false
            })

        return uploaded
    } catch (error) {
        logError(error)
        return {}
    }
}

const imageKitUploadProductMedia = async (media, folder, file) => {
    // SDK initialization
    const imagekit = new ImageKit({
        publicKey: envConfig.imagekit.PUBLIC_KEY,
        privateKey: envConfig.imagekit.PRIVATE_KEY,
        urlEndpoint: envConfig.imagekit.URL,
    })

    let baseFolder =
        `${envConfig.imagekit?.FOLDER?.toLowerCase()}/${envConfig.general?.NODE_ENV?.toLowerCase()}` ||
        'Sample'
    const uploaded = await imagekit
        .upload({
            folder: `${baseFolder}/${folder}`,
            file: media,
            fileName: file?.originalname?.toLowerCase() || 'sample-image',
            // tags : ["tag1"]
        })
        .then(async (result) => {
            return result
        })
        .catch((error) => {
            logError(error)
            return false
        })

    return uploaded
}

module.exports = { imageKitUploadMedia, imageKitUploadProductMedia }
