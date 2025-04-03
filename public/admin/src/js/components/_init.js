//
// Global init of core components
//

// Init components
var BEAVERComponents = (function () {
    // Public methods
    return {
        init: function () {
            BEAVERApp.init()
            BEAVERDrawer.init()
            BEAVERMenu.init()
            BEAVERScroll.init()
            BEAVERSticky.init()
            BEAVERSwapper.init()
            BEAVERToggle.init()
            BEAVERScrolltop.init()
            BEAVERDialer.init()
            BEAVERImageInput.init()
            BEAVERPasswordMeter.init()
        },
    }
})()

// On document ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        BEAVERComponents.init()
    })
} else {
    BEAVERComponents.init()
}

// Init page loader
window.addEventListener('load', function () {
    BEAVERApp.hidePageLoading()
})

// Declare BEAVERApp for Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    window.BEAVERComponents = module.exports = BEAVERComponents
}
