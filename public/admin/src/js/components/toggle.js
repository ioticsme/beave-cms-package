"use strict";

// Class definition
var BEAVEToggle = function(element, options) {
    ////////////////////////////
    // ** Private variables  ** //
    ////////////////////////////
    var the = this;

    if (!element) {
        return;
    }

    // Default Options
    var defaultOptions = {
        saveState: true
    };

    ////////////////////////////
    // ** Private methods  ** //
    ////////////////////////////

    var _construct = function() {
        if ( BEAVEUtil.data(element).has('toggle') === true ) {
            the = BEAVEUtil.data(element).get('toggle');
        } else {
            _init();
        }
    }

    var _init = function() {
        // Variables
        the.options = BEAVEUtil.deepExtend({}, defaultOptions, options);
        the.uid = BEAVEUtil.getUniqueId('toggle');

        // Elements
        the.element = element;

        the.target = document.querySelector(the.element.getAttribute('data-beave-toggle-target')) ? document.querySelector(the.element.getAttribute('data-beave-toggle-target')) : the.element;
        the.state = the.element.hasAttribute('data-beave-toggle-state') ? the.element.getAttribute('data-beave-toggle-state') : '';
        the.mode = the.element.hasAttribute('data-beave-toggle-mode') ? the.element.getAttribute('data-beave-toggle-mode') : '';
        the.attribute = 'data-beave-' + the.element.getAttribute('data-beave-toggle-name');

        // Event Handlers
        _handlers();

        // Bind Instance
        BEAVEUtil.data(the.element).set('toggle', the);
    }

    var _handlers = function() {
        BEAVEUtil.addEvent(the.element, 'click', function(e) {
            e.preventDefault();

            if ( the.mode !== '' ) {
                if ( the.mode === 'off' && _isEnabled() === false ) {
                    _toggle();
                } else if ( the.mode === 'on' && _isEnabled() === true ) {
                    _toggle();
                }
            } else {
                _toggle();
            }
        });
    }

    // Event handlers
    var _toggle = function() {
        // Trigger "after.toggle" event
        BEAVEEventHandler.trigger(the.element, 'beave.toggle.change', the);

        if ( _isEnabled() ) {
            _disable();
        } else {
            _enable();
        }       

        // Trigger "before.toggle" event
        BEAVEEventHandler.trigger(the.element, 'beave.toggle.changed', the);

        return the;
    }

    var _enable = function() {
        if ( _isEnabled() === true ) {
            return;
        }

        BEAVEEventHandler.trigger(the.element, 'beave.toggle.enable', the);

        the.target.setAttribute(the.attribute, 'on');

        if (the.state.length > 0) {
            the.element.classList.add(the.state);
        }        

        if ( typeof BEAVECookie !== 'undefined' && the.options.saveState === true ) {
            BEAVECookie.set(the.attribute, 'on');
        }

        BEAVEEventHandler.trigger(the.element, 'beave.toggle.enabled', the);

        return the;
    }

    var _disable = function() {
        if ( _isEnabled() === false ) {
            return;
        }

        BEAVEEventHandler.trigger(the.element, 'beave.toggle.disable', the);

        the.target.removeAttribute(the.attribute);

        if (the.state.length > 0) {
            the.element.classList.remove(the.state);
        } 

        if ( typeof BEAVECookie !== 'undefined' && the.options.saveState === true ) {
            BEAVECookie.remove(the.attribute);
        }

        BEAVEEventHandler.trigger(the.element, 'beave.toggle.disabled', the);

        return the;
    }

    var _isEnabled = function() {
        return (String(the.target.getAttribute(the.attribute)).toLowerCase() === 'on');
    }

    var _destroy = function() {
        BEAVEUtil.data(the.element).remove('toggle');
    }

    // Construct class
    _construct();

    ///////////////////////
    // ** Public API  ** //
    ///////////////////////

    // Plugin API
    the.toggle = function() {
        return _toggle();
    }

    the.enable = function() {
        return _enable();
    }

    the.disable = function() {
        return _disable();
    }

    the.isEnabled = function() {
        return _isEnabled();
    }

    the.goElement = function() {
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
BEAVEToggle.getInstance = function(element) {
    if ( element !== null && BEAVEUtil.data(element).has('toggle') ) {
        return BEAVEUtil.data(element).get('toggle');
    } else {
        return null;
    }
}

// Create instances
BEAVEToggle.createInstances = function(selector = '[data-beave-toggle]') {
    // Get instances
    var elements = document.body.querySelectorAll(selector);

    if ( elements && elements.length > 0 ) {
        for (var i = 0, len = elements.length; i < len; i++) {
            // Initialize instances
            new BEAVEToggle(elements[i]);
        }
    }
}

// Global initialization
BEAVEToggle.init = function() {
    BEAVEToggle.createInstances();
};

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BEAVEToggle;
}