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
        const keys_to_remove = []
        const iterator = await redis.scanStream({
            match: `${envConfig.cache.CACHE_KEY_PREFIX}-*`,
        })

        for await (const key of iterator) {
            keys_to_remove.push(key)
        }
        return await redis.del(...keys_to_remove)
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
