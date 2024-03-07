ArticleEditor.add('plugin', 'variable', {
    translations: {
        en: {
            "blocks": {
                "variable": "Variable"
            },
            "variable": {
                "variable": "Variable"
            }
        }
    },
    defaults: {
        icon: '<svg height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="m8 0c4.418278 0 8 3.581722 8 8s-3.581722 8-8 8-8-3.581722-8-8 3.581722-8 8-8zm0 2c-3.3137085 0-6 2.6862915-6 6s2.6862915 6 6 6 6-2.6862915 6-6-2.6862915-6-6-6zm-.04375592 2c1.59851929 0 2.78098562.82644628 2.84667822 2.45730028h-1.72990447c-.01094876-.52892562-.4051042-.90358127-1.11677375-.90358127-.67882327 0-1.02918366.30853994-1.02918366.71625344 0 1.36639119 4.07293958.12121212 4.07293958 3.23966942 0 1.43250693-1.08392747 2.49035813-3.01090964 2.49035813-1.86128959 0-2.99996087-1.0688705-2.98901211-2.65564738h1.65326311c.03284629.6060606.51459183 1.05785128 1.39049282 1.05785128.72261831 0 1.14962004-.2754821 1.14962004-.76033062 0-1.43250689-3.99629825-.15426997-3.99629825-3.32782369 0-1.2892562.99633737-2.31404959 2.75908811-2.31404959z"/></svg>',
        items: ['email', 'name', 'lastname'],
        classname: 'arx-variable',
        template: {
            start: '[% ',
            end: ' %]'
        }
    },
    subscribe: {
        'editor.parse': function(event) {
            this._parse(event);
        },
        'editor.unparse': function(event) {
            this._unparse(event);
        }
    },
    start: function() {
        this.app.toolbar.add('variable', {
            title: '## variable.variable ##',
            icon: this.opts.variable.icon,
            command: 'variable.popup',
            blocks: {
                all: 'editable',
                except: ['code'],
                types: ['variable']
            },
            active: {
                types: ['variable']
            }
        });
    },
    popup: function(params, button) {
        var items = {};
        var vars = this.opts.variable.items;
        var instance = this.app.block.get();
        var activeKey = (instance.getType('variable')) ? instance.getHtml() : false;

        for (var i = 0; i < vars.length; i++) {
            items[i] = {
                title: vars[i],
                command: 'variable.insert',
                active: (activeKey === vars[i]),
                params: {
                    variable: vars[i]
                }
            };
        }

        this.app.popup.create('variable', { items: items });
        this.app.popup.open({ button: button });
    },
    insert: function(params) {
        this.app.popup.close();

        var instance = this.app.create('block.variable');
        instance.setHtml(params.variable);

        // insert
        this.app.block.add({
            instance: instance,
            caret: 'after'
        });
    },


    // private
    _parse: function(event) {
        var html = event.get('html');
        var start = this.opts.variable.template.start;
        var end = this.opts.variable.template.end;
        var htmlStart = '<span data-' + this.prefix + '-type="variable">'
        var htmlEnd = '</span>';
        var storedLinks = [];
        var re = new RegExp(this.app.utils.escapeRegExp(start) + '(.*?)' + this.app.utils.escapeRegExp(end), 'gi');
        var match = html.match(re);
        if (match != null) {
            html = this._storeLinks(html, storedLinks);
            var matched, replacer;
            for (var i = 0; i < match.length; i++) {
                matched =  match[i].replace(start, '').replace(end, '');
                replacer = htmlStart + matched + htmlEnd;
                html = html.replace(match[i], replacer);
            }
            html = this._restoreLinks(html, storedLinks);
        }

        event.set('html', html);
    },
    _unparse: function(event) {
        var html = event.get('html');
        var start = this.opts.variable.template.start;
        var end = this.opts.variable.template.end;

        // find
        html = this.app.utils.wrap(html, function($w) {
            $w.find('.' + this.opts.variable.classname).replaceWith(function(node) {
                return start + node.innerHTML + end;
            });
        }.bind(this));

        event.set('html', html);
    },
    _storeLinks: function(html, storedLinks) {
        var links = html.match(new RegExp('<a[^>]*>', 'gi'));
        if (links === null) return html;

        for (var i = 0; i < links.length; i++) {
            html = html.replace(links[i], '#####xstartvarlinkszz' + i + 'xendvarlinkstzz#####');
            storedLinks.push(links[i]);
        }

        return html;
    },
    _restoreLinks: function(html, storedLinks) {
        for (var i = 0; i < storedLinks.length; i++) {
            html = html.replace('#####xstartvarlinkszz' + i + 'xendvarlinkstzz#####', storedLinks[i]);
        }

        return html;
    }
});