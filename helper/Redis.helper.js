const envConfig = require('../config/env.config')
const Redis = require('ioredis')
const { logError } = require('./Logger.helper')

const redis = new Redis(envConfig.cache.REDIS_URL)

const getCache = async (key, checkActive = true) => {
    try {
        if (checkActive && !envConfig.cache.ACTIVE) {
            return null
        }
        return await redis.get(key)
    } catch (error) {
        logError(error)
        return error
    }
}

const setCache = async (key, data, expiry = 300, checkActive = true) => {
    try {
        if (checkActive && !envConfig.cache.ACTIVE) {
            return 'OK'
        }

        await redis.set(key, data, 'EX', expiry) // Response will be 'OK'

        return 'OK'
    } catch (error) {
        logError(error)
        return error
    }
}

const removeCache = async (keys) => {
    try {
        return await redis.del(...keys)
    } catch (error) {
        logError(error)
        return error
    }
}

const clearCacheAll = async () => {
    try {
        const iterator = redis.scanStream({
            match: `${envConfig.cache.CACHE_KEY_PREFIX}-*`,
        })

        for await (const chunk of iterator) {
            if (chunk.length > 0) {
                await redis.del(chunk)
            }
        }

        return true
    } catch (error) {
        logError(error)
        return error
    }
}

const flushCache = async () => {
    try {
        return await redis.flushdb()
    } catch (error) {
        logError(error)
        return error
    }
}

module.exports = {
    getCache,
    setCache,
    removeCache,
    clearCacheAll,
    flushCache,
}
