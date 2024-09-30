"use strict";

// Class definition
var BEAVEThemeModeUser = function () {
    
    var handleSubmit = function() {
		// Update chart on theme mode change
        BEAVEThemeMode.on("beave.thememode.change", function() {                
            var menuMode = BEAVEThemeMode.getMenuMode();
            var mode = BEAVEThemeMode.getMode();
            console.log("user selected theme mode:" + menuMode);
            console.log("theme mode:" + mode);

            // Submit selected theme mode menu option via ajax and 
            // store it in user profile and set the user opted theme mode via HTML attribute
            // <html data-theme-mode="light"> .... </html>
        });
    }

    return {
        init: function () {
			handleSubmit();
        }
    };
}();

// Initialize app on document ready
BEAVEUtil.onDOMContentLoaded(function () {
    BEAVEThemeModeUser.init();
});

// Declare BEAVEThemeModeUser for Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BEAVEThemeModeUser;
}