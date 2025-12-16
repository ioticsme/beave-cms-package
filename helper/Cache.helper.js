const { default: collect } = require('collect.js')
const envConfig = require('../config/env.config')
const Brand = require('../model/Brand')
const Country = require('../model/Country')
const { getCache, setCache } = require('./Redis.helper')
const Settings = require('../model/Settings')
const { logError } = require('./Logger.helper')

const getBrandsFromCache = async () => {
    const cacheKey = `${envConfig.cache.CACHE_KEY_PREFIX}-all-brands`
    const brands = await getCache(cacheKey).then(async (data) => {
        if (!data) {
            const liveBrands = await Brand.find({
                active: { $ne: false },
            })
                .sort({ position: 1 })
                .populate([
                    {
                        path: 'languages',
                        options: { sort: { is_default: -1 } }, // Sort by default language
                    },
                    {
                        path: 'domains.country',
                    },
                ])
                .lean()

            liveBrands.forEach((brand) => {
                brand.domains = collect(brand.domains)
                    .sortBy('country.position')
                    .all()
            })
            if (liveBrands.length) {
                await setCache(
                    cacheKey,
                    JSON.stringify(liveBrands),
                    60 * 60 * 24 * 30
                )
            }
            return liveBrands
        }
        return JSON.parse(data)
    })

    return brands
}

const getCountriesFromCache = async () => {
    try {
        const cacheKey = `${envConfig.cache.CACHE_KEY_PREFIX}-all-countries`
        let countries = await getCache(cacheKey).then(async (data) => {
            if (!data) {
                let countries = await Country.find({
                    active: { $ne: false },
                })
                    .sort({ position: 1 })
                    .lean()
                if (countries.length) {
                    await setCache(
                        cacheKey,
                        JSON.stringify(countries),
                        60 * 60 * 24 * 30
                    )
                }

                return countries
            }
            return JSON.parse(data)
        })

        return countries
    } catch (error) {
        return []
    }
}

const getCountry = async (req) => {
    try {
        let countryCode = null
        if (req.query.country) {
            countryCode = req.query.country?.toLowerCase()
        } else if (req.headers.country) {
            countryCode = req.headers.country?.toLowerCase()
        }

        let country = null
        const allCountries = await getCountriesFromCache()
        if (countryCode) {
            country = allCountries.find(
                (country) => country.code === countryCode
            )
        } else {
            country = allCountries?.[0]
        }
        return country
    } catch (error) {
        logError(error)
        return null
    }
}

const getBrand = async (req, country) => {
    try {
        let brandCode = null
        if (req.query.brand) {
            brandCode = req.query.brand?.toLowerCase()
        } else if (req.headers.brand) {
            brandCode = req.headers.brand?.toLowerCase()
        }
        const allBrands = await getBrandsFromCache()
        let brand = null
        if (brandCode) {
            brand = allBrands.find(
                (brand) => brand.code?.toLowerCase() === brandCode
            )
            if (!brand) {
                brand = allBrands?.[0]
            }
        } else {
            brand = allBrands?.[0]
        }
        let domain = null
        if (country) {
            domain = brand?.domains.find(
                (domain) =>
                    domain.country?._id?.toString() === country._id?.toString()
            )
            if (!domain) {
                domain = brand?.domains?.[0]
            }
        } else {
            domain = brand?.domains?.[0]
        }

        if (brand) {
            brand.domain = domain
        }

        return brand
    } catch (error) {
        logError(error)
        return null
    }
}

const getBrandSettings = async (brand = {}, country = {}) => {
    const cacheKey = `${envConfig.cache.CACHE_KEY_PREFIX}-brand-settings-${brand?.code}-${country?.code}`
    const brandSettings = await getCache(cacheKey).then(async (data) => {
        if (data) {
            return JSON.parse(data)
        } else {
            const liveData = await Settings.findOne({
                brand: brand?._id,
                country: country?._id,
            }).select('-brand -country -__v -created_at -updated_at -author')
            if (liveData) {
                setCache(cacheKey, JSON.stringify(liveData), 60 * 60 * 24 * 1)
            }

            return liveData
        }
    })

    return brandSettings
}

module.exports = {
    getCountriesFromCache,
    getBrandsFromCache,
    getCountry,
    getBrand,
    getBrandSettings,
}
