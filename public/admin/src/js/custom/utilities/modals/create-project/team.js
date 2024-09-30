"use strict";

// Class definition
var BEAVEModalCreateProjectTeam = function () {
	// Variables
	var nextButton;
	var previousButton;
	var form;
	var stepper;

	// Private functions
	var handleForm = function() {
		nextButton.addEventListener('click', function (e) {
			// Prevent default button action
			e.preventDefault();

			// Disable button to avoid multiple click 
			nextButton.disabled = true;

			// Show loading indication
			nextButton.setAttribute('data-beave-indicator', 'on');

			// Simulate form submission
			setTimeout(function() {
				// Enable button
				nextButton.disabled = false;
				
				// Simulate form submission
				nextButton.removeAttribute('data-beave-indicator');
				
				// Go to next step
				stepper.goNext();
			}, 1500); 		
		});

		previousButton.addEventListener('click', function () {
			stepper.goPrevious();
		});
	}

	return {
		// Public functions
		init: function () {
			form = BEAVEModalCreateProject.getForm();
			stepper = BEAVEModalCreateProject.getStepperObj();
			nextButton = BEAVEModalCreateProject.getStepper().querySelector('[data-beave-element="team-next"]');
			previousButton = BEAVEModalCreateProject.getStepper().querySelector('[data-beave-element="team-previous"]');

			handleForm();
		}
	};
}();

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	window.BEAVEModalCreateProjectTeam = module.exports = BEAVEModalCreateProjectTeam;
}