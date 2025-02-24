const envConfig = require('../config/env.config')
const winston = require('winston')
const { format } = require('date-fns')
const crypto = require('crypto')

const _ = require('lodash')
// BEGIN:FOR PDF Generation
const fs = require('fs').promises
const path = require('path')
// const puppeteer = require('puppeteer')
// const hb = require('handlebars')
// END:FOR PDF Generation

const projectRootDir = require('path').resolve('./')

// Generate and store this securely, e.g., in an environment variable
const ENCRYPTION_KEY = envConfig.general.APP_KEY // 32 bytes key
const IV_LENGTH = 16 // Initialization vector length

const getRequestIp = async (req) => {
    let ip = (
        req.headers['cf-connecting-ip'] ||
        req.headers['x-real-ip'] ||
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        ''
    ).split(',')

    if (ip[0].trim().substr(0, 7) == '::ffff:') {
        ip = ip[0].trim().substr(7)
    } else {
        ip = ip[0].trim()
    }

    return ip
}

const fileLogger = async (message, service, type, level = 'info') => {
    const logger = winston.createLogger({
        level: level,
        format: winston.format.json(),
        defaultMeta: {
            service: service,
            time: format(new Date(), 'dd-MM-yyyy HH:mm:ss'),
        },
        transports: [
            new winston.transports.File({
                filename: `./log/${type}-${format(
                    new Date(),
                    'dd-MM-yyyy'
                )}.log`,
                json: false,
                level: level,
                // stringify: (obj) => JSON.stringify(obj),
            }),
            // new winston.transports.File({ filename: 'combined.log' }),
        ],
    })

    logger.info({
        level: level,
        message: message,
    })
}

// const createFcmSwJS = async (credentials) => {
//     const wrapper_public_dir = `${projectRootDir}/public`
//     if (!fs.existsSync(wrapper_public_dir)) {
//         fs.mkdirSync(wrapper_public_dir)
//     }
//     var writeStream = fs.createWriteStream(
//         `${wrapper_public_dir}/firebase-messaging-sw.js`
//     )
//     writeStream.write(
//         `importScripts('https://www.gstatic.com/firebasejs/8.2.0/firebase-app.js')
//         importScripts('https://www.gstatic.com/firebasejs/8.2.0/firebase-messaging.js')

//         const firebaseConfig = {
//             apiKey: '${credentials.apiKey}',
//             authDomain: '${credentials.authDomain}',
//             projectId: '${credentials.projectId}',
//             storageBucket: '${credentials.storageBucket}',
//             messagingSenderId: '${credentials.messagingSenderId}',
//             appId: '${credentials.appId}',
//         }

//         firebase.initializeApp(firebaseConfig)
//         const messaging = firebase.messaging()
//         messaging.onBackgroundMessage(function (payload) {
//             console.log(
//                 '[firebase-messaging-sw.js] Received background message ',
//                 payload
//             )
//             // Customize notification here
//             const notificationTitle = 'Title'
//             const notificationOptions = {
//                 body: payload,
//                 icon: '/firebase-logo.png',
//             }
//             self.registration.showNotification(notificationTitle, notificationOptions)
//         });`
//     )
//     writeStream.end()
// }

const loadSVGIcons = async () => {
    const dirPath = path.join(
        __dirname,
        '../public/admin/assets/media/icons/duotune'
    )

    const output = []
    try {
        const folders = await fs.readdir(dirPath)
        // Filter the list to only include folders
        const folderNames = []

        for (const file of folders) {
            const stats = await fs.stat(path.join(dirPath, file))

            if (stats.isDirectory()) {
                folderNames.push({
                    name: file,
                    items: [],
                })
            }
        }

        for (const targetFolder of folderNames) {
            const svgDir = path.join(
                __dirname,
                `../public/admin/assets/media/icons/duotune/${targetFolder.name}`
            )

            const tempItems = []

            const allFiles = await fs.readdir(svgDir)
            const svgFiles = allFiles.filter(
                (file) => path.extname(file) === '.svg'
            )

            for (const file of svgFiles) {
                const svgPath = path.join(svgDir, file)
                const svgData = await fs.readFile(svgPath, 'utf8')
                tempItems.push(svgData)
            }

            const folderObject = _.find(folderNames, {
                name: targetFolder.name,
            })

            folderObject.items.push(...tempItems)
            output.push(folderObject)
        }

        return output
    } catch (e) {
        console.log(e)
        return output
    }
}

const filteringScheduledCMSItems = async (items) => {
    // BEGIN::Filtering scheduled items
    const dayStart = new Date().setHours(0, 0, 0, 0)
    const dayEnd = new Date().setHours(23, 59, 59, 999)
    const filteredData = _.filter(items, (item) => {
        const scheduledStart = item.scheduled.start
            ? new Date(item.scheduled.start).setHours(0, 0, 0, 0)
            : null
        const scheduledEnd = item.scheduled.end
            ? new Date(item.scheduled.end).setHours(23, 59, 59, 999)
            : null
        return (
            (scheduledStart == null || scheduledStart <= dayStart) &&
            (scheduledEnd == null || scheduledEnd >= dayEnd)
        )
    })
    return filteredData
    // END::Filtering scheduled items
}

/**
 * Encrypts a given text using AES-256-CBC.
 * @param {string} text - The plaintext to encrypt.
 * @returns {string} The encrypted text in base64 format.
 */
const encryptData = (text) => {
    const iv = crypto.randomBytes(IV_LENGTH) // Generate a random IV
    const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        Buffer.from(ENCRYPTION_KEY, 'hex'),
        iv
    )
    let encrypted = cipher.update(text, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    return `${iv.toString('hex')}:${encrypted}` // Combine IV and encrypted data
}

/**
 * Decrypts an encrypted string using AES-256-CBC.
 * @param {string} encryptedText - The encrypted text in the format 'IV:encryptedData'.
 * @returns {string} The decrypted plaintext.
 */
const decryptData = (encryptedText) => {
    const [iv, encrypted] = encryptedText.split(':') // Split IV and encrypted data
    const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(ENCRYPTION_KEY, 'hex'),
        Buffer.from(iv, 'hex')
    )
    let decrypted = decipher.update(encrypted, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
}

module.exports = {
    getRequestIp,
    fileLogger,
    // createFcmSwJS,
    loadSVGIcons,
    filteringScheduledCMSItems,
    encryptData,
    decryptData,
}
