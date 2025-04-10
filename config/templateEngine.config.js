const nunjucks = require('nunjucks')

module.exports = (app, viewsPath) => {
    const njk = nunjucks
        .configure([viewsPath], {
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
        .addFilter('log', (value) => {
            console.log(value)
            return value // Return the value to ensure it continues rendering
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
}
