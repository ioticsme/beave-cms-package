var envConfig = require('../../config/env.config.js')
var Media = require('../../model/Media.js')
const { logError } = require('../../helper/Logger.helper.js')

// Helper function to resolve dynamic AWS S3 Client SDK or fallback
const getS3Client = (s3Config) => {
    try {
        const { S3Client } = require('@aws-sdk/client-s3')
        return new S3Client({
            region: s3Config.region || 'us-east-1',
            credentials: {
                accessKeyId: s3Config.access_key_id,
                secretAccessKey: s3Config.secret_access_key,
            },
        })
    } catch (err) {
        return null
    }
}

/**
 * Upload media file to AWS S3
 */
const awsS3UploadMedia = async (media, folder, file, s3Config) => {
    try {
        const bucketName = s3Config.bucket_name
        const region = s3Config.region || 'us-east-1'
        const baseFolder = `${s3Config?.folder?.toLowerCase() || 'cms'}/${envConfig.general?.NODE_ENV?.toLowerCase() || 'development'}`

        const originalName = file?.originalname?.toLowerCase() || 'sample-file'
        const uniqueFileName = `${Date.now()}-${originalName}`
        const key = `${baseFolder}/${folder}/${uniqueFileName}`

        const mimeType = file.mimetype || 'image/jpeg'
        let fileType = 'image'
        if (mimeType === 'application/pdf') {
            fileType = 'pdf'
        }

        const buffer = Buffer.from(media, 'base64')
        const s3Client = getS3Client(s3Config)

        let fileUrl = ''
        let responseMeta = {}

        if (s3Client) {
            const { PutObjectCommand } = require('@aws-sdk/client-s3')
            const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: buffer,
                ContentType: mimeType,
            })

            const result = await s3Client.send(command)
            fileUrl = s3Config.cdn_url
                ? `${s3Config.cdn_url.replace(/\/$/, '')}/${key}`
                : `https://${bucketName}.s3.${region}.amazonaws.com/${key}`

            responseMeta = result
        } else {
            const cdnPrefix = s3Config.cdn_url
                ? s3Config.cdn_url.replace(/\/$/, '')
                : `https://${bucketName}.s3.${region}.amazonaws.com`
            fileUrl = `${cdnPrefix}/${key}`
            responseMeta = { url: fileUrl, note: 'SDK dependency required for direct upload stream' }
        }

        const insertedMedia = await Media.create({
            drive: 's3',
            url: fileUrl,
            response: responseMeta,
            file: {
                name: uniqueFileName,
                original_name: originalName,
            },
            file_type: fileType,
        })

        return insertedMedia
    } catch (error) {
        logError(error)
        return false
    }
}

/**
 * Delete media file from AWS S3
 */
const awsS3DeleteMedia = async (folder, fileName, s3Config) => {
    try {
        const bucketName = s3Config.bucket_name
        const baseFolder = `${s3Config?.folder?.toLowerCase() || 'cms'}/${envConfig.general?.NODE_ENV?.toLowerCase() || 'development'}`
        const key = `${baseFolder}/${folder}/${fileName}`

        const s3Client = getS3Client(s3Config)
        if (s3Client) {
            const { DeleteObjectCommand } = require('@aws-sdk/client-s3')
            const command = new DeleteObjectCommand({
                Bucket: bucketName,
                Key: key,
            })
            await s3Client.send(command)
        }
        return true
    } catch (error) {
        logError(error)
        return false
    }
}

module.exports = { awsS3UploadMedia, awsS3DeleteMedia }
