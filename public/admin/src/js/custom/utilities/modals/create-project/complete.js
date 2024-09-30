"use strict";

// Class definition
var BEAVEModalCreateProjectComplete = function () {
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
			form = BEAVEModalCreateProject.getForm();
			stepper = BEAVEModalCreateProject.getStepperObj();
			startButton = BEAVEModalCreateProject.getStepper().querySelector('[data-beave-element="complete-start"]');

			handleForm();
		}
	};
}();

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	window.BEAVEModalCreateProjectComplete = module.exports = BEAVEModalCreateProjectComplete;
}
