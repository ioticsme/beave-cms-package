const Settings = require('../model/Settings')
const Admin = require('../model/Admin')
const Brand = require('../model/Brand')

const collect = require('collect.js')

const devAuth = async (req, res, next) => {
    if (!req.session?.brand?._id) {
        const admin = await Admin.findOne()
        const brand = await Brand.findOne()
            .sort({ position: 1 })
            .populate({
                path: 'languages',
                options: { sort: { is_default: -1 } },
            })
            .populate('domains.country')

        let domains = collect(brand.domains).sortBy('country.position').all()
        let domain = domains?.[0] || {}

        if (brand && domain?.country) {
            req.session.admin_id = admin._id
            req.session.admin_name = admin.name
            req.session.admin_role = admin.role
            req.session.admin_privileges = admin.privileges
            const settings = await Settings.findOne({
                brand: brand,
                country: domain.country._id,
            }).select('-brand -country -__v -created_at -updated_at -author')

            req.session.brand = {
                _id: brand._id, //TODO: id should be _id for the consistency
                name: brand.name,
                code: brand.code,
                languages: brand.languages,
                country: domain.country._id,
                country_name: domain.country.name.en,
                country_code: domain.country.code,
                country_currency: domain.country.currency,
                country_currency_symbol: domain.country.currency_symbol,
                currency_decimal_points: domain.country.currency_decimal_points,
                country_object: domain.country,
                settings: settings ? settings : {},
            }
        }
    }
    next()
}

module.exports = devAuth
