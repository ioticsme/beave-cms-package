'use strict'

// Class definition
var BEAVERFeedback = function (options) {
    ////////////////////////////
    // ** Private Variables  ** //
    ////////////////////////////
    var the = this

    // Default options
    var defaultOptions = {
        width: 100,
        placement: 'top-center',
        content: '',
        type: 'popup',
    }

    ////////////////////////////
    // ** Private methods  ** //
    ////////////////////////////

    var _construct = function () {
        _init()
    }

    var _init = function () {
        // Variables
        the.options = BEAVERUtil.deepExtend({}, defaultOptions, options)
        the.uid = BEAVERUtil.getUniqueId('feedback')
        the.element
        the.shown = false

        // Event Handlers
        _handlers()

        // Bind Instance
        BEAVERUtil.data(the.element).set('feedback', the)
    }

    var _handlers = function () {
        BEAVERUtil.addEvent(the.element, 'click', function (e) {
            e.preventDefault()

            _go()
        })
    }

    var _show = function () {
        if (
            BEAVEREventHandler.trigger(
                the.element,
                'beaver.feedback.show',
                the
            ) === false
        ) {
            return
        }

        if (the.options.type === 'popup') {
            _showPopup()
        }

        BEAVEREventHandler.trigger(the.element, 'beaver.feedback.shown', the)

        return the
    }

    var _hide = function () {
        if (
            BEAVEREventHandler.trigger(
                the.element,
                'beaver.feedback.hide',
                the
            ) === false
        ) {
            return
        }

        if (the.options.type === 'popup') {
            _hidePopup()
        }

        the.shown = false

        BEAVEREventHandler.trigger(the.element, 'beaver.feedback.hidden', the)

        return the
    }

    var _showPopup = function () {
        the.element = document.createElement('DIV')

        BEAVERUtil.addClass(the.element, 'feedback feedback-popup')
        BEAVERUtil.setHTML(the.element, the.options.content)

        if (the.options.placement == 'top-center') {
            _setPopupTopCenterPosition()
        }

        document.body.appendChild(the.element)

        BEAVERUtil.addClass(the.element, 'feedback-shown')

        the.shown = true
    }

    var _setPopupTopCenterPosition = function () {
        var width = BEAVERUtil.getResponsiveValue(the.options.width)
        var height = BEAVERUtil.css(the.element, 'height')

        BEAVERUtil.addClass(the.element, 'feedback-top-center')

        BEAVERUtil.css(the.element, 'width', width)
        BEAVERUtil.css(the.element, 'left', '50%')
        BEAVERUtil.css(the.element, 'top', '-' + height)
    }

    var _hidePopup = function () {
        the.element.remove()
    }

    var _destroy = function () {
        BEAVERUtil.data(the.element).remove('feedback')
    }

    // Construct class
    _construct()

    ///////////////////////
    // ** Public API  ** //
    ///////////////////////

    // Plugin API
    the.show = function () {
        return _show()
    }

    the.hide = function () {
        return _hide()
    }

    the.isShown = function () {
        return the.shown
    }

    the.getElement = function () {
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

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BEAVERFeedback
}
