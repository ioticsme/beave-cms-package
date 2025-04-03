'use strict'

var BEAVERDrawerHandlersInitialized = false

// Class definition
var BEAVERDrawer = function (element, options) {
    //////////////////////////////
    // ** Private variables  ** //
    //////////////////////////////
    var the = this

    if (typeof element === 'undefined' || element === null) {
        return
    }

    // Default options
    var defaultOptions = {
        overlay: true,
        direction: 'end',
        baseClass: 'drawer',
        overlayClass: 'drawer-overlay',
    }

    ////////////////////////////
    // ** Private methods  ** //
    ////////////////////////////

    var _construct = function () {
        if (BEAVERUtil.data(element).has('drawer')) {
            the = BEAVERUtil.data(element).get('drawer')
        } else {
            _init()
        }
    }

    var _init = function () {
        // Variables
        the.options = BEAVERUtil.deepExtend({}, defaultOptions, options)
        the.uid = BEAVERUtil.getUniqueId('drawer')
        the.element = element
        the.overlayElement = null
        the.name = the.element.getAttribute('data-beaver-drawer-name')
        the.shown = false
        the.lastWidth
        the.lastHeight
        the.toggleElement = null

        // Set initialized
        the.element.setAttribute('data-beaver-drawer', 'true')

        // Event Handlers
        _handlers()

        // Update Instance
        _update()

        // Bind Instance
        BEAVERUtil.data(the.element).set('drawer', the)
    }

    var _handlers = function () {
        var togglers = _getOption('toggle')
        var closers = _getOption('close')

        if (togglers !== null && togglers.length > 0) {
            BEAVERUtil.on(document.body, togglers, 'click', function (e) {
                e.preventDefault()

                the.toggleElement = this
                _toggle()
            })
        }

        if (closers !== null && closers.length > 0) {
            BEAVERUtil.on(document.body, closers, 'click', function (e) {
                e.preventDefault()

                the.closeElement = this
                _hide()
            })
        }
    }

    var _toggle = function () {
        if (
            BEAVEREventHandler.trigger(
                the.element,
                'beaver.drawer.toggle',
                the
            ) === false
        ) {
            return
        }

        if (the.shown === true) {
            _hide()
        } else {
            _show()
        }

        BEAVEREventHandler.trigger(the.element, 'beaver.drawer.toggled', the)
    }

    var _hide = function () {
        if (
            BEAVEREventHandler.trigger(
                the.element,
                'beaver.drawer.hide',
                the
            ) === false
        ) {
            return
        }

        the.shown = false

        _deleteOverlay()

        document.body.removeAttribute('data-beaver-drawer-' + the.name, 'on')
        document.body.removeAttribute('data-beaver-drawer')

        BEAVERUtil.removeClass(the.element, the.options.baseClass + '-on')

        if (the.toggleElement !== null) {
            BEAVERUtil.removeClass(the.toggleElement, 'active')
        }

        BEAVEREventHandler.trigger(
            the.element,
            'beaver.drawer.after.hidden',
            the
        ) === false
    }

    var _show = function () {
        if (
            BEAVEREventHandler.trigger(
                the.element,
                'beaver.drawer.show',
                the
            ) === false
        ) {
            return
        }

        the.shown = true

        _createOverlay()
        document.body.setAttribute('data-beaver-drawer-' + the.name, 'on')
        document.body.setAttribute('data-beaver-drawer', 'on')

        BEAVERUtil.addClass(the.element, the.options.baseClass + '-on')

        if (the.toggleElement !== null) {
            BEAVERUtil.addClass(the.toggleElement, 'active')
        }

        BEAVEREventHandler.trigger(the.element, 'beaver.drawer.shown', the)
    }

    var _update = function () {
        var width = _getWidth()
        var height = _getHeight()
        var direction = _getOption('direction')

        var top = _getOption('top')
        var bottom = _getOption('bottom')
        var start = _getOption('start')
        var end = _getOption('end')

        // Reset state
        if (
            BEAVERUtil.hasClass(the.element, the.options.baseClass + '-on') ===
                true &&
            String(
                document.body.getAttribute(
                    'data-beaver-drawer-' + the.name + '-'
                )
            ) === 'on'
        ) {
            the.shown = true
        } else {
            the.shown = false
        }

        // Activate/deactivate
        if (_getOption('activate') === true) {
            BEAVERUtil.addClass(the.element, the.options.baseClass)
            BEAVERUtil.addClass(
                the.element,
                the.options.baseClass + '-' + direction
            )

            if (width) {
                BEAVERUtil.css(the.element, 'width', width, true)
                the.lastWidth = width
            }

            if (height) {
                BEAVERUtil.css(the.element, 'height', height, true)
                the.lastHeight = height
            }

            if (top) {
                BEAVERUtil.css(the.element, 'top', top)
            }

            if (bottom) {
                BEAVERUtil.css(the.element, 'bottom', bottom)
            }

            if (start) {
                if (BEAVERUtil.isRTL()) {
                    BEAVERUtil.css(the.element, 'right', start)
                } else {
                    BEAVERUtil.css(the.element, 'left', start)
                }
            }

            if (end) {
                if (BEAVERUtil.isRTL()) {
                    BEAVERUtil.css(the.element, 'left', end)
                } else {
                    BEAVERUtil.css(the.element, 'right', end)
                }
            }
        } else {
            BEAVERUtil.removeClass(the.element, the.options.baseClass)
            BEAVERUtil.removeClass(
                the.element,
                the.options.baseClass + '-' + direction
            )

            BEAVERUtil.css(the.element, 'width', '')
            BEAVERUtil.css(the.element, 'height', '')

            if (top) {
                BEAVERUtil.css(the.element, 'top', '')
            }

            if (bottom) {
                BEAVERUtil.css(the.element, 'bottom', '')
            }

            if (start) {
                if (BEAVERUtil.isRTL()) {
                    BEAVERUtil.css(the.element, 'right', '')
                } else {
                    BEAVERUtil.css(the.element, 'left', '')
                }
            }

            if (end) {
                if (BEAVERUtil.isRTL()) {
                    BEAVERUtil.css(the.element, 'left', '')
                } else {
                    BEAVERUtil.css(the.element, 'right', '')
                }
            }

            _hide()
        }
    }

    var _createOverlay = function () {
        if (_getOption('overlay') === true) {
            the.overlayElement = document.createElement('DIV')

            BEAVERUtil.css(
                the.overlayElement,
                'z-index',
                BEAVERUtil.css(the.element, 'z-index') - 1
            ) // update

            document.body.append(the.overlayElement)

            BEAVERUtil.addClass(the.overlayElement, _getOption('overlay-class'))

            BEAVERUtil.addEvent(the.overlayElement, 'click', function (e) {
                e.preventDefault()

                if (_getOption('permanent') !== true) {
                    _hide()
                }
            })
        }
    }

    var _deleteOverlay = function () {
        if (the.overlayElement !== null) {
            BEAVERUtil.remove(the.overlayElement)
        }
    }

    var _getOption = function (name) {
        if (the.element.hasAttribute('data-beaver-drawer-' + name) === true) {
            var attr = the.element.getAttribute('data-beaver-drawer-' + name)
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

    var _getWidth = function () {
        var width = _getOption('width')

        if (width === 'auto') {
            width = BEAVERUtil.css(the.element, 'width')
        }

        return width
    }

    var _getHeight = function () {
        var height = _getOption('height')

        if (height === 'auto') {
            height = BEAVERUtil.css(the.element, 'height')
        }

        return height
    }

    var _destroy = function () {
        BEAVERUtil.data(the.element).remove('drawer')
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

    the.show = function () {
        return _show()
    }

    the.hide = function () {
        return _hide()
    }

    the.isShown = function () {
        return the.shown
    }

    the.update = function () {
        _update()
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
BEAVERDrawer.getInstance = function (element) {
    if (element !== null && BEAVERUtil.data(element).has('drawer')) {
        return BEAVERUtil.data(element).get('drawer')
    } else {
        return null
    }
}

// Hide all drawers and skip one if provided
BEAVERDrawer.hideAll = function (
    skip = null,
    selector = '[data-beaver-drawer="true"]'
) {
    var items = document.querySelectorAll(selector)

    if (items && items.length > 0) {
        for (var i = 0, len = items.length; i < len; i++) {
            var item = items[i]
            var drawer = BEAVERDrawer.getInstance(item)

            if (!drawer) {
                continue
            }

            if (skip) {
                if (item !== skip) {
                    drawer.hide()
                }
            } else {
                drawer.hide()
            }
        }
    }
}

// Update all drawers
BEAVERDrawer.updateAll = function (selector = '[data-beaver-drawer="true"]') {
    var items = document.querySelectorAll(selector)

    if (items && items.length > 0) {
        for (var i = 0, len = items.length; i < len; i++) {
            var drawer = BEAVERDrawer.getInstance(items[i])

            if (drawer) {
                drawer.update()
            }
        }
    }
}

// Create instances
BEAVERDrawer.createInstances = function (
    selector = '[data-beaver-drawer="true"]'
) {
    // Initialize Menus
    var elements = document.querySelectorAll(selector)

    if (elements && elements.length > 0) {
        for (var i = 0, len = elements.length; i < len; i++) {
            new BEAVERDrawer(elements[i])
        }
    }
}

// Toggle instances
BEAVERDrawer.handleShow = function () {
    // External drawer toggle handler
    BEAVERUtil.on(
        document.body,
        '[data-beaver-drawer-show="true"][data-beaver-drawer-target]',
        'click',
        function (e) {
            e.preventDefault()

            var element = document.querySelector(
                this.getAttribute('data-beaver-drawer-target')
            )

            if (element) {
                BEAVERDrawer.getInstance(element).show()
            }
        }
    )
}

// Handle escape key press
BEAVERDrawer.handleEscapeKey = function () {
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            //if esc key was not pressed in combination with ctrl or alt or shift
            const isNotCombinedKey = !(
                event.ctrlKey ||
                event.altKey ||
                event.shiftKey
            )
            if (isNotCombinedKey) {
                var elements = document.querySelectorAll(
                    '.drawer-on[data-beaver-drawer="true"]:not([data-beaver-drawer-escape="false"])'
                )
                var drawer

                if (elements && elements.length > 0) {
                    for (var i = 0, len = elements.length; i < len; i++) {
                        drawer = BEAVERDrawer.getInstance(elements[i])
                        if (drawer.isShown()) {
                            drawer.hide()
                        }
                    }
                }
            }
        }
    })
}

// Dismiss instances
BEAVERDrawer.handleDismiss = function () {
    // External drawer toggle handler
    BEAVERUtil.on(
        document.body,
        '[data-beaver-drawer-dismiss="true"]',
        'click',
        function (e) {
            var element = this.closest('[data-beaver-drawer="true"]')

            if (element) {
                var drawer = BEAVERDrawer.getInstance(element)
                if (drawer.isShown()) {
                    drawer.hide()
                }
            }
        }
    )
}

// Handle resize
BEAVERDrawer.handleResize = function () {
    // Window resize Handling
    window.addEventListener('resize', function () {
        var timer

        BEAVERUtil.throttle(
            timer,
            function () {
                // Locate and update drawer instances on window resize
                var elements = document.querySelectorAll(
                    '[data-beaver-drawer="true"]'
                )

                if (elements && elements.length > 0) {
                    for (var i = 0, len = elements.length; i < len; i++) {
                        var drawer = BEAVERDrawer.getInstance(elements[i])
                        if (drawer) {
                            drawer.update()
                        }
                    }
                }
            },
            200
        )
    })
}

// Global initialization
BEAVERDrawer.init = function () {
    BEAVERDrawer.createInstances()

    if (BEAVERDrawerHandlersInitialized === false) {
        BEAVERDrawer.handleResize()
        BEAVERDrawer.handleShow()
        BEAVERDrawer.handleDismiss()
        BEAVERDrawer.handleEscapeKey()

        BEAVERDrawerHandlersInitialized = true
    }
}

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BEAVERDrawer
}
