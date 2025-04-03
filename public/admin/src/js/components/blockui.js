'use strict'

// Class definition
var BEAVERBlockUI = function (element, options) {
    //////////////////////////////
    // ** Private variables  ** //
    //////////////////////////////
    var the = this

    if (typeof element === 'undefined' || element === null) {
        return
    }

    // Default options
    var defaultOptions = {
        zIndex: false,
        overlayClass: '',
        overflow: 'hidden',
        message: '<span class="spinner-border text-primary"></span>',
    }

    ////////////////////////////
    // ** Private methods  ** //
    ////////////////////////////

    var _construct = function () {
        if (BEAVERUtil.data(element).has('blockui')) {
            the = BEAVERUtil.data(element).get('blockui')
        } else {
            _init()
        }
    }

    var _init = function () {
        // Variables
        the.options = BEAVERUtil.deepExtend({}, defaultOptions, options)
        the.element = element
        the.overlayElement = null
        the.blocked = false
        the.positionChanged = false
        the.overflowChanged = false

        // Bind Instance
        BEAVERUtil.data(the.element).set('blockui', the)
    }

    var _block = function () {
        if (
            BEAVEREventHandler.trigger(
                the.element,
                'beaver.blockui.block',
                the
            ) === false
        ) {
            return
        }

        var isPage = the.element.tagName === 'BODY'

        var position = BEAVERUtil.css(the.element, 'position')
        var overflow = BEAVERUtil.css(the.element, 'overflow')
        var zIndex = isPage ? 10000 : 1

        if (the.options.zIndex > 0) {
            zIndex = the.options.zIndex
        } else {
            if (BEAVERUtil.css(the.element, 'z-index') != 'auto') {
                zIndex = BEAVERUtil.css(the.element, 'z-index')
            }
        }

        the.element.classList.add('blockui')

        if (
            position === 'absolute' ||
            position === 'relative' ||
            position === 'fixed'
        ) {
            BEAVERUtil.css(the.element, 'position', 'relative')
            the.positionChanged = true
        }

        if (the.options.overflow === 'hidden' && overflow === 'visible') {
            BEAVERUtil.css(the.element, 'overflow', 'hidden')
            the.overflowChanged = true
        }

        the.overlayElement = document.createElement('DIV')
        the.overlayElement.setAttribute(
            'class',
            'blockui-overlay ' + the.options.overlayClass
        )

        the.overlayElement.innerHTML = the.options.message

        BEAVERUtil.css(the.overlayElement, 'z-index', zIndex)

        the.element.append(the.overlayElement)
        the.blocked = true

        BEAVEREventHandler.trigger(
            the.element,
            'beaver.blockui.after.blocked',
            the
        )
    }

    var _release = function () {
        if (
            BEAVEREventHandler.trigger(
                the.element,
                'beaver.blockui.release',
                the
            ) === false
        ) {
            return
        }

        the.element.classList.add('blockui')

        if (the.positionChanged) {
            BEAVERUtil.css(the.element, 'position', '')
        }

        if (the.overflowChanged) {
            BEAVERUtil.css(the.element, 'overflow', '')
        }

        if (the.overlayElement) {
            BEAVERUtil.remove(the.overlayElement)
        }

        the.blocked = false

        BEAVEREventHandler.trigger(the.element, 'beaver.blockui.released', the)
    }

    var _isBlocked = function () {
        return the.blocked
    }

    var _destroy = function () {
        BEAVERUtil.data(the.element).remove('blockui')
    }

    // Construct class
    _construct()

    ///////////////////////
    // ** Public API  ** //
    ///////////////////////

    // Plugin API
    the.block = function () {
        _block()
    }

    the.release = function () {
        _release()
    }

    the.isBlocked = function () {
        return _isBlocked()
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
BEAVERBlockUI.getInstance = function (element) {
    if (element !== null && BEAVERUtil.data(element).has('blockui')) {
        return BEAVERUtil.data(element).get('blockui')
    } else {
        return null
    }
}

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BEAVERBlockUI
}
