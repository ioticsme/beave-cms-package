const envConfig = require('../../config/env.config')
const Joi = require('joi')
const axios = require('axios')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Admin = require('../../model/Admin')
const {
    format,
    addDays,
    subDays,
    parse,
    parseISO,
    startOfMonth,
    subMonths,
    endOfMonth,
    startOfDay,
    endOfDay,
    differenceInDays,
} = require('date-fns')

// Services
const { differenceInPercentage } = require('../../helper/Operations.helper')
const User = require('../../model/User')

const basicDashboard = async (req, res) => {
    return res.render(`admin-njk/dashboards/basic`, {})
}
module.exports = {
    basicDashboard,
}
