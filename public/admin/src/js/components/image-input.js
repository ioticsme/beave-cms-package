"use strict";

// Class definition
var BEAVEImageInput = function(element, options) {
    ////////////////////////////
    // ** Private Variables  ** //
    ////////////////////////////
    var the = this;

    if ( typeof element === "undefined" || element === null ) {
        return;
    }

    // Default Options
    var defaultOptions = {
        
    };

    ////////////////////////////
    // ** Private Methods  ** //
    ////////////////////////////

    var _construct = function() {
        if ( BEAVEUtil.data(element).has('image-input') === true ) {
            the = BEAVEUtil.data(element).get('image-input');
        } else {
            _init();
        }
    }

    var _init = function() {
        // Variables
        the.options = BEAVEUtil.deepExtend({}, defaultOptions, options);
        the.uid = BEAVEUtil.getUniqueId('image-input');

        // Elements
        the.element = element;
        the.inputElement = BEAVEUtil.find(element, 'input[type="file"]');
        the.wrapperElement = BEAVEUtil.find(element, '.image-input-wrapper');
        the.cancelElement = BEAVEUtil.find(element, '[data-beave-image-input-action="cancel"]');
        the.removeElement = BEAVEUtil.find(element, '[data-beave-image-input-action="remove"]');
        the.hiddenElement = BEAVEUtil.find(element, 'input[type="hidden"]');
        the.src = BEAVEUtil.css(the.wrapperElement, 'backgroundImage');

        // Set initialized
        the.element.setAttribute('data-beave-image-input', 'true');

        // Event Handlers
        _handlers();

        // Bind Instance
        BEAVEUtil.data(the.element).set('image-input', the);
    }

    // Init Event Handlers
    var _handlers = function() {
        BEAVEUtil.addEvent(the.inputElement, 'change', _change);
        BEAVEUtil.addEvent(the.cancelElement, 'click', _cancel);
        BEAVEUtil.addEvent(the.removeElement, 'click', _remove);
    }

    // Event Handlers
    var _change = function(e) {
        e.preventDefault();

        if ( the.inputElement !== null && the.inputElement.files && the.inputElement.files[0] ) {
            // Fire change event
            if ( BEAVEEventHandler.trigger(the.element, 'beave.imageinput.change', the) === false ) {
                return;
            }

            var reader = new FileReader();

            reader.onload = function(e) {
                BEAVEUtil.css(the.wrapperElement, 'background-image', 'url('+ e.target.result +')');
            }

            reader.readAsDataURL(the.inputElement.files[0]);

            the.element.classList.add('image-input-changed');
            the.element.classList.remove('image-input-empty');

            // Fire removed event
            BEAVEEventHandler.trigger(the.element, 'beave.imageinput.changed', the);
        }
    }

    var _cancel = function(e) {
        e.preventDefault();

        // Fire cancel event
        if ( BEAVEEventHandler.trigger(the.element, 'beave.imageinput.cancel', the) === false ) {
            return;
        }

        the.element.classList.remove('image-input-changed');
        the.element.classList.remove('image-input-empty');

        if (the.src === 'none') {   
            BEAVEUtil.css(the.wrapperElement, 'background-image', '');
            the.element.classList.add('image-input-empty');
        } else {
            BEAVEUtil.css(the.wrapperElement, 'background-image', the.src);
        }
        
        the.inputElement.value = "";

        if ( the.hiddenElement !== null ) {
            the.hiddenElement.value = "0";
        }

        // Fire canceled event
        BEAVEEventHandler.trigger(the.element, 'beave.imageinput.canceled', the);
    }

    var _remove = function(e) {
        e.preventDefault();

        // Fire remove event
        if ( BEAVEEventHandler.trigger(the.element, 'beave.imageinput.remove', the) === false ) {
            return;
        }

        the.element.classList.remove('image-input-changed');
        the.element.classList.add('image-input-empty');

        BEAVEUtil.css(the.wrapperElement, 'background-image', "none");
        the.inputElement.value = "";

        if ( the.hiddenElement !== null ) {
            the.hiddenElement.value = "1";
        }

        // Fire removed event
        BEAVEEventHandler.trigger(the.element, 'beave.imageinput.removed', the);
    }

    var _destroy = function() {
        BEAVEUtil.data(the.element).remove('image-input');
    }

    // Construct Class
    _construct();

    ///////////////////////
    // ** Public API  ** //
    ///////////////////////

    // Plugin API
    the.getInputElement = function() {
        return the.inputElement;
    }

    the.getElement = function() {
        return the.element;
    }
    
    the.destroy = function() {
        return _destroy();
    }

    // Event API
    the.on = function(name, handler) {
        return BEAVEEventHandler.on(the.element, name, handler);
    }

    the.one = function(name, handler) {
        return BEAVEEventHandler.one(the.element, name, handler);
    }

    the.off = function(name, handlerId) {
        return BEAVEEventHandler.off(the.element, name, handlerId);
    }

    the.trigger = function(name, event) {
        return BEAVEEventHandler.trigger(the.element, name, event, the, event);
    }
};

// Static methods
BEAVEImageInput.getInstance = function(element) {
    if ( element !== null && BEAVEUtil.data(element).has('image-input') ) {
        return BEAVEUtil.data(element).get('image-input');
    } else {
        return null;
    }
}

// Create instances
BEAVEImageInput.createInstances = function(selector = '[data-beave-image-input]') {
    // Initialize Menus
    var elements = document.querySelectorAll(selector);

    if ( elements && elements.length > 0 ) {
        for (var i = 0, len = elements.length; i < len; i++) {
            new BEAVEImageInput(elements[i]);
        }
    }
}

// Global initialization
BEAVEImageInput.init = function() {
    BEAVEImageInput.createInstances();
};

// Webpack Support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BEAVEImageInput;
}
