"use strict";

// Class definition
var BEAVESocialFeeds = function () {    
    // init variables
    var morePostsBtn = document.getElementById('beave_social_feeds_more_posts_btn');
    var morePosts = document.getElementById('beave_social_feeds_more_posts');
    var posts = document.getElementById('beave_social_feeds_posts');

    var postInput = document.getElementById('beave_social_feeds_post_input');
    var postBtn =  document.getElementById('beave_social_feeds_post_btn');
    var newPost = document.getElementById('beave_social_feeds_new_post');
    
    // Private functions
    var handleMorePosts = function () {
        // Show more click
        morePostsBtn.addEventListener('click', function (e) {
            // Cancel default behavior
            e.preventDefault();
            
            // Show indicator
            morePostsBtn.setAttribute('data-beave-indicator', 'on');

            // Disable button to avoid multiple click 
            morePostsBtn.disabled = true;
            
            // Simulate form submission process
            setTimeout(function() {
                // Hide loading indication
                morePostsBtn.removeAttribute('data-beave-indicator');

                // Enable button
				morePostsBtn.disabled = false;

                // Hide button
                morePostsBtn.classList.add('d-none');

                // Show card
                morePosts.classList.remove('d-none');

                // Scroll to
                BEAVEUtil.scrollTo(morePosts, 200);
            }, 1000);
        });
    }

    // Private functions
    var handleNewPost = function () {
        // Show more click
        postBtn.addEventListener('click', function (e) {
            // Cancel default behavior
            e.preventDefault();

            // Show indicator
            postBtn.setAttribute('data-beave-indicator', 'on');

            // Disable button to avoid multiple click 
            postBtn.disabled = true;
            
            // Simulate form submission process
            setTimeout(function() {
                // Hide loading indication
                postBtn.removeAttribute('data-beave-indicator');

                // Enable button
				postBtn.disabled = false;

                var message = postInput.value;
                var post = newPost.querySelector('.card').cloneNode(true);
                
                posts.prepend(post);

                if (message.length > 0) {
                    post.querySelector('[data-beave-post-element="content"]').innerHTML = message;
                }                

                // Scroll to post
                BEAVEUtil.scrollTo(post, 200);
            }, 1000);
        });
    }

    // Public methods
    return {
        init: function () {
            handleMorePosts();
            handleNewPost();
        }
    }
}();

// On document ready
BEAVEUtil.onDOMContentLoaded(function() {
    BEAVESocialFeeds.init();
});
