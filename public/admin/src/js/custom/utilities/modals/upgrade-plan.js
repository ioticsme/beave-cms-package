"use strict";

// Class definition
var BEAVEModalUpgradePlan = function () {
    // Private variables
    var modal;
	var planPeriodMonthButton;
	var planPeriodAnnualButton;
    var planUpgradeButton;

    // Private functions
	var changePlanPrices = function(type) {
		var items = [].slice.call(modal.querySelectorAll('[data-beave-plan-price-month]'));

		items.map(function (item) {
			var monthPrice = item.getAttribute('data-beave-plan-price-month');
			var annualPrice = item.getAttribute('data-beave-plan-price-annual');

			if ( type === 'month' ) {
				item.innerHTML = monthPrice;
			} else if ( type === 'annual' ) {
				item.innerHTML = annualPrice;
			}
		});
	}

    var handlePlanPeriodSelection = function() {
        // Handle period change
        planPeriodMonthButton.addEventListener('click', function (e) {
            e.preventDefault();

            planPeriodMonthButton.classList.add('active');
            planPeriodAnnualButton.classList.remove('active');

            changePlanPrices('month');
        });

		planPeriodAnnualButton.addEventListener('click', function (e) {
            e.preventDefault();

            planPeriodMonthButton.classList.remove('active');
            planPeriodAnnualButton.classList.add('active');
            
            changePlanPrices('annual');
        });
    }
    
    var handlePlanUpgrade = function () {
        if ( !planUpgradeButton ) {
            return;
        }

        planUpgradeButton.addEventListener('click', function (e) {
            e.preventDefault();

            var el = this;

            swal.fire({
                text: "Are you sure you would like to upgrade to selected plan ?",
                icon: "warning",
                buttonsStyling: false,
                showDenyButton: true,
                confirmButtonText: "Yes",
                denyButtonText: 'No',
                customClass: {
                    confirmButton: "btn btn-primary",
                    denyButton: "btn btn-light-danger"
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    el.setAttribute('data-beave-indicator', 'on');            
                    el.disabled = true;

                    setTimeout(function() {
                        Swal.fire({
                            text: 'Your subscription plan has been successfully upgraded', 
                            icon: 'success',
                            confirmButtonText: "Ok",
                            buttonsStyling: false,
                            customClass: {
                                confirmButton: "btn btn-light-primary"
                            }
                        }).then((result) => {
                            bootstrap.Modal.getInstance(modal).hide();
                        })

                    }, 2000);
                } 
            });            
        });
    }

    // Public methods
    return {
        init: function () {
            // Elements
            modal = document.querySelector('#beave_modal_upgrade_plan');

            if (!modal) {
				return;
			}

			planPeriodMonthButton = modal.querySelector('[data-beave-plan="month"]');
			planPeriodAnnualButton = modal.querySelector('[data-beave-plan="annual"]');
            planUpgradeButton = document.querySelector('#beave_modal_upgrade_plan_btn');

            // Handlers
            handlePlanPeriodSelection();
            handlePlanUpgrade();
            changePlanPrices();
        }
    }
}();

// On document ready
BEAVEUtil.onDOMContentLoaded(function() {
    BEAVEModalUpgradePlan.init();
});
