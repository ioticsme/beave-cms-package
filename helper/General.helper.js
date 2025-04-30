const { default: collect } = require('collect.js')
const envConfig = require('../config/env.config')
const Brand = require('../model/Brand')
const Country = require('../model/Country')
const { getCache, setCache } = require('./Redis.helper')

const convertToSingular = (pluralName) => {
    // Define some basic rules for pluralization
    const rules = [
        { pattern: /ies$/i, replace: 'y' }, // Replace 'ies' with 'y'
        { pattern: /s$/i, replace: '' }, // Remove 's' at the end
        { pattern: /es$/i, replace: '' }, // Remove 'es' at the end
    ]

    // Apply the rules in order
    for (const rule of rules) {
        if (rule.pattern.test(pluralName)) {
            return pluralName?.replace(rule.pattern, rule.replace)
        }
    }

    // If no rule matches, return the original name
    return pluralName
}

const getBrandsFromCache = async () => {
    const cacheKey = `${envConfig.cache.CACHE_KEY_PREFIX}-all-brands`
    const brands = await getCache(cacheKey).then(async (data) => {
        if (!data) {
            const liveBrands = await Brand.find({
                active: true,
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

            await setCache(
                cacheKey,
                JSON.stringify(liveBrands),
                60 * 60 * 24 * 30
            )
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
                    // active: true,
                })
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

module.exports = {
    convertToSingular,
    getCountriesFromCache,
    getBrandsFromCache,
}
