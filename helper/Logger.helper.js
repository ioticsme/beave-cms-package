const winston = require('winston')
const path = require('path')
const DailyRotateFile = require('winston-daily-rotate-file')
// const { MongoDB } = require('winston-mongodb') // Optional

const envConfig = require('../config/env.config.js')

const arrow = '\u276F\u276F\u25B6'

const PROJECT_ROOT = path.join(__dirname, '..')

// Format message with file and line info
const customMessage = (message, stack) => {
    try {
        if (!stack) return message

        const stackList = stack.split('\n')
        const stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi
        const stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi
        const sp = stackReg.exec(stackList[1]) || stackReg2.exec(stackList[1])
        if (!sp?.length) return message

        const filePath = sp[2]
        if (filePath.includes('node_modules')) return message

        const relativePath = path.relative(PROJECT_ROOT, filePath)
        return `${relativePath}:${sp[3]}:${sp[4]}${arrow} ${
            stackList[0] || message
        }`
    } catch (err) {
        console.log('error in customMessage:', err)
        return message
    }
}

const customFormat = winston.format.printf(
    ({ level, message, timestamp, stack }) => {
        const formattedMsg = customMessage(message, stack)
        return JSON.stringify({
            timestamp,
            level,
            message: formattedMsg,
            stack: stack || message,
        })
    }
)

const createRotateTransport = (level) =>
    new DailyRotateFile({
        filename: `logs/${level}-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxFiles: '7d',
        maxSize: '20m',
        level,
        zippedArchive: true,
    })

const createPermanentTransport = (filename, level) =>
    new winston.transports.File({
        filename: `logs/${filename}.log`,
        level,
        handleExceptions: true,
        json: true,
        maxSize: 5242880,
        maxFiles: 5,
        colorize: true,
    })

const transports = [
    createRotateTransport('info'),
    createRotateTransport('warn'),
    createPermanentTransport('error', 'error'),
    new winston.transports.Console({
        format: winston.format.simple(),
        level: envConfig.general.NODE_ENV === 'production' ? 'error' : 'debug',
    }),
    // Optional MongoDB Logging
    // new MongoDB({
    //     db: process.env.DB_CONNECTION,
    //     collection: 'server_logs',
    //     level: 'error',
    //     options: {
    //         useUnifiedTopology: true,
    //         useNewUrlParser: true,
    //     },
    //     format: winston.format.combine(
    //         winston.format.timestamp(),
    //         winston.format.errors({ stack: true }),
    //         winston.format.json()
    //     ),
    // }),
]

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        customFormat
    ),
    transports,
    exceptionHandlers: [createPermanentTransport('exception', 'error')],
})

logger.stream = {
    write: function (message) {
        logger.info(message, { meta: { serverLogs: 'server-logs' } })
    },
}

module.exports = {
    logStream: logger.stream,
    logInfo: (msg) => {
        if (envConfig.general.NODE_ENV !== 'production') console.log(msg)
        logger.info(msg)
    },
    logWarn: (msg) => {
        if (envConfig.general.NODE_ENV !== 'production') console.warn(msg)
        logger.warn(msg)
    },
    logError: (error) => {
        console.error(error)
        logger.error(error)
    },
    logDebug: (msg) => {
        if (envConfig.general.NODE_ENV !== 'production') console.debug(msg)
        logger.debug(msg)
    },
    logger,
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error)
    process.exit(1)
})

process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason)
    process.exit(1)
})
