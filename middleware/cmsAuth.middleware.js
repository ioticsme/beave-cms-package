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

const authCheck = async (req, res, next) => {
    if (!req.session || !req.session.admin_id) {
        res.redirect('/admin/auth/login')
        return
    }

    req.authUser = req.session
    next()
}

const checkSuperAdmin = (req, res, next) => {
    if (req.authUser.admin_role != 'super_admin') {
        return res.render(`admin/app-error-500`)
    }
    next()
}

function extractUrls(items, access_ids, role = 'admin') {
    return (
        collect(items)
            .flatMap((item) => {
                // Initialize an array with the current item's URLs (if available)
                let urls
                if (['super_admin', 'admin'].includes(role)) {
                    urls = item.urls || []
                } else if (access_ids.includes(item.id)) {
                    urls = item.urls || []
                } else {
                    urls = []
                }

                // Recursively check for children and merge their URLs
                if (Array.isArray(item.children) && item.children.length > 0) {
                    urls = urls.concat(
                        extractUrls(item.children, access_ids, role)
                    )
                }

                return urls
            })
            // .put('/ecommerce/assets/media/logos/favicon.ico')
            .all()
    ) // Return the final merged array of URLs
}

function hasAccessInChildren(children, accessIds) {
    // Recursively check if any child's id matches accessIds or if it has nested children
    return children.some(
        (child) =>
            accessIds.includes(child.id) ||
            (child.children && hasAccessInChildren(child.children, accessIds))
    )
}

function extractSections(items, accessIds = [], role = 'admin') {
    if (role == 'super_admin' || role == 'admin') {
        return ['dashboard', 'content', 'assets', 'custom-forms', 'settings']
    }

    let sections = []
    collect(items)
        .flatMap((item) => {
            if (item.children?.length) {
                const hasAccess = hasAccessInChildren(item.children, accessIds)

                if (hasAccess) {
                    sections.push(item.section)
                }
            }
            return item
        })
        .all()

    return sections
}

// Helper function to match dynamic routes
function isAllowedRoute(req, allowedRoutes) {
    // console.log('req :>> ', req)
    // const currentRoute = req.path
    const currentRoute = req.originalUrl
    // console.log('Current Route:', currentRoute)
    // Check if any allowed route pattern matches the current request path
    return allowedRoutes.some((routePattern) => {
        // Convert the route pattern, replacing :id with a regex that matches any value
        const routeRegex = new RegExp(
            '^' + routePattern.replace(':id', '[^/]+') + '$'
        )
        return routeRegex.test(currentRoute)
    })
}

const checkRouteAccess = async (req, res, next) => {
    const access_ids = new Set(req.authUser.admin_privileges?.split(',') ?? [])
    access_ids.add('dashboard.page')
    // console.log(access_ids)
    const config_privilege_routes = await privileges(req)

    const urls_array = extractUrls(
        config_privilege_routes,
        [...access_ids],
        req.session.admin_role
    )
    urls_array.push('/admin/upload-article-image')
    urls_array.push('/admin/settings/switch-brand')
    const allowedSections = extractSections(
        config_privilege_routes,
        [...access_ids],
        req.session.admin_role
    )
    // console.log(urls_array)
    // console.log('allowedSections :>> ', allowedSections)
    if (
        !['super_admin', 'admin'].includes(req.session.admin_role) &&
        !isAllowedRoute(req, urls_array)
    ) {
        return res.render(`admin-njk/page-error-403`)
    }

    res.locals.allowedURLs = urls_array
    res.locals.allowedSections = allowedSections
    res.locals.userPrivileges = [...access_ids]

    next()
}

module.exports = {
    authCheck,
    checkSuperAdmin,
    checkRouteAccess,
}
