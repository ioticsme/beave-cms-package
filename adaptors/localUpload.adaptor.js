const path = require('path')
const fs = require('fs')
var envConfig = require('../config/env.config.js')
var Media = require('../model/Media.js')

// Function to upload media to the local folder under the main app root
const localUploadMedia = async (media, folder, file, req) => {
    try {
        // Log media and file objects
        // console.log('media (base64):', media) // Inspect base64 media content
        // console.log('file:', file) // Inspect file object

        // Resolve the main app root dynamically
        const appRoot = process.cwd() // This will give you the main app's root directory

        // Create a base folder path under the main app's root
        const uploadsDir = path.join(appRoot, 'uploads', folder)

        // Ensure the folder exists, if not create it
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true })
        }

        // Define the local file path for saving
        const relativeFilePath = path.join(
            'uploads',
            folder,
            file.originalname.toLowerCase()
        )
        const filePath = path.join(appRoot, relativeFilePath)

        // Decode the base64 media string to a buffer
        const bufferData = Buffer.from(media, 'base64')

        // Write the file to the local directory
        // console.log('Writing file from decoded base64 buffer')
        fs.writeFileSync(filePath, bufferData)

        let fileType = 'image'
        if (file.mimetype === 'application/pdf') {
            fileType = 'pdf'
        }

        // Insert media record into the database
        const insertedMedia = await Media.create({
            drive: 'local',
            url: relativeFilePath, // Store the local path
            file: {
                name: file.originalname.toLowerCase(),
            },
            file_type: fileType,
        })

        return insertedMedia
    } catch (error) {
        console.log('Local File Upload Error:', error)
        return false
    }
}

// Function to delete a file from the uploads folder
const localDeleteMedia = async (folder, fileName) => {
    try {
        // Resolve the main app root dynamically
        const appRoot = process.cwd() // This will give you the main app's root directory

        // Create the full path to the file in the uploads folder
        const filePath = path.join(
            appRoot,
            'uploads',
            folder,
            fileName.toLowerCase()
        )

        // Check if the file exists
        if (fs.existsSync(filePath)) {
            // Remove the file
            fs.unlinkSync(filePath)
            console.log(`File deleted successfully: ${filePath}`)
            return true
        } else {
            console.log(`File not found: ${filePath}`)
            return false
        }
    } catch (error) {
        console.log('File Deletion Error:', error)
        return false
    }
}

module.exports = { localUploadMedia, localDeleteMedia }
