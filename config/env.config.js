require('dotenv').config()

const envConfig = {
    general: {
        NODE_ENV: process.env.NODE_ENV || 'development',
        PORT: process.env.PORT || 8080,
        APP_KEY: process.env.APP_KEY || 'testkey',
        SESSION_MAX_AGE: Number(process.env.SESSION_MAX_AGE) || 720, // Value must be in minutes
        DOMAIN: process.env.DOMAIN,
        FRONTEND_URL: process.env.FRONTEND_URL,
        CLIENT_NAME: process.env.CLIENT_NAME,
        CMS_LOGO_LARGE:
            process.env.CMS_LOGO_LARGE ||
            '/cms-static/admin/assets/media/logo/beave-logo.png',
        CMS_LOGO_SMALL:
            process.env.CMS_LOGO_SMALL ||
            '/cms-static/admin/assets/media/logo/beave-logo.png',
        ADMIN_LANDING_URL: process.env.ADMIN_LANDING_URL || '/admin/dashboard',
        SESSION_STORAGE: process.env.SESSION_STORAGE || 'file',
        CAPTCHA_ENABLED: process.env.CAPTCHA_ENABLED || false,
        HAS_PDF_UPLOAD: process.env.HAS_PDF_UPLOAD || false,
        SEND_SIGNUP_MAIL: process.env.SEND_SIGNUP_MAIL || false,
    },
    db: {
        URL: process.env.DB_CONNECTION,
        NAME: process.env.DB_NAME || process.env.CLIENT_NAME?.toLowerCase(),
    },
    // imagekit: {
    //     PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
    //     PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
    //     URL: process.env.IMAGEKIT_URL,
    //     FOLDER: process.env.IMAGEKIT_FOLDER,
    // },
    // bunny_cdn: {
    //     REGION: process.env.BUNNY_REGION || '', // If German region, set this to an empty string: ''
    //     HOSTNAME: process.env.BUNNY_HOSTNAME || 'storage.bunnycdn.com',
    //     STORAGE_ZONE_NAME: process.env.BUNNY_STORAGE_ZONE_NAME,
    //     API_KEY: process.env.BUNNY_API_KEY,
    //     URL: process.env.BUNNY_URL,
    // },
    // mailgun: {
    //     DOMAIN: process.env.MAILGUN_DOMAIN,
    //     API_KEY: process.env.MAILGUN_API_KEY,
    //     FROM: process.env.MAILGUN_FROM,
    //     URL: process.env.MAILGUN_URL || undefined,
    //     TEMPLATE_FORGOT_PASSWORD: process.env.MAILGUN_TEMPLATE_FORGOT_PASSWORD,
    //     TEMPLATE_WELCOME: process.env.MAILGUN_TEMPLATE_WELCOME,
    // },
    captcha: {
        BASE_URL: process.env.CAPTCHA_BASE_URL,
        SECRET_KEY: process.env.CAPTCHA_SECRET_KEY,
    },
    cache: {
        ACTIVE: process.env.CACHE_LOCAL_DATA || false,
        // WEB_TOKEN_EXPIRY: process.env.WEB_USER_TOKEN_EXPIRY || '24h',
        // MOBILE_TOKEN_EXPIRY: process.env.MOBILE_USER_TOKEN_EXPIRY || '30days',
        REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    slack: {
        ADMIN_CHANNEL: process.env.SLACK_ADMIN_CHANNEL,
    },
}

module.exports = envConfig
