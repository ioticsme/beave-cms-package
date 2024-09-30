"use strict";

// Class definition
var BEAVEPricingGeneral = function () {
    // Private variables
    var element;
	var planPeriodMonthButton;
	var planPeriodAnnualButton;

	var changePlanPrices = function(type) {
		var items = [].slice.call(element.querySelectorAll('[data-beave-plan-price-month]'));

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

    var handlePlanPeriodSelection = function(e) {

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

    // Public methods
    return {
        init: function () {
            element = document.querySelector('#beave_pricing');
			planPeriodMonthButton = element.querySelector('[data-beave-plan="month"]');
			planPeriodAnnualButton = element.querySelector('[data-beave-plan="annual"]');

            // Handlers
            handlePlanPeriodSelection();
        }
    }
}();

// On document ready
BEAVEUtil.onDOMContentLoaded(function() {
    BEAVEPricingGeneral.init();
});
