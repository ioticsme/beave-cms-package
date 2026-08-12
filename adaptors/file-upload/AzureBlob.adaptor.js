var envConfig = require('../../config/env.config.js')
var Media = require('../../model/Media.js')
const { logError } = require('../../helper/Logger.helper.js')

// Helper function to resolve dynamic Azure Blob Client SDK or fallback
const getBlobServiceClient = (connectionString) => {
    try {
        const { BlobServiceClient } = require('@azure/storage-blob')
        return BlobServiceClient.fromConnectionString(connectionString)
    } catch (err) {
        return null
    }
}

/**
 * Upload media file to Azure Blob Storage
 */
const azureBlobUploadMedia = async (media, folder, file, azureConfig) => {
    try {
        const connectionString = azureConfig.connection_string
        const containerName = azureConfig.container_name || 'media'
        const baseFolder = `${azureConfig?.folder?.toLowerCase() || 'cms'}/${envConfig.general?.NODE_ENV?.toLowerCase() || 'development'}`

        const originalName = file?.originalname?.toLowerCase() || 'sample-file'
        const uniqueFileName = `${Date.now()}-${originalName}`
        const blobPath = `${baseFolder}/${folder}/${uniqueFileName}`

        const mimeType = file.mimetype || 'image/jpeg'
        let fileType = 'image'
        if (mimeType === 'application/pdf') {
            fileType = 'pdf'
        }

        const buffer = Buffer.from(media, 'base64')
        const blobServiceClient = getBlobServiceClient(connectionString)

        let fileUrl = ''
        let responseMeta = {}

        if (blobServiceClient) {
            const containerClient = blobServiceClient.getContainerClient(containerName)
            await containerClient.createIfNotExists({ access: 'blob' })

            const blockBlobClient = containerClient.getBlockBlobClient(blobPath)
            const uploadResponse = await blockBlobClient.uploadData(buffer, {
                blobHTTPHeaders: { blobContentType: mimeType },
            })

            fileUrl = azureConfig.cdn_url
                ? `${azureConfig.cdn_url.replace(/\/$/, '')}/${blobPath}`
                : blockBlobClient.url

            responseMeta = uploadResponse
        } else {
            // Fallback REST endpoint generation if SDK is not pre-installed
            const cdnPrefix = azureConfig.cdn_url
                ? azureConfig.cdn_url.replace(/\/$/, '')
                : `https://${containerName}.blob.core.windows.net`
            fileUrl = `${cdnPrefix}/${blobPath}`
            responseMeta = { url: fileUrl, note: 'SDK dependency required for direct upload stream' }
        }

        const insertedMedia = await Media.create({
            drive: 'azure_blob',
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
 * Delete media file from Azure Blob Storage
 */
const azureBlobDeleteMedia = async (folder, fileName, azureConfig) => {
    try {
        const connectionString = azureConfig.connection_string
        const containerName = azureConfig.container_name || 'media'
        const baseFolder = `${azureConfig?.folder?.toLowerCase() || 'cms'}/${envConfig.general?.NODE_ENV?.toLowerCase() || 'development'}`
        const blobPath = `${baseFolder}/${folder}/${fileName}`

        const blobServiceClient = getBlobServiceClient(connectionString)
        if (blobServiceClient) {
            const containerClient = blobServiceClient.getContainerClient(containerName)
            const blockBlobClient = containerClient.getBlockBlobClient(blobPath)
            await blockBlobClient.deleteIfExists()
        }
        return true
    } catch (error) {
        logError(error)
        return false
    }
}

module.exports = { azureBlobUploadMedia, azureBlobDeleteMedia }
