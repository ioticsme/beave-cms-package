'use strict'

var BEAVERSwapperHandlersInitialized = false

// Class definition
var BEAVERSwapper = function (element, options) {
    ////////////////////////////
    // ** Private Variables  ** //
    ////////////////////////////
    var the = this

    if (typeof element === 'undefined' || element === null) {
        return
    }

    // Default Options
    var defaultOptions = {
        mode: 'append',
    }

    ////////////////////////////
    // ** Private Methods  ** //
    ////////////////////////////

    var _construct = function () {
        if (BEAVERUtil.data(element).has('swapper') === true) {
            the = BEAVERUtil.data(element).get('swapper')
        } else {
            _init()
        }
    }

    var _init = function () {
        the.element = element
        the.options = BEAVERUtil.deepExtend({}, defaultOptions, options)

        // Set initialized
        the.element.setAttribute('data-beaver-swapper', 'true')

        // Initial update
        _update()

        // Bind Instance
        BEAVERUtil.data(the.element).set('swapper', the)
    }

    var _update = function (e) {
        var parentSelector = _getOption('parent')

        var mode = _getOption('mode')
        var parentElement = parentSelector
            ? document.querySelector(parentSelector)
            : null

        if (parentElement && element.parentNode !== parentElement) {
            if (mode === 'prepend') {
                parentElement.prepend(element)
            } else if (mode === 'append') {
                parentElement.append(element)
            }
        }
    }

    var _getOption = function (name) {
        if (the.element.hasAttribute('data-beaver-swapper-' + name) === true) {
            var attr = the.element.getAttribute('data-beaver-swapper-' + name)
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
        BEAVERUtil.data(the.element).remove('swapper')
    }

    // Construct Class
    _construct()

    ///////////////////////
    // ** Public API  ** //
    ///////////////////////

    // Methods
    the.update = function () {
        _update()
    }

    the.destroy = function () {
        return _destroy()
    }

    // Event API
    the.on = function (name, handler) {
        return BEAVEREventHandler.on(the.element, name, handler)
    }

    the.one = function (name, handler) {
        return BEAVEREventHandler.one(the.element, name, handler)
    }

    the.off = function (name, handlerId) {
        return BEAVEREventHandler.off(the.element, name, handlerId)
    }

    the.trigger = function (name, event) {
        return BEAVEREventHandler.trigger(the.element, name, event, the, event)
    }
}

// Static methods
BEAVERSwapper.getInstance = function (element) {
    if (element !== null && BEAVERUtil.data(element).has('swapper')) {
        return BEAVERUtil.data(element).get('swapper')
    } else {
        return null
    }
}

// Create instances
BEAVERSwapper.createInstances = function (
    selector = '[data-beaver-swapper="true"]'
) {
    // Initialize Menus
    var elements = document.querySelectorAll(selector)
    var swapper

    if (elements && elements.length > 0) {
        for (var i = 0, len = elements.length; i < len; i++) {
            swapper = new BEAVERSwapper(elements[i])
        }
    }
}

// Window resize handler
BEAVERSwapper.handleResize = function () {
    window.addEventListener('resize', function () {
        var timer

        BEAVERUtil.throttle(
            timer,
            function () {
                // Locate and update Offcanvas instances on window resize
                var elements = document.querySelectorAll(
                    '[data-beaver-swapper="true"]'
                )

                if (elements && elements.length > 0) {
                    for (var i = 0, len = elements.length; i < len; i++) {
                        var swapper = BEAVERSwapper.getInstance(elements[i])
                        if (swapper) {
                            swapper.update()
                        }
                    }
                }
            },
            200
        )
    })
}

// Global initialization
BEAVERSwapper.init = function () {
    BEAVERSwapper.createInstances()

    if (BEAVERSwapperHandlersInitialized === false) {
        BEAVERSwapper.handleResize()
        BEAVERSwapperHandlersInitialized = true
    }
}

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BEAVERSwapper
}
