const envConfig = require('../config/env.config')
const path = require('path')
const axios = require('axios')
const Mailgun = require('mailgun.js')
const formData = require('form-data')
const fs = require('fs')
const Config = require('../model/Config')
const { sendMailGunEmail } = require('../adaptors/email/mailgun.adaptor')
const { sendLocalMail } = require('../adaptors/email/nodemailer.adaptor')

const sendEmail = async (
    to,
    subject,
    template,
    payloads,
    filePath = false,
    html = false
) => {
    try {
        const email_settings = await Config.findOne().select('email_settings')
        const default_channel = email_settings.email_settings.default_channel
        if (default_channel == 'local') {
            await sendLocalMail(
                to,
                subject,
                template,
                payloads,
                email_settings.email_settings.local,
                (filePath = false),
                (html = false)
            )
        } else if (default_channel == 'mailgun') {
            await sendMailGunEmail(
                to,
                subject,
                template,
                payloads,
                email_settings.email_settings.mailgun,
                (filePath = false),
                (html = false)
            )
        }

        // console.log(mailgunData)
        return 'Done'
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    sendEmail,
}
