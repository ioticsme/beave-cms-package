"use strict";

// Class definition
var BEAVEFeedback = function(options) {
    ////////////////////////////
    // ** Private Variables  ** //
    ////////////////////////////
    var the = this;

    // Default options
    var defaultOptions = {
        'width' : 100,
        'placement' : 'top-center',
        'content' : '',
        'type': 'popup'
    };

    ////////////////////////////
    // ** Private methods  ** //
    ////////////////////////////

    var _construct = function() {
        _init();
    }

    var _init = function() {
        // Variables
        the.options = BEAVEUtil.deepExtend({}, defaultOptions, options);
        the.uid = BEAVEUtil.getUniqueId('feedback');
        the.element;
        the.shown = false;

        // Event Handlers
        _handlers();

        // Bind Instance
        BEAVEUtil.data(the.element).set('feedback', the);
    }

    var _handlers = function() {
        BEAVEUtil.addEvent(the.element, 'click', function(e) {
            e.preventDefault();

            _go();
        });
    }

    var _show = function() {
        if ( BEAVEEventHandler.trigger(the.element, 'beave.feedback.show', the) === false ) {
            return;
        }

        if ( the.options.type === 'popup') {
            _showPopup();
        }

        BEAVEEventHandler.trigger(the.element, 'beave.feedback.shown', the);

        return the;
    }

    var _hide = function() {
        if ( BEAVEEventHandler.trigger(the.element, 'beave.feedback.hide', the) === false ) {
            return;
        }

        if ( the.options.type === 'popup') {
            _hidePopup();
        }

        the.shown = false;

        BEAVEEventHandler.trigger(the.element, 'beave.feedback.hidden', the);

        return the;
    }

    var _showPopup = function() {
        the.element = document.createElement("DIV");

        BEAVEUtil.addClass(the.element, 'feedback feedback-popup');
        BEAVEUtil.setHTML(the.element, the.options.content);

        if (the.options.placement == 'top-center') {
            _setPopupTopCenterPosition();
        }

        document.body.appendChild(the.element);

        BEAVEUtil.addClass(the.element, 'feedback-shown');

        the.shown = true;
    }

    var _setPopupTopCenterPosition = function() {
        var width = BEAVEUtil.getResponsiveValue(the.options.width);
        var height = BEAVEUtil.css(the.element, 'height');

        BEAVEUtil.addClass(the.element, 'feedback-top-center');

        BEAVEUtil.css(the.element, 'width', width);
        BEAVEUtil.css(the.element, 'left', '50%');
        BEAVEUtil.css(the.element, 'top', '-' + height);
    }

    var _hidePopup = function() {
        the.element.remove();
    }

    var _destroy = function() {
        BEAVEUtil.data(the.element).remove('feedback');
    }

    // Construct class
    _construct();

    ///////////////////////
    // ** Public API  ** //
    ///////////////////////

    // Plugin API
    the.show = function() {
        return _show();
    }

    the.hide = function() {
        return _hide();
    }

    the.isShown = function() {
        return the.shown;
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

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BEAVEFeedback;
}
