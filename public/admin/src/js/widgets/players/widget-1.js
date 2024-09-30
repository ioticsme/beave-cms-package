"use strict";

// Class definition
var BEAVEPlayersWidget1 = function () {
    // Private methods
    var initPlayers = function() {
        // https://www.w3schools.com/jsref/dom_obj_audio.asp
        // Toggle Handler
        BEAVEUtil.on(document.body, '[data-beave-element="list-play-button"]', 'click', function (e) {
            var currentButton = this;

            var audio = document.querySelector('[data-beave-element="audio-track-1"]');
            var playIcon = this.querySelector('[data-beave-element="list-play-icon"]');
            var pauseIcon = this.querySelector('[data-beave-element="list-pause-icon"]');

            if (pauseIcon.classList.contains('d-none')) {
                audio.play();

                playIcon.classList.add('d-none');
                pauseIcon.classList.remove('d-none');
            } else {
                audio.pause();

                playIcon.classList.remove('d-none');
                pauseIcon.classList.add('d-none');
            }
            
            var buttons = [].slice.call(document.querySelectorAll('[data-beave-element="list-play-button"]'));
            buttons.map(function (button) {
                if (button !== currentButton) {
                    var playIcon = button.querySelector('[data-beave-element="list-play-icon"]');
                    var pauseIcon = button.querySelector('[data-beave-element="list-pause-icon"]');

                    playIcon.classList.remove('d-none');
                    pauseIcon.classList.add('d-none');
                }
            });
        });
    }

    // Public methods
    return {
        init: function () {
            initPlayers();
        }   
    }
}();

// Webpack support
if (typeof module !== 'undefined') {
    module.exports = BEAVEPlayersWidget1;
}

// Window load
window.addEventListener("load", function() {
    BEAVEPlayersWidget1.init();
}); 
        
        
        
           