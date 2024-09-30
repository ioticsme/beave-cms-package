"use strict";

// Class definition
var BEAVEModalCreateProject = function () {
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
			stepper = document.querySelector('#kt_modal_create_project_stepper');
			form = document.querySelector('#kt_modal_create_project_form');

			initStepper();
		},

		getStepperObj: function () {
			return stepperObj;
		},

		getStepper: function () {
			return stepper;
		},
		
		getForm: function () {
			return form;
		}
	};
}();

// On document ready
BEAVEUtil.onDOMContentLoaded(function () {
	if (!document.querySelector('#kt_modal_create_project')) {
		return;
	}

	BEAVEModalCreateProject.init();
	BEAVEModalCreateProjectType.init();
	BEAVEModalCreateProjectBudget.init();
	BEAVEModalCreateProjectSettings.init();
	BEAVEModalCreateProjectTeam.init();
	BEAVEModalCreateProjectTargets.init();
	BEAVEModalCreateProjectFiles.init();
	BEAVEModalCreateProjectComplete.init();
});

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	window.BEAVEModalCreateProject = module.exports = BEAVEModalCreateProject;
}
