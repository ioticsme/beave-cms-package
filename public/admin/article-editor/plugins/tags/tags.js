// Icon
ArticleEditor.iconTags = '<svg height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="m13.454 1c.853089 0 1.546.69366173 1.546 1.546v4.36371429c0 .56592472-.2790572 1.24002756-.6652017 1.62429902l-5.78655018 6.01223499c-.60256278.6050023-1.58507632.6050023-2.18621204.0014299l-4.90828435-4.90828722c-.60500231-.60256278-.60500231-1.58507632.01233983-2.19971875l5.98566032-5.75877764c.39921147-.40082772 1.07325621-.68089459 1.63853383-.68089459zm-.454 2h-3.90971429c-.0333803 0-.19751184.06819697-.23666299.10718491l-5.65962272 5.44381509 4.254 4.254 5.4606089-5.67296241c.0188278-.01875188.0660214-.12740905.0841458-.18802473l.0072453-.03429857zm-2 1c.553 0 1 .447 1 1s-.447 1-1 1-1-.447-1-1 .447-1 1-1z"/></svg>';

// Block
ArticleEditor.add('block', 'block.tags', {
    mixins: ['block'],
    type: 'tags',
    parser: {
        tag: 'div',
        parse: function($el) {
            return ($el.hasClass('tags')) ? 'tags' : false;
        }
    },
    toolbar: {
        add: { command: 'addbar.popup', title: '## buttons.add ##' },
        tags: { command: 'tags.edit', title: '## buttons.settings ##', icon: ArticleEditor.iconTags }
    },
    control: {
        trash: { command: 'block.remove', title: '## buttons.delete ##' },
        duplicate: { command: 'block.duplicate', title: '## buttons.duplicate ##'  }
    },
    create: function() {
        return this.dom('<div>').addClass('tags');
    }
});

// Plugin
ArticleEditor.add('plugin', 'tags', {
    translations: {
        en: {
            "tags": {
                "tags": "Tags",
                "add": "Add",
                "save": "Save",
                "cancel": "Cancel",
                "label": "Add comma-separated tags"
            },
             "blocks": {
                 "tags": "Tags"
             }
        }
    },
    popups: {
        add: {
            title: '## tags.tags ##',
            width: '100%',
            form: {
                tags: { label: '## tags.label ##', type: 'textarea', rows: 4 }
            },
            footer: {
                insert: { title: '## tags.add ##', command: 'tags.insert', type: 'primary' },
                cancel: { title: '## tags.cancel ##', command: 'popup.close' }
            }
        },
        edit: {
            title: '## tags.tags ##',
            width: '100%',
            form: {
                tags: { label: '## tags.label ##', type: 'textarea', rows: 4 }
            },
            footer: {
                save: { title: '## tags.save ##', command: 'tags.save', type: 'primary' },
                cancel: { title: '## tags.cancel ##', command: 'popup.close' }
            }
        }
    },
    defaults: {
        classname: 'tag'
    },
    start: function() {
        this.app.addbar.add('tags', {
            title: '## blocks.tags ##',
            icon: ArticleEditor.iconTags,
            command: 'tags.popup'
        });
    },
    popup: function() {
        var stack = this.app.popup.add('tags', this.popups.add);
        stack.open({ focus: 'tags' });
    },
    edit: function(params, button) {
        var stack = this.app.popup.create('tags', this.popups.edit);

        // data
        var instance = this.app.block.get();
        var $block = instance.getBlock();

        var tags = [];
        $block.find('.' + this.opts.tags.classname).each(function($node) {
            tags.push($node.html());
        });

        // set
        stack.setData({ tags: tags.join(', ') });

        // open
        this.app.popup.open({ button: button, focus: 'tags' });
    },
    save: function(stack) {
        var current = this.app.block.get();
        var $block = current.getBlock();
        $block.html('');

        var instance = this._buildInstance(stack, current);
        if (!instance) {
            current.remove();
        }
    },
    insert: function(stack) {
        var instance = this._buildInstance(stack);

        // insert
        if (instance) {
            this.app.block.add({ instance: instance });
        }
    },

    // private
    _buildInstance: function(stack, instance) {
        this.app.popup.close();

        var data = stack.getData();
        var str = data.tags.trim();

        if (str === '') {
            return;
        }

        // create
        var instance = instance || this.app.create('block.tags');
        var $block = instance.getBlock();

        // build
        var tags = str.split(',');
        for (var i = 0; i < tags.length; i++) {
            var tag = tags[i].trim();
            var $tag = this.dom('<span>').addClass(this.opts.tags.classname).html(tag);

            $block.append($tag);
        }

        return instance;
    }
});