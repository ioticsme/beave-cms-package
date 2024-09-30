"use strict";

// Class definition
var BEAVEScrolltop = function(element, options) {
    ////////////////////////////
    // ** Private variables  ** //
    ////////////////////////////
    var the = this;

    if ( typeof element === "undefined" || element === null ) {
        return;
    }

    // Default options
    var defaultOptions = {
        offset: 300,
        speed: 600
    };

    ////////////////////////////
    // ** Private methods  ** //
    ////////////////////////////

    var _construct = function() {
        if (BEAVEUtil.data(element).has('scrolltop')) {
            the = BEAVEUtil.data(element).get('scrolltop');
        } else {
            _init();
        }
    }

    var _init = function() {
        // Variables
        the.options = BEAVEUtil.deepExtend({}, defaultOptions, options);
        the.uid = BEAVEUtil.getUniqueId('scrolltop');
        the.element = element;

        // Set initialized
        the.element.setAttribute('data-beave-scrolltop', 'true');

        // Event Handlers
        _handlers();

        // Bind Instance
        BEAVEUtil.data(the.element).set('scrolltop', the);
    }

    var _handlers = function() {
        var timer;

        window.addEventListener('scroll', function() {
            BEAVEUtil.throttle(timer, function() {
                _scroll();
            }, 200);
        });

        BEAVEUtil.addEvent(the.element, 'click', function(e) {
            e.preventDefault();

            _go();
        });
    }

    var _scroll = function() {
        var offset = parseInt(_getOption('offset'));

        var pos = BEAVEUtil.getScrollTop(); // current vertical position

        if ( pos > offset ) {
            if ( document.body.hasAttribute('data-beave-scrolltop') === false ) {
                document.body.setAttribute('data-beave-scrolltop', 'on');
            }
        } else {
            if ( document.body.hasAttribute('data-beave-scrolltop') === true ) {
                document.body.removeAttribute('data-beave-scrolltop');
            }
        }
    }

    var _go = function() {
        var speed = parseInt(_getOption('speed'));

        window.scrollTo({top: 0, behavior: 'smooth'});
        //BEAVEUtil.scrollTop(0, speed);
    }

    var _getOption = function(name) {
        if ( the.element.hasAttribute('data-beave-scrolltop-' + name) === true ) {
            var attr = the.element.getAttribute('data-beave-scrolltop-' + name);
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
        BEAVEUtil.data(the.element).remove('scrolltop');
    }

    // Construct class
    _construct();

    ///////////////////////
    // ** Public API  ** //
    ///////////////////////

    // Plugin API
    the.go = function() {
        return _go();
    }

    the.getElement = function() {
        return the.element;
    }

    the.destroy = function() {
        return _destroy();
    }
};

// Static methods
BEAVEScrolltop.getInstance = function(element) {
    if (element && BEAVEUtil.data(element).has('scrolltop')) {
        return BEAVEUtil.data(element).get('scrolltop');
    } else {
        return null;
    }
}

// Create instances
BEAVEScrolltop.createInstances = function(selector = '[data-beave-scrolltop="true"]') {
    // Initialize Menus
    var elements = document.body.querySelectorAll(selector);

    if ( elements && elements.length > 0 ) {
        for (var i = 0, len = elements.length; i < len; i++) {
            new BEAVEScrolltop(elements[i]);
        }
    }
}

// Global initialization
BEAVEScrolltop.init = function() {
    BEAVEScrolltop.createInstances();
};

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BEAVEScrolltop;
}
