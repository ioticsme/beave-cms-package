const envConfig = require('./config/env.config')
const express = require('express')
const nunjucks = require('nunjucks')
const helmet = require('helmet')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const chalk = require('chalk')
var session = require('express-session')
const FileStore = require('session-file-store')(session)
const Redis = require('ioredis')
var redisStore = require('connect-redis')(session)

const path = require('path')
var cors = require('cors')
const app = express()
const rateLimit = require('express-rate-limit')
const { format } = require('date-fns')

// BEGIN::Initiating Swagger APi Documentation
const setupSwagger = require('./swagger')
setupSwagger(app)
// END::Initiating Swagger APi Documentation

// BEGIN::Service Providers
const {
    baseConfig,
    authUser,
    mainNavGenerator,
    allBrands,
    nunjucksFilter,
} = require('./middleware/cms.middleware')
// END::Service Providers

// console.log(envConfig.general)
app.use((req, res, next) => {
    app.locals.baseURL =
        envConfig.general.DOMAIN || req.protocol + '://' + req.get('host')
    app.locals.clientName = envConfig.general.CLIENT_NAME
    next()
})
// BEGIN::Security Headers
// app.use(helmet())
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }))
app.use(helmet.frameguard({ action: 'deny' }))
app.use(helmet.xssFilter())
app.use(helmet.hidePoweredBy())
app.disable('x-powered-by')
// END::Security Headers

app.use(cors())

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Assets folder
app.use('/cms-static', express.static(path.join(__dirname, './public')))
app.use('/static', express.static(`${process.cwd()}/public`))
app.use('/uploads', express.static(`${process.cwd()}/uploads`))

//Configure admin session storage
let session_driver
if (envConfig.general.SESSION_STORAGE == 'redis') {
    session_driver = new redisStore({
        client: new Redis(envConfig.cache.REDIS_URL),
        ttl: envConfig.general.SESSION_MAX_AGE * 60, // Time to leave in seconds
    })
} else {
    session_driver = new FileStore({
        path: './sessions', // This specifies the directory to store session files,
        ttl: envConfig.general.SESSION_MAX_AGE * 60 * 1000, // Time to leave in milliseconds
    })
}

const sessionConfig = {
    store: session_driver,
    secret: `${envConfig.general.APP_KEY}`,
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: envConfig.general.SESSION_MAX_AGE * 60 * 1000,
    },
}
//session middleware
if (envConfig.general.NODE_ENV === 'production') {
    app.set('trust proxy', 1)
}
app.use(session(sessionConfig))
app.use(cookieParser())

// Template Engine
var njk = nunjucks
    .configure(path.join(__dirname, '/views'), {
        express: app,
        autoescape: true,
        noCache: true,
        // Add the `keys` filter to the environment
        filters: {
            keys: function (obj) {
                return Object.keys(obj)
            },
        },
    })
    .addFilter('json', function (obj) {
        return JSON.stringify(obj)
    })
    .addFilter('keys', function (obj) {
        return Object.keys(obj)
    })
njk.addFilter('htmlSlice', function (value, start, end) {
    const text = value.replace(/<[^>]*>?/gm, '') // Remove HTML tags
    return text.slice(start, end) // Return sliced text
})
njk.addFilter('in_array', function (ar, val) {
    return Array.isArray(ar) && ar.includes(val)
})
njk.addGlobal('ObjectKeys', Object.keys)
app.set('view engine', 'njk')

// app.set('views', path.join(__dirname, '/views'))
// app.set('view engine', 'pug')

// DB Connection
const Config = require('./model/Config')
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

app.get('/health', async (req, res) => {
    const appKey =
        envConfig.general.APP_KEY === undefined ? 'APP Key is missing!!!' : 'OK'
    res.status(200).json({
        'DB Connected': dbSuccess,
        Health: 'OK',
        'App Key': appKey,
        Timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        TimeNow: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    })
})

// BEGIN:: API Route Groups
const adminRoutes = require('./routes/admin/admin.routes')
const webAPIRoutes = require('./routes/api/web-api.routes')
// END:: API Route Groups

// TODO::Below code is only for continuos development purpose. Should be removed on staging and production
// BEGIN::Admin automatic auth on each server restart for development purpose
if (envConfig.general.NODE_ENV == 'development') {
    const Settings = require('./model/Settings')
    const Admin = require('./model/Admin')
    const Brand = require('./model/Brand')
    const devAuth = async (req, res, next) => {
        if (!req.session?.brand?._id) {
            const admin = await Admin.findOne()
            const brand = await Brand.findOne({ code: 'fc' })
                .populate({
                    path: 'languages',
                    options: { sort: { is_default: -1 } },
                })
                .populate('domains.country')

            if (brand) {
                session = req.session
                session.admin_id = admin._id
                session.admin_name = admin.name
                session.admin_role = admin.role
                const settings = await Settings.findOne({
                    brand: brand,
                    country: brand.domains[0].country._id,
                }).select(
                    '-brand -country -__v -created_at -updated_at -author'
                )

                session.brand = {
                    _id: brand._id, //TODO: id should be _id for the consistency
                    name: brand.name,
                    code: brand.code,
                    languages: brand.languages,
                    country: brand.domains[0].country._id,
                    country_name: brand.domains[0].country.name.en,
                    country_code: brand.domains[0].country.code,
                    country_currency: brand.domains[0].country.currency,
                    country_currency_symbol:
                        brand.domains[0].country.currency_symbol,
                    settings: settings ? settings : {},
                }
            }
        }
        next()
    }
    app.use(devAuth)
}
// END::Admin aautomatic auth for development purpose

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})
// Apply the rate limiting middleware to API calls only
app.use('/api', apiLimiter)

app.get('/', (req, res) => {
    return res.status(404).json('Not Found')
})
app.use('/api', webAPIRoutes)
app.use(
    '/admin',
    [baseConfig, nunjucksFilter, authUser, mainNavGenerator, allBrands],
    adminRoutes
)

module.exports = app
