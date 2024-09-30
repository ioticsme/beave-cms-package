"use strict";

var BEAVEDrawerHandlersInitialized = false; 

// Class definition
var BEAVEDrawer = function(element, options) {
    //////////////////////////////
    // ** Private variables  ** //
    //////////////////////////////
    var the = this;

    if ( typeof element === "undefined" || element === null ) {
        return;
    }

    // Default options
    var defaultOptions = {
        overlay: true,
        direction: 'end',
        baseClass: 'drawer',
        overlayClass: 'drawer-overlay'
    };

    ////////////////////////////
    // ** Private methods  ** //
    ////////////////////////////

    var _construct = function() {
        if ( BEAVEUtil.data(element).has('drawer') ) {
            the = BEAVEUtil.data(element).get('drawer');
        } else {
            _init();
        }
    }

    var _init = function() {
        // Variables
        the.options = BEAVEUtil.deepExtend({}, defaultOptions, options);
        the.uid = BEAVEUtil.getUniqueId('drawer');
        the.element = element;
        the.overlayElement = null;
        the.name = the.element.getAttribute('data-beave-drawer-name');
        the.shown = false;
        the.lastWidth;
        the.lastHeight;
        the.toggleElement = null;

        // Set initialized
        the.element.setAttribute('data-beave-drawer', 'true');

        // Event Handlers
        _handlers();

        // Update Instance
        _update();

        // Bind Instance
        BEAVEUtil.data(the.element).set('drawer', the);
    }

    var _handlers = function() {
        var togglers = _getOption('toggle');
        var closers = _getOption('close');

        if ( togglers !== null && togglers.length > 0 ) {
            BEAVEUtil.on(document.body, togglers, 'click', function(e) {
                e.preventDefault();

                the.toggleElement = this;
                _toggle();
            });
        }

        if ( closers !== null && closers.length > 0 ) {
            BEAVEUtil.on(document.body, closers, 'click', function(e) {
                e.preventDefault();

                the.closeElement = this;
                _hide();
            });
        }
    }

    var _toggle = function() {
        if ( BEAVEEventHandler.trigger(the.element, 'beave.drawer.toggle', the) === false ) {
            return;
        }

        if ( the.shown === true ) {
            _hide();
        } else {
            _show();
        }

        BEAVEEventHandler.trigger(the.element, 'beave.drawer.toggled', the);
    }

    var _hide = function() {
        if ( BEAVEEventHandler.trigger(the.element, 'beave.drawer.hide', the) === false ) {
            return;
        }

        the.shown = false;

        _deleteOverlay();

        document.body.removeAttribute('data-beave-drawer-' + the.name, 'on');
        document.body.removeAttribute('data-beave-drawer');

        BEAVEUtil.removeClass(the.element, the.options.baseClass + '-on');

        if ( the.toggleElement !== null ) {
            BEAVEUtil.removeClass(the.toggleElement, 'active');
        }

        BEAVEEventHandler.trigger(the.element, 'beave.drawer.after.hidden', the) === false
    }

    var _show = function() {
        if ( BEAVEEventHandler.trigger(the.element, 'beave.drawer.show', the) === false ) {
            return;
        }

        the.shown = true;

        _createOverlay();
        document.body.setAttribute('data-beave-drawer-' + the.name, 'on');
        document.body.setAttribute('data-beave-drawer', 'on');

        BEAVEUtil.addClass(the.element, the.options.baseClass + '-on');

        if ( the.toggleElement !== null ) {
            BEAVEUtil.addClass(the.toggleElement, 'active');
        }

        BEAVEEventHandler.trigger(the.element, 'beave.drawer.shown', the);
    }

    var _update = function() {
        var width = _getWidth();
        var height = _getHeight();
        var direction = _getOption('direction');

        var top = _getOption('top');
        var bottom = _getOption('bottom');
        var start = _getOption('start');
        var end = _getOption('end');

        // Reset state
        if ( BEAVEUtil.hasClass(the.element, the.options.baseClass + '-on') === true && String(document.body.getAttribute('data-beave-drawer-' + the.name + '-')) === 'on' ) {
            the.shown = true;
        } else {
            the.shown = false;
        }       

        // Activate/deactivate
        if ( _getOption('activate') === true ) {
            BEAVEUtil.addClass(the.element, the.options.baseClass);
            BEAVEUtil.addClass(the.element, the.options.baseClass + '-' + direction);
            
            if (width) {
                BEAVEUtil.css(the.element, 'width', width, true);
                the.lastWidth = width;
            }
            
            if (height) {
                BEAVEUtil.css(the.element, 'height', height, true);
                the.lastHeight = height;
            }

            if (top) {
                BEAVEUtil.css(the.element, 'top', top);
            }

            if (bottom) {
                BEAVEUtil.css(the.element, 'bottom', bottom);
            }

            if (start) {
                if (BEAVEUtil.isRTL()) {
                    BEAVEUtil.css(the.element, 'right', start);
                } else {
                    BEAVEUtil.css(the.element, 'left', start);
                }
            }

            if (end) {
                if (BEAVEUtil.isRTL()) {
                    BEAVEUtil.css(the.element, 'left', end);
                } else {
                    BEAVEUtil.css(the.element, 'right', end);
                }
            }
        } else {
            BEAVEUtil.removeClass(the.element, the.options.baseClass);
            BEAVEUtil.removeClass(the.element, the.options.baseClass + '-' + direction);

            BEAVEUtil.css(the.element, 'width', '');
            BEAVEUtil.css(the.element, 'height', '');

            if (top) {
                BEAVEUtil.css(the.element, 'top', '');
            }

            if (bottom) {
                BEAVEUtil.css(the.element, 'bottom', '');
            }

            if (start) {
                if (BEAVEUtil.isRTL()) {
                    BEAVEUtil.css(the.element, 'right', '');
                } else {
                    BEAVEUtil.css(the.element, 'left', '');
                }
            }

            if (end) {
                if (BEAVEUtil.isRTL()) {
                    BEAVEUtil.css(the.element, 'left', '');
                } else {
                    BEAVEUtil.css(the.element, 'right', '');
                }
            }

            _hide();
        }
    }

    var _createOverlay = function() {
        if ( _getOption('overlay') === true ) {
            the.overlayElement = document.createElement('DIV');

            BEAVEUtil.css(the.overlayElement, 'z-index', BEAVEUtil.css(the.element, 'z-index') - 1); // update

            document.body.append(the.overlayElement);

            BEAVEUtil.addClass(the.overlayElement, _getOption('overlay-class'));

            BEAVEUtil.addEvent(the.overlayElement, 'click', function(e) {
                e.preventDefault();

                if ( _getOption('permanent') !== true ) {
                    _hide();
                }
            });
        }
    }

    var _deleteOverlay = function() {
        if ( the.overlayElement !== null ) {
            BEAVEUtil.remove(the.overlayElement);
        }
    }

    var _getOption = function(name) {
        if ( the.element.hasAttribute('data-beave-drawer-' + name) === true ) {
            var attr = the.element.getAttribute('data-beave-drawer-' + name);
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

    var _getWidth = function() {
        var width = _getOption('width');

        if ( width === 'auto') {
            width = BEAVEUtil.css(the.element, 'width');
        }

        return width;
    }

    var _getHeight = function() {
        var height = _getOption('height');

        if ( height === 'auto') {
            height = BEAVEUtil.css(the.element, 'height');
        }

        return height;
    }

    var _destroy = function() {
        BEAVEUtil.data(the.element).remove('drawer');
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

    the.show = function() {
        return _show();
    }

    the.hide = function() {
        return _hide();
    }

    the.isShown = function() {
        return the.shown;
    }

    the.update = function() {
        _update();
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
BEAVEDrawer.getInstance = function(element) {
    if (element !== null && BEAVEUtil.data(element).has('drawer')) {
        return BEAVEUtil.data(element).get('drawer');
    } else {
        return null;
    }
}

// Hide all drawers and skip one if provided
BEAVEDrawer.hideAll = function(skip = null, selector = '[data-beave-drawer="true"]') {
    var items = document.querySelectorAll(selector);

    if (items && items.length > 0) {
        for (var i = 0, len = items.length; i < len; i++) {
            var item = items[i];
            var drawer = BEAVEDrawer.getInstance(item);

            if (!drawer) {
                continue;
            }

            if ( skip ) {
                if ( item !== skip ) {
                    drawer.hide();
                }
            } else {
                drawer.hide();
            }
        }
    }
}

// Update all drawers
BEAVEDrawer.updateAll = function(selector = '[data-beave-drawer="true"]') {
    var items = document.querySelectorAll(selector);

    if (items && items.length > 0) {
        for (var i = 0, len = items.length; i < len; i++) {
            var drawer = BEAVEDrawer.getInstance(items[i]);

            if (drawer) {
                drawer.update();
            }
        }
    }
}

// Create instances
BEAVEDrawer.createInstances = function(selector = '[data-beave-drawer="true"]') {
    // Initialize Menus
    var elements = document.querySelectorAll(selector);

    if ( elements && elements.length > 0 ) {
        for (var i = 0, len = elements.length; i < len; i++) {
            new BEAVEDrawer(elements[i]);
        }
    }
}

// Toggle instances
BEAVEDrawer.handleShow = function() {
    // External drawer toggle handler
    BEAVEUtil.on(document.body,  '[data-beave-drawer-show="true"][data-beave-drawer-target]', 'click', function(e) {
        e.preventDefault();
        
        var element = document.querySelector(this.getAttribute('data-beave-drawer-target'));

        if (element) {
            BEAVEDrawer.getInstance(element).show();
        } 
    });
}

// Handle escape key press
BEAVEDrawer.handleEscapeKey = function() {
    document.addEventListener('keydown', (event) => {        
        if (event.key === 'Escape') {
            //if esc key was not pressed in combination with ctrl or alt or shift
            const isNotCombinedKey = !(event.ctrlKey || event.altKey || event.shiftKey);
            if (isNotCombinedKey) {
                var elements = document.querySelectorAll('.drawer-on[data-beave-drawer="true"]:not([data-beave-drawer-escape="false"])');
                var drawer;

                if ( elements && elements.length > 0 ) {
                    for (var i = 0, len = elements.length; i < len; i++) {
                        drawer = BEAVEDrawer.getInstance(elements[i]);
                        if (drawer.isShown()) {
                            drawer.hide();
                        }
                    }
                }              
            }
        }
    });
}

// Dismiss instances
BEAVEDrawer.handleDismiss = function() {
    // External drawer toggle handler
    BEAVEUtil.on(document.body,  '[data-beave-drawer-dismiss="true"]', 'click', function(e) {
        var element = this.closest('[data-beave-drawer="true"]');

        if (element) {
            var drawer = BEAVEDrawer.getInstance(element);
            if (drawer.isShown()) {
                drawer.hide();
            }
        } 
    });
}

// Handle resize
BEAVEDrawer.handleResize = function() {
    // Window resize Handling
    window.addEventListener('resize', function() {
        var timer;

        BEAVEUtil.throttle(timer, function() {
            // Locate and update drawer instances on window resize
            var elements = document.querySelectorAll('[data-beave-drawer="true"]');

            if ( elements && elements.length > 0 ) {
                for (var i = 0, len = elements.length; i < len; i++) {
                    var drawer = BEAVEDrawer.getInstance(elements[i]);
                    if (drawer) {
                        drawer.update();
                    }
                }
            }
        }, 200);
    });
}

// Global initialization
BEAVEDrawer.init = function() {
    BEAVEDrawer.createInstances();

    if (BEAVEDrawerHandlersInitialized === false) {
        BEAVEDrawer.handleResize();
        BEAVEDrawer.handleShow();
        BEAVEDrawer.handleDismiss();
        BEAVEDrawer.handleEscapeKey();

        BEAVEDrawerHandlersInitialized = true;
    }
};

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BEAVEDrawer;
}