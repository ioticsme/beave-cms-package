var envConfig = require('../../config/env.config.js')
var https = require('https')
var fs = require('fs')
var Media = require('../../model/Media.js')
var slugify = require('slugify')
var axios = require('axios')

const REGION = envConfig.bunny_cdn.REGION // If German region, set this to an empty string: ''
const BASE_HOSTNAME = envConfig.bunny_cdn.HOSTNAME
const HOSTNAME = REGION ? `${REGION}.${BASE_HOSTNAME}` : BASE_HOSTNAME
const STORAGE_ZONE_NAME = envConfig.bunny_cdn.STORAGE_ZONE_NAME
const ACCESS_KEY = envConfig.bunny_cdn.API_KEY

// Upload function internally uses the ImageKit.io javascript SDK
const bunnyCDNUploadMedia = async (media, folder, file) => {
    try {
        // No region specified, defaults to Falkenstein (storage.bunnycdn.com)
        // const bunnyStorage = new BunnyStorage.default(
        //     ACCESS_KEY,
        //     STORAGE_ZONE_NAME
        // )
        const FILE_PATH = media
        const FOLDER = `${envConfig.general.NODE_ENV}/${folder}`
        const FILENAME_TO_UPLOAD = encodeURIComponent(
            `${Date.now()}-${slugify(file?.originalname, {
                lower: true,
            })}` || 'sample-image'
        )

        // list all files in zone / path
        // const files = await bunnyStorage.list()
        // const readStream = fs.createReadStream(FILE_PATH)
        const decodedMedia = Buffer.from(FILE_PATH, 'base64')

        const options = {
            method: 'PUT',
            host: HOSTNAME,
            path: `/${STORAGE_ZONE_NAME}/${FOLDER}/${FILENAME_TO_UPLOAD}`,
            headers: {
                AccessKey: ACCESS_KEY,
                'Content-Type': 'application/octet-stream',
            },
        }
        // console.log(options)

        // Wrap the request in a promise to handle it asynchronously
        const uploaded = await new Promise((resolve, reject) => {
            const up_req = https.request(options, (res) => {
                res.on('data', (chunk) => {
                    // console.log(chunk.toString('utf8'))
                })
                res.on('end', () => {
                    resolve(true) // Resolve the promise when the request is completed
                })
            })

            up_req.on('error', (error) => {
                console.error(error)
                reject(error) // Reject the promise if there's an error
            })

            // Write the decoded media to the request stream
            up_req.write(decodedMedia)
            // End the request
            up_req.end()
        })

        if (uploaded) {
            const insertedMedia = await Media.create({
                url: `${envConfig.bunny_cdn.URL}/${FOLDER}/${FILENAME_TO_UPLOAD}`,
                response: uploaded,
                file: FILENAME_TO_UPLOAD,
                file_type: file.mimetype,
                // drive: envConfig.media_drive,
            })

            return insertedMedia
        } else {
            console.log(`Failed to upload media. Status code: 500`)
            // Handle the failure case here
        }
    } catch (e) {
        console.log(e)
        return `application error. Status code: 500`
    }
}

const bunnyCDNUploadImage = async (media, folder, file) => {
    try {
        // No region specified, defaults to Falkenstein (storage.bunnycdn.com)
        // const bunnyStorage = new BunnyStorage.default(
        //     ACCESS_KEY,
        //     STORAGE_ZONE_NAME
        // )
        const FILE_PATH = media
        const FOLDER = `${'staging'}/${folder}`
        const FILENAME_TO_UPLOAD = encodeURIComponent(
            `${Date.now()}-${slugify(file?.originalname, {
                lower: true,
            })}` || 'sample-image'
        )

        // list all files in zone / path
        // const files = await bunnyStorage.list()
        // const readStream = fs.createReadStream(FILE_PATH)
        const decodedMedia = Buffer.from(FILE_PATH, 'base64')

        const options = {
            method: 'PUT',
            host: HOSTNAME,
            path: `/${STORAGE_ZONE_NAME}/${FOLDER}/${FILENAME_TO_UPLOAD}`,
            headers: {
                AccessKey: ACCESS_KEY,
                'Content-Type': 'application/octet-stream',
            },
        }
        // console.log(options)

        // Wrap the request in a promise to handle it asynchronously
        const uploaded = await new Promise((resolve, reject) => {
            const up_req = https.request(options, (res) => {
                res.on('data', (chunk) => {
                    // console.log(chunk.toString('utf8'))
                })
                res.on('end', () => {
                    resolve(true) // Resolve the promise when the request is completed
                })
            })

            up_req.on('error', (error) => {
                console.error(error)
                reject(error) // Reject the promise if there's an error
            })

            // Write the decoded media to the request stream
            up_req.write(decodedMedia)
            // End the request
            up_req.end()
        })

        if (uploaded) {
            return `${envConfig.bunny_cdn.URL}/${FOLDER}/${FILENAME_TO_UPLOAD}`
        } else {
            console.log(`Failed to upload media. Status code: 500`)
            // Handle the failure case here
        }
    } catch (e) {
        console.log(e)
        return `application error. Status code: 500`
    }
}

const bunnyCDNUploadMediaFromURL = async (media_url, folder, req = {}) => {
    try {
        // console.log(media_url)
        const response = await axios.get(media_url, {
            responseType: 'arraybuffer',
        })
        // console.log(response)

        const base64Data = Buffer.from(response.data, 'binary').toString(
            'base64'
        )

        let file = {
            originalname: `${await getFileNameFromUrl(media_url)}`,
        }

        // return await bunnyCDNUploadMedia(base64Data, folder, file, req)
        return await bunnyCDNUploadImage(base64Data, folder, file)
    } catch (e) {
        console.log(e)
        return `application error. Status code: 500`
    }
}

const getFileNameFromUrl = async (url) => {
    // Extract the last part of the URL (after the last /)
    const urlParts = url.split('/')
    const filename = urlParts[urlParts.length - 1]

    // Decode URI components in case the filename contains encoded characters
    const decodedFilename = decodeURIComponent(filename)

    return decodedFilename
}

module.exports = {
    bunnyCDNUploadMedia,
    bunnyCDNUploadMediaFromURL,
}
