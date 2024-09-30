"use strict";

// Class definition
var BEAVEPosSystem = function () {
	var form;

    var moneyFormat = wNumb({
        mark: '.',
        thousand: ',',
        decimals: 2,
        prefix: '$',
    });

	var calculateTotals = function() {
        var items = [].slice.call(form.querySelectorAll('[data-beave-pos-element="item-total"]'));
        var total = 0;
        var tax = 12;
        var discount = 8;
        var grantTotal = 0;

        items.map(function (item) {
            total += moneyFormat.from(item.innerHTML);
        });

        grantTotal = total;
        grantTotal -= discount;
        grantTotal += tax * 8 / 100;

        form.querySelector('[data-beave-pos-element="total"]').innerHTML = moneyFormat.to(total); 
        form.querySelector('[data-beave-pos-element="grant-total"]').innerHTML = moneyFormat.to(grantTotal); 
    }

	var handleQuantity = function() {
		var dialers = [].slice.call(form.querySelectorAll('[data-beave-pos-element="item"] [data-beave-dialer="true"]'));

        dialers.map(function (dialer) {
            var dialerObject = BEAVEDialer.getInstance(dialer);

            dialerObject.on('beave.dialer.changed', function(){
                var quantity = parseInt(dialerObject.getValue());
                var item = dialerObject.getElement().closest('[data-beave-pos-element="item"]');
                var value = parseInt(item.getAttribute("data-beave-pos-item-price"));
                var total = quantity * value;

                item.querySelector('[data-beave-pos-element="item-total"]').innerHTML = moneyFormat.to(total);

                calculateTotals();
            });    
        });
	}

	return {
		// Public functions
		init: function () {
			// Elements
			form = document.querySelector('#beave_pos_form');

			handleQuantity();
		}
	};
}();

// On document ready
BEAVEUtil.onDOMContentLoaded(function () {
	BEAVEPosSystem.init();
});