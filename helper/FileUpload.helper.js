const envConfig = require('../config/env.config')
const ImageKit = require('imagekit')
const Media = require('../model/Media')
var FileReader = require('filereader')

// Upload function internally uses the ImageKit.io javascript SDK
const uploadMedia = async (media, folder, file) => {
    // SDK initialization
    const imagekit = new ImageKit({
        publicKey: envConfig.imagekit.PUBLIC_KEY,
        privateKey: envConfig.imagekit.PRIVATE_KEY,
        urlEndpoint: envConfig.imagekit.URL,
    })

    // URL generation
    // const imageURL = imagekit.url({
    //     path: '/default-image.jpg',
    //     transformation: [
    //         {
    //             height: '300',
    //             width: '400',
    //         },
    //     ],
    // })

    // let nodeEnv = envConfig.general.NODE_ENV
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
            // const rendered_url = await imagekit.url({
            //     src: result.url,
            //     transformation: [{ height: 300, width: 400 }],
            // })

            const insertedMedia = await Media.create({
                url: result.url,
                response: result,
                file: {
                    name: file?.originalname?.toLowerCase() || 'sample-image',
                },
            })

            return insertedMedia
        })
        .catch((error) => {
            console.log('ERR', error)
            return false
        })

    return uploaded
}

module.exports = {
    uploadMedia,
}
