const Config = require('../model/Config')
const envConfig = require('../config/env.config')

const mongoose = require('mongoose')
const chalk = require('chalk')

module.exports = () => {
    global.globalModuleConfig = {}
    let dbSuccess = 'Fail'
    mongoose.set('strictQuery', false)
    mongoose
        .connect(envConfig.db.URL, {
            dbName: `${envConfig.db.NAME}`,
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then(() => {
            dbSuccess = 'Success'
            console.log(chalk.cyan('DB Connected'))
            Config.findOne()
                .select('-order_no -created_at -updated_at -__v -_id')
                .then(async (data) => {
                    let config = data
                    if (!data) {
                        try {
                            config = await Config.create({
                                general: {
                                    client_name: envConfig.general.CLIENT_NAME,
                                },
                            })
                        } catch (error) {
                            if (error.name === 'ValidationError') {
                                let errors = {}

                                Object.keys(error.errors).forEach((key) => {
                                    errors[key] = error.errors[key].message
                                })

                                console.log(errors)
                            }
                        }
                    }
                })
        })

    var db = mongoose.connection
    db.on('error', console.error.bind(console, 'MongoDB connection error:')) //TODO::Send slack notification
}
