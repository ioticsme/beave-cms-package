const Agenda = require('agenda')
const envConfig = require('../config/env.config')
const CustomJobs = require(`${process.cwd()}/jobs`)

const MAX_RETRIES = 3 // maximum number of retries
const RETRY_INTERVAL = '5 seconds' // retry interval

const agenda = new Agenda({
    db: {
        address: envConfig.db.URL,
        collection: 'agenda_jobs',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // specify the database name here
            dbName: envConfig.db.NAME,
        },
    },
})

agenda.on('ready', () => {
    // Agenda is connected and ready to schedule jobs
    console.log('Queue Watch Is Ready')
    // agenda.schedule('in 10 seconds', 'log message')
    agenda.start()
})

// Handle any errors that occur while initializing the agenda instance
agenda.on('error', (error) => {
    console.error('Agenda error:', error)
})

// Define a job that logs a message to the console
agenda.define(
    'job queues',
    { priority: 'high', concurrency: 10 },
    async (job, done) => {
        try {
            if (!CustomJobs) {
                throw new Error('CustomJobs is not defined')
            }

            const method = job.attrs.data.method
            if (!CustomJobs[method]) {
                throw new Error(`Method ${method} not found in CustomJobs`)
            }

            const task = await CustomJobs[method](job.attrs.data?.payload)
            if (task) {
                done()
            } else {
                // console.log(job.attrs.failCount)
                const retries = job.attrs.failCount || 0
                if (retries < MAX_RETRIES) {
                    job.fail({
                        retry: true,
                        message: 'job failed, retrying...',
                    })
                    job.schedule(`in ${RETRY_INTERVAL}`).save()
                    done()
                } else {
                    job.fail('job failed after multiple retries')
                    done('error')
                }
            }
        } catch (err) {
            console.log(err)
            done(err)
        }
    }
)

const queueJob = async (data) => {
    // console.log(payloads)
    agenda.schedule(`in ${data.delay}`, 'job queues', {
        method: data.method,
        payload: data.payload,
    })
}

module.exports = queueJob
