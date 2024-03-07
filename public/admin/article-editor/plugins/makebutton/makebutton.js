ArticleEditor.add('plugin', 'makebutton', {
    translations: {
        en: {
            "makebutton": {
                "make-a-button": "Make a Button",
                "remove-button": "Remove button",
                "button": "Button"
            }
        }
    },
    defaults: {
        icon: '<svg height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="m13 3c1.6568542 0 3 1.34314575 3 3v4c0 1.6568542-1.3431458 3-3 3h-10c-1.65685425 0-3-1.3431458-3-3v-4c0-1.65685425 1.34314575-3 3-3zm0 2h-10c-.55228475 0-1 .44771525-1 1v4c0 .5522847.44771525 1 1 1h10c.5522847 0 1-.4477153 1-1v-4c0-.55228475-.4477153-1-1-1zm-8 2h6c.5522847 0 1 .44771525 1 1s-.4477153 1-1 1h-6c-.55228475 0-1-.44771525-1-1s.44771525-1 1-1z"/></svg>',
        items: false
    },
    start: function() {
        if (this.opts.makebutton.items === false) return;

        this.app.toolbar.add('makebutton', {
            title: '## makebutton.make-a-button ##',
            icon: this.opts.makebutton.icon,
            command: 'makebutton.toggle',
            blocks: {
                all: 'editable',
                except: ['code']
            },
            active: {
                tags: ['a']
            },
            position: { after: 'link' }
        });
    },
    toggle: function(params, button) {
        var obj = this.opts.makebutton.items;
        var items = {};
        for (var key in obj) {
            items[key] = obj[key];
            items[key].command = 'makebutton.set'
        }

        // remove
        items['remove'] = {
            title: '## makebutton.remove-button ##',
            divider: 'top',
            command: 'makebutton.remove'
        };

        this.app.popup.create('makebutton', { items: items });
        this.app.popup.open({ button: button });
    },
    set: function(params, item, name) {
        this.app.popup.close();

        var obj = this.opts.makebutton.items[name];
        var $link = this.app.link.getLink();

        if ($link.length === 0) {
            var nodes = this.app.inline.set({ tag: 'a', caret: 'after' });
            $link = this.dom(nodes[0]);
            $link.attr('href', '#');
            $link.text(this.lang.get('makebutton.button'));
        }

        this._removeClasses($link);
        $link.addClass(obj.params.classname);
    },
    remove: function() {
        this.app.popup.close();

        var $link = this.app.link.getLink();
        this._removeClasses($link);
    },

    // private
    _getClasses: function() {
        var classes = [];
        var obj = this.opts.makebutton.items;

        for (var key in obj) {
            classes.push(obj[key].params.classname);
        }

        return classes;
    },
    _removeClasses: function($link) {
        var classes = this._getClasses();
        for (var i = 0; i < classes.length; i++) {
            $link.removeClass(classes[i]);
        }
    }
});