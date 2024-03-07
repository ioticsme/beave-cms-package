ArticleEditor.add('plugin', 'buttonlink', {
    translations: {
        en: {
            "buttonlink": {
                "button": "Button"
            }
        }
    },
    defaults: {
        classname: false
    },
    subscribe: {
        'popup.before.open': function() {
            if (this.opts.buttonlink.classname === false) return;

            var stack = this.app.popup.getStack();
            var name = stack.getName();

            if (name === 'link') {
                this._build(stack);
            }
        }
    },
    make: function() {
        this.app.popup.close();

        var $link = this.app.link.getLink();
        $link.addClass(this.opts.buttonlink.classname);

    },
    unmake: function() {
        this.app.popup.close();

        var $link = this.app.link.getLink();
        $link.removeClass(this.opts.buttonlink.classname);
    },

    // private
    _build: function(stack) {
        var $link = this.app.link.getLink();

        if ($link.length === 0) return;

        var items = stack.getItemsData();
        var item = { title: '## buttonlink.button ##', command: 'buttonlink.make' };
        var index = this.app.utils.getObjectIndex(items, 'unlink');

        if (this._hasClass($link)) {
            item = { title: '## buttonlink.button ##', command: 'buttonlink.unmake', active: true };
        }

        items = this.app.utils.insertToObject('buttonlink', item, items, index);
        stack.setItemsData(items);
    },
    _hasClass: function($link) {
        var arr = this.opts.buttonlink.classname.split(' ');
        var count = 0;
        for (var i = 0; i < arr.length; i++) {
            if ($link.hasClass(arr[i])) count++;
        }

        return (count === arr.length);
    }
});