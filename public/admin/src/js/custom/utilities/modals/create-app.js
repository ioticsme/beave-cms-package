"use strict";

// Class definition
var BEAVECreateApp = function () {
	// Elements
	var modal;	
	var modalEl;

	var stepper;
	var form;
	var formSubmitButton;
	var formContinueButton;

	// Variables
	var stepperObj;
	var validations = [];

	// Private Functions
	var initStepper = function () {
		// Initialize Stepper
		stepperObj = new BEAVEStepper(stepper);

		// Stepper change event(handle hiding submit button for the last step)
		stepperObj.on('beave.stepper.changed', function (stepper) {
			if (stepperObj.getCurrentStepIndex() === 4) {
				formSubmitButton.classList.remove('d-none');
				formSubmitButton.classList.add('d-inline-block');
				formContinueButton.classList.add('d-none');
			} else if (stepperObj.getCurrentStepIndex() === 5) {
				formSubmitButton.classList.add('d-none');
				formContinueButton.classList.add('d-none');
			} else {
				formSubmitButton.classList.remove('d-inline-block');
				formSubmitButton.classList.remove('d-none');
				formContinueButton.classList.remove('d-none');
			}
		});

		// Validation before going to next page
		stepperObj.on('beave.stepper.next', function (stepper) {
			console.log('stepper.next');

			// Validate form before change stepper step
			var validator = validations[stepper.getCurrentStepIndex() - 1]; // get validator for currnt step

			if (validator) {
				validator.validate().then(function (status) {
					console.log('validated!');

					if (status == 'Valid') {
						stepper.goNext();

						//BEAVEUtil.scrollTop();
					} else {
						// Show error message popup. For more info check the plugin's official documentation: https://sweetalert2.github.io/
						Swal.fire({
							text: "Sorry, looks like there are some errors detected, please try again.",
							icon: "error",
							buttonsStyling: false,
							confirmButtonText: "Ok, got it!",
							customClass: {
								confirmButton: "btn btn-light"
							}
						}).then(function () {
							//BEAVEUtil.scrollTop();
						});
					}
				});
			} else {
				stepper.goNext();

				BEAVEUtil.scrollTop();
			}
		});

		// Prev event
		stepperObj.on('beave.stepper.previous', function (stepper) {
			console.log('stepper.previous');

			stepper.goPrevious();
			BEAVEUtil.scrollTop();
		});

		formSubmitButton.addEventListener('click', function (e) {
			// Validate form before change stepper step
			var validator = validations[3]; // get validator for last form

			validator.validate().then(function (status) {
				console.log('validated!');

				if (status == 'Valid') {
					// Prevent default button action
					e.preventDefault();

					// Disable button to avoid multiple click 
					formSubmitButton.disabled = true;

					// Show loading indication
					formSubmitButton.setAttribute('data-beave-indicator', 'on');

					// Simulate form submission
					setTimeout(function() {
						// Hide loading indication
						formSubmitButton.removeAttribute('data-beave-indicator');

						// Enable button
						formSubmitButton.disabled = false;

						stepperObj.goNext();
						//BEAVEUtil.scrollTop();
					}, 2000);
				} else {
					Swal.fire({
						text: "Sorry, looks like there are some errors detected, please try again.",
						icon: "error",
						buttonsStyling: false,
						confirmButtonText: "Ok, got it!",
						customClass: {
							confirmButton: "btn btn-light"
						}
					}).then(function () {
						BEAVEUtil.scrollTop();
					});
				}
			});
		});
	}

	// Init form inputs
	var initForm = function() {
		// Expiry month. For more info, plase visit the official plugin site: https://select2.org/
        $(form.querySelector('[name="card_expiry_month"]')).on('change', function() {
            // Revalidate the field when an option is chosen
            validations[3].revalidateField('card_expiry_month');
        });

		// Expiry year. For more info, plase visit the official plugin site: https://select2.org/
        $(form.querySelector('[name="card_expiry_year"]')).on('change', function() {
            // Revalidate the field when an option is chosen
            validations[3].revalidateField('card_expiry_year');
        });
	}

	var initValidation = function () {
		// Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
		// Step 1
		validations.push(FormValidation.formValidation(
			form,
			{
				fields: {
					name: {
						validators: {
							notEmpty: {
								message: 'App name is required'
							}
						}
					},
					category: {
						validators: {
							notEmpty: {
								message: 'Category is required'
							}
						}
					}
				},
				plugins: {
					trigger: new FormValidation.plugins.Trigger(),
					bootstrap: new FormValidation.plugins.Bootstrap5({
						rowSelector: '.fv-row',
                        eleInvalidClass: '',
                        eleValidClass: ''
					})
				}
			}
		));

		// Step 2
		validations.push(FormValidation.formValidation(
			form,
			{
				fields: {
					framework: {
						validators: {
							notEmpty: {
								message: 'Framework is required'
							}
						}
					}
				},
				plugins: {
					trigger: new FormValidation.plugins.Trigger(),
					// Bootstrap Framework Integration
					bootstrap: new FormValidation.plugins.Bootstrap5({
						rowSelector: '.fv-row',
                        eleInvalidClass: '',
                        eleValidClass: ''
					})
				}
			}
		));

		// Step 3
		validations.push(FormValidation.formValidation(
			form,
			{
				fields: {
					dbname: {
						validators: {
							notEmpty: {
								message: 'Database name is required'
							}
						}
					},
					dbengine: {
						validators: {
							notEmpty: {
								message: 'Database engine is required'
							}
						}
					}
				},
				plugins: {
					trigger: new FormValidation.plugins.Trigger(),
					// Bootstrap Framework Integration
					bootstrap: new FormValidation.plugins.Bootstrap5({
						rowSelector: '.fv-row',
                        eleInvalidClass: '',
                        eleValidClass: ''
					})
				}
			}
		));

		// Step 4
		validations.push(FormValidation.formValidation(
			form,
			{
				fields: {
					'card_name': {
						validators: {
							notEmpty: {
								message: 'Name on card is required'
							}
						}
					},
					'card_number': {
						validators: {
							notEmpty: {
								message: 'Card member is required'
							},
                            creditCard: {
                                message: 'Card number is not valid'
                            }
						}
					},
					'card_expiry_month': {
						validators: {
							notEmpty: {
								message: 'Month is required'
							}
						}
					},
					'card_expiry_year': {
						validators: {
							notEmpty: {
								message: 'Year is required'
							}
						}
					},
					'card_cvv': {
						validators: {
							notEmpty: {
								message: 'CVV is required'
							},
							digits: {
								message: 'CVV must contain only digits'
							},
							stringLength: {
								min: 3,
								max: 4,
								message: 'CVV must contain 3 to 4 digits only'
							}
						}
					}
				},

				plugins: {
					trigger: new FormValidation.plugins.Trigger(),
					// Bootstrap Framework Integration
					bootstrap: new FormValidation.plugins.Bootstrap5({
						rowSelector: '.fv-row',
                        eleInvalidClass: '',
                        eleValidClass: ''
					})
				}
			}
		));
	}

	return {
		// Public Functions
		init: function () {
			// Elements
			modalEl = document.querySelector('#beave_modal_create_app');

			if (!modalEl) {
				return;
			}

			modal = new bootstrap.Modal(modalEl);

			stepper = document.querySelector('#beave_modal_create_app_stepper');
			form = document.querySelector('#beave_modal_create_app_form');
			formSubmitButton = stepper.querySelector('[data-beave-stepper-action="submit"]');
			formContinueButton = stepper.querySelector('[data-beave-stepper-action="next"]');

			initStepper();
			initForm();
			initValidation();
		}
	};
}();

// On document ready
BEAVEUtil.onDOMContentLoaded(function() {
    BEAVECreateApp.init();
});