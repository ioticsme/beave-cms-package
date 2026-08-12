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
        const search = req.query.search
            ? req.query.search.trim().toLowerCase()
            : ''
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 20

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
                    search: '',
                    page: 1,
                    limit: 20,
                    totalPages: 0,
                    totalLogs: 0,
                })
            }

            let allLogs = data
                .split('\n')
                .filter((line) => line.trim())
                .map((line) => {
                    try {
                        return JSON.parse(line)
                    } catch (e) {
                        return null
                    }
                })
                .filter((log) => log !== null)
                .reverse()

            if (search) {
                allLogs = allLogs.filter((log) => {
                    const message = (log.message || '').toLowerCase()
                    const stack =
                        typeof log.stack === 'string'
                            ? log.stack.toLowerCase()
                            : JSON.stringify(log.stack || '').toLowerCase()
                    const timestamp = (log.timestamp || '').toLowerCase()
                    return (
                        message.includes(search) ||
                        stack.includes(search) ||
                        timestamp.includes(search)
                    )
                })
            }

            const totalLogs = allLogs.length
            const totalPages = Math.ceil(totalLogs / limit) || 1
            const currentPage = Math.max(1, Math.min(page, totalPages))
            const startIndex = (currentPage - 1) * limit
            const paginatedLogs = allLogs.slice(startIndex, startIndex + limit)

            return res.render('admin-njk/logs/server-log-list', {
                logs: paginatedLogs,
                validTypes,
                activeType: logType,
                search: req.query.search || '',
                page: currentPage,
                limit,
                totalPages,
                totalLogs,
            })
        })
    } catch (error) {
        logError(error)
        return res.render(`admin-njk/error-500`)
    }
}

const serverLogJsonList = async (req, res) => {
    try {
        let validTypes = ['error', 'exception', 'warn', 'info']
        const logType =
            req.query.type && validTypes.includes(req.query.type)
                ? req.query.type
                : 'error'

        const draw = parseInt(req.query.draw) || 1
        const start = parseInt(req.query.start) || 0
        const length = parseInt(req.query.length) || 10
        const searchValue =
            req.query.search && req.query.search.value
                ? req.query.search.value.trim().toLowerCase()
                : ''

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
                return res.status(200).json({
                    draw,
                    recordsTotal: 0,
                    recordsFiltered: 0,
                    data: [],
                })
            }

            let allLogs = data
                .split('\n')
                .filter((line) => line.trim())
                .map((line) => {
                    try {
                        return JSON.parse(line)
                    } catch (e) {
                        return null
                    }
                })
                .filter((log) => log !== null)
                .reverse()

            const recordsTotal = allLogs.length

            if (searchValue) {
                allLogs = allLogs.filter((log) => {
                    const message = (log.message || '').toLowerCase()
                    const stack =
                        typeof log.stack === 'string'
                            ? log.stack.toLowerCase()
                            : JSON.stringify(log.stack || '').toLowerCase()
                    const timestamp = (log.timestamp || '').toLowerCase()
                    return (
                        message.includes(searchValue) ||
                        stack.includes(searchValue) ||
                        timestamp.includes(searchValue)
                    )
                })
            }

            const recordsFiltered = allLogs.length
            const paginatedData = allLogs.slice(start, start + length)

            return res.status(200).json({
                draw,
                recordsTotal,
                recordsFiltered,
                data: paginatedData,
            })
        })
    } catch (error) {
        logError(error)
        return res.status(500).json({ error: 'Something went wrong' })
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
    serverLogJsonList,
    queueList,
}
