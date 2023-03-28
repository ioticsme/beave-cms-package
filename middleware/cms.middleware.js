const envConfig = require('../config/env.config')
const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const Brand = require('../model/Brand')
const Settings = require('../model/Settings')
const ContentType = require('../model/ContentType')
const AdminNav = require('../model/AdminNav')
var session = require('express-session')
const { default: collect } = require('collect.js')
const { navConfig } = require('../config/admin.config')
let customNavConfig
try {
    customNavConfig = require(`${path.dirname(
        require.main.filename
    )}/config/admin.config.js`)
    // customNavConfig = require(path.resolve(
    //     __dirname,
    //     '../../../../',
    //     './config/admin.config.js'
    // ))
} catch (error) {
    // console.log(error)
    customNavConfig = []
}

const baseConfig = async (req, res, next) => {
    res.locals.browserTitle = `${envConfig.general.CLIENT_NAME}`
    res.locals.cmsLogoLarge = `${envConfig.general.CMS_LOGO_LARGE}`
    res.locals.cmsLogoSmall = `${envConfig.general.CMS_LOGO_SMALL}`
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

// const mainNavGenerator = async (req, res, next) => {
//     const admin_nav = await AdminNav.find().select('-_id -created_at -updated_at -__v')
//     const contentTypes = await ContentType.find({
//         // single_type: false,
//         active: true,
//     })
//         .select('-_id title slug admin_icon position active single_type')
//         .sort([['position', 'ascending']])
//     // app.locals.mainNav = contentTypes
//     const listTypeItems = collect(contentTypes)
//         .filter((item) => item.single_type === false)
//         .map((item) => {
//             return {
//                 label: item.title,
//                 expandable: true,
//                 icon: item.admin_icon,
//                 position: item.position,
//                 child: [
//                     {
//                         label: `All ${item.title}`,
//                         path: `/admin/cms/${item.slug}`,
//                     },
//                     {
//                         label: `Add ${item.title}`,
//                         path: `/admin/cms/${item.slug}/add`,
//                     },
//                 ],
//             }
//         })
//         .all()

//     const singleTypeItems = collect(contentTypes)
//         .filter((item) => item.single_type === true)
//         .all()

//     const contentSection = _.find(navConfig, { section: 'Content' })
//     contentSection.items = _.uniqBy(
//         _.concat(contentSection.items, listTypeItems),
//         (item) => {
//             return item.label
//         }
//     )
//     if (!singleTypeItems.length) {
//         _.remove(contentSection.items, (item) => item.label === 'Single Type')
//     } else {
//         const single_type_nav = _.find(contentSection.items, {
//             label: 'Single Type',
//         })
//         single_type_nav.child = _.map(singleTypeItems, single_item => {
//             return {
//                 label: single_item.title,
//                 path: `/admin/cms/${single_item.slug}`,
//             }
//         })
//         // console.log(singleTypeItems)
//         // single_type_nav.child = [
//         //     {
//         //         label: 'Marketing Tool',
//         //         path: '/admin/settings/integrations/marketing',
//         //     },
//         // ]
//     }
//     const mixed_nav = _.sortBy(_.concat(navConfig, admin_nav), 'position')
//     // console.log(mixed_nav)
//     res.locals.mainNav = mixed_nav
//     res.locals.activeNav = req.originalUrl
//     // console.log(singleTypeItems)
//     next()
// }

const mainNavGenerator = async (req, res, next) => {
    let preBuildnav = _.cloneDeep(navConfig)
    let customBuildnav = _.cloneDeep(customNavConfig || [])
    const admin_nav_db_data = await AdminNav.find().select(
        '-_id -created_at -updated_at -__v'
    )
    const adminNav = _.cloneDeep(admin_nav_db_data)

    // const path = req.path;
    // console.log(`The request path is: ${path}`);
    // console.log('DB Fetch Begin')
    // const mergedArray = _.groupBy(_.merge(preBuildnav, customBuildnav, adminNav), 'section')
    // console.log(mergedArray)
    // console.log('DB Fetch END')

    // const mixed_nav = _.sortBy(_.concat(preBuildnav, admin_nav), 'position')

    const findSection = (section) => {
        return _.findIndex(preBuildnav, { section })
    }

    _.forEach(customBuildnav, (customSection) => {
        const sectionIndex = findSection(customSection.section)
        if (sectionIndex !== -1) {
            _.forEach(customSection.items, (customItem) => {
                const itemIndex = _.findIndex(preBuildnav[sectionIndex].items, {
                    label: customItem.label,
                })
                if (itemIndex === -1) {
                    // console.log(`sectionIndex (${customSection.section}): ${sectionIndex}`)
                    preBuildnav[sectionIndex].items.push(customItem)
                }
            })
        } else {
            preBuildnav.push(customSection)
        }
    })

    _.forEach(adminNav, (customSection) => {
        const sectionIndex = findSection(customSection.section)
        if (sectionIndex !== -1) {
            _.forEach(customSection.items, (customItem) => {
                const itemIndex = _.findIndex(preBuildnav[sectionIndex].items, {
                    label: customItem.label,
                })
                if (itemIndex === -1) {
                    // console.log(`sectionIndex (${customSection.section}): ${sectionIndex}`)
                    preBuildnav[sectionIndex].items.push(customItem)
                }
            })
        } else {
            preBuildnav.push(customSection)
        }
    })

    const contentTypes = await ContentType.find({
        // single_type: false,
        active: true,
    })
        .select(
            '-_id title slug admin_icon admin_nav_section position active single_type'
        )
        .sort([['position', 'ascending']])
    // app.locals.mainNav = contentTypes
    const listTypeItems = collect(contentTypes)
        // .filter((item) => item.single_type === false)
        .map((item) => {
            if (item.single_type === false) {
                return {
                    section: item.admin_nav_section || 'Content',
                    label: item.title,
                    expandable: true,
                    icon: item.admin_icon,
                    position: item.position,
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
                return {
                    section: item.admin_nav_section || 'Content',
                    label: item.title,
                    expandable: false,
                    icon: item.admin_icon,
                    path: `/admin/cms/${item.slug}`,
                }
            }
        })
        .all()

    // console.log(preBuildnav)

    // const singleTypeItems = collect(contentTypes)
    //     .filter((item) => item.single_type === true)
    //     .all()

    listTypeItems.forEach((d) => {
        // console.log(d.section)
        const contentSection = _.find(preBuildnav, { section: d.section })
        // if (contentSection?.items?.length) {
        //     contentSection.items = _.uniqBy(
        //         _.concat(contentSection.items, listTypeItems),
        //         (item) => {
        //             return item.label
        //         }
        //     )
        // } else {
        if (contentSection) {
            contentSection.items = _.uniqBy(
                _.concat(contentSection.items, d),
                (item) => {
                    return item.label
                }
            )
        }

        // }
    })

    // if (!singleTypeItems.length) {
    //     const contentSection = _.find(preBuildnav, { section: 'Content' })
    //     _.remove(contentSection?.items, (item) => item.label === 'Single Type')
    // } else {
    //     const contentSection = _.find(preBuildnav, { section: 'Content' })
    //     const single_type_nav = _.find(contentSection.items, {
    //         label: 'Single Type',
    //     })
    //     single_type_nav.child = _.map(singleTypeItems, (single_item) => {
    //         return {
    //             label: single_item.title,
    //             path: `/admin/cms/${single_item.slug}`,
    //         }
    //     })
    //     // console.log(singleTypeItems)
    //     // single_type_nav.child = [
    //     //     {
    //     //         label: 'Marketing Tool',
    //     //         path: '/admin/settings/integrations/marketing',
    //     //     },
    //     // ]
    // }

    const mixed_nav = _.sortBy(preBuildnav, 'position')
    // console.log(mixed_nav[4].items[4].child)
    // console.log(mixed_nav)

    res.locals.mainNav = mixed_nav
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
