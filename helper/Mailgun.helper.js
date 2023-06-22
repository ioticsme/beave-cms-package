// "https://smsapi.aptivadigi.com/api/?username=iotic&password=Iotics@324&cmd=sendSMS&message=Dear+customer%2C+your+one+time+password+%28OTP%29+for+ordering+from+Akawi+Oven+is+513391&sender=EATROOT&uniCode=0&to=971566994313"
const envConfig = require('../config/env.config')
const path = require('path')
const axios = require('axios')
const Mailgun = require('mailgun.js')
const formData = require('form-data')
const fs = require('fs')

const mailGunTemplates = async () => {
    try {
        const DOMAIN = envConfig.mailgun.DOMAIN

        // const DOMAIN = 'funcity.ae'
        const mailgun = new Mailgun(formData)

        const client = mailgun.client({
            username: 'api',
            key: envConfig.mailgun.API_KEY,
            url: envConfig.mailgun.URL,
        })

        // console.log(client.domains.domainTemplates.list)
        // console.log(envConfig.mailgun.API_KEY)

        // console.log(client)
        const domainTemplates = await client.domains.domainTemplates.list(
            DOMAIN,
            {
                limit: 30,
            }
        )

        return domainTemplates
    } catch (e) {
        console.log(e)
        return []
    }
}

module.exports = {
    mailGunTemplates,
}
