require('dotenv').config()
const Brand = require('../model/Brand')
const Settings = require('../model/Settings')
const ContentType = require('../model/ContentType')
var session = require('express-session')
const { default: collect } = require('collect.js')

const baseConfig = async (req, res, next) => {
    res.locals.baseURL = `${process.env.DOMAIN}`
    res.locals.clientName = `${process.env.CLIENT_NAME}`
    res.locals.cmsLogoLarge = `#`
    res.locals.cmsLogoSmall = `#`
    res.locals.globalModuleConfig = globalModuleConfig
    next()
}

const authCheck = async (req, res, next) => {
    if (!req.session || !req.session.admin_id) {
        res.redirect('/admin/auth/login')
        return
    }

    req.authUser = req.session
    next()
}

const contentTypeCheck = async (req, res, next) => {
    if (!req.params.contentType) {
        return res.json('Not Found')
    }
    try {
        const contentType = await ContentType.findOne({
            slug: req.params.contentType,
        })
        req.contentType = contentType
        next()
    } catch (err) {
        return res.json('Not Found')
    }
}

const authUser = async (req, res, next) => {
    try {
        if (!req.session.selected_brand) {
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

                req.session.selected_brand = {
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

const mainNavGenerator = async (req, res, next) => {
    const ContentType = require('../model/ContentType')
    const contentTypes = await ContentType.find({
        // single_type: false,
        in_use: true,
    })
        .select('_id title slug admin_icon position in_use single_type')
        .sort([['position', 'ascending']])
    // app.locals.mainNav = contentTypes
    const listTypeItems = collect(contentTypes)
        .filter((item) => item.single_type === false)
        .all()
    const singleTypeItems = collect(contentTypes)
        .filter((item) => item.single_type === true)
        .all()
    res.locals.mainNav = listTypeItems
    res.locals.hasSingleType = singleTypeItems.length ? true : false
    res.locals.singleTypeNav = singleTypeItems
    res.locals.activeNav = req.originalUrl
    // console.log(singleTypeItems)
    next()
}

const allBrands = async (req, res, next) => {
    const allBrands = await Brand.find()
        .populate('languages')
        .populate('domains.country')
    res.locals.allBrands = allBrands
    next()
}

const checkSuperAdmin = (req, res, next) => {
    if (req.authUser.admin_role != 'super_admin') {
        return res.render(`admin/error-500`)
    }
    next()
}

module.exports = {
    baseConfig,
    authCheck,
    contentTypeCheck,
    authUser,
    mainNavGenerator,
    allBrands,
    checkSuperAdmin,
}
