'use strict'

// Class definition
var BEAVERThemeModeUser = (function () {
    var handleSubmit = function () {
        // Update chart on theme mode change
        BEAVERThemeMode.on('beaver.thememode.change', function () {
            var menuMode = BEAVERThemeMode.getMenuMode()
            var mode = BEAVERThemeMode.getMode()
            console.log('user selected theme mode:' + menuMode)
            console.log('theme mode:' + mode)

            // Submit selected theme mode menu option via ajax and
            // store it in user profile and set the user opted theme mode via HTML attribute
            // <html data-theme-mode="light"> .... </html>
        })
    }

    return {
        init: function () {
            handleSubmit()
        },
    }
})()

// Initialize app on document ready
BEAVERUtil.onDOMContentLoaded(function () {
    BEAVERThemeModeUser.init()
})

// Declare BEAVERThemeModeUser for Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BEAVERThemeModeUser
}
