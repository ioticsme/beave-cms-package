'use strict'

// Class definition
var BEAVERToggle = function (element, options) {
    ////////////////////////////
    // ** Private variables  ** //
    ////////////////////////////
    var the = this

    if (!element) {
        return
    }

    // Default Options
    var defaultOptions = {
        saveState: true,
    }

    ////////////////////////////
    // ** Private methods  ** //
    ////////////////////////////

    var _construct = function () {
        if (BEAVERUtil.data(element).has('toggle') === true) {
            the = BEAVERUtil.data(element).get('toggle')
        } else {
            _init()
        }
    }

    var _init = function () {
        // Variables
        the.options = BEAVERUtil.deepExtend({}, defaultOptions, options)
        the.uid = BEAVERUtil.getUniqueId('toggle')

        // Elements
        the.element = element

        the.target = document.querySelector(
            the.element.getAttribute('data-beaver-toggle-target')
        )
            ? document.querySelector(
                  the.element.getAttribute('data-beaver-toggle-target')
              )
            : the.element
        the.state = the.element.hasAttribute('data-beaver-toggle-state')
            ? the.element.getAttribute('data-beaver-toggle-state')
            : ''
        the.mode = the.element.hasAttribute('data-beaver-toggle-mode')
            ? the.element.getAttribute('data-beaver-toggle-mode')
            : ''
        the.attribute =
            'data-beaver-' + the.element.getAttribute('data-beaver-toggle-name')

        // Event Handlers
        _handlers()

        // Bind Instance
        BEAVERUtil.data(the.element).set('toggle', the)
    }

    var _handlers = function () {
        BEAVERUtil.addEvent(the.element, 'click', function (e) {
            e.preventDefault()

            if (the.mode !== '') {
                if (the.mode === 'off' && _isEnabled() === false) {
                    _toggle()
                } else if (the.mode === 'on' && _isEnabled() === true) {
                    _toggle()
                }
            } else {
                _toggle()
            }
        })
    }

    // Event handlers
    var _toggle = function () {
        // Trigger "after.toggle" event
        BEAVEREventHandler.trigger(the.element, 'beaver.toggle.change', the)

        if (_isEnabled()) {
            _disable()
        } else {
            _enable()
        }

        // Trigger "before.toggle" event
        BEAVEREventHandler.trigger(the.element, 'beaver.toggle.changed', the)

        return the
    }

    var _enable = function () {
        if (_isEnabled() === true) {
            return
        }

        BEAVEREventHandler.trigger(the.element, 'beaver.toggle.enable', the)

        the.target.setAttribute(the.attribute, 'on')

        if (the.state.length > 0) {
            the.element.classList.add(the.state)
        }

        if (
            typeof BEAVERCookie !== 'undefined' &&
            the.options.saveState === true
        ) {
            BEAVERCookie.set(the.attribute, 'on')
        }

        BEAVEREventHandler.trigger(the.element, 'beaver.toggle.enabled', the)

        return the
    }

    var _disable = function () {
        if (_isEnabled() === false) {
            return
        }

        BEAVEREventHandler.trigger(the.element, 'beaver.toggle.disable', the)

        the.target.removeAttribute(the.attribute)

        if (the.state.length > 0) {
            the.element.classList.remove(the.state)
        }

        if (
            typeof BEAVERCookie !== 'undefined' &&
            the.options.saveState === true
        ) {
            BEAVERCookie.remove(the.attribute)
        }

        BEAVEREventHandler.trigger(the.element, 'beaver.toggle.disabled', the)

        return the
    }

    var _isEnabled = function () {
        return (
            String(the.target.getAttribute(the.attribute)).toLowerCase() ===
            'on'
        )
    }

    var _destroy = function () {
        BEAVERUtil.data(the.element).remove('toggle')
    }

    // Construct class
    _construct()

    ///////////////////////
    // ** Public API  ** //
    ///////////////////////

    // Plugin API
    the.toggle = function () {
        return _toggle()
    }

    the.enable = function () {
        return _enable()
    }

    the.disable = function () {
        return _disable()
    }

    the.isEnabled = function () {
        return _isEnabled()
    }

    the.goElement = function () {
        return the.element
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
BEAVERToggle.getInstance = function (element) {
    if (element !== null && BEAVERUtil.data(element).has('toggle')) {
        return BEAVERUtil.data(element).get('toggle')
    } else {
        return null
    }
}

// Create instances
BEAVERToggle.createInstances = function (selector = '[data-beaver-toggle]') {
    // Get instances
    var elements = document.body.querySelectorAll(selector)

    if (elements && elements.length > 0) {
        for (var i = 0, len = elements.length; i < len; i++) {
            // Initialize instances
            new BEAVERToggle(elements[i])
        }
    }
}

// Global initialization
BEAVERToggle.init = function () {
    BEAVERToggle.createInstances()
}

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BEAVERToggle
}
