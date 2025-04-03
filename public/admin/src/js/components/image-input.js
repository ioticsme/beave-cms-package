'use strict'

// Class definition
var BEAVERImageInput = function (element, options) {
    ////////////////////////////
    // ** Private Variables  ** //
    ////////////////////////////
    var the = this

    if (typeof element === 'undefined' || element === null) {
        return
    }

    // Default Options
    var defaultOptions = {}

    ////////////////////////////
    // ** Private Methods  ** //
    ////////////////////////////

    var _construct = function () {
        if (BEAVERUtil.data(element).has('image-input') === true) {
            the = BEAVERUtil.data(element).get('image-input')
        } else {
            _init()
        }
    }

    var _init = function () {
        // Variables
        the.options = BEAVERUtil.deepExtend({}, defaultOptions, options)
        the.uid = BEAVERUtil.getUniqueId('image-input')

        // Elements
        the.element = element
        the.inputElement = BEAVERUtil.find(element, 'input[type="file"]')
        the.wrapperElement = BEAVERUtil.find(element, '.image-input-wrapper')
        the.cancelElement = BEAVERUtil.find(
            element,
            '[data-beaver-image-input-action="cancel"]'
        )
        the.removeElement = BEAVERUtil.find(
            element,
            '[data-beaver-image-input-action="remove"]'
        )
        the.hiddenElement = BEAVERUtil.find(element, 'input[type="hidden"]')
        the.src = BEAVERUtil.css(the.wrapperElement, 'backgroundImage')

        // Set initialized
        the.element.setAttribute('data-beaver-image-input', 'true')

        // Event Handlers
        _handlers()

        // Bind Instance
        BEAVERUtil.data(the.element).set('image-input', the)
    }

    // Init Event Handlers
    var _handlers = function () {
        BEAVERUtil.addEvent(the.inputElement, 'change', _change)
        BEAVERUtil.addEvent(the.cancelElement, 'click', _cancel)
        BEAVERUtil.addEvent(the.removeElement, 'click', _remove)
    }

    // Event Handlers
    var _change = function (e) {
        e.preventDefault()

        if (
            the.inputElement !== null &&
            the.inputElement.files &&
            the.inputElement.files[0]
        ) {
            // Fire change event
            if (
                BEAVEREventHandler.trigger(
                    the.element,
                    'beaver.imageinput.change',
                    the
                ) === false
            ) {
                return
            }

            var reader = new FileReader()

            reader.onload = function (e) {
                BEAVERUtil.css(
                    the.wrapperElement,
                    'background-image',
                    'url(' + e.target.result + ')'
                )
            }

            reader.readAsDataURL(the.inputElement.files[0])

            the.element.classList.add('image-input-changed')
            the.element.classList.remove('image-input-empty')

            // Fire removed event
            BEAVEREventHandler.trigger(
                the.element,
                'beaver.imageinput.changed',
                the
            )
        }
    }

    var _cancel = function (e) {
        e.preventDefault()

        // Fire cancel event
        if (
            BEAVEREventHandler.trigger(
                the.element,
                'beaver.imageinput.cancel',
                the
            ) === false
        ) {
            return
        }

        the.element.classList.remove('image-input-changed')
        the.element.classList.remove('image-input-empty')

        if (the.src === 'none') {
            BEAVERUtil.css(the.wrapperElement, 'background-image', '')
            the.element.classList.add('image-input-empty')
        } else {
            BEAVERUtil.css(the.wrapperElement, 'background-image', the.src)
        }

        the.inputElement.value = ''

        if (the.hiddenElement !== null) {
            the.hiddenElement.value = '0'
        }

        // Fire canceled event
        BEAVEREventHandler.trigger(
            the.element,
            'beaver.imageinput.canceled',
            the
        )
    }

    var _remove = function (e) {
        e.preventDefault()

        // Fire remove event
        if (
            BEAVEREventHandler.trigger(
                the.element,
                'beaver.imageinput.remove',
                the
            ) === false
        ) {
            return
        }

        the.element.classList.remove('image-input-changed')
        the.element.classList.add('image-input-empty')

        BEAVERUtil.css(the.wrapperElement, 'background-image', 'none')
        the.inputElement.value = ''

        if (the.hiddenElement !== null) {
            the.hiddenElement.value = '1'
        }

        // Fire removed event
        BEAVEREventHandler.trigger(
            the.element,
            'beaver.imageinput.removed',
            the
        )
    }

    var _destroy = function () {
        BEAVERUtil.data(the.element).remove('image-input')
    }

    // Construct Class
    _construct()

    ///////////////////////
    // ** Public API  ** //
    ///////////////////////

    // Plugin API
    the.getInputElement = function () {
        return the.inputElement
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

// Static methods
BEAVERImageInput.getInstance = function (element) {
    if (element !== null && BEAVERUtil.data(element).has('image-input')) {
        return BEAVERUtil.data(element).get('image-input')
    } else {
        return null
    }
}

// Create instances
BEAVERImageInput.createInstances = function (
    selector = '[data-beaver-image-input]'
) {
    // Initialize Menus
    var elements = document.querySelectorAll(selector)

    if (elements && elements.length > 0) {
        for (var i = 0, len = elements.length; i < len; i++) {
            new BEAVERImageInput(elements[i])
        }
    }
}

// Global initialization
BEAVERImageInput.init = function () {
    BEAVERImageInput.createInstances()
}

// Webpack Support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BEAVERImageInput
}
