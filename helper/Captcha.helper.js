const envConfig = require('../config/env.config')
const axios = require('axios')

// TODO: env parameteres should come from DB (Super admin config)
const verifyCaptcha = async (token) => {
    try {
        let response = await axios
            .post(
                `${envConfig.captcha.BASE_URL}?secret=${envConfig.captcha.SECRET_KEY}&response=${token}`
            )
            .then((res) => {
                // console.log(res.data)
                return res?.data?.success
            })
            .catch((err) => {
                console.log(err)
                return false
            })
        return response
    } catch (error) {
        return false
    }
}

module.exports = {
    verifyCaptcha,
}
