"use strict";

// Class definition
var BEAVETimelineWidget24 = function () {
    // Private methods
    var handleActions = function() {
        var card = document.querySelector('#kt_list_widget_24');        
        
        if ( !card ) {
            return;
        }

        // Checkbox Handler
        BEAVEUtil.on(card, '[data-beave-element="follow"]', 'click', function (e) {
            if ( this.innerText === 'Following' ) {
                this.innerText = 'Follow';
                this.classList.add('btn-light-primary');
                this.classList.remove('btn-primary');
                this.blur();
            } else {
                this.innerText = 'Following';
                this.classList.add('btn-primary');
                this.classList.remove('btn-light-primary');
                this.blur();
            }
        });
    }

    // Public methods
    return {
        init: function () {           
            handleActions();             
        }   
    }
}();

// Webpack support
if (typeof module !== 'undefined') {
    module.exports = BEAVETimelineWidget24;
}

// On document ready
BEAVEUtil.onDOMContentLoaded(function() {
    BEAVETimelineWidget24.init();
}); 
