"use strict";

var BEAVESwapperHandlersInitialized = false;

// Class definition
var BEAVESwapper = function(element, options) {
    ////////////////////////////
    // ** Private Variables  ** //
    ////////////////////////////
    var the = this;

    if ( typeof element === "undefined" || element === null ) {
        return;
    }

    // Default Options
    var defaultOptions = {
        mode: 'append'
    };

    ////////////////////////////
    // ** Private Methods  ** //
    ////////////////////////////

    var _construct = function() {
        if ( BEAVEUtil.data(element).has('swapper') === true ) {
            the = BEAVEUtil.data(element).get('swapper');
        } else {
            _init();
        }
    }

    var _init = function() {
        the.element = element;
        the.options = BEAVEUtil.deepExtend({}, defaultOptions, options);

        // Set initialized
        the.element.setAttribute('data-beave-swapper', 'true');

        // Initial update
        _update();

        // Bind Instance
        BEAVEUtil.data(the.element).set('swapper', the);
    }

    var _update = function(e) {
        var parentSelector = _getOption('parent');

        var mode = _getOption('mode');
        var parentElement = parentSelector ? document.querySelector(parentSelector) : null;
       

        if (parentElement && element.parentNode !== parentElement) {
            if (mode === 'prepend') {
                parentElement.prepend(element);
            } else if (mode === 'append') {
                parentElement.append(element);
            }
        }
    }

    var _getOption = function(name) {
        if ( the.element.hasAttribute('data-beave-swapper-' + name) === true ) {
            var attr = the.element.getAttribute('data-beave-swapper-' + name);
            var value = BEAVEUtil.getResponsiveValue(attr);

            if ( value !== null && String(value) === 'true' ) {
                value = true;
            } else if ( value !== null && String(value) === 'false' ) {
                value = false;
            }

            return value;
        } else {
            var optionName = BEAVEUtil.snakeToCamel(name);

            if ( the.options[optionName] ) {
                return BEAVEUtil.getResponsiveValue(the.options[optionName]);
            } else {
                return null;
            }
        }
    }

    var _destroy = function() {
        BEAVEUtil.data(the.element).remove('swapper');
    }

    // Construct Class
    _construct();

    ///////////////////////
    // ** Public API  ** //
    ///////////////////////

    // Methods
    the.update = function() {
        _update();
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
BEAVESwapper.getInstance = function(element) {
    if ( element !== null && BEAVEUtil.data(element).has('swapper') ) {
        return BEAVEUtil.data(element).get('swapper');
    } else {
        return null;
    }
}

// Create instances
BEAVESwapper.createInstances = function(selector = '[data-beave-swapper="true"]') {
    // Initialize Menus
    var elements = document.querySelectorAll(selector);
    var swapper;

    if ( elements && elements.length > 0 ) {
        for (var i = 0, len = elements.length; i < len; i++) {
            swapper = new BEAVESwapper(elements[i]);
        }
    }
}

// Window resize handler
BEAVESwapper.handleResize = function() {
    window.addEventListener('resize', function() {
        var timer;
    
        BEAVEUtil.throttle(timer, function() {
            // Locate and update Offcanvas instances on window resize
            var elements = document.querySelectorAll('[data-beave-swapper="true"]');
    
            if ( elements && elements.length > 0 ) {
                for (var i = 0, len = elements.length; i < len; i++) {
                    var swapper = BEAVESwapper.getInstance(elements[i]);
                    if (swapper) {
                        swapper.update();
                    }                
                }
            }
        }, 200);
    });
};

// Global initialization
BEAVESwapper.init = function() {
    BEAVESwapper.createInstances();

    if (BEAVESwapperHandlersInitialized === false) {
        BEAVESwapper.handleResize();
        BEAVESwapperHandlersInitialized = true;
    }
};

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BEAVESwapper;
}
