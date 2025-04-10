const session = require('express-session')
const FileStore = require('session-file-store')(session)
const Redis = require('ioredis')
var redisStore = require('connect-redis')(session)

const envConfig = require('./env.config')

let sessionDriver
if (envConfig.general.SESSION_STORAGE == 'redis') {
    sessionDriver = new redisStore({
        client: new Redis(envConfig.cache.REDIS_URL),
        ttl: envConfig.general.SESSION_MAX_AGE * 60, // Time to leave in seconds
    })
} else {
    sessionDriver = new FileStore({
        path: './sessions', // This specifies the directory to store session files,
        ttl: envConfig.general.SESSION_MAX_AGE * 60 * 1000, // Time to leave in milliseconds
    })
}

const sessionConfig = {
    store: sessionDriver,
    secret: `${envConfig.general.APP_KEY}`,
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: envConfig.general.SESSION_MAX_AGE * 60 * 1000,
    },
}

module.exports = sessionConfig
