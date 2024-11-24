const envConfig = require('../../config/env.config')
const path = require('path')
const axios = require('axios')
const Mailgun = require('mailgun.js')
const formData = require('form-data')
const fs = require('fs')
const { decryptData } = require('../../helper/Operations.helper')

const sendMailGunEmail = async (
    to,
    subject,
    template,
    payloads,
    mg_settings,
    filePath = false,
    html = false
) => {
    try {
        const DOMAIN = mg_settings.domain
        const mailgun = new Mailgun(formData)
        const api_key = await decryptData(mg_settings.api_key)
        const mg = mailgun.client({
            username: 'api',
            key: api_key,
            // url: mg_settings.url,
        })
        // console.log(mg)

        const mailgunData = {
            from: `${mg_settings.from}`,
            to: `${to}`,
            subject: `${subject}`,
        }

        // let attachment
        // if (filePath) {
        //     const pdfPath = path.join(`${filePath}`)
        //     const file = {
        //         filename: 'invoice.pdf',
        //         data: await fs.promises.readFile(pdfPath),
        //     }
        //     attachment = [file]
        //     mailgunData.attachment = attachment
        // }

        // console.log(mailgunData.template)
        if (!mailgunData.template && !html) {
            mailgunData.text = JSON.stringify(payloads.field_values)
        } else if (!mailgunData.template || html) {
            mailgunData.html = html
        } else {
            mailgunData.template = `${template}`
            mailgunData['h:X-Mailgun-Variables'] = JSON.stringify(payloads.field_values)
        }

        // console.log(mailgunData)

        return mg.messages.create(DOMAIN, mailgunData)
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = {
    sendMailGunEmail,
}
