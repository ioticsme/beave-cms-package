"use strict";

// Class definition
var BEAVEAppFileManagerSettings = function () {
    var form;

	// Private functions
	var handleForm = function() {
		const saveButton = form.querySelector('#kt_file_manager_settings_submit');

        saveButton.addEventListener('click', e => {
            e.preventDefault();

            saveButton.setAttribute("data-beave-indicator", "on");

            // Simulate process for demo only
            setTimeout(function(){
                toastr.options = {
                    "closeButton": true,
                    "debug": false,
                    "newestOnTop": false,
                    "progressBar": false,
                    "positionClass": "toast-top-right",
                    "preventDuplicates": false,
                    "showDuration": "300",
                    "hideDuration": "1000",
                    "timeOut": "5000",
                    "extendedTimeOut": "1000",
                    "showEasing": "swing",
                    "hideEasing": "linear",
                    "showMethod": "fadeIn",
                    "hideMethod": "fadeOut"
                };

                toastr.success('File manager settings have been saved');

                saveButton.removeAttribute("data-beave-indicator");
            }, 1000);
        });
	}

	// Public methods
	return {
		init: function(element) {
            form = document.querySelector('#kt_file_manager_settings');

			handleForm();
        }
	};
}();

// On document ready
BEAVEUtil.onDOMContentLoaded(function () {
    BEAVEAppFileManagerSettings.init();
});
