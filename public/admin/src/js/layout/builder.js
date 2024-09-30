"use strict";

// Class definition
var BEAVEAppLayoutBuilder = function() {
	var form;
	var actionInput;
	var url;
	var previewButton;
	var exportButton;
	var resetButton;

	var engage;
	var engageToggleOff;
	var engageToggleOn;
	var engagePrebuiltsModal;

	var handleEngagePrebuilts = function() {	
		if (engagePrebuiltsModal === null) {
			return;
		}	

		if ( BEAVECookie.get("app_engage_prebuilts_modal_displayed") !== "1" ) {
			setTimeout(function() {
				const modal = new bootstrap.Modal(engagePrebuiltsModal);
				modal.show();
	
				const date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
				BEAVECookie.set("app_engage_prebuilts_modal_displayed", "1", {expires: date});
			}, 3000);
		} 
	}

	var handleEngagePrebuiltsViewMenu = function() {
		const selected = engagePrebuiltsModal.querySelector('[data-beave-element="selected"]');
		const selectedTitle = engagePrebuiltsModal.querySelector('[data-beave-element="title"]');
		const menu = engagePrebuiltsModal.querySelector('[data-beave-menu="true"]');

		// Toggle Handler
		BEAVEUtil.on(engagePrebuiltsModal, '[data-beave-mode]', 'click', function (e) {
			const title = this.innerText;	
			const mode = this.getAttribute("data-beave-mode");
			const selectedLink = menu.querySelector('.menu-link.active');
			const viewImage = document.querySelector('#beave_app_engage_prebuilts_view_image');
			const viewText = document.querySelector('#beave_app_engage_prebuilts_view_text');
			selectedTitle.innerText = title;

			if (selectedLink) {
				selectedLink.classList.remove('active');
			}

			this.classList.add('active');

			if (mode === "image") {
				viewImage.classList.remove("d-none");
				viewImage.classList.add("d-block");
				viewText.classList.remove("d-block");
				viewText.classList.add("d-none");
			} else {
				viewText.classList.remove("d-none");
				viewText.classList.add("d-block");
				viewImage.classList.remove("d-block");
				viewImage.classList.add("d-none");
			}
		});
	}

	var handleEngageToggle = function() {	
		engageToggleOff.addEventListener("click", function (e) {
			e.preventDefault();

			const date = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 days from now
			BEAVECookie.set("app_engage_hide", "1", {expires: date});
			engage.classList.add('app-engage-hide');
		});

		engageToggleOn.addEventListener("click", function (e) {
			e.preventDefault();

			BEAVECookie.remove("app_engage_hide");
			engage.classList.remove('app-engage-hide');
		});
	}

	var handlePreview = function() {
		previewButton.addEventListener("click", function(e) {
			e.preventDefault();

			// Set form action value
			actionInput.value = "preview";

			// Show progress
			previewButton.setAttribute("data-beave-indicator", "on");

			// Prepare form data
			var data = $(form).serialize();

			// Submit
			$.ajax({
				type: "POST",
				dataType: "html",
				url: url,
				data: data,
				success: function(response, status, xhr) {
					if (history.scrollRestoration) {
						history.scrollRestoration = 'manual';
					}					
					location.reload();					
					return;

					toastr.success(
						"Preview has been updated with current configured layout.", 
						"Preview updated!", 
						{timeOut: 0, extendedTimeOut: 0, closeButton: true, closeDuration: 0}
					);

					setTimeout(function() {
						location.reload(); // reload page
					}, 1500);
				},
				error: function(response) {
					toastr.error(
						"Please try it again later.", 
						"Something went wrong!", 
						{timeOut: 0, extendedTimeOut: 0, closeButton: true, closeDuration: 0}
					);
				},
				complete: function() {
					previewButton.removeAttribute("data-beave-indicator");
				}
			});
		});
	};

	var handleExport = function() {
		exportButton.addEventListener("click", function(e) {
			e.preventDefault();

			toastr.success(
				"Process has been started and it may take a while.", 
				"Generating HTML!", 
				{timeOut: 0, extendedTimeOut: 0, closeButton: true, closeDuration: 0}
			);

			// Show progress
			exportButton.setAttribute("data-beave-indicator", "on");

			// Set form action value
			actionInput.value = "export";
			
			// Prepare form data
			var data = $(form).serialize();

			$.ajax({
				type: "POST",
				dataType: "html",
				url: url,
				data: data,
				success: function(response, status, xhr) {
					var timer = setInterval(function() {
						$("<iframe/>").attr({
							src: url + "?layout-builder[action]=export&download=1&output=" + response,
							style: "visibility:hidden;display:none",
						}).ready(function() {
							// Stop the timer
							clearInterval(timer);

							exportButton.removeAttribute("data-beave-indicator");
						}).appendTo("body");
					}, 3000);
				},
				error: function(response) {
					toastr.error(
						"Please try it again later.", 
						"Something went wrong!", 
						{timeOut: 0, extendedTimeOut: 0, closeButton: true, closeDuration: 0}
					);

					exportButton.removeAttribute("data-beave-indicator");
				},
			});
		});
	};

	var handleReset = function() {
		resetButton.addEventListener("click", function(e) {
			e.preventDefault();

			// Show progress
			resetButton.setAttribute("data-beave-indicator", "on");

			// Set form action value
			actionInput.value = "reset";
			
			// Prepare form data
			var data = $(form).serialize();

			$.ajax({
				type: "POST",
				dataType: "html",
				url: url,
				data: data,
				success: function(response, status, xhr) {
					if (history.scrollRestoration) {
						history.scrollRestoration = 'manual';
					}
					
					location.reload();					
					return;
					
					toastr.success(
						"Preview has been successfully reset and the page will be reloaded.", 
						"Reset Preview!", 
						{timeOut: 0, extendedTimeOut: 0, closeButton: true, closeDuration: 0}
					);

					setTimeout(function() {
						location.reload(); // reload page
					}, 1500);
				},
				error: function(response) {
					toastr.error(
						"Please try it again later.", 
						"Something went wrong!", 
						{timeOut: 0, extendedTimeOut: 0, closeButton: true, closeDuration: 0}
					);
				},
				complete: function() {
					resetButton.removeAttribute("data-beave-indicator");
				},
			});
		});
	};

	var handleThemeMode = function() {
		var checkLight = document.querySelector('#beave_layout_builder_theme_mode_light');
		var checkDark = document.querySelector('#beave_layout_builder_theme_mode_dark');
		var check = document.querySelector('#beave_layout_builder_theme_mode_' + BEAVEThemeMode.getMode());

		if (checkLight) {
			checkLight.addEventListener("click", function() {
				this.checked = true;
				this.closest('[data-beave-buttons="true"]').querySelector('.form-check-image.active').classList.remove('active');
				this.closest('.form-check-image').classList.add('active');
				BEAVEThemeMode.setMode('light');
			});
		}
		
		if (checkDark) {
			checkDark.addEventListener("click", function() {
				this.checked = true;
				this.closest('[data-beave-buttons="true"]').querySelector('.form-check-image.active').classList.remove('active');
				this.closest('.form-check-image').classList.add('active');
				BEAVEThemeMode.setMode('dark');
			});
		}

		if ( check ) {
			check.closest('.form-check-image').classList.add('active');
			check.checked = true;
		}
	}

	return {
		// Public functions
		init: function() {
			engage = document.querySelector('#beave_app_engage');
			engageToggleOn = document.querySelector('#beave_app_engage_toggle_on');
			engageToggleOff = document.querySelector('#beave_app_engage_toggle_off');
			engagePrebuiltsModal = document.querySelector('#beave_app_engage_prebuilts_modal');

			if ( engage && engagePrebuiltsModal) {
				handleEngagePrebuilts();
				handleEngagePrebuiltsViewMenu();
			}

			if ( engage && engageToggleOn && engageToggleOff ) {
				handleEngageToggle();
			}

            form = document.querySelector("#beave_app_layout_builder_form");

            if ( !form ) {
                return;
            }

            url = form.getAttribute("action");
            actionInput = document.querySelector("#beave_app_layout_builder_action");            
            previewButton = document.querySelector("#beave_app_layout_builder_preview");
            exportButton = document.querySelector("#beave_app_layout_builder_export");
            resetButton = document.querySelector("#beave_app_layout_builder_reset");			
    
			if ( previewButton ) {
				handlePreview();
			}

			if ( exportButton ) {
				handleExport();
			}

			if ( resetButton ) {
				handleReset();
			}

			handleThemeMode();
		}
	};
}();

// On document ready
BEAVEUtil.onDOMContentLoaded(function() {
    BEAVEAppLayoutBuilder.init();
});