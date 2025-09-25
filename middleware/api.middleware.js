const envConfig = require('../config/env.config')
const jwt = require('jsonwebtoken')
const collect = require('collect.js')
const useragent = require('express-useragent')
const { getCache, setCache } = require('../helper/Redis.helper')
const Menu = require('../model/Menu')
const Language = require('../model/Language')

const {
    getCountry,
    getBrand,
    getBrandSettings,
} = require('../helper/Cache.helper')
const { logError, logWarn } = require('../helper/Logger.helper')

const BrandWithCountryCheck = async (req, res, next) => {
    try {
        const apiSourceList = ['app', 'web']
        const apiSource = apiSourceList.includes(req.headers?.source)
            ? req.headers?.source
            : 'web'

        const country = await getCountry(req)
        if (!country) {
            return res.status(400).json({ error: 'Invalid Country' })
        }

        const brand = await getBrand(req, country)
        if (!brand?.domain) {
            return res.status(400).json({ error: 'Invalid Brand' })
        }

        let lang
        if (req.query.lang?.toLowerCase()) {
            lang = req.query.lang?.toLowerCase()
        } else if (req.headers.lang?.toLowerCase()) {
            lang = req.headers.lang?.toLowerCase()
        } else {
            const language = await Language.findOne().sort({ is_default: -1 }) // Sort by is_default in descending order, so true (1) comes first
            lang = language.prefix
        }

        if (brand?.domain?.maintenance_mode) {
            return res
                .status(503)
                .json({ error: 'Application on Maintenance Mode' })
        }

        let brandSettings = await getBrandSettings(brand, country)
        if (!brandSettings) {
            brandSettings = {}
            logWarn(
                `Invalid Brand Settings for brand: ${brand.code} country: ${country.code}`
            )
        }

        req.brand = {
            ...brand,
            settings: brandSettings,
            country_name: country.name.en,
            country_code: country.code,
            currency: country.currency,
            currency_symbol: country.currency_symbol,
            currency_decimal_points: country.currency_decimal_points,
            country_object: country,
        }
        req.country = country
        req.language = lang
        req.source = apiSource
    } catch (err) {
        logError(err)
        return res.status(400).json({ error: 'Invalid Header' })
    }

    next()
}

const webDefaultHeader = async (req, res, next) => {
    req.source = 'web'
    next()
}

const mobileDefaultHeader = async (req, res, next) => {
    req.source = 'app'
    next()
}

const UserAuthCheck = async (req, res, next) => {
    // console.log(req.path)
    const path_to_skip = ['/user/checkout/payment']
    if (path_to_skip.includes(req.path)) {
        next()
    } else {
        try {
            if (!req.headers.authorization) {
                return res.status(401).json({
                    error: 'Unauthorized',
                })
            }
            const token = req.headers.authorization.split(' ')
            const decodedUser = jwt.verify(token[1], envConfig.general.APP_KEY)
            // const user = await User.findOne({
            //     _id: decodedUser.data?.user?._id,
            // })
            // if (!user) {
            //     return res.status(401).json('Unauthorized')
            // }

            if (envConfig.cache.ACTIVE) {
                const tokenExistInRedis = await getCache(
                    `user-${req.source}-auth-${decodedUser.data?.user?._id}`
                )
                if (!tokenExistInRedis || tokenExistInRedis != token[1]) {
                    return res.status(401).json({
                        error: 'Unauthorized',
                    })
                }
            }

            const brandSettings = await getBrandSettings(req.brand, req.country)
            req.authPublicUser = {
                ...decodedUser.data?.user,
                brand: {
                    ...req.brand,
                    country_name: req.country.name.en,
                    country_code: req.country.code,
                    currency: req.country.currency,
                    currency_symbol: req.country.currency_symbol,
                    currency_decimal_points:
                        req.country.currency_decimal_points,
                    country_object: req.country,
                    settings: brandSettings,
                },
            }
        } catch (err) {
            return res.status(401).json({
                error: 'Unauthorized',
            })
        }
        next()
    }
}

const getNav = async (req, res, next) => {
    try {
        const cache_key = `${envConfig.cache.CACHE_KEY_PREFIX}-app-nav-${req.brand?.name?.en}-${req.country?.name?.en}`

        const navigation = await getCache(cache_key)
            .then(async (data) => {
                if (data) {
                    return {
                        data: JSON.parse(data),
                        is_redis: true,
                    }
                } else {
                    const nav = await Menu.find({
                        brand: req.brand,
                        country: req.country,
                        'nav_items.active': true,
                        deleted: { $ne: true },
                    }).select('-country -brand -created_at -updated_at -__v')

                    let liveData = []
                    if (nav) {
                        const navCollection = collect(nav)
                        const groupedNav = navCollection.groupBy('nav_position')
                        groupedNav.all()
                        // const liveData = groupedNav.items
                        liveData =
                            groupedNav
                                .map((navItem, positionKey) => {
                                    // console.log(positionKey)
                                    // console.log(navItem.items[0].nav_items)
                                    return navItem?.items[0]?.nav_items
                                })
                                .all() || []

                        if (
                            envConfig.cache.ACTIVE == 'true' &&
                            liveData?.length
                        ) {
                            setCache(
                                cache_key,
                                JSON.stringify(liveData),
                                parseInt(3600)
                            )
                        }
                    }
                    return {
                        data: liveData,
                        is_redis: false,
                    }
                }
            })
            .catch((err) => {
                console.log(err)
                // TODO:: Send slack notification for redis connection fail on product pull
            })
        // Adding global meta to navigation
        const globalMeta = req.brand?.domain?.meta || {}
        // Restructuring the global meta
        const newGlobalMeta = {
            en: {
                title: globalMeta.title?.en,
                description: globalMeta.description?.en,
                keywords: globalMeta.keywords?.en,
                og_image: globalMeta.og_image?.en,
            },
            ar: {
                title: globalMeta.title?.ar,
                description: globalMeta.description?.ar,
                keywords: globalMeta.keywords?.ar,
                og_image: globalMeta.og_image?.ar,
            },
        }
        req.navigation = { ...navigation.data, meta: newGlobalMeta }
    } catch (error) {
        console.log(error)
        return res.status(400).json('Not foundssss')
    }
    next()
}

const userAgent = async (req, res, next) => {
    var source = req.headers['user-agent']
    var ua = useragent.parse(source)
    req.user_agent_data = {
        browser: ua.browser,
        version: ua.version,
        os: ua.os,
        platform: ua.platform,
        geoIp: ua.geoIp,
        source: ua.source,
    }
    next()
}

module.exports = {
    BrandWithCountryCheck,
    webDefaultHeader,
    mobileDefaultHeader,
    UserAuthCheck,
    getNav,
    userAgent,
}
