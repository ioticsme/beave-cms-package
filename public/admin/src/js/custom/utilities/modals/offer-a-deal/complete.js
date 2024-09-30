"use strict";

// Class definition
var BEAVEModalOfferADealComplete = function () {
	// Variables
	var startButton;
	var form;
	var stepper;

	// Private functions
	var handleForm = function() {
		startButton.addEventListener('click', function () {
			stepper.goTo(1);
		});
	}

	return {
		// Public functions
		init: function () {
			form = BEAVEModalOfferADeal.getForm();
			stepper = BEAVEModalOfferADeal.getStepperObj();
			startButton = BEAVEModalOfferADeal.getStepper().querySelector('[data-beave-element="complete-start"]');

			handleForm();
		}
	};
}();

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	window.BEAVEModalOfferADealComplete = module.exports = BEAVEModalOfferADealComplete;
}