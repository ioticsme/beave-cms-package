"use strict";

// Class definition
var BEAVELandingPage = function () {
    // Private methods
    var initTyped = function() {
        var typed = new Typed("#beave_landing_hero_text", {
            strings: ["The Best Theme Ever", "The Most Trusted Theme", "#1 Selling Theme"],
            typeSpeed: 50
        });
    }

    // Public methods
    return {
        init: function () {
            //initTyped();
        }   
    }
}();

// Webpack support
if (typeof module !== 'undefined') {
    module.exports = BEAVELandingPage;
}

// On document ready
BEAVEUtil.onDOMContentLoaded(function() {
    BEAVELandingPage.init();
});
