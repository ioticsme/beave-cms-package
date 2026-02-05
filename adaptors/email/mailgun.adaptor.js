const Mailgun = require('mailgun.js')
const formData = require('form-data')
const { decryptData } = require('../../helper/Operations.helper')
const { logInfo, logError } = require('../../helper/Logger.helper')

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
        if (!template) {
            logInfo(
                `Template is not provided - subject: ${subject} - to: ${to}`
            )
            return false
        }

        const DOMAIN = mg_settings.domain
        const mailgun = new Mailgun(formData)
        const api_key = decryptData(mg_settings.api_key)
        const mg = mailgun.client({
            username: 'api',
            key: api_key,
            // url: mg_settings.url,
        })

        const mailgunData = {
            from: `${mg_settings.from}`,
            to: `${to}`,
            subject: `${subject}`,
            template: `${template}`,
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
            mailgunData.text = JSON.stringify(payloads)
        } else if (!mailgunData.template || html) {
            mailgunData.html = html
        } else {
            mailgunData.template = `${template}`
            mailgunData['h:X-Mailgun-Variables'] = JSON.stringify(payloads)
        }

        let response = await mg.messages.create(DOMAIN, mailgunData)
        let logData = {
            from: mg_settings.from,
            to: to,
            subject: subject,
            template: template,
            response: response,
        }

        logInfo(JSON.stringify(logData))

        return response
    } catch (error) {
        logError(error)
        return false
    }
}

module.exports = {
    sendMailGunEmail,
}
