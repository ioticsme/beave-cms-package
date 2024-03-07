ArticleEditor.add('plugin', 'counter', {
    translations: {
        en: {
            "counter": {
                "words": "words",
                "chars": "chars"
            }
        }
    },
    subscribe: {
        'editor.change': function() {
            this._count();
        }
    },
    start: function() {
        this._count();
    },

    // private
    _count: function() {
        var words = 0, characters = 0, spaces = 0;
        var html = this.app.$element.val();

        html = this._clean(html)
        if (html !== '') {
            var arrWords = html.split(/\s+/);
            var arrSpaces = html.match(/\s/g);

            words = (arrWords) ? arrWords.length : 0;
            spaces = (arrSpaces) ? arrSpaces.length : 0;

            characters = html.replace(/\s+/g, ' ').length;
        }

        var data = { words: words, characters: characters, spaces: spaces };

        // broadcast
        this.app.broadcast('counter.count', data);

        // statusbar
        this.app.statusbar.add('words', this.lang.get('counter.words') + ': ' + data.words);
        this.app.statusbar.add('chars', this.lang.get('counter.chars') + ': ' + data.characters);
    },
    _clean: function(html) {
        html = html.replace(/<\/(.*?)>/gi, ' ');
        html = html.replace(/<(.*?)>/gi, '');
        html = html.replace(/\t/gi, '');
        html = html.replace(/\n|\r/gi, ' ');
        html = html.replace(/&nbsp;/g, '1');
        html = html.trim();
        html = this.app.utils.removeInvisibleChars(html);

        return html;
    }
});