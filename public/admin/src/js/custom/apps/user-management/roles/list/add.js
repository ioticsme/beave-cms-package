"use strict";

// Class definition
var BEAVEUsersAddRole = function () {
    // Shared variables
    const element = document.getElementById('beave_modal_add_role');
<<<<<<< Updated upstream
    const form = element.querySelector('#kt_modal_add_role_form');
=======
    const form = element.querySelector('#beave_modal_add_role_form');
>>>>>>> Stashed changes
    const modal = new bootstrap.Modal(element);

    // Init add schedule modal
    var initAddRole = () => {

        // Init form validation rules. For more info check the FormValidation plugin's official documentation:https://formvalidation.io/
        var validator = FormValidation.formValidation(
            form,
            {
                fields: {
                    'role_name': {
                        validators: {
                            notEmpty: {
                                message: 'Role name is required'
                            }
                        }
                    },
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
        );

        // Close button handler
        const closeButton = element.querySelector('[data-beave-roles-modal-action="close"]');
        closeButton.addEventListener('click', e => {
            e.preventDefault();

            Swal.fire({
                text: "Are you sure you would like to close?",
                icon: "warning",
                showCancelButton: true,
                buttonsStyling: false,
                confirmButtonText: "Yes, close it!",
                cancelButtonText: "No, return",
                customClass: {
                    confirmButton: "btn btn-primary",
                    cancelButton: "btn btn-active-light"
                }
            }).then(function (result) {
                if (result.value) {
                    modal.hide(); // Hide modal				
                } 
            });
        });

        // Cancel button handler
        const cancelButton = element.querySelector('[data-beave-roles-modal-action="cancel"]');
        cancelButton.addEventListener('click', e => {
            e.preventDefault();

            Swal.fire({
                text: "Are you sure you would like to cancel?",
                icon: "warning",
                showCancelButton: true,
                buttonsStyling: false,
                confirmButtonText: "Yes, cancel it!",
                cancelButtonText: "No, return",
                customClass: {
                    confirmButton: "btn btn-primary",
                    cancelButton: "btn btn-active-light"
                }
            }).then(function (result) {
                if (result.value) {
                    form.reset(); // Reset form	
                    modal.hide(); // Hide modal				
                } else if (result.dismiss === 'cancel') {
                    Swal.fire({
                        text: "Your form has not been cancelled!.",
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok, got it!",
                        customClass: {
                            confirmButton: "btn btn-primary",
                        }
                    });
                }
            });
        });

         // Submit button handler
         const submitButton = element.querySelector('[data-beave-roles-modal-action="submit"]');
         submitButton.addEventListener('click', function (e) {
             // Prevent default button action
             e.preventDefault();
 
             // Validate form before submit
             if (validator) {
                 validator.validate().then(function (status) {
                     console.log('validated!');
 
                     if (status == 'Valid') {
                         // Show loading indication
                         submitButton.setAttribute('data-beave-indicator', 'on');
 
                         // Disable button to avoid multiple click 
                         submitButton.disabled = true;
 
                         // Simulate form submission. For more info check the plugin's official documentation: https://sweetalert2.github.io/
                         setTimeout(function () {
                             // Remove loading indication
                             submitButton.removeAttribute('data-beave-indicator');
 
                             // Enable button
                             submitButton.disabled = false;
 
                             // Show popup confirmation 
                             Swal.fire({
                                 text: "Form has been successfully submitted!",
                                 icon: "success",
                                 buttonsStyling: false,
                                 confirmButtonText: "Ok, got it!",
                                 customClass: {
                                     confirmButton: "btn btn-primary"
                                 }
                             }).then(function (result) {
                                 if (result.isConfirmed) {
                                     modal.hide();
                                 }
                             });
 
                             //form.submit(); // Submit form
                         }, 2000);
                     } else {
                         // Show popup warning. For more info check the plugin's official documentation: https://sweetalert2.github.io/
                         Swal.fire({
                             text: "Sorry, looks like there are some errors detected, please try again.",
                             icon: "error",
                             buttonsStyling: false,
                             confirmButtonText: "Ok, got it!",
                             customClass: {
                                 confirmButton: "btn btn-primary"
                             }
                         });
                     }
                 });
             }
         });
        

    }

    // Select all handler
    const handleSelectAll = () =>{
        // Define variables
        const selectAll = form.querySelector('#beave_roles_select_all');
        const allCheckboxes = form.querySelectorAll('[type="checkbox"]');

        // Handle check state
        selectAll.addEventListener('change', e => {

            // Apply check state to all checkboxes
            allCheckboxes.forEach(c => {
                c.checked = e.target.checked;
            });
        });
    }

    return {
        // Public functions
        init: function () {
            initAddRole();
            handleSelectAll();
        }
    };
}();

// On document ready
BEAVEUtil.onDOMContentLoaded(function () {
    BEAVEUsersAddRole.init();
});