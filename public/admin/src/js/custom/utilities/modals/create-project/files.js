"use strict";

// Class definition
var BEAVEModalCreateProjectFiles = function () {
	// Variables
	var nextButton;
	var previousButton;
	var form;
	var stepper;

	// Private functions
	var initForm = function() {
		// Project logo
		// For more info about Dropzone plugin visit:  https://www.dropzonejs.com/#usage
		var myDropzone = new Dropzone("#kt_modal_create_project_files_upload", { 
			url: "https://keenthemes.com/scripts/void.php", // Set the url for your upload script location
            paramName: "file", // The name that will be used to transfer the file
            maxFiles: 10,
            maxFilesize: 10, // MB
            addRemoveLinks: true,
            accept: function(file, done) {
                if (file.name == "justinbieber.jpg") {
                    done("Naha, you don't.");
                } else {
                    done();
                }
            }
		});  
	}

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
				// Hide loading indication
				nextButton.removeAttribute('data-beave-indicator');

				// Enable button
				nextButton.disabled = false;
				
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
			nextButton = BEAVEModalCreateProject.getStepper().querySelector('[data-beave-element="files-next"]');
			previousButton = BEAVEModalCreateProject.getStepper().querySelector('[data-beave-element="files-previous"]');

			initForm();
			handleForm();
		}
	};
}();

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	window.BEAVEModalCreateProjectFiles = module.exports = BEAVEModalCreateProjectFiles;
}
