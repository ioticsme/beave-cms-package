"use strict";

// Class definition
var BEAVEBlockUI = function(element, options) {
    //////////////////////////////
    // ** Private variables  ** //
    //////////////////////////////
    var the = this;

    if ( typeof element === "undefined" || element === null ) {
        return;
    }

    // Default options
    var defaultOptions = {
        zIndex: false,
        overlayClass: '',
        overflow: 'hidden',
        message: '<span class="spinner-border text-primary"></span>'
    };

    ////////////////////////////
    // ** Private methods  ** //
    ////////////////////////////

    var _construct = function() {
        if ( BEAVEUtil.data(element).has('blockui') ) {
            the = BEAVEUtil.data(element).get('blockui');
        } else {
            _init();
        }
    }

    var _init = function() {
        // Variables
        the.options = BEAVEUtil.deepExtend({}, defaultOptions, options);
        the.element = element;
        the.overlayElement = null;
        the.blocked = false;
        the.positionChanged = false;
        the.overflowChanged = false;

        // Bind Instance
        BEAVEUtil.data(the.element).set('blockui', the);
    }

    var _block = function() {
        if ( BEAVEEventHandler.trigger(the.element, 'beave.blockui.block', the) === false ) {
            return;
        }

        var isPage = (the.element.tagName === 'BODY');
       
        var position = BEAVEUtil.css(the.element, 'position');
        var overflow = BEAVEUtil.css(the.element, 'overflow');
        var zIndex = isPage ? 10000 : 1;

        if (the.options.zIndex > 0) {
            zIndex = the.options.zIndex;
        } else {
            if (BEAVEUtil.css(the.element, 'z-index') != 'auto') {
                zIndex = BEAVEUtil.css(the.element, 'z-index');
            }
        }

        the.element.classList.add('blockui');

        if (position === "absolute" || position === "relative" || position === "fixed") {
            BEAVEUtil.css(the.element, 'position', 'relative');
            the.positionChanged = true;
        }

        if (the.options.overflow === 'hidden' && overflow === 'visible') {           
            BEAVEUtil.css(the.element, 'overflow', 'hidden');
            the.overflowChanged = true;
        }

        the.overlayElement = document.createElement('DIV');    
        the.overlayElement.setAttribute('class', 'blockui-overlay ' + the.options.overlayClass);
        
        the.overlayElement.innerHTML = the.options.message;

        BEAVEUtil.css(the.overlayElement, 'z-index', zIndex);

        the.element.append(the.overlayElement);
        the.blocked = true;

        BEAVEEventHandler.trigger(the.element, 'beave.blockui.after.blocked', the)
    }

    var _release = function() {
        if ( BEAVEEventHandler.trigger(the.element, 'beave.blockui.release', the) === false ) {
            return;
        }

        the.element.classList.add('blockui');
        
        if (the.positionChanged) {
            BEAVEUtil.css(the.element, 'position', '');
        }

        if (the.overflowChanged) {
            BEAVEUtil.css(the.element, 'overflow', '');
        }

        if (the.overlayElement) {
            BEAVEUtil.remove(the.overlayElement);
        }        

        the.blocked = false;

        BEAVEEventHandler.trigger(the.element, 'beave.blockui.released', the);
    }

    var _isBlocked = function() {
        return the.blocked;
    }

    var _destroy = function() {
        BEAVEUtil.data(the.element).remove('blockui');
    }

    // Construct class
    _construct();

    ///////////////////////
    // ** Public API  ** //
    ///////////////////////

    // Plugin API
    the.block = function() {
        _block();
    }

    the.release = function() {
        _release();
    }

    the.isBlocked = function() {
        return _isBlocked();
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
BEAVEBlockUI.getInstance = function(element) {
    if (element !== null && BEAVEUtil.data(element).has('blockui')) {
        return BEAVEUtil.data(element).get('blockui');
    } else {
        return null;
    }
}

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BEAVEBlockUI;
}