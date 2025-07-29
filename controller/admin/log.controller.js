const fs = require('fs')
// const Agenda = require('../../model/Agenda')
const path = require('path')
const { format } = require('date-fns')
const { logError } = require('../../helper/Logger.helper')

const serverLogList = async (req, res) => {
    try {
        let validTypes = ['error', 'exception', 'warn', 'info']
        const logType =
            req.query.type && validTypes.includes(req.query.type)
                ? req.query.type
                : 'error'
        let logFilePath = path.join(process.cwd(), `logs/${logType}.log`)
        if (['warn', 'info', 'debug'].includes(logType)) {
            logFilePath = path.join(
                process.cwd(),
                `logs/${logType}-${format(new Date(), 'yyyy-MM-dd')}.log`
            )
        }

        fs.readFile(logFilePath, 'utf8', (err, data) => {
            if (err) {
                logError(err)
                return res.render('admin-njk/logs/server-log-list', {
                    logs: [],
                    validTypes,
                    activeType: logType,
                })
            }

            let logs = data
                .split('\n')
                .filter((line) => line)
                .map((line) => JSON.parse(line))
                .reverse()

            return res.render('admin-njk/logs/server-log-list', {
                logs,
                validTypes,
                activeType: logType,
            })
        })
    } catch (error) {
        logError(error)
        return res.render(`admin-njk/error-500`)
    }
}

const queueList = async (req, res) => {
    try {
        const data = await Agenda.find().sort({ _id: -1 })
        return res.render('admin-njk/logs/queue', {
            data,
        })
    } catch (error) {
        logError(error)
        return res.render(`admin-njk/error-500`)
    }
}

module.exports = {
    serverLogList,
    queueList,
}
