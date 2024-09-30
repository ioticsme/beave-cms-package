"use strict";

var BEAVEStickyHandlersInitialized = false;

// Class definition
var BEAVESticky = function(element, options) {
    ////////////////////////////
    // ** Private Variables  ** //
    ////////////////////////////
    var the = this;

    if ( typeof element === "undefined" || element === null ) {
        return;
    }

    // Default Options
    var defaultOptions = {
        offset: 200,
        reverse: false,
        release: null,
        animation: true,
        animationSpeed: '0.3s',
        animationClass: 'animation-slide-in-down'
    };
    ////////////////////////////
    // ** Private Methods  ** //
    ////////////////////////////

    var _construct = function() {
        if ( BEAVEUtil.data(element).has('sticky') === true ) {
            the = BEAVEUtil.data(element).get('sticky');
        } else {
            _init();
        }
    }

    var _init = function() {
        the.element = element;
        the.options = BEAVEUtil.deepExtend({}, defaultOptions, options);
        the.uid = BEAVEUtil.getUniqueId('sticky');
        the.name = the.element.getAttribute('data-beave-sticky-name');
        the.attributeName = 'data-beave-sticky-' + the.name;
        the.attributeName2 = 'data-beave-' + the.name;
        the.eventTriggerState = true;
        the.lastScrollTop = 0;
        the.scrollHandler;

        // Set initialized
        the.element.setAttribute('data-beave-sticky', 'true');

        // Event Handlers
        window.addEventListener('scroll', _scroll);

        // Initial Launch
        _scroll();

        // Bind Instance
        BEAVEUtil.data(the.element).set('sticky', the);
    }

    var _scroll = function(e) {
        var offset = _getOption('offset');
        var release = _getOption('release');
        var reverse = _getOption('reverse');
        var st;
        var attrName;
        var diff;

        // Exit if false
        if ( offset === false ) {
            _disable();
            return;
        }

        offset = parseInt(offset);
        release = release ? document.querySelector(release) : null;

        st = BEAVEUtil.getScrollTop();
        diff = document.documentElement.scrollHeight - window.innerHeight - BEAVEUtil.getScrollTop();
        
        var proceed = (!release || (release.offsetTop - release.clientHeight) > st);

        if ( reverse === true ) {  // Release on reverse scroll mode
            if ( st > offset && proceed ) {
                if ( document.body.hasAttribute(the.attributeName) === false) {
                    
                    if (_enable() === false) {
                        return;
                    }

                    document.body.setAttribute(the.attributeName, 'on');
                    document.body.setAttribute(the.attributeName2, 'on');
                    the.element.setAttribute("data-beave-sticky-enabled", "true");
                }

                if ( the.eventTriggerState === true ) {
                    BEAVEEventHandler.trigger(the.element, 'beave.sticky.on', the);
                    BEAVEEventHandler.trigger(the.element, 'beave.sticky.change', the);

                    the.eventTriggerState = false;
                }
            } else { // Back scroll mode
                if ( document.body.hasAttribute(the.attributeName) === true) {
                    _disable();
                    document.body.removeAttribute(the.attributeName);
                    document.body.removeAttribute(the.attributeName2);
                    the.element.removeAttribute("data-beave-sticky-enabled");
                }

                if ( the.eventTriggerState === false ) {
                    BEAVEEventHandler.trigger(the.element, 'beave.sticky.off', the);
                    BEAVEEventHandler.trigger(the.element, 'beave.sticky.change', the);
                    the.eventTriggerState = true;
                }
            }

            the.lastScrollTop = st;
        } else { // Classic scroll mode
            if ( st > offset && proceed ) {
                if ( document.body.hasAttribute(the.attributeName) === false) {
                    
                    if (_enable() === false) {
                        return;
                    } 
                    
                    document.body.setAttribute(the.attributeName, 'on');
                    document.body.setAttribute(the.attributeName2, 'on');
                    the.element.setAttribute("data-beave-sticky-enabled", "true");
                }

                if ( the.eventTriggerState === true ) {
                    BEAVEEventHandler.trigger(the.element, 'beave.sticky.on', the);
                    BEAVEEventHandler.trigger(the.element, 'beave.sticky.change', the);
                    the.eventTriggerState = false;
                }
            } else { // back scroll mode
                if ( document.body.hasAttribute(the.attributeName) === true ) {
                    _disable();
                    document.body.removeAttribute(the.attributeName);
                    document.body.removeAttribute(the.attributeName2);
                    the.element.removeAttribute("data-beave-sticky-enabled");
                }

                if ( the.eventTriggerState === false ) {
                    BEAVEEventHandler.trigger(the.element, 'beave.sticky.off', the);
                    BEAVEEventHandler.trigger(the.element, 'beave.sticky.change', the);
                    the.eventTriggerState = true;
                }
            }
        }      

        if (release) {
            if ( release.offsetTop - release.clientHeight > st ) {
                the.element.setAttribute('data-beave-sticky-released', 'true');
            } else {
                the.element.removeAttribute('data-beave-sticky-released');
            }
        } 
    }

    var _enable = function(update) {
        var top = _getOption('top');
        top = top ? parseInt(top) : 0;

        var left = _getOption('left');
        var right = _getOption('right');
        var width = _getOption('width');
        var zindex = _getOption('zindex');
        var dependencies = _getOption('dependencies');
        var classes = _getOption('class');

        var height = _calculateHeight();
        var heightOffset = _getOption('height-offset');
        heightOffset = heightOffset ? parseInt(heightOffset) : 0;

        if (height + heightOffset + top > BEAVEUtil.getViewPort().height) {
            return false;
        }
        
        if ( update !== true && _getOption('animation') === true ) {
            BEAVEUtil.css(the.element, 'animationDuration', _getOption('animationSpeed'));
            BEAVEUtil.animateClass(the.element, 'animation ' + _getOption('animationClass'));
        }

        if ( classes !== null ) {
            BEAVEUtil.addClass(the.element, classes);
        }

        if ( zindex !== null ) {
            BEAVEUtil.css(the.element, 'z-index', zindex);
            BEAVEUtil.css(the.element, 'position', 'fixed');
        }

        if ( top >= 0 ) {
            BEAVEUtil.css(the.element, 'top', String(top) + 'px');
        }

        if ( width !== null ) {
            if (width['target']) {
                var targetElement = document.querySelector(width['target']);
                if (targetElement) {
                    width = BEAVEUtil.css(targetElement, 'width');
                }
            }

            BEAVEUtil.css(the.element, 'width', width);
        }

        if ( left !== null ) {
            if ( String(left).toLowerCase() === 'auto' ) {
                var offsetLeft = BEAVEUtil.offset(the.element).left;

                if ( offsetLeft >= 0 ) {
                    BEAVEUtil.css(the.element, 'left', String(offsetLeft) + 'px');
                }
            } else {
                BEAVEUtil.css(the.element, 'left', left);
            }
        }

        if ( right !== null ) {
            BEAVEUtil.css(the.element, 'right', right);
        }        

        // Height dependencies
        if ( dependencies !== null ) {
            var dependencyElements = document.querySelectorAll(dependencies);
            
            if ( dependencyElements && dependencyElements.length > 0 ) {
                for ( var i = 0, len = dependencyElements.length; i < len; i++ ) {
                    BEAVEUtil.css(dependencyElements[i], 'padding-top', String(height) + 'px');
                }
            }
        }
    }

    var _disable = function() {
        BEAVEUtil.css(the.element, 'top', '');
        BEAVEUtil.css(the.element, 'width', '');
        BEAVEUtil.css(the.element, 'left', '');
        BEAVEUtil.css(the.element, 'right', '');
        BEAVEUtil.css(the.element, 'z-index', '');
        BEAVEUtil.css(the.element, 'position', '');

        var dependencies = _getOption('dependencies');
        var classes = _getOption('class');

        if ( classes !== null ) {
            BEAVEUtil.removeClass(the.element, classes);
        }

        // Height dependencies
        if ( dependencies !== null ) {
            var dependencyElements = document.querySelectorAll(dependencies);

            if ( dependencyElements && dependencyElements.length > 0 ) {
                for ( var i = 0, len = dependencyElements.length; i < len; i++ ) {
                    BEAVEUtil.css(dependencyElements[i], 'padding-top', '');
                }
            }
        }
    }

    var _check = function() {

    }

    var _calculateHeight = function() {
        var height = parseFloat(BEAVEUtil.css(the.element, 'height'));

        height = height + parseFloat(BEAVEUtil.css(the.element, 'margin-top'));
        height = height + parseFloat(BEAVEUtil.css(the.element, 'margin-bottom'));
        
        if (BEAVEUtil.css(element, 'border-top')) {
            height = height + parseFloat(BEAVEUtil.css(the.element, 'border-top'));
        }

        if (BEAVEUtil.css(element, 'border-bottom')) {
            height = height + parseFloat(BEAVEUtil.css(the.element, 'border-bottom'));
        }

        return height;
    }

    var _getOption = function(name) {
        if ( the.element.hasAttribute('data-beave-sticky-' + name) === true ) {
            var attr = the.element.getAttribute('data-beave-sticky-' + name);
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
        window.removeEventListener('scroll', _scroll);
        BEAVEUtil.data(the.element).remove('sticky');
    }

    // Construct Class
    _construct();

    ///////////////////////
    // ** Public API  ** //
    ///////////////////////

    // Methods
    the.update = function() {
        if ( document.body.hasAttribute(the.attributeName) === true ) {
            _disable();
            document.body.removeAttribute(the.attributeName);
            document.body.removeAttribute(the.attributeName2);
            _enable(true);
            document.body.setAttribute(the.attributeName, 'on');
            document.body.setAttribute(the.attributeName2, 'on');
        }
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
BEAVESticky.getInstance = function(element) {
    if ( element !== null && BEAVEUtil.data(element).has('sticky') ) {
        return BEAVEUtil.data(element).get('sticky');
    } else {
        return null;
    }
}

// Create instances
BEAVESticky.createInstances = function(selector = '[data-beave-sticky="true"]') {
    // Initialize Menus
    var elements = document.body.querySelectorAll(selector);
    var sticky;

    if ( elements && elements.length > 0 ) {
        for (var i = 0, len = elements.length; i < len; i++) {
            sticky = new BEAVESticky(elements[i]);
        }
    }
}

// Window resize handler
BEAVESticky.handleResize = function() {
    window.addEventListener('resize', function() {
        var timer;
    
        BEAVEUtil.throttle(timer, function() {
            // Locate and update Offcanvas instances on window resize
            var elements = document.body.querySelectorAll('[data-beave-sticky="true"]');
    
            if ( elements && elements.length > 0 ) {
                for (var i = 0, len = elements.length; i < len; i++) {
                    var sticky = BEAVESticky.getInstance(elements[i]);
                    if (sticky) {
                        sticky.update();
                    }
                }
            }
        }, 200);
    });
}

// Global initialization
BEAVESticky.init = function() {
    BEAVESticky.createInstances();

    if (BEAVEStickyHandlersInitialized === false) {
        BEAVESticky.handleResize();
        BEAVEStickyHandlersInitialized = true;
    }    
};

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BEAVESticky;
}
