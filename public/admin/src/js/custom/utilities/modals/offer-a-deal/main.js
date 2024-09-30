"use strict";

// Class definition
var BEAVEModalOfferADeal = function () {
    // Private variables
	var stepper;
	var stepperObj;
	var form;	

	// Private functions
	var initStepper = function () {
		// Initialize Stepper
		stepperObj = new BEAVEStepper(stepper);
	}

	return {
		// Public functions
		init: function () {
			stepper = document.querySelector('#beave_modal_offer_a_deal_stepper');
			form = document.querySelector('#beave_modal_offer_a_deal_form');

			initStepper();
		},

		getStepper: function () {
			return stepper;
		},

		getStepperObj: function () {
			return stepperObj;
		},
		
		getForm: function () {
			return form;
		}
	};
}();

// On document ready
BEAVEUtil.onDOMContentLoaded(function () {
	if (!document.querySelector('#beave_modal_offer_a_deal')) {
		return;
	}

    BEAVEModalOfferADeal.init();
    BEAVEModalOfferADealType.init();
    BEAVEModalOfferADealDetails.init();
    BEAVEModalOfferADealFinance.init();
    BEAVEModalOfferADealComplete.init();
});

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	window.BEAVEModalOfferADeal = module.exports = BEAVEModalOfferADeal;
}