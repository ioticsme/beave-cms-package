const envConfig = require('../config/env.config')
const path = require('path')
const axios = require('axios')
const Mailgun = require('mailgun.js')
const formData = require('form-data')
const fs = require('fs')

const sendEmail = async (
    from,
    to,
    subject,
    template,
    payloads,
    mg_settings = envConfig.mailgun,
    filePath = false
) => {
    try {
        const DOMAIN = mg_settings.DOMAIN
        const mailgun = new Mailgun(formData)
        const mg = mailgun.client({
            username: 'api',
            key: mg_settings.API_KEY,
            url: mg_settings.URL,
        })
        // console.log(mg)

        // console.log(mg.domains.domainTemplates.list())

        let attachment
        if (filePath) {
            const pdfPath = path.join(`${filePath}`)
            const file = {
                filename: 'invoice.pdf',
                data: await fs.promises.readFile(pdfPath),
            }
            attachment = [file]
        }
        const mailgunData = {
            from: `${from}`,
            to: `${to}`,
            subject: `${subject}`,
            template: `${template}`,
            attachment: attachment,
            'h:X-Mailgun-Variables': JSON.stringify(payloads),
        }
        // console.log(mailgunData)

        return mg.messages.create(DOMAIN, mailgunData)
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    sendEmail,
}
