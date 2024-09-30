//
// Global init of core components
//

// Init components
var BEAVEComponents = function () {
    // Public methods
    return {
        init: function () {
            BEAVEApp.init();
			BEAVEDrawer.init();
			BEAVEMenu.init();
			BEAVEScroll.init();
			BEAVESticky.init();
			BEAVESwapper.init();
			BEAVEToggle.init();
			BEAVEScrolltop.init();
			BEAVEDialer.init();	
			BEAVEImageInput.init();
			BEAVEPasswordMeter.init();	
        }
    }	
}();

// On document ready
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", function() {
		BEAVEComponents.init();
	});
 } else {
	BEAVEComponents.init();
 }

 // Init page loader
window.addEventListener("load", function() {
    BEAVEApp.hidePageLoading();
});

// Declare BEAVEApp for Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	window.BEAVEComponents = module.exports = BEAVEComponents;
}