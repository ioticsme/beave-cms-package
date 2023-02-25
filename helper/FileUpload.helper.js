const envConfig = require('../config/env.config')
const ImageKit = require('imagekit')
const Media = require('../model/Media')
var FileReader = require('filereader')

// Upload function internally uses the ImageKit.io javascript SDK
const uploadMedia = async (media, folder, new_name) => {
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

    let nodeEnv = envConfig.general.NODE_ENV
    let baseFolder = `${envConfig.imagekit.FOLDER}/${
        nodeEnv.charAt(0).toUpperCase() + nodeEnv.slice(1)
    }`
    const uploaded = await imagekit
        .upload({
            folder: `${baseFolder}/${folder}`,
            file: media,
            fileName: new_name,
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
