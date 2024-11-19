const envConfig = require('../config/env.config')
const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const Brand = require('../model/Brand')
const Settings = require('../model/Settings')
const ContentType = require('../model/ContentType')
const { default: collect } = require('collect.js')
const { navConfig } = require('../config/admin.config')
const { convertToSingular } = require('../helper/General.helper')
const { privileges } = require('../config/userPrivilege.config')
const { default: slugify } = require('slugify')

// Getting custom navigation from cms-wrapper config
let customNavConfig
try {
    customNavConfig = require(`${path.dirname(
        require.main.filename
    )}/config/admin.config.js`)
} catch (error) {
    customNavConfig = []
}

const baseConfig = async (req, res, next) => {
    res.locals.browserTitle = `${envConfig.general.CLIENT_NAME}`
    res.locals.cmsLogoLarge = `${envConfig.general.CMS_LOGO_LARGE}`
    res.locals.cmsLogoSmall = `${envConfig.general.CMS_LOGO_SMALL}`
    res.locals.globalModuleConfig = globalModuleConfig
    next()
}

const nunjucksFilter = async (req, res, next) => {
    // Converting the date object dd-mm-yyyy format
    res.locals.convertDateToDMY = (date) => {
        if (date) {
            return format(date, 'dd-MM-yyyy')
        } else {
            return null
        }
    }
    // Stringify the json object
    res.locals.jsonToString = (json) => {
        if (json) {
            return JSON.stringify(json)
        } else {
            return null
        }
    }
    // Convert plural to singular
    res.locals.pluralToSingular = (plural) => {
        return convertToSingular(plural)
    }

    res.locals.brandCountryMatch = (domains, country) => {
        return collect(domains)
            .pluck('country')
            .toArray()
            .some((item) => {
                return String(item) === String(country)
            })
    }

    res.locals.mathRandom = () => {
        return Math.floor(Math.random() * 1000 + 1)
    }

    next()
}

const contentTypeCheck = async (req, res, next) => {
    if (!req.params.contentType) {
        return res.json('Not Found')
    }
    try {
        const contentType = await ContentType.findOne({
            slug: req.params.contentType,
            brand: { $in: [req.session.brand._id] },
        })
        if (!contentType) {
            return res.render(`admin-njk/page-error-404`)
        }
        req.contentType = contentType
        next()
    } catch (err) {
        return res.json('Not Found')
    }
}

// Generating the navigation for the cms
const mainNavGenerator = async (req, res, next) => {
    // preBuildNav is the navigation declared in the config folder of cms-package
    let preBuildNav = _.cloneDeep(navConfig)

    // customBuildNav is the navigation declared in the config folder of cms-wrapper
    let customBuildNav = _.cloneDeep(customNavConfig || [])

    // Finding index of the section in preBuildNav
    const findSectionIndex = (section) => {
        // This will return the index of the section if it exists otherwise it will return -1
        return _.findIndex(customBuildNav, { section })
    }

    // Returning the value of the is_hidden attribute
    const checkSectionIsHidden = (nav, index) => {
        return nav[index]?.is_hidden
    }

    // Looping through preBuildNav
    _.forEach(preBuildNav, (preBuildSection) => {
        const sectionIndex = findSectionIndex(preBuildSection.section)

        if (sectionIndex !== -1) {
            // Section already exists in customBuildNav
            // Checking the section is hidden or not
            if (checkSectionIsHidden(customBuildNav, sectionIndex)) {
                // If section is hidden then we need to delete that object from the nav array
                customBuildNav.splice(sectionIndex, 1)
            } else {
                _.forEach(preBuildSection.items, (customItem) => {
                    // Checking the same route of  exists in customBuildNav
                    // if it exists that will be neglected because more priority to customBuildNav
                    const itemIndex = _.findIndex(
                        customBuildNav[sectionIndex].items,
                        {
                            label: customItem.label,
                        }
                    )
                    if (itemIndex === -1) {
                        customBuildNav[sectionIndex].items.push(customItem)
                    } else {
                        // Checking navItem is hidden or not
                        if (
                            checkSectionIsHidden(
                                customBuildNav[sectionIndex].items,
                                itemIndex
                            )
                        ) {
                            customBuildNav[sectionIndex].items.splice(
                                itemIndex,
                                1
                            )
                        }
                    }
                })
            }
        } else {
            // Section is not exist in custom build nav
            customBuildNav.push(preBuildSection)
        }
        // console.log(preBuildSection)
    })

    // Finding all content types to list in the contents section
    const contentTypes = await ContentType.find({
        active: true,
        brand: { $in: [req.session.brand?._id] },
    })
        .select(
            '-_id title slug admin_icon admin_nav_section position active single_type has_access'
        )
        .sort([['position', 'ascending']])

    // console.log('contentTypes :>> ', contentTypes)

    // Looping through all content types and creating navigation
    const listTypeItems = collect(contentTypes)
        .map((item) => {
            if (item.single_type === false) {
                // Non single type content types
                return {
                    section: item.admin_nav_section || 'Content',
                    label: item.title,
                    expandable: true,
                    icon: item.admin_icon,
                    position: item.position,
                    has_access: item.has_access,
                    path: `/admin/cms/${item.slug}`,
                    child: [
                        {
                            label: `All ${item.title}`,
                            path: `/admin/cms/${item.slug}`,
                        },
                        {
                            label: `Add ${item.title}`,
                            path: `/admin/cms/${item.slug}/add`,
                        },
                    ],
                }
            } else {
                // single type content types
                return {
                    section: item.admin_nav_section || 'Content',
                    section_slug: slugify(item.admin_nav_section || 'Content', {
                        lower: true,
                    }),
                    label: item.title,
                    expandable: false,
                    icon: item.admin_icon,
                    has_access: item.has_access,
                    path: `/admin/cms/${item.slug}`,
                }
            }
        })
        .all()

    listTypeItems.forEach((d) => {
        const contentSection = _.find(customBuildNav, { section: d.section })
        if (contentSection) {
            contentSection.items = _.uniqBy(
                _.concat(contentSection.items, d),
                (item) => {
                    return item?.label
                }
            )
        }
    })

    // Sorting all section with their positions
    const mixedNav = _.sortBy(
        customBuildNav.filter((nav) => nav.items?.length),
        'position'
    )

    res.locals.mainNav = mixedNav
    res.locals.activeNav = req.originalUrl
    res.locals.allowedURLs = []
    res.locals.allowedSections = []
    next()
}

const allBrands = async (req, res, next) => {
    const allBrands = await Brand.find()
        .populate('languages')
        .populate('domains.country')
    res.locals.allBrands = allBrands
    next()
}

const authUser = async (req, res, next) => {
    try {
        if (!req.session.brand) {
            const brand = await Brand.findOne()
                .populate({
                    path: 'languages',
                    options: { sort: { is_default: -1 } },
                })
                .populate('domains.country')
            if (brand) {
                const settings = await Settings.findOne({
                    brand: brand,
                    country: brand.domains[0].country._id,
                }).select(
                    '-brand -country -__v -created_at -updated_at -author'
                )

                req.session.brand = {
                    _id: brand._id,
                    name: brand.name,
                    code: brand.code,
                    languages: brand.languages,
                    country: brand.domains[0].country._id,
                    country_name: brand.domains[0].country.name.en,
                    country_code: brand.domains[0].country.code,
                    country_currency: brand.domains[0].country.currency,
                    country_currency_symbol:
                        brand.domains[0].country.currency_symbol,
                    settings: settings ? settings : {},
                }
            }
        }
        res.locals.authUser = req.session
        // console.log(req.session)
        next()
    } catch (e) {
        return res.redirect('/admin/auth/login')
    }
}

module.exports = {
    baseConfig,
    contentTypeCheck,
    mainNavGenerator,
    allBrands,
    nunjucksFilter,
    authUser,
}
