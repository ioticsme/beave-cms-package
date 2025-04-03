'use strict'

// Class definition
var BEAVERScrolltop = function (element, options) {
    ////////////////////////////
    // ** Private variables  ** //
    ////////////////////////////
    var the = this

    if (typeof element === 'undefined' || element === null) {
        return
    }

    // Default options
    var defaultOptions = {
        offset: 300,
        speed: 600,
    }

    ////////////////////////////
    // ** Private methods  ** //
    ////////////////////////////

    var _construct = function () {
        if (BEAVERUtil.data(element).has('scrolltop')) {
            the = BEAVERUtil.data(element).get('scrolltop')
        } else {
            _init()
        }
    }

    var _init = function () {
        // Variables
        the.options = BEAVERUtil.deepExtend({}, defaultOptions, options)
        the.uid = BEAVERUtil.getUniqueId('scrolltop')
        the.element = element

        // Set initialized
        the.element.setAttribute('data-beaver-scrolltop', 'true')

        // Event Handlers
        _handlers()

        // Bind Instance
        BEAVERUtil.data(the.element).set('scrolltop', the)
    }

    var _handlers = function () {
        var timer

        window.addEventListener('scroll', function () {
            BEAVERUtil.throttle(
                timer,
                function () {
                    _scroll()
                },
                200
            )
        })

        BEAVERUtil.addEvent(the.element, 'click', function (e) {
            e.preventDefault()

            _go()
        })
    }

    var _scroll = function () {
        var offset = parseInt(_getOption('offset'))

        var pos = BEAVERUtil.getScrollTop() // current vertical position

        if (pos > offset) {
            if (document.body.hasAttribute('data-beaver-scrolltop') === false) {
                document.body.setAttribute('data-beaver-scrolltop', 'on')
            }
        } else {
            if (document.body.hasAttribute('data-beaver-scrolltop') === true) {
                document.body.removeAttribute('data-beaver-scrolltop')
            }
        }
    }

    var _go = function () {
        var speed = parseInt(_getOption('speed'))

        window.scrollTo({ top: 0, behavior: 'smooth' })
        //BEAVERUtil.scrollTop(0, speed);
    }

    var _getOption = function (name) {
        if (
            the.element.hasAttribute('data-beaver-scrolltop-' + name) === true
        ) {
            var attr = the.element.getAttribute('data-beaver-scrolltop-' + name)
            var value = BEAVERUtil.getResponsiveValue(attr)

            if (value !== null && String(value) === 'true') {
                value = true
            } else if (value !== null && String(value) === 'false') {
                value = false
            }

            return value
        } else {
            var optionName = BEAVERUtil.snakeToCamel(name)

            if (the.options[optionName]) {
                return BEAVERUtil.getResponsiveValue(the.options[optionName])
            } else {
                return null
            }
        }
    }

    var _destroy = function () {
        BEAVERUtil.data(the.element).remove('scrolltop')
    }

    // Construct class
    _construct()

    ///////////////////////
    // ** Public API  ** //
    ///////////////////////

    // Plugin API
    the.go = function () {
        return _go()
    }

    the.getElement = function () {
        return the.element
    }

    the.destroy = function () {
        return _destroy()
    }
}

// Static methods
BEAVERScrolltop.getInstance = function (element) {
    if (element && BEAVERUtil.data(element).has('scrolltop')) {
        return BEAVERUtil.data(element).get('scrolltop')
    } else {
        return null
    }
}

// Create instances
BEAVERScrolltop.createInstances = function (
    selector = '[data-beaver-scrolltop="true"]'
) {
    // Initialize Menus
    var elements = document.body.querySelectorAll(selector)

    if (elements && elements.length > 0) {
        for (var i = 0, len = elements.length; i < len; i++) {
            new BEAVERScrolltop(elements[i])
        }
    }
}

// Global initialization
BEAVERScrolltop.init = function () {
    BEAVERScrolltop.createInstances()
}

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BEAVERScrolltop
}
