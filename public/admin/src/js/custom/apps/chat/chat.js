"use strict";

// Class definition
var BEAVEAppChat = function () {
	// Private functions
	var handeSend = function (element) {
		if (!element) {
			return;
		}

		// Handle send
		BEAVEUtil.on(element, '[data-beave-element="input"]', 'keydown', function(e) {
			if (e.keyCode == 13) {
				handeMessaging(element);
				e.preventDefault();

				return false;
			}
		});

		BEAVEUtil.on(element, '[data-beave-element="send"]', 'click', function(e) {
			handeMessaging(element);
		});
	}

	var handeMessaging = function(element) {
		var messages = element.querySelector('[data-beave-element="messages"]');
		var input = element.querySelector('[data-beave-element="input"]');

        if (input.value.length === 0 ) {
            return;
        }

		var messageOutTemplate = messages.querySelector('[data-beave-element="template-out"]');
		var messageInTemplate = messages.querySelector('[data-beave-element="template-in"]');
		var message;
		
		// Show example outgoing message
		message = messageOutTemplate.cloneNode(true);
		message.classList.remove('d-none');
		message.querySelector('[data-beave-element="message-text"]').innerText = input.value;		
		input.value = '';
		messages.appendChild(message);
		messages.scrollTop = messages.scrollHeight;
		
		
		setTimeout(function() {			
			// Show example incoming message
			message = messageInTemplate.cloneNode(true);			
			message.classList.remove('d-none');
			message.querySelector('[data-beave-element="message-text"]').innerText = 'Thank you for your awesome support!';
			messages.appendChild(message);
			messages.scrollTop = messages.scrollHeight;
		}, 2000);
	}

	// Public methods
	return {
		init: function(element) {
			handeSend(element);
        }
	};
}();

// On document ready
BEAVEUtil.onDOMContentLoaded(function () {
	// Init inline chat messenger
    BEAVEAppChat.init(document.querySelector('#beave_chat_messenger'));

	// Init drawer chat messenger
	BEAVEAppChat.init(document.querySelector('#beave_drawer_chat_messenger'));
});
