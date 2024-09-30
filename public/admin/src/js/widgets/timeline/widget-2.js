"use strict";

// Class definition
var BEAVETimelineWidget2 = function () {
    // Private methods
    var handleCheckbox = function() {
        var card = document.querySelector('#beave_timeline_widget_2_card');        
        
        if (!card) {
            return;
        }

        // Checkbox Handler
        BEAVEUtil.on(card, '[data-beave-element="checkbox"]', 'change', function (e) {
            var check = this.closest('.form-check');
            var tr = this.closest('tr');
            var bullet = tr.querySelector('[data-beave-element="bullet"]');
            var status = tr.querySelector('[data-beave-element="status"]');

            if ( this.checked === true ) {
                check.classList.add('form-check-success');

                bullet.classList.remove('bg-primary');
                bullet.classList.add('bg-success');

                status.innerText = 'Done';
                status.classList.remove('badge-light-primary');
                status.classList.add('badge-light-success');
            } else {
                check.classList.remove('form-check-success');

                bullet.classList.remove('bg-success');
                bullet.classList.add('bg-primary');

                status.innerText = 'In Process';
                status.classList.remove('badge-light-success');
                status.classList.add('badge-light-primary');
            }
        });
    }

    // Public methods
    return {
        init: function () {           
            handleCheckbox();             
        }   
    }
}();

// Webpack support
if (typeof module !== 'undefined') {
    module.exports = BEAVETimelineWidget2;
}

// On document ready
BEAVEUtil.onDOMContentLoaded(function() {
    BEAVETimelineWidget2.init();
});


 