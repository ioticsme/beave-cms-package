'use strict'

var BEAVERStickyHandlersInitialized = false

// Class definition
var BEAVERSticky = function (element, options) {
    ////////////////////////////
    // ** Private Variables  ** //
    ////////////////////////////
    var the = this

    if (typeof element === 'undefined' || element === null) {
        return
    }

    // Default Options
    var defaultOptions = {
        offset: 200,
        reverse: false,
        release: null,
        animation: true,
        animationSpeed: '0.3s',
        animationClass: 'animation-slide-in-down',
    }
    ////////////////////////////
    // ** Private Methods  ** //
    ////////////////////////////

    var _construct = function () {
        if (BEAVERUtil.data(element).has('sticky') === true) {
            the = BEAVERUtil.data(element).get('sticky')
        } else {
            _init()
        }
    }

    var _init = function () {
        the.element = element
        the.options = BEAVERUtil.deepExtend({}, defaultOptions, options)
        the.uid = BEAVERUtil.getUniqueId('sticky')
        the.name = the.element.getAttribute('data-beaver-sticky-name')
        the.attributeName = 'data-beaver-sticky-' + the.name
        the.attributeName2 = 'data-beaver-' + the.name
        the.eventTriggerState = true
        the.lastScrollTop = 0
        the.scrollHandler

        // Set initialized
        the.element.setAttribute('data-beaver-sticky', 'true')

        // Event Handlers
        window.addEventListener('scroll', _scroll)

        // Initial Launch
        _scroll()

        // Bind Instance
        BEAVERUtil.data(the.element).set('sticky', the)
    }

    var _scroll = function (e) {
        var offset = _getOption('offset')
        var release = _getOption('release')
        var reverse = _getOption('reverse')
        var st
        var attrName
        var diff

        // Exit if false
        if (offset === false) {
            _disable()
            return
        }

        offset = parseInt(offset)
        release = release ? document.querySelector(release) : null

        st = BEAVERUtil.getScrollTop()
        diff =
            document.documentElement.scrollHeight -
            window.innerHeight -
            BEAVERUtil.getScrollTop()

        var proceed = !release || release.offsetTop - release.clientHeight > st

        if (reverse === true) {
            // Release on reverse scroll mode
            if (st > offset && proceed) {
                if (document.body.hasAttribute(the.attributeName) === false) {
                    if (_enable() === false) {
                        return
                    }

                    document.body.setAttribute(the.attributeName, 'on')
                    document.body.setAttribute(the.attributeName2, 'on')
                    the.element.setAttribute(
                        'data-beaver-sticky-enabled',
                        'true'
                    )
                }

                if (the.eventTriggerState === true) {
                    BEAVEREventHandler.trigger(
                        the.element,
                        'beaver.sticky.on',
                        the
                    )
                    BEAVEREventHandler.trigger(
                        the.element,
                        'beaver.sticky.change',
                        the
                    )

                    the.eventTriggerState = false
                }
            } else {
                // Back scroll mode
                if (document.body.hasAttribute(the.attributeName) === true) {
                    _disable()
                    document.body.removeAttribute(the.attributeName)
                    document.body.removeAttribute(the.attributeName2)
                    the.element.removeAttribute('data-beaver-sticky-enabled')
                }

                if (the.eventTriggerState === false) {
                    BEAVEREventHandler.trigger(
                        the.element,
                        'beaver.sticky.off',
                        the
                    )
                    BEAVEREventHandler.trigger(
                        the.element,
                        'beaver.sticky.change',
                        the
                    )
                    the.eventTriggerState = true
                }
            }

            the.lastScrollTop = st
        } else {
            // Classic scroll mode
            if (st > offset && proceed) {
                if (document.body.hasAttribute(the.attributeName) === false) {
                    if (_enable() === false) {
                        return
                    }

                    document.body.setAttribute(the.attributeName, 'on')
                    document.body.setAttribute(the.attributeName2, 'on')
                    the.element.setAttribute(
                        'data-beaver-sticky-enabled',
                        'true'
                    )
                }

                if (the.eventTriggerState === true) {
                    BEAVEREventHandler.trigger(
                        the.element,
                        'beaver.sticky.on',
                        the
                    )
                    BEAVEREventHandler.trigger(
                        the.element,
                        'beaver.sticky.change',
                        the
                    )
                    the.eventTriggerState = false
                }
            } else {
                // back scroll mode
                if (document.body.hasAttribute(the.attributeName) === true) {
                    _disable()
                    document.body.removeAttribute(the.attributeName)
                    document.body.removeAttribute(the.attributeName2)
                    the.element.removeAttribute('data-beaver-sticky-enabled')
                }

                if (the.eventTriggerState === false) {
                    BEAVEREventHandler.trigger(
                        the.element,
                        'beaver.sticky.off',
                        the
                    )
                    BEAVEREventHandler.trigger(
                        the.element,
                        'beaver.sticky.change',
                        the
                    )
                    the.eventTriggerState = true
                }
            }
        }

        if (release) {
            if (release.offsetTop - release.clientHeight > st) {
                the.element.setAttribute('data-beaver-sticky-released', 'true')
            } else {
                the.element.removeAttribute('data-beaver-sticky-released')
            }
        }
    }

    var _enable = function (update) {
        var top = _getOption('top')
        top = top ? parseInt(top) : 0

        var left = _getOption('left')
        var right = _getOption('right')
        var width = _getOption('width')
        var zindex = _getOption('zindex')
        var dependencies = _getOption('dependencies')
        var classes = _getOption('class')

        var height = _calculateHeight()
        var heightOffset = _getOption('height-offset')
        heightOffset = heightOffset ? parseInt(heightOffset) : 0

        if (height + heightOffset + top > BEAVERUtil.getViewPort().height) {
            return false
        }

        if (update !== true && _getOption('animation') === true) {
            BEAVERUtil.css(
                the.element,
                'animationDuration',
                _getOption('animationSpeed')
            )
            BEAVERUtil.animateClass(
                the.element,
                'animation ' + _getOption('animationClass')
            )
        }

        if (classes !== null) {
            BEAVERUtil.addClass(the.element, classes)
        }

        if (zindex !== null) {
            BEAVERUtil.css(the.element, 'z-index', zindex)
            BEAVERUtil.css(the.element, 'position', 'fixed')
        }

        if (top >= 0) {
            BEAVERUtil.css(the.element, 'top', String(top) + 'px')
        }

        if (width !== null) {
            if (width['target']) {
                var targetElement = document.querySelector(width['target'])
                if (targetElement) {
                    width = BEAVERUtil.css(targetElement, 'width')
                }
            }

            BEAVERUtil.css(the.element, 'width', width)
        }

        if (left !== null) {
            if (String(left).toLowerCase() === 'auto') {
                var offsetLeft = BEAVERUtil.offset(the.element).left

                if (offsetLeft >= 0) {
                    BEAVERUtil.css(
                        the.element,
                        'left',
                        String(offsetLeft) + 'px'
                    )
                }
            } else {
                BEAVERUtil.css(the.element, 'left', left)
            }
        }

        if (right !== null) {
            BEAVERUtil.css(the.element, 'right', right)
        }

        // Height dependencies
        if (dependencies !== null) {
            var dependencyElements = document.querySelectorAll(dependencies)

            if (dependencyElements && dependencyElements.length > 0) {
                for (var i = 0, len = dependencyElements.length; i < len; i++) {
                    BEAVERUtil.css(
                        dependencyElements[i],
                        'padding-top',
                        String(height) + 'px'
                    )
                }
            }
        }
    }

    var _disable = function () {
        BEAVERUtil.css(the.element, 'top', '')
        BEAVERUtil.css(the.element, 'width', '')
        BEAVERUtil.css(the.element, 'left', '')
        BEAVERUtil.css(the.element, 'right', '')
        BEAVERUtil.css(the.element, 'z-index', '')
        BEAVERUtil.css(the.element, 'position', '')

        var dependencies = _getOption('dependencies')
        var classes = _getOption('class')

        if (classes !== null) {
            BEAVERUtil.removeClass(the.element, classes)
        }

        // Height dependencies
        if (dependencies !== null) {
            var dependencyElements = document.querySelectorAll(dependencies)

            if (dependencyElements && dependencyElements.length > 0) {
                for (var i = 0, len = dependencyElements.length; i < len; i++) {
                    BEAVERUtil.css(dependencyElements[i], 'padding-top', '')
                }
            }
        }
    }

    var _check = function () {}

    var _calculateHeight = function () {
        var height = parseFloat(BEAVERUtil.css(the.element, 'height'))

        height = height + parseFloat(BEAVERUtil.css(the.element, 'margin-top'))
        height =
            height + parseFloat(BEAVERUtil.css(the.element, 'margin-bottom'))

        if (BEAVERUtil.css(element, 'border-top')) {
            height =
                height + parseFloat(BEAVERUtil.css(the.element, 'border-top'))
        }

        if (BEAVERUtil.css(element, 'border-bottom')) {
            height =
                height +
                parseFloat(BEAVERUtil.css(the.element, 'border-bottom'))
        }

        return height
    }

    var _getOption = function (name) {
        if (the.element.hasAttribute('data-beaver-sticky-' + name) === true) {
            var attr = the.element.getAttribute('data-beaver-sticky-' + name)
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
        window.removeEventListener('scroll', _scroll)
        BEAVERUtil.data(the.element).remove('sticky')
    }

    // Construct Class
    _construct()

    ///////////////////////
    // ** Public API  ** //
    ///////////////////////

    // Methods
    the.update = function () {
        if (document.body.hasAttribute(the.attributeName) === true) {
            _disable()
            document.body.removeAttribute(the.attributeName)
            document.body.removeAttribute(the.attributeName2)
            _enable(true)
            document.body.setAttribute(the.attributeName, 'on')
            document.body.setAttribute(the.attributeName2, 'on')
        }
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
BEAVERSticky.getInstance = function (element) {
    if (element !== null && BEAVERUtil.data(element).has('sticky')) {
        return BEAVERUtil.data(element).get('sticky')
    } else {
        return null
    }
}

// Create instances
BEAVERSticky.createInstances = function (
    selector = '[data-beaver-sticky="true"]'
) {
    // Initialize Menus
    var elements = document.body.querySelectorAll(selector)
    var sticky

    if (elements && elements.length > 0) {
        for (var i = 0, len = elements.length; i < len; i++) {
            sticky = new BEAVERSticky(elements[i])
        }
    }
}

// Window resize handler
BEAVERSticky.handleResize = function () {
    window.addEventListener('resize', function () {
        var timer

        BEAVERUtil.throttle(
            timer,
            function () {
                // Locate and update Offcanvas instances on window resize
                var elements = document.body.querySelectorAll(
                    '[data-beaver-sticky="true"]'
                )

                if (elements && elements.length > 0) {
                    for (var i = 0, len = elements.length; i < len; i++) {
                        var sticky = BEAVERSticky.getInstance(elements[i])
                        if (sticky) {
                            sticky.update()
                        }
                    }
                }
            },
            200
        )
    })
}

// Global initialization
BEAVERSticky.init = function () {
    BEAVERSticky.createInstances()

    if (BEAVERStickyHandlersInitialized === false) {
        BEAVERSticky.handleResize()
        BEAVERStickyHandlersInitialized = true
    }
}

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BEAVERSticky
}
