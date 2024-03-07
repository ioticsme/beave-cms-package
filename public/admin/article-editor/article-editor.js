/*
    Article Editor JS
    Version 2.4.8
    Updated: December 13, 2023

    http://imperavi.com/article/

    Copyright (c) 2009-2023, Imperavi Ltd.
    License: http://imperavi.com/article/license/
*/
if (typeof CodeMirror === 'undefined') { var CodeMirror; }
(function() {
// Version 2.0
var Ajax = {};

Ajax.settings = {};
Ajax.post = function(options) { return new AjaxRequest('post', options); };
Ajax.get = function(options) { return new AjaxRequest('get', options); };
Ajax.request = function(method, options) { return new AjaxRequest(method, options); };

var AjaxRequest = function(method, options) {
    var defaults = {
        method: method,
        url: '',
        before: function() {},
        success: function() {},
        error: function() {},
        data: false,
        async: true,
        headers: {}
    };

    this.p = this.extend(defaults, options);
    this.p = this.extend(this.p, Ajax.settings);
    this.p.method = this.p.method.toUpperCase();

    this.prepareData();

    this.xhr = new XMLHttpRequest();
    this.xhr.open(this.p.method, this.p.url, this.p.async);

    this.setHeaders();

    var before = (typeof this.p.before === 'function') ? this.p.before(this.xhr) : true;
    if (before !== false) {
        this.send();
    }
};

AjaxRequest.prototype = {
    extend: function(obj1, obj2) {
        if (obj2) {
            Object.keys(obj2).forEach(function(key) {
                obj1[key] = obj2[key];
            });
        }
        return obj1;
    },
    prepareData: function() {
        if (['POST', 'PUT'].indexOf(this.p.method) !== -1 && !this.isFormData()) this.p.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        if (typeof this.p.data === 'object' && !this.isFormData()) this.p.data = this.toParams(this.p.data);
        if (this.p.method === 'GET') {
            var sign = (this.p.url.search(/\?/) !== -1) ? '&' : '?';
            this.p.url = (this.p.data) ? this.p.url + sign + this.p.data : this.p.url;
        }
    },
    setHeaders: function() {
        this.xhr.setRequestHeader('X-Requested-With', this.p.headers['X-Requested-With'] || 'XMLHttpRequest');
        Object.keys(this.p.headers).forEach(function(key) {
            this.xhr.setRequestHeader(key, this.p.headers[key]);
        }.bind(this));
    },
    isFormData: function() {
        return (typeof window.FormData !== 'undefined' && this.p.data instanceof window.FormData);
    },
    isComplete: function() {
        return !(this.xhr.status < 200 || (this.xhr.status >= 300 && this.xhr.status !== 304));
    },
    send: function() {
        if (this.p.async) {
            this.xhr.onload = this.loaded.bind(this);
            this.xhr.send(this.p.data);
        }
        else {
            this.xhr.send(this.p.data);
            this.loaded.call(this);
        }
    },
    loaded: function() {
        var response;
        if (this.isComplete()) {
            response = this.parseResponse();
            if (typeof this.p.success === 'function') this.p.success(response, this.xhr);
        }
        else {
            response = this.parseResponse();
            if (typeof this.p.error === 'function') this.p.error(response, this.xhr, this.xhr.status);
        }
    },
    parseResponse: function() {
        var response = this.xhr.response;
        var json = this.parseJson(response);
        return (json) ? json : response;
    },
    parseJson: function(str) {
        try {
            var o = JSON.parse(str);
            if (o && typeof o === 'object') {
                return o;
            }

        } catch (e) {
            return false;
        }

        return false;
    },
    toParams: function (obj) {
        return Object.keys(obj).map(
            function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]); }
        ).join('&');
    }
};
// Version 2.0
var DomCache = [0];
var DomExpando = 'data' + new Date().getTime();

var Dom = function(selector, context) {
    return this.parse(selector, context);
};

Dom.ready = function(fn) {
    document.addEventListener('DOMContentLoaded', fn);
};

Dom.prototype = {
    get length() {
        return this.nodes.length;
    },
    parse: function(s, c) {
        var n;
        var rehtml = /^\s*<(\w+|!)[^>]*>/;

        if (!s) {
            n = [];
        }
        else if (s instanceof Dom) {
            this.nodes = s.nodes;
            return s;
        }
        else if (rehtml.test(s)) {
            n = this.create(s);
        }
        else if (typeof s !== 'string') {
            if (s.nodeType && s.nodeType === 11) n = s.childNodes;
            else n = (s.nodeType || this._isWindowNode(s)) ? [s] : s;
        }
        else {
            n = this._query(s, c);
        }

        this.nodes = this._slice(n);
    },
    create: function(html) {
        if (/^<(\w+)\s*\/?>(?:<\/\1>|)$/.test(html)) {
            return [document.createElement(RegExp.$1)];
        }

        var elmns = [];
        var c = document.createElement('div');
        c.innerHTML = html;
        for (var i = 0, l = c.childNodes.length; i < l; i++) {
            elmns.push(c.childNodes[i]);
        }

        return elmns;
    },

    // dataset/dataget
    dataset: function(key, value) {
        return this.each(function($node) {
            DomCache[this.dataindex($node.get())][key] = value;
        });
    },
    dataget: function(key) {
        return DomCache[this.dataindex(this.get())][key];
    },
    dataindex: function(el) {
        var index = el[DomExpando];
        var nextIndex = DomCache.length;

        if (!index) {
            index = nextIndex;
            if (el) el[DomExpando] = nextIndex;
            DomCache[index] = {};
        }

        return index;
    },

    // add
    add: function(n) {
        this.nodes = this.nodes.concat(this._array(n));
        return this;
    },

    // get
    get: function(index) {
        return this.nodes[(index || 0)] || false;
    },
    getAll: function() {
        return this.nodes;
    },
    eq: function(index) {
        return new Dom(this.nodes[index]);
    },
    first: function() {
        return new Dom(this.nodes[0]);
    },
    last: function() {
        return new Dom(this.nodes[this.nodes.length - 1]);
    },
    contents: function() {
        return this.get().childNodes;
    },

    // loop
    each: function(fn) {
        var len = this.nodes.length;
        for (var i = 0; i < len; i++) {
            fn.call(this, new Dom(this.nodes[i]), i);
        }

        return this;
    },

    // traversing
    is: function(s) {
        return (this.filter(s).length > 0);
    },
    filter: function (s) {
        var fn;
        if (s === undefined) {
            return this;
        }
        else if (typeof s === 'function') {
            fn = function(node) { return s(new Dom(node)); };
        }
        else {
            fn = function(node) {
                if ((s && s.nodeType) || s instanceof Node) {
                    return (s === node);
                }
                else {
                    node.matches = node.matches || node.msMatchesSelector || node.webkitMatchesSelector;
                    return (node.nodeType === 1) ? node.matches(s || '*') : false;
                }
            };
        }

        return new Dom(this.nodes.filter.call(this.nodes, fn));
    },
    not: function(filter) {
        return this.filter(function(node) { return !new Dom(node).is(filter || true); });
    },
    find: function(s) {
        var n = [];
        this.each(function($n) {
            var node = $n.get();
            var ns = this._query(s, node);
            for (var i = 0; i < ns.length; i++) {
                n.push(ns[i]);
            }
        });

        return new Dom(n);
    },
    children: function(s) {
        var n = [];
        this.each(function($n) {
            var node = $n.get();
            if (node.children) {
                var ns = node.children;
                for (var i = 0; i < ns.length; i++) {
                    n.push(ns[i]);
                }
            }
        });

        return new Dom(n).filter(s);
    },
    parent: function(s) {
        var node = this.get();
        var p = (node.parentNode) ? node.parentNode : false;
        return (p) ? new Dom(p).filter(s) : new Dom();
    },
    parents: function(s, c) {
        c = this._context(c);

        var n = [];
        this.each(function($n) {
            var node = $n.get();
            var p = node.parentNode;
            while (p && p !== c) {
                if (s) {
                    if (new Dom(p).is(s)) { n.push(p); }
                }
                else {
                    n.push(p);
                }

                p = p.parentNode;
            }
        });

        return new Dom(n);
    },
    closest: function(s, c) {
        c = this._context(c);

        var n = [];
        var isNode = (s && s.nodeType);
        this.each(function($n) {
            var node = $n.get();
            do {
                if (node && ((isNode && node === s) || new Dom(node).is(s))) {
                    return n.push(node);
                }
            } while ((node = node.parentNode) && node !== c);
        });

        return new Dom(n);
    },
    next: function(s) {
        return this._sibling(s, 'nextSibling');
    },
    nextElement: function(s) {
        return this._sibling(s, 'nextElementSibling');
    },
    prev: function(s) {
        return this._sibling(s, 'previousSibling');
    },
    prevElement: function(s) {
        return this._sibling(s, 'previousElementSibling');
    },

    // css
    css: function(name, value) {
        if (value === undefined && (typeof name !== 'object')) {
            var node = this.get();
            if (name === 'width' || name === 'height') {
                return (node.style) ? this._getHeightOrWidth(name) + 'px' : undefined;
            }
            else {
                return (node.style) ? getComputedStyle(node, null)[name] : undefined;
            }
        }

        // set
        return this.each(function($n) {
            var node = $n.get();
            var o = {};
            if (typeof name === 'object') o = name;
            else o[name] = value;

            for (var key in o) {
                if (node.style) node.style[key] = o[key];
            }
        });
    },

    // attr
    attr: function(name, value, data) {
        data = (data) ? 'data-' : '';

        if (typeof value === 'undefined' && (typeof name !== 'object')) {
            var node = this.get();
            if (node && node.nodeType !== 3) {
                return (name === 'checked') ? node.checked : this._boolean(node.getAttribute(data + name));
            }
            else {
                return;
            }
        }

        // set
        return this.each(function($n) {
            var node = $n.get();
            var o = {};
            if (typeof name === 'object') o = name;
            else o[name] = value;

            for (var key in o) {
                if (node.nodeType !== 3) {
                    if (key === 'checked') node.checked = o[key];
                    else node.setAttribute(data + key, o[key]);
                }
            }
        });
    },
    data: function(name, value) {
        if (name === undefined || name === true) {
            var reDataAttr = /^data-(.+)$/;
            var attrs = this.get().attributes;

            var data = {};
            var replacer = function (g) { return g[1].toUpperCase(); };

            for (var key in attrs) {
                if (attrs[key] && reDataAttr.test(attrs[key].nodeName)) {
                    var dataName = attrs[key].nodeName.match(reDataAttr)[1];
                    var val = attrs[key].value;
                    if (name !== true) {
                        dataName = dataName.replace(/-([a-z])/g, replacer);
                    }

                    if (val.search(/^{/) !== -1) val = this._object(val);
                    else val = (this._number(val)) ? parseFloat(val) : this._boolean(val);

                    data[dataName] = val;
                }
            }

            return data;
        }

        return this.attr(name, value, true);
    },
    val: function(value) {
        if (value === undefined) {
            var el = this.get();
            if (el.type && el.type === 'checkbox') return el.checked;
            else return el.value;
        }

        return this.each(function($n) {
            var el = $n.get();
            if (el.type && el.type === 'checkbox') el.checked = value;
            else el.value = value;
        });
    },
    removeAttr: function(value) {
        return this.each(function($n) {
            var node = $n.get();
            var fn = function(name) { if (node.nodeType !== 3) node.removeAttribute(name); };
            value.split(' ').forEach(fn);
        });
    },

    // class
    addClass: function(value) {
        return this._eachClass(value, 'add');
    },
    removeClass: function(value) {
        return this._eachClass(value, 'remove');
    },
    toggleClass: function(value) {
        return this._eachClass(value, 'toggle');
    },
    hasClass: function(value) {
        var node = this.get();
        return (node.classList) ? node.classList.contains(value) : false;
    },

    // html & text
    empty: function() {
        return this.each(function($n) { $n.get().innerHTML = ''; });
    },
    html: function(html) {
        return (html === undefined) ? (this.get().innerHTML || '') : this.empty().append(html);
    },
    text: function(text) {
        return (text === undefined) ? (this.get().textContent || '') : this.each(function($n) { $n.get().textContent = text; });
    },

    // manipulation
    after: function(html) {
        return this._inject(html, function(frag, node) {
            if (typeof frag === 'string') {
                node.insertAdjacentHTML('afterend', frag);
            }
            else {
                if (node.parentNode !== null) {
                    for (var i = frag instanceof Node ? [frag] : this._array(frag).reverse(), s = 0; s < i.length; s++) {
                        node.parentNode.insertBefore(i[s], node.nextSibling);
                    }
                }
            }

            return node;
        });
    },
    before: function(html) {
        return this._inject(html, function(frag, node) {
            if (typeof frag === 'string') {
                node.insertAdjacentHTML('beforebegin', frag);
            }
            else {
                var elms = (frag instanceof Node) ? [frag] : this._array(frag);
                for (var i = 0; i < elms.length; i++) {
                    node.parentNode.insertBefore(elms[i], node);
                }
            }

            return node;
        });
    },
    append: function(html) {
        return this._inject(html, function(frag, node) {
            if (typeof frag === 'string' || typeof frag === 'number') {
                node.insertAdjacentHTML('beforeend', frag);
            }
            else {
                var elms = (frag instanceof Node) ? [frag] : this._array(frag);
                for (var i = 0; i < elms.length; i++) {
                    node.appendChild(elms[i]);
                }
            }

            return node;
        });
    },
    prepend: function(html) {
        return this._inject(html, function(frag, node) {
            if (typeof frag === 'string' || typeof frag === 'number') {
                node.insertAdjacentHTML('afterbegin', frag);
            }
            else {
                var elms = (frag instanceof Node) ? [frag] : this._array(frag).reverse();
                for (var i = 0; i < elms.length; i++) {
                    node.insertBefore(elms[i], node.firstChild);
                }
            }

            return node;
        });
    },
    wrap: function(html) {
        return this._inject(html, function(frag, node) {
            var wrapper = (typeof frag === 'string' || typeof frag === 'number') ? this.create(frag)[0] : (frag instanceof Node) ? frag : this._array(frag)[0];

            if (node.parentNode) {
                node.parentNode.insertBefore(wrapper, node);
            }

            wrapper.appendChild(node);
            return wrapper;
        });
    },
    unwrap: function() {
        return this.each(function($n) {
            var node = $n.get();
            var docFrag = document.createDocumentFragment();
            while (node.firstChild) {
                var child = node.removeChild(node.firstChild);
                docFrag.appendChild(child);
            }

            node.parentNode.replaceChild(docFrag, node);
        });
    },
    replaceWith: function(html) {
        return this._inject(html, function(frag, node) {
            var docFrag = document.createDocumentFragment();
            var elms = (typeof frag === 'string' || typeof frag === 'number') ? this.create(frag) : (frag instanceof Node) ? [frag] : this._array(frag);

            for (var i = 0; i < elms.length; i++) {
                docFrag.appendChild(elms[i]);
            }

            var result = docFrag.childNodes[0];
            if (node.parentNode) {
                node.parentNode.replaceChild(docFrag, node);
            }

            return result;
        });
    },
    remove: function() {
        return this.each(function($n) {
            var node = $n.get();
            if (node.parentNode) node.parentNode.removeChild(node);
        });
    },
    clone: function(events) {
        var n = [];
        this.each(function($n) {
            var node = $n.get();
            var copy = this._clone(node);
            if (events) copy = this._cloneEvents(node, copy);
            n.push(copy);
        });

        return new Dom(n);
    },

    // show/hide
    show: function() {
        return this.each(function($n) {
            var node = $n.get();
            if (!node.style || !this._hasDisplayNone(node)) return;

            var target = node.getAttribute('domTargetShow');
            node.style.display = (target) ? target : 'block';
            node.removeAttribute('domTargetShow');

        }.bind(this));
    },
    hide: function() {
        return this.each(function($n) {
            var node = $n.get();
            if (!node.style || this._hasDisplayNone(node)) return;

            var display = node.style.display;
            if (display !== 'block') node.setAttribute('domTargetShow', display);
            node.style.display = 'none';
        });
    },

    // dimensions
    scrollTop: function(value) {
        var node = this.get();
        var isWindow = this._isWindowNode(node);
        var isDocument = (node.nodeType === 9);
        var el = (isDocument) ? (node.scrollingElement || node.body.parentNode || node.body || node.documentElement) : node;

        if (typeof value !== 'undefined') {
            value = parseInt(value);
            if (isWindow) node.scrollTo(0, value);
            else el.scrollTop = value;
            return;
        }

        return (isWindow) ? node.pageYOffset : el.scrollTop;
    },
    offset: function() {
        return this._getPos('offset');
    },
    position: function() {
        return this._getPos('position');
    },
    width: function(value) {
        return (value !== undefined) ? this.css('width', parseInt(value) + 'px') : this._getSize('width', 'Width');
    },
    height: function(value) {
        return (value !== undefined) ? this.css('height', parseInt(value) + 'px') : this._getSize('height', 'Height');
    },
    outerWidth: function() {
        return this._getSize('width', 'Width', 'outer');
    },
    outerHeight: function() {
        return this._getSize('height', 'Height', 'outer');
    },
    innerWidth: function() {
        return this._getSize('width', 'Width', 'inner');
    },
    innerHeight: function() {
        return this._getSize('height', 'Height', 'inner');
    },

    // events
    click: function() {
        return this._trigger('click');
    },
    focus: function() {
        return this._trigger('focus');
    },
    blur: function() {
        return this._trigger('blur');
    },
    on: function(names, handler, one) {
        return this.each(function($n) {
            var node = $n.get();
            var events = names.split(' ');
            for (var i = 0; i < events.length; i++) {
                var event = this._getEventName(events[i]);
                var namespace = this._getEventNamespace(events[i]);

                handler = (one) ? this._getOneHandler(handler, names) : handler;
                node.addEventListener(event, handler);

                node._e = node._e || {};
                node._e[namespace] = node._e[namespace] || {};
                node._e[namespace][event] = node._e[namespace][event] || [];
                node._e[namespace][event].push(handler);
            }

        });
    },
    one: function(events, handler) {
        return this.on(events, handler, true);
    },
    off: function(names, handler) {
        var testEvent = function(name, key, event) { return (name === event); };
        var testNamespace = function(name, key, event, namespace) { return (key === namespace); };
        var testEventNamespace = function(name, key, event, namespace) { return (name === event && key === namespace); };
        var testPositive = function() { return true; };

        if (names === undefined) {
            // all
            return this.each(function($n) {
                this._offEvent($n.get(), false, false, handler, testPositive);
            });
        }

        return this.each(function($n) {
            var node = $n.get();
            var events = names.split(' ');

            for (var i = 0; i < events.length; i++) {
                var event = this._getEventName(events[i]);
                var namespace = this._getEventNamespace(events[i]);

                // 1) event without namespace
                if (namespace === '_events') this._offEvent(node, event, namespace, handler, testEvent);
                // 2) only namespace
                else if (!event && namespace !== '_events') this._offEvent(node, event, namespace, handler, testNamespace);
                // 3) event + namespace
                else this._offEvent(node, event, namespace, handler, testEventNamespace);
            }
        });
    },

    // form
    serialize: function(asObject) {
        var obj = {};
        var elms = this.get().elements;
        for (var i = 0; i < elms.length; i++) {
            var el = elms[i];
            if (/(checkbox|radio)/.test(el.type) && !el.checked) continue;
            if (!el.name || el.disabled || el.type === 'file') continue;

            if (el.type === 'select-multiple') {
                for (var z = 0; z < el.options.length; z++) {
                    var opt = el.options[z];
                    if (opt.selected) obj[el.name] = opt.value;
                }
            }

            obj[el.name] = (this._number(el.value)) ? parseFloat(el.value) : this._boolean(el.value);
        }

        return (asObject) ? obj : this._params(obj);
    },

    // animation
    scroll: function() {
        this.get().scrollIntoView({ behavior: 'smooth' });
    },
    fadeIn: function(speed, fn) {
        var anim = this._anim(speed, fn, 500);

        return this.each(function($n) {
            $n.css({ 'display': 'block', 'opacity': 0, 'animation': 'fadeIn ' + anim.speed + 's ease-in-out' }).removeClass('hidden');
            $n.one('animationend', function() {
                $n.css({ 'opacity': '', 'animation': '' });
                if (anim.fn) anim.fn($n);
            });
        });
    },
    fadeOut: function(speed, fn) {
        var anim = this._anim(speed, fn, 300);

        return this.each(function($n) {
            $n.css({ 'opacity': 1, 'animation': 'fadeOut ' + anim.speed + 's ease-in-out' });
            $n.one('animationend', function() {
                $n.css({ 'display': 'none', 'opacity': '', 'animation': '' });
                if (anim.fn) anim.fn($n);
            });
        });
    },
    slideUp: function(speed, fn) {
        var anim = this._anim(speed, fn, 300);

        return this.each(function($n) {
            $n.height($n.height());
            $n.css({ 'overflow': 'hidden', 'animation': 'slideUp ' + anim.speed + 's ease-out' });
            $n.one('animationend', function() {
                $n.css({ 'display': 'none', 'height': '', 'animation': '' });
                if (anim.fn) anim.fn($n);
            });
        });
    },
    slideDown: function(speed, fn) {
        var anim = this._anim(speed, fn, 400);

        return this.each(function($n) {
            $n.height($n.height());
            $n.css({ 'display': 'block', 'overflow': 'hidden', 'animation': 'slideDown ' + anim.speed + 's ease-in-out' }).removeClass('hidden');
            $n.one('animationend', function() {
                $n.css({ 'overflow': '', 'height': '', 'animation': '' });
                if (anim.fn) anim.fn($n);
            });
        });
    },

    // private
    _queryContext: function(s, c) {
        c = this._context(c);
        return (c.nodeType !== 3 && typeof c.querySelectorAll === 'function') ? c.querySelectorAll(s) : [];
    },
    _query: function(s, c) {
        var d = document;
        if (c) {
            return this._queryContext(s, c);
        }
        else if (/^[.#]?[\w-]*$/.test(s)) {
            if (s[0] === '#') {
                var el = d.getElementById(s.slice(1));
                return el ? [el] : [];
            }
            if (s[0] === '.') {
                return d.getElementsByClassName(s.slice(1));
            }

            return d.getElementsByTagName(s);
        }

        return d.querySelectorAll(s);
    },
    _context: function(c) {
        return (!c) ? document : ((typeof c === 'string') ? document.querySelector(c) : c);
    },
    _sibling: function(s, method) {
        var isNode = (s && s.nodeType);
        var sibling;

        this.each(function($n) {
            var node = $n.get();
            do {
                node = node[method];
                 if (node && ((isNode && node === s) || new Dom(node).is(s))) {
                    sibling = node;
                    return;
                }
            }
            while (node);
        });

        return new Dom(sibling);
    },
    _slice: function(o) {
        return (!o || o.length === 0) ? [] : (o.length) ? [].slice.call(o.nodes || o) : [o];
    },
    _array: function(o) {
        if (o === undefined) return [];
        else if (o instanceof NodeList) {
            var arr = [];
            for (var i = 0; i < o.length; i++) {
                arr[i] = o[i];
            }

            return arr;
        }

        return (o instanceof Dom) ? o.nodes : o;
    },
    _object: function(str) {
        var jsonStr = str.replace(/(\w+:)|(\w+ :)/g, function(matchedStr) {
            return '"' + matchedStr.substring(0, matchedStr.length - 1) + '":';
        });

        return JSON.parse(jsonStr);
    },
    _params: function(obj) {
        var params = '';
        Object.keys(obj).forEach(function(key) {
            params += '&' + this._encodeUri(key) + '=' + this._encodeUri(obj[key]);
        }.bind(this));

        return params.replace(/^&/, '');
    },
    _boolean: function(str) {
        if (str === 'true') return true;
        else if (str === 'false') return false;

        return str;
    },
    _number: function(str) {
        return !isNaN(str) && !isNaN(parseFloat(str));
    },
    _inject: function(html, fn) {
        var len = this.nodes.length;
        var nodes = [];
        while (len--) {
            var res = (typeof html === 'function') ? html.call(this, this.nodes[len]) : html;
            var el = (len === 0) ? res : this._clone(res);
            var node = fn.call(this, el, this.nodes[len]);

            if (node) {
                if (node.dom) nodes.push(node.get());
                else nodes.push(node);
            }
        }

        return new Dom(nodes);
    },
    _clone: function(node) {
        if (typeof node === 'undefined') return;
        if (typeof node === 'string') return node;
        else if (node instanceof Node || node.nodeType) return node.cloneNode(true);
        else if ('length' in node) {
            return [].map.call(this._array(node), function(el) { return el.cloneNode(true); });
        }
    },
    _cloneEvents: function(node, copy) {
        var events = node._e;
        if (events) {
            copy._e = events;
            for (var name in events._events) {
                if (events._events.hasOwnProperty(name)) {
                    for (var i = 0; i < events._events[name].length; i++) {
                        copy.addEventListener(name, events._events[name][i]);
                    }
                }
            }
        }

        return copy;
    },
    _trigger: function(name) {
        var node = this.get();
        if (node && node.nodeType !== 3) node[name]();
        return this;
    },
    _encodeUri: function(str) {
        return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
    },
    _getSize: function(name, cname) {
        var el = this.get();
        var value = 0;
        if (el.nodeType === 3) {
            value = 0;
        }
        else if (el.nodeType === 9) {
            value = this._getDocSize(el, cname);
        }
        else if (this._isWindowNode(el)) {
            value = window['inner' + cname];
        }
        else {
            value = this._getHeightOrWidth(name);
        }

        return Math.round(value);
    },
    _getDocSize: function(node, type) {
        var body = node.body, html = node.documentElement;
        return Math.max(body['scroll' + type], body['offset' + type], html['client' + type], html['scroll' + type], html['offset' + type]);
    },
    _getPos: function(type) {
        var node = this.get();
        var dim = { top: 0, left: 0 };
        if (node.nodeType === 3 || this._isWindowNode(node) || node.nodeType === 9) {
            return dim;
        }
        else if (type === 'position') {
            return { top: node.offsetTop, left: node.offsetLeft };
        }
        else if (type === 'offset') {
            var rect = node.getBoundingClientRect();
            var doc = node.ownerDocument;
            var docElem = doc.documentElement;
            var win = doc.defaultView;

            return {
                top: rect.top + win.pageYOffset - docElem.clientTop,
                left: rect.left + win.pageXOffset - docElem.clientLeft
            };
        }

        return dim;
    },
    _getHeightOrWidth: function(name, type) {
        var cname = name.charAt(0).toUpperCase() + name.slice(1);
        var mode = (type) ? type : 'offset';
        var result = 0;
        var el = this.get();
        var style = getComputedStyle(el, null);
        var $targets = this.parents().filter(function($n) {
            var node = $n.get();
            return (node.nodeType === 1 && getComputedStyle(node, null).display === 'none') ? node : false;
        });

        if (style.display === 'none') $targets.add(el);
        if ($targets.length !== 0) {
            var fixStyle = 'visibility: hidden !important; display: block !important;';
            var tmp = [];

            $targets.each(function($n) {
                var thisStyle = $n.attr('style');
                if (thisStyle !== null) tmp.push(thisStyle);
                $n.attr('style', (thisStyle !== null) ? thisStyle + ';' + fixStyle : fixStyle);
            });

            result = el[mode + cname];

            $targets.each(function($n, i) {
                if (tmp[i] === undefined) $n.removeAttr('style');
                else $n.attr('style', tmp[i]);
            });
        }
        else {
            result = el[mode + cname];
        }

        return result;
    },
    _eachClass: function(value, type) {
        return this.each(function($n) {
            if (value) {
                var node = $n.get();
                var fn = function(name) { if (node.classList) node.classList[type](name); };
                value.split(' ').forEach(fn);
            }
        });
    },
    _getOneHandler: function(handler, events) {
        var self = this;
        return function() {
            handler.apply(this, arguments);
            self.off(events);
        };
    },
    _getEventNamespace: function(event) {
        var arr = event.split('.');
        var namespace = (arr[1]) ? arr[1] : '_events';
        return (arr[2]) ? namespace + arr[2] : namespace;
    },
    _getEventName: function(event) {
        return event.split('.')[0];
    },
    _offEvent: function(node, event, namespace, handler, condition) {
        for (var key in node._e) {
            if (node._e.hasOwnProperty(key)) {
                for (var name in node._e[key]) {
                    if (condition(name, key, event, namespace)) {
                        var handlers = node._e[key][name];
                        for (var i = 0; i < handlers.length; i++) {
                            if (typeof handler !== 'undefined' && handlers[i].toString() !== handler.toString()) {
                                continue;
                            }

                            node.removeEventListener(name, handlers[i]);
                            node._e[key][name].splice(i, 1);

                            if (node._e[key][name].length === 0) delete node._e[key][name];
                            if (Object.keys(node._e[key]).length === 0) delete node._e[key];
                        }
                    }
                }
            }
        }
    },
    _hasDisplayNone: function(el) {
        return (el.style.display === 'none') || ((el.currentStyle) ? el.currentStyle.display : getComputedStyle(el, null).display) === 'none';
    },
    _anim: function(speed, fn, speedDef) {
        if (typeof speed === 'function') {
            fn = speed;
            speed = speedDef;
        }
        else {
            speed = speed || speedDef;
        }

        return {
            fn: fn,
            speed: speed/1000
        };
    },
    _isWindowNode: function(node) {
        return (node === window || (node.parent && node.parent === window));
    }
};
// Unique ID
var arx_uuid = 0;

// Init
var ArticleEditor = function(selector, settings) {
    return ArticleEditorInit(selector, settings);
};

// Class
var ArticleEditorInit = function(selector, settings) {
    var $elms = $ARX.dom(selector);
    var instance;
    $elms.each(function($el) {
        instance = $el.dataget($ARX.namespace);
        if (!instance) {
            // Initialization
            instance = new App($el, settings, arx_uuid);
            $el.dataset($ARX.namespace, instance);
            $ARX.instances[arx_uuid] = instance;
            arx_uuid++;
        }
    });

    return instance;
};

var $ARX = ArticleEditor;

// Dom & Ajax
$ARX.dom = function(selector, context) { return new Dom(selector, context); };
$ARX.ajax = Ajax;

// Globals
$ARX.instances = [];
$ARX.namespace = 'article-editor';
$ARX.prefix = 'arx';
$ARX.version = '2.4.8';
$ARX.settings = {};
$ARX.lang = {};
$ARX._mixins = {};
$ARX._repository = {};
$ARX._subscribe = {};
$ARX.keycodes = {
    BACKSPACE: 8,
    DELETE: 46,
    UP: 38,
    DOWN: 40,
    ENTER: 13,
    SPACE: 32,
    ESC: 27,
    TAB: 9,
    CTRL: 17,
    META: 91,
    SHIFT: 16,
    ALT: 18,
    RIGHT: 39,
    LEFT: 37
};

// Add
$ARX.add = function(type, name, obj) {
    // translations
    if (obj.translations) {
        $ARX.lang = $ARX.extend(true, $ARX.lang, obj.translations);
    }

    // defaults
    if (obj.defaults) {
        var localopts = {};
        localopts[name] = obj.defaults;
        $ARX.opts = $ARX.extend(true, $ARX.opts, localopts);
    }

    // extend parser
    if (obj.parser) {
        var opt = {};
        opt[obj.type] = obj.parser;
        $ARX.opts.parser = $ARX.extend({}, true, $ARX.opts.parser, opt);
    }

    // extend nested
    if (obj.nested) {
        $ARX.opts.nested.push(obj.type);
    }

    if (type === 'mixin') {
        $ARX._mixins[name] = obj;
    }
    else {
        // subscribe
        if (obj.subscribe) {
            for (var key in obj.subscribe) {
                if (obj.subscribe.hasOwnProperty(key)) {
                    var arr = key.split(',');
                    for (var i = 0; i < arr.length; i++) {
                        var ns = arr[i].trim();
                        if (typeof $ARX._subscribe[ns] === 'undefined') $ARX._subscribe[ns] = [];
                        $ARX._subscribe[ns].push({ module: name, func: obj.subscribe[key] });
                    }
                }
            }
        }

        // prototype
        var F = function() {};
        F.prototype = obj;

        // mixins
        if (obj.mixins) {
            for (var z = 0; z < obj.mixins.length; z++) {
                $ARX.inherit(F, $ARX._mixins[obj.mixins[z]]);
            }
        }

        $ARX._repository[name] = { type: type, proto: F, obj: obj };
    }
};

// Extend
$ARX.extend = function() {
    var extended = {};
    var deep = false;
    var i = 0;
    var length = arguments.length;

    if (Object.prototype.toString.call(arguments[0]) === '[object Boolean]') {
        deep = arguments[0];
        i++;
    }

    var merge = function(obj) {
        for (var prop in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') extended[prop] = $ARX.extend(true, extended[prop], obj[prop]);
                else extended[prop] = obj[prop];
            }
        }
    };

    for (; i < length; i++) {
        var obj = arguments[i];
        merge(obj);
    }

    return extended;
};

// Error
$ARX.error = function(exception) {
    throw exception;
};

// Inherit
$ARX.inherit = function(current, parent) {
    var F = function() {};
    F.prototype = parent;
    var f = new F();

    for (var prop in current.prototype) {
        if (current.prototype.__lookupGetter__(prop)) f.__defineGetter__(prop, current.prototype.__lookupGetter__(prop));
        else f[prop] = current.prototype[prop];
    }

    current.prototype = f;
    current.prototype.super = parent;

    return current;
};

// Lang
$ARX.addLang = function(lang, obj) {
    if (typeof $ARX.lang[lang] === 'undefined') $ARX.lang[lang] = {};
    $ARX.lang[lang] = $ARX.extend(true, $ARX.lang[lang], obj);
};

ArticleEditor.opts = {
    plugins: [],
    content: false,
    placeholder: false,
    css: false,
    custom: {
        css: false,
        js: false
    },
    editor: {
        classname: 'entry',
        disabled: false,
        focus: false,
        sync: true,
        drop: true,
        lang: 'en',
        add: 'top',
        addbar: false,
        https: false,
        padding: true,
        markup: 'paragraph',
        mobile: 400,
        enterKey: true,
        scrollTarget: window,
        direction: 'ltr',
        spellcheck: true,
        grammarly: true,
        notranslate: false,
        reloadmarker: true,
        minHeight: '100px', // string, '500px'
        maxHeight: false, // string, '500px'
        doctype: '<!doctype html>',
        csscache: false
    },
    selection: {
        multiple: true,
    },
    control: true,
    source: true,
    image: {
        states: true,
        upload: false,
        url: true,
        select: false,
        selectMethod: 'get',
        name: 'file',
        data: false,
        drop: true,
        multiple: true,
        clipboard: true,
        types: ['image/*'],
        tag: 'figure', // p, div, figure
        newtab: false,
        link: true,
        width: false
    },
    classes: false,
    codemirrorSrc: false,
    codemirror: false,
    state: {
        limit: 100
    },
    path: {
        title: '## editor.title ##',
        sticky: true,
        stickyMinHeight: 200, // pixels
        stickyTopOffset: 0 // number
    },
    autosave: {
        url: false,
        name: false,
        data: false,
        method: 'post'
    },
    paste: {
        clean: true,
        autoparse: true,
        paragraphize: true,
        plaintext: false,
        linkTarget: false,
        images: true,
        links: true,
        keepStyle: [],
        keepClass: [],
        keepAttrs: ['td', 'th'],
        formTags: ['form', 'input', 'button', 'select', 'textarea', 'legend', 'fieldset'],
        blockTags: ['pre', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'tbody', 'thead', 'tfoot', 'th', 'tr', 'td', 'ul', 'ol', 'li', 'blockquote', 'p', 'hr', 'figure', 'iframe', 'figcaption', 'address', 'section', 'header', 'footer', 'aside', 'article', 'audio', 'source'],
        inlineTags: ['a', 'svg', 'img', 'br', 'strong', 'ins', 'code', 'del', 'span', 'samp', 'kbd', 'sup', 'sub', 'mark', 'var', 'cite', 'small', 'b', 'u', 'em', 'i', 'abbr']
    },
    clean: {
        comments: false,
        enter: true,
        enterinline: false
    },
    tab: {
        key: true,
        spaces: false // true or number of spaces
    },
    topbar: {
        undoredo: false,
        shortcuts: true
    },
    toolbar: {
        hide: [],
        sticky: true,
        stickyMinHeight: 200, // pixels
        stickyTopOffset: 0 // number
    },
    buttons: {
        editor: ['add', 'template', 'mobile', 'html'],
        topbar: ['undo', 'redo', 'shortcut'],
        toolbar: false,
        tags: {
            'b': ['bold'],
            'strong': ['bold'],
            'i': ['italic'],
            'em': ['italic'],
            'del': ['deleted'],
            'u': ['underline'],
            'a': ['link']
        },
        types: false,
        icons: false,
        hidden: {}
    },
    card: {
        classname: 'card',
        template: '<div class="card"><div class="card-head"><h3>Card title</h3></div><div class="card-body"><p>Card body</p></div></div>'
    },
    text: {
        classname: 'arx-text'
    },
    noneditable: {
        classname: 'noneditable'
    },
    embed: {
        responsive: 'embed-responsive',
        script: true,
        checkbox: false
    },
    code: {
        template: '<pre></pre>',
        spaces: 4 // or false
    },
    line: true,
    layer: {
        template: '<div></div>'
    },
    table: {
        template: '<table><tr><td></td><td></td></tr><tr><td></td><td></td></tr></table>'
    },
    quote: {
        template: '<blockquote><p>Quote...</p><p><cite>Author Attribution</cite></p></blockquote>'
    },
    snippets: false,
    templates: false,
    grid: {
        classname: 'grid',
        classes: '',
        overlay: true,
        offset: {
            left: 0,
            right: 0
        },
        columns: 12,
        gutter: '1.25rem',
        patterns:  {
            '6|6': 'column column-6|column column-6',
            '4|4|4': 'column column-4|column column-4|column column-4',
            '3|3|3|3': 'column column-3|column column-3|column column-3|column column-3',
            '2|2|2|2|2|2': 'column column-2|column column-2|column column-2|column column-2|column column-2|column column-2',
            '3|6|3': 'column column-3|column column-6|column column-3',
            '2|8|2': 'column column-2|column column-8|column column-2',
            '5|7': 'column column-5|column column-7',
            '7|5': 'column column-7|column column-5',
            '4|8': 'column column-4|column column-8',
            '8|4': 'column column-8|column column-4',
            '3|9': 'column column-3|column column-9',
            '9|3': 'column column-9|column column-3',
            '2|10': 'column column-2|column column-10',
            '10|2': 'column column-10|column column-2',
            '12': 'column column-12'
        }
    },
    link: {
        size: 30,
        nofollow: false,
        target: false
    },
    addbar: ['paragraph', 'image', 'embed', 'line', 'table', 'snippet', 'quote', 'code', 'grid', 'layer'], // text, card
    addbarAdd: [],
    addbarHide: [],
    format: ['p', 'h1', 'h2', 'h3', 'ul', 'ol'], // h4, h5, h6,  dl, address, div (text)
    formatAdd: false,
    outset: {
        none: 'none',
        left: 'outset-left',
        both: 'outset-both',
        right: 'outset-right'
    },
    align: {
        left: 'align-left',
        center: 'align-center',
        right: 'align-right',
        justify: 'align-justify'
    },
    valign: {
        none: 'none',
        top: 'valign-top',
        middle: 'valign-middle',
        bottom: 'valign-bottom'
    },
    shortcutsRemove: false,
    shortcutsBase: {
        'meta+z': '## shortcuts.meta-z ##',
        'meta+shift+z': '## shortcuts.meta-shift-z ##',
        'meta+a': '## shortcuts.meta-a ##',
        'meta+shift+a': '## shortcuts.meta-shift-a ##',
        'meta+click': '## shortcuts.meta-click ##'
    },
    shortcuts: {
        'ctrl+shift+d, meta+shift+d': {
            title: '## shortcuts.meta-shift-d ##',
            name: 'meta+shift+d',
            command: 'block.duplicate'
        },
        'ctrl+shift+up, meta+shift+up': {
            title: '## shortcuts.meta-shift-up ##',
            name: 'meta+shift+&uarr;',
            command: 'block.moveUp'
        },
        'ctrl+shift+down, meta+shift+down': {
            title: '## shortcuts.meta-shift-down ##',
            name: 'meta+shift+&darr;',
            command: 'block.moveDown'
        },
        'ctrl+shift+m, meta+shift+m': {
            title: '## shortcuts.meta-shift-m ##',
            name: 'meta+shift+m',
            command: 'inline.removeFormat'
        },
        'ctrl+b, meta+b': {
            title: '## shortcuts.meta-b ##',
            name: 'meta+b',
            command: 'inline.set',
            params: { tag: 'b' }
        },
        'ctrl+i, meta+i': {
            title: '## shortcuts.meta-i ##',
            name: 'meta+i',
            command: 'inline.set',
            params: { tag: 'i' }
        },
        'ctrl+u, meta+u': {
            title: '## shortcuts.meta-u ##',
            name: 'meta+u',
            command: 'inline.set',
            params: { tag: 'u' }
        },
        'ctrl+h, meta+h': {
            title: '## shortcuts.meta-h ##',
            name: 'meta+h',
            command: 'inline.set',
            params: { tag: 'sup' }
        },
        'ctrl+l, meta+l': {
            title: '## shortcuts.meta-l ##',
            name: 'meta+l',
            command: 'inline.set',
            params: { tag: 'sub' }
        },
        'ctrl+alt+0, meta+alt+0': {
            title: '## shortcuts.meta-alt-0 ##',
            name: 'meta+alt+0',
            command: 'block.format',
            params: { tag: 'p' }
        },
        'ctrl+alt+1, meta+alt+1': {
            title: '## shortcuts.meta-alt-1 ##',
            name: 'meta+alt+1',
            command: 'block.format',
            params: { tag: 'h1' }
        },
        'ctrl+alt+2, meta+alt+2': {
            title: '## shortcuts.meta-alt-2 ##',
            name: 'meta+alt+2',
            command: 'block.format',
            params: { tag: 'h2' }
        },
        'ctrl+alt+3, meta+alt+3': {
            title: '## shortcuts.meta-alt-3 ##',
            name: 'meta+alt+3',
            command: 'block.format',
            params: { tag: 'h3' }
        },
        'ctrl+alt+4, meta+alt+4': {
            title: '## shortcuts.meta-alt-4 ##',
            name: 'meta+alt+4',
            command: 'block.format',
            params: { tag: 'h4' }
        },
        'ctrl+alt+5, meta+alt+5': {
            title: '## shortcuts.meta-alt-5 ##',
            name: 'meta+alt+5',
            command: 'block.format',
            params: { tag: 'h5' }
        },
        'ctrl+alt+6, meta+alt+6': {
            title: '## shortcuts.meta-alt-6 ##',
            name: 'meta+alt+6',
            command: 'block.format',
            params: { tag: 'h6' }
        },
        'ctrl+shift+7, meta+shift+7': {
            title: '## shortcuts.meta-shift-7 ##',
            name: 'meta+shift+7',
            command: 'block.format',
            params: { tag: 'ol'}
        },
        'ctrl+shift+8, meta+shift+8': {
            title: '## shortcuts.meta-shift-8 ##',
            name: 'meta+shift+8',
            command: 'block.format',
            params: { tag: 'ul' }
        },
        'ctrl+], meta+]': {
            title: '## shortcuts.meta-indent ##',
            name: 'meta+]',
            command: 'list.indent'
        },
        'ctrl+[, meta+[': {
            title: '## shortcuts.meta-outdent ##',
            name: 'meta+[',
            command: 'list.outdent'
        },
        'ctrl+k, meta+k': {
            title: '## shortcuts.meta-k ##',
            name: 'meta+k',
            command: 'link.format'
        }
    },

    // private
    disableMode: false,
    markerChar: '\ufeff',
    containers: {
        main: ['bars', 'editor', 'source', 'statusbar'],
        bars: ['pathbar', 'toolbar']
    },
    tags: {
        denied: ['font', 'html', 'head', 'link', 'title', 'body', 'meta', 'applet', 'marquee'],
        incode: ['!DOCTYPE', '!doctype', 'html', 'head', 'link', 'title', 'body', 'meta', 'textarea', 'style'],
        form: ['form', 'input', 'button', 'select', 'textarea', 'legend', 'fieldset'],
        inline: ['a', 'svg', 'span', 'strong', 'strike', 'b', 'u', 'em', 'i', 'code', 'del', 'ins', 'samp', 'kbd', 'sup', 'sub', 'mark', 'var', 'cite', 'small', 'abbr'],
        block: ['pre', 'hr', 'ul', 'ol', 'li', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',  'dl', 'dt', 'dd', 'div', 'table', 'tbody', 'thead', 'tfoot', 'tr', 'th', 'td', 'blockquote', 'output', 'figcaption', 'figure', 'address', 'main', 'section', 'header', 'footer', 'aside', 'article', 'iframe', 'audio', 'source'],
        parser: ['pre', 'hr', 'ul', 'ol', 'dl', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'table', 'address', 'blockquote', 'figure', 'main', 'section', 'header', 'footer', 'aside', 'article', 'iframe']
    },
    bsmodal: false,
    regex: {
        youtube: /^https?\:\/\/(?:www\.youtube(?:\-nocookie)?\.com\/|m\.youtube\.com\/|youtube\.com\/)?(?:ytscreeningroom\?vi?=|youtu\.be\/|vi?\/|user\/.+\/u\/\w{1,2}\/|embed\/|watch\?(?:.*\&)?vi?=|\&vi?=|\?(?:.*\&)?vi?=)([^#\&\?\n\/<>"']*)/gi,
        vimeo: /(http|https)?:\/\/(?:www.|player.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:\/[a-zA-Z0-9_-]+)?/gi,
        imageurl: /((https?|www)[^\s]+\.)(jpe?g|png|gif)(\?[^\s-]+)?/gi,
        url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z\u00F0-\u02AF0-9()!@:%_+.~#?&//=]*)/gi,
        aurl1: /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim,
        aurl2: /(^|[^\/])(www\.[\S]+(\b|$))/gim
    },
    addbarExtend: {},
    buttonsObj: {
        'undo': { title: '## buttons.undo ##', command: 'state.undo' },
        'redo': { title: '## buttons.redo ##', command: 'state.redo' },
        'shortcut': { title: '## buttons.shortcuts ##', observer: 'shortcut.observe', command: 'shortcut.popup' },
        'template': { title: '## buttons.templates ##', command: 'template.popup', observer: 'template.observe' },
        'mobile': { title: '## buttons.mobile-view ##', command: 'editor.toggleView' },
        'html': { title: '## buttons.html ##',  command: 'source.toggle' },
        'paragraph': { title: '## blocks.paragraph ##', command: 'block.add' },
        'image': { title: '## blocks.image ##', command: 'image.popup', observer: 'image.observe' },
        'embed': { title: '## blocks.embed ##', command: 'embed.popup', observer: 'embed.observe' },
        'line': { title: '## blocks.line ##', command: 'block.add', observer: 'block.observe' },
        'table': { title: '## blocks.table ##', command: 'table.add', observer: 'table.observe' },
        'snippet': { title: '## blocks.snippet ##', command: 'snippet.popup', observer: 'snippet.observe' },
        'quote': { title: '## blocks.quote ##', command: 'block.add', observer: 'block.observe' },
        'text': { title: '## blocks.text ##', command: 'block.add' },
        'code': { title: '## blocks.code ##', command: 'block.add', observer: 'block.observe' },
        'grid': { title: '## blocks.grid ##', command: 'grid.popup', observer: 'grid.observe' },
        'layer': { title: '## blocks.layer ##', command: 'block.add', observer: 'block.observe' },
        'card': { title: '## blocks.card ##', command: 'block.add' },
        'trash': { title: '## buttons.delete ##', command: 'block.remove' }
    },
    nested: [],
    parser: {},
    parserTags: [],
    formatObj: {
        p: {
            title: '## blocks.paragraph ##',
            type: 'paragraph',
            shortcut: 'Ctrl+Alt+0'
        },
        div: {
            title: '## blocks.text ##',
            type: 'text'
        },
        h1: {
            title: '<span style="font-size: 20px; font-weight: bold;">## headings.h1 ##</span>',
            type: 'heading',
            shortcut: 'Ctrl+Alt+1'
        },
        h2: {
            title: '<span style="font-size: 16px; font-weight: bold;">## headings.h2 ##</span>',
            type: 'heading',
            shortcut: 'Ctrl+Alt+2'
        },
        h3: {
            title: '<span style="font-weight: bold;">## headings.h3 ##</span>',
            type: 'heading',
            shortcut: 'Ctrl+Alt+3'
        },
        h4: {
            title: '<span style="font-weight: bold;">## headings.h4 ##</span>',
            type: 'heading',
            shortcut: 'Ctrl+Alt+4'
        },
        h5: {
            title: '<span style="font-weight: bold;">## headings.h5 ##</span>',
            type: 'heading',
            shortcut: 'Ctrl+Alt+5'
        },
        h6: {
            title: '<span style="font-weight: bold;">## headings.h6 ##</span>',
            type: 'heading',
            shortcut: 'Ctrl+Alt+6'
        },
        ol: {
            title: '1. ## list.ordered-list ##',
            type: 'list',
            shortcut: 'Ctrl+Shift+7'
        },
        ul: {
            title: '&bull; ## list.unordered-list ##',
            type: 'list',
            shortcut: 'Ctrl+Shift+8'
        },
        dl: {
            title: '## blocks.dlist ##',
            type: 'dlist'
        },
        address: {
            title: '<em>## blocks.address ##</em>',
            type: 'address'
        }
    }
};
ArticleEditor.lang.en = {
    "accessibility": {
        "help-label": "Rich text editor"
    },
    "editor": {
        "title": "Article",
        "multiple": "Multiple",
    },
    "placeholders": {
        "figcaption": "Type caption (optional)",
        "text": "Type something...",
        "code": "Edit to add code...",
        "layer": "Press enter to add a new text..."
    },
    "popup": {
        "link": "Link",
        "add": "Add",
        "grid": "Grid",
        "back": "Back",
        "image": "Image",
        "snippets": "Snippets",
        "add-image": "Add Image"
    },
    "shortcuts": {
        "meta-a": "Select text in the block",
        "meta-shift-a": "Select all blocks",
        "meta-click": "Select multiple blocks",
        "meta-z": "Undo",
        "meta-shift-z": "Redo",
        "meta-shift-m": "Remove inline format",
        "meta-b": "Bold",
        "meta-i": "Italic",
        "meta-u": "Underline",
        "meta-h": "Superscript",
        "meta-l": "Subscript",
        "meta-k": "Link",
        "meta-alt-0": "Normal text",
        "meta-alt-1": "Heading 1",
        "meta-alt-2": "Heading 2",
        "meta-alt-3": "Heading 3",
        "meta-alt-4": "Heading 4",
        "meta-alt-5": "Heading 5",
        "meta-alt-6": "Heading 6",
        "meta-shift-7": "Ordered List",
        "meta-shift-8": "Unordered List",
        "meta-indent": "Indent",
        "meta-outdent": "Outdent",
        "meta-shift-backspace": "Delete block",
        "meta-shift-d": "Duplicate block",
        "meta-shift-up": "Move line up",
        "meta-shift-down": "Move line down"
    },
    "headings": {
        "h1": "Heading 1",
        "h2": "Heading 2",
        "h3": "Heading 3",
        "h4": "Heading 4",
        "h5": "Heading 5",
        "h6": "Heading 6"
    },
    "inline": {
        "bold": "Bold",
        "italic": "Italic",
        "deleted": "Deleted"
    },
    "list": {
        "unordered-list": "Unordered List",
        "ordered-list": "Ordered List",
        "indent": "Indent",
        "outdent": "Outdent"
    },
    "link": {
        "link": "Link",
        "edit-link": "Edit link",
        "unlink": "Unlink",
        "link-in-new-tab": "Open link in new tab",
        "save": "Save",
        "insert": "Insert",
        "cancel": "Cancel",
        "text": "Text",
        "url": "URL"
    },
    "table": {
        "width": "Width",
        "nowrap": "Nowrap",
        "save": "Save",
        "cancel": "Cancel",
        "table-cell": "Table Cell",
        "add-head": "Add head",
        "remove-head": "Remove head",
        "add-row-below": "Add row below",
        "add-row-above": "Add row above",
        "remove-row": "Remove row",
        "add-column-after": "Add column after",
        "add-column-before": "Add column before",
        "remove-column": "Remove column"
    },
    "image": {
        "or": "or",
        "alt-text": "Alt Text",
        "save": "Save",
        "link": "Link",
        "width": "Width",
        "delete": "Delete",
        "cancel": "Cancel",
        "insert": "Insert",
        "caption": "Caption",
        "link-in-new-tab": "Open link in new tab",
        "url-placeholder": "Paste url of image...",
        "upload-new-placeholder": "Drag to upload a new image<br>or click to select"
    },
    "code": {
        "code": "Code",
        "insert": "Insert",
        "save": "Save",
        "cancel": "Cancel"
    },
    "embed": {
        "embed": "Embed",
        "caption": "Caption",
        "insert": "Insert",
        "save": "Save",
        "cancel": "Cancel",
        "description": "Paste any embed/html code or enter the url (vimeo or youtube video only)",
        "responsive-video": "Responsive video"
    },
    "upload": {
        "placeholder": "Drag to upload <br>or click to select"
    },
    "templates": {
        "templates": "Templates"
    },
    "snippets": {
        "snippets": "Snippets"
    },
    "form": {
        "link": "Link",
        "url": "Url",
        "text": "Text",
        "name": "Name",
        "alt-text": "Alt Text",
        "image": "Image",
        "upload": "Upload",
        "alignment": "Alignment",
        "outset": "Outset",
        "valign": "Valign"
    },
    "buttons": {
        "mobile-view": "Mobile View",
        "cancel": "Cancel",
        "insert": "Insert",
        "unlink": "Unlink",
        "save": "Save",
        "add": "Add",
        "transform-to-text": "Transform to text",
        "align": "Alignment",
        "valign": "Valign",
        "outset": "Outset",
        "indent": "Indent",
        "outdent": "Outdent",
        "head": "Head",
        "row": "Row",
        "cell": "Cell",
        "html": "HTML",
        "templates": "Templates",
        "shortcuts": "Keyboard Shortcuts",
        "format": "Format",
        "bold": "Bold",
        "italic": "Italic",
        "deleted": "Deleted",
        "underline": "Underline",
        "table": "Table",
        "link": "Link",
        "undo": "Undo",
        "redo": "Redo",
        "style": "Style",
        "config": "Config",
        "settings": "Settings",
        "text": "Text",
        "embed": "Embed",
        "grid": "Grid",
        "image": "Image",
        "list": "List",
        "delete": "Delete",
        "duplicate": "Duplicate",
        "sort": "Sort",
        "edit": "Edit",
        "inline": "Inline"
    },
    "blocks": {
        "noneditable": "Noneditable",
        "paragraph": "Paragraph",
        "heading": "Heading",
        "image": "Image",
        "figcaption": "Figcaption",
        "embed": "Embed",
        "line": "Line",
        "code": "Code",
        "quote": "Quote",
        "quoteitem": "Paragraph",
        "snippet": "Snippet",
        "column": "Column",
        "grid": "Grid",
        "list": "List",
        "table": "Table",
        "layer": "Layer",
        "row": "Row",
        "text": "Text",
        "cell": "Cell",
        "dlist": "Definition List",
        "address": "Address",
        "form": "Form",
        "card": "Card"
    }
};
var App = function($element, settings, uuid) {
    // environment
    var maps = ['keycodes', 'prefix', 'dom', 'ajax', '_repository', '_subscribe'];
    for (var i = 0; i < maps.length; i++) {
        this[maps[i]] = $ARX[maps[i]];
    }

    this.uuid = uuid;
    this.$win = this.dom(window);
    this.$doc = this.dom(document);
    this.$body = this.dom('body');
    this.$element = $element;
    this.app = this;

    // initial
    this.initialSettings = settings;

    // starter
    this._initer = ['setting', 'lang'];
    this._priority = ['container', 'editor', 'accessibility', 'state'];
    this._plugins = [];

    // started
    this.started = false;

    // start
    this.start();
};

App.prototype = {
    // start
    start: function(settings) {
        if (!this.isTextarea()) return;
        if (this.isStarted()) return;
        if (settings) this.initialSettings = settings;

        // core
        this._initCore();
        this._plugins = this.setting.get('plugins');

        // starting
        this.broadcast('app.before.start');

        // init
        this._initModules();
        this._initPlugins();

        // start
        this._startPriority();
        this._startModules();
        this._startPlugins();

        this.started = true;

        // started
        this.broadcast('app.start');

        // call load methods
        this._loadModulesAndPlugins();

        // disable mode
        if (this.opts.disableMode !== false) {
            this.disable();
        }
    },
    isStarted: function() {
        return this.started;
    },
    isTextarea: function() {
        return (this.$element.get().tagName === 'TEXTAREA');
    },

    // stop
    stop: function() {
        if (this.isStopped()) return;

        // stopping
        this.broadcast('app.before.stop');

        this._stopPlugins();
        this._stopPriority();
        this._stopModules();

        this.started = false;

        // stopped
        this.broadcast('app.stop');
    },
    isStopped: function() {
        return !this.started;
    },

    // destroy
    destroy: function() {
        clearTimeout(this.app.sync.typingTimer);
        this.stop();
        this.broadcast('app.destroy');
        this.$element.dataset($ARX.namespace, false);

        var index = $ARX.instances.indexOf(this.uuid);
        if (index > -1) {
            $ARX.instances.splice(index, 1);
        }
    },

    // disable / enable
    disable: function() {
        this.block.unset();
        this.blocks.unset();
        this.selection.removeAllRanges();

        if (this.source.is()) {
            this.source.close();
        }

        this.popup.close(false);

        this.toolbar.disableSticky();
        this.toolbar.disable();
        this.path.disable();
        this.topbar.disable();

        this.editor.getOverlay().addClass(this.prefix + '-editor-disabled');
        this.opts.disableMode = true;
    },
    enable: function() {
        this.toolbar.enableSticky();
        this.toolbar.enable();
        this.path.enable();
        this.topbar.enable();

        this.editor.getOverlay().removeClass(this.prefix + '-editor-disabled');
        this.opts.disableMode = false;
    },

    // broadcast
    broadcast: function(name, params) {
        var event = (params instanceof App.Event) ? params : new App.Event(name, params);
        if (typeof this._subscribe[name] !== 'undefined') {
            var events = this._subscribe[name];
            for (var i = 0; i < events.length; i++) {
                var instance = this[events[i].module];
                if (instance) {
                    events[i].func.call(instance, event);
                }
            }
        }

        // callbacks
        var callbacks = (this.setting.has('subscribe')) ? this.setting.get('subscribe') : {};
        if (typeof callbacks[name] === 'function') {
            callbacks[name].call(this, event);
        }

        return event;
    },
    broadcastParams: function(name, params) {
        var event = this.broadcast(name, params);
        return event.getAll();
    },
    broadcastHtml: function(name, html) {
        var event = this.broadcast(name, { html: html });
        return event.get('html');
    },

    // create
    create: function(name) {
        if (typeof this._repository[name] === 'undefined') {
            $ARX.error('The class "' + name + '" does not exist.');
        }

        var args = [].slice.call(arguments, 1);
        var instance = new this._repository[name].proto();

        // extend
        instance._name = name;
        instance.app = this;

        var maps = ['uuid', 'prefix', 'dom', 'ajax'];
        for (var i = 0; i < maps.length; i++) {
           instance[maps[i]] = this[maps[i]];
        }

        // lang & settings
        if (this.lang) instance.lang = this.lang;
        if (this.opts) instance.opts = this.opts;

        // init
        var result;
        if (instance.init) {
            result = instance.init.apply(instance, args);
        }

        return (result) ? result : instance;
    },

    // api
    api: function(name) {
        var args = [].slice.call(arguments, 1);
        var namespaces = name.split(".");
        var func = namespaces.pop();
        var context = this;
        for (var i = 0; i < namespaces.length; i++) {
            context = context[namespaces[i]];
        }

        if (context && typeof context[func] === 'function') {
            return context[func].apply(context, args);
        }
    },

    // init
    _initCore: function() {
        for (var i = 0; i < this._initer.length; i++) {
            this[this._initer[i]] = this.create(this._initer[i]);
        }

        // opts
        if (this.setting) {
            this.opts = this.setting.dump();
        }
    },
    _initModules: function() {
        for (var key in this._repository) {
            if (this._repository[key].type === 'module' && this._initer.indexOf(key) === -1) {
                this[key] = this.create(key);
            }
        }
    },
    _initPlugins: function() {
        var plugins = this.setting.get('plugins');
        for (var key in this._repository) {
            if (this._repository[key].type === 'plugin' && plugins.indexOf(key) !== -1) {
                this[key] = this.create(key);
            }
        }
    },

    // start
    _startPriority: function() {
        for (var i = 0; i < this._priority.length; i++) {
            this._call(this[this._priority[i]], 'start');
        }
    },
    _startModules: function() {
        this._iterate('module', 'start');
    },
    _startPlugins: function() {
        this._iterate('plugin', 'start');
    },

    // stop
    _stopPriority: function() {
        var priority = this._priority.slice().reverse();
        for (var i = 0; i < priority.length; i++) {
            this._call(this[priority[i]], 'stop');
        }
    },
    _stopModules: function() {
        this._iterate('module', 'stop');
    },
    _stopPlugins: function() {
        this._iterate('plugin', 'stop');
    },

    // load
    _loadModulesAndPlugins: function() {
        this._iterate('module', 'load');
        this._iterate('plugin', 'load');
    },

    // iterate
    _iterate: function(type, method) {
        for (var key in this._repository) {
            if (this._repository.hasOwnProperty(key)) {
                var isIn = (type === 'module') ? (method === 'load' || this._priority.indexOf(key) === -1) : (this._plugins.indexOf(key) !== -1);
                if (this._repository[key].type === type && isIn) {
                    this._call(this[key], method);
                }
            }
        }
    },

    // call
    _call: function(instance, method) {
        if (typeof instance[method] === 'function') {
            instance[method].apply(instance);
        }
    }
};
App.Event = function(name, params) {
    // local
    this.name = name;
    this.params = (typeof params === 'undefined') ? {} : params;
    this.stopped = false;
};

App.Event.prototype = {
    is: function(name) {
        if (Array.isArray(name)) {
            for (var i = 0; i < name.length; i++) {
                if (this.params[name[i]]) {
                    return true;
                }
            }
        }
        else {
            return this.get(name);
        }
    },
    has: function(name) {
        return (typeof this.params[name] !== 'undefined');
    },
    getAll: function() {
        return this.params;
    },
    get: function(name) {
        return this.params[name];
    },
    set: function(name, value) {
        this.params[name] = value;
    },
    stop: function() {
        this.stopped = true;
    },
    isStopped: function() {
        return this.stopped;
    }
};
ArticleEditor.add('mixin', 'block', {
    defaults: {
        id: { getter: 'getId', setter: 'setId' },
        html: { getter: 'getHtml', setter: 'setHtml' },
        align: { getter: 'getAlign', setter: 'setAlign' },
        valign: { getter: 'getValign', setter: 'setValign' },
        outset: { getter: 'getOutset', setter: 'setOutset' },
    },
    init: function(source, params) {

        this.$block = (source) ? this.dom(source) : this.create(params);

        // build & render
        this._build(params);
        this._buildData();
        this._render();
    },

    // is
    isType: function(type) {
        var types = (Array.isArray(type)) ? type : [type];
        return (types.indexOf(this.type) !== -1);
    },
    isBlock: function() {
        return true;
    },
    isAllowedButton: function(name, obj) {
        // type
        var type = this.getType();

        // hidden
        if (typeof this.opts.buttons.hidden[type] !== 'undefined') {
            var val = this.opts.buttons.hidden[type];
            if (Array.isArray(val) && val.indexOf(name) !== -1) {
                return false;
            }
        }

        // all
        if (typeof obj.blocks === 'undefined') {
            return true;
        }

        var blocks = obj.blocks;

        // except
        if (blocks.except && blocks.except.indexOf(type) !== -1) {
            return false;
        }

        // array of elements
        if ((Array.isArray(blocks.types) && blocks.types.indexOf(type) !== -1)) {
            return true;
        }

        if (blocks.all) {
            // editable
            if (blocks.all === true || blocks.all === 'all') {
                return true;
            }
            else if (blocks.all === 'editable' && this.isEditable()) {
                return true;
            }
            else if (blocks.all === 'first-level' && this.isFirstLevel()) {
                return true;
            }
            else if (blocks.all === 'noneditable' && !this.isEditable()) {
                return true;
            }
        }

        return false;
    },
    isFirstLevel: function() {
        return this.$block.attr('data-' + this.prefix + '-first-level');
    },
    isSecondLevel: function() {
        return (['quoteitem', 'row', 'cell'].indexOf(this.type) !== -1);
    },
    isEditable: function() {
        return (typeof this.editable !== 'undefined' && this.editable === true);
    },
    isInlineBlock: function() {
        return (typeof this.inline !== 'undefined');
    },
    isAllSelected: function() {
        if (this.isEditable()) {
            return this.app.selection.isAll(this.$block);
        }
        else {
            return true;
        }
    },
    isEmpty: function() {
        if (this.isEmptiable()) {
            if (this.$block.hasClass(this.prefix + '-empty-layer')) {
                return true;
            }
            else {
                var html = this.$block.html();
                html = html.trim();
                html = this._cleanEmpty(html);

                return (html === '');
            }
        }
        else if (this.isEditable()) {
            return this._isEmpty();
        }
    },
    isEmptiable: function() {
        return (typeof this.emptiable !== 'undefined');
    },
    isCaretStart: function() {
        if (this.getType() === 'code') {
            return this.app.caret.is(this.$block, 'start', false, false);
        }
        else if (this.getType() === 'list') {
            // check if the item is the first
            var current = this.app.selection.getCurrent();
            var $item = this.dom(current).closest('li');
            var $prev = $item.prev();
            if ($prev.length === 0) {
                return this.app.caret.is(this.$block, 'start');
            }
            else {
                return false;
            }
        }
        else if (this.isEditable()) {
            return this.app.caret.is(this.$block, 'start');
        }

        return true;
    },
    isCaretEnd: function() {
        if (this.getType() === 'code') {
            return this.app.caret.is(this.$block, 'end', false, false);
        }
        else if (this.getType() === 'address') {
            return this.app.caret.is(this.$block, 'end', false, true, false);
        }
        else if (this.isEditable()) {
            return this.app.caret.is(this.$block, 'end');
        }

        return true;
    },

    // get
    getData: function(name) {
        var data = {};
        Object.keys(this.data).forEach(function(key) {
            data[key] = this[this.data[key].getter].apply(this);
        }.bind(this));

        return (name) ? data[name] : data;
    },
    getType: function() {
        return this.type;
    },
    getTag: function() {
        return (this.$block) ? this.$block.get().tagName.toLowerCase() : false;
    },
    getTitle: function() {
        var type = this.getType();
        var titles = this.lang.get('blocks');
        var title = this.$block.attr('data-title');

        return (typeof titles[type] !== 'undefined') ? titles[type] : title;
    },
    getOffset: function() {
        var offset = this.app.editor.getFrame().offset();
        var elOffset = this.$block.offset();

        return { top: offset.top + elOffset.top, left: offset.left + elOffset.left };
    },
    getBlock: function() {
        return this.$block;
    },
    getHtml: function() {
        return this.$block.html();
    },
    getPlainText: function() {
        var html = this.$block.html();

        return this.app.content.getTextFromHtml(html, { nl: true });
    },
    getOuterHtml: function() {
        return this.$block.get().outerHTML;
    },
    getParent: function(type) {
        type = (type) ? '=' + type : '';

        var $el = this.$block.parent().closest('[data-' + this.prefix + '-type' + type + ']');
        if ($el.length !== 0) {
            return $el.dataget('instance');
        }

        return false;
    },
    getNext: function(type) {
        type = (type) ? '=' + type : '';

        var $el = this.$block.nextElement();
        if ($el.length !== 0 && $el.is('[data-' + this.prefix + '-type' + type + ']')) {
            return $el.dataget('instance');
        }

        return false;
    },
    getPrev: function(type) {
        type = (type) ? '=' + type : '';

        var $el = this.$block.prevElement();
        if ($el.length !== 0 && $el.is('[data-' + this.prefix + '-type' + type + ']')) {
            return $el.dataget('instance');
        }

        return false;
    },
    getChildFirst: function(type) {
        type = (type) ? '=' + type : '';

        var $el = this.$block.find('[data-' + this.prefix + '-type' + type + ']').first();
        if ($el.length !== 0) {
            return $el.dataget('instance');
        }

        return false;
    },
    getChildLast: function(type) {
        type = (type) ? '=' + type : '';

        var $el = this.$block.find('[data-' + this.prefix + '-type' + type + ']').last();
        if ($el.length !== 0) {
            return $el.dataget('instance');
        }

        return false;
    },
    getId: function() {
        return this.$block.attr('id');
    },
    getAlign: function() {
        var obj = this.opts.align;
        if (!obj) return false;

        var value = 'left';
        for (var key in obj) {
            if (this.$block.hasClass(obj[key])) {
                value = key;
            }
        }

        return value;
    },
    getValign: function() {
        var obj = this.opts.valign;
        if (!obj) return false;

        var value = 'none';
        for (var key in obj) {
            if (this.$block.hasClass(obj[key])) {
                value = key;
            }
        }

        return value;
    },
    getOutset: function() {
        var obj = this.opts.outset;
        if (!obj) return false;

        var value = 'none';
        for (var key in obj) {
            if (this.$block.hasClass(obj[key])) {
                value = key;
            }
        }

        return value;
    },
    getCaption: function() {
        var $caption = this.$block.find('figcaption');

        return ($caption.length !== 0) ? $caption.html().trim() : '';
    },

    // set
    setData: function(data) {
        for (var key in data) {
            if (!this.data[key]) continue;
            this[this.data[key].setter].call(this, data[key]);
        }
    },
    setEmpty: function() {
        this.$block.html('');

        if (this.isEmptiable()) {
            this._addEmptyButton(this.$block);
        }
    },
    setSelectAll: function() {
        if (this.isEditable()) {
            this.app.selection.select(this.$block);
        }
    },
    setHtml: function(html) {
        this.$block.html(html);

        if (html !== '') {
            this._buildInstancesInside(this.$block);
        }
    },
    setId: function(value) {
        if (value === '') {
            this.$block.removeAttr('id');
        }
        else {
            this.$block.attr('id', value);
        }
    },
    setAlign: function(value) {
        this._removeObjClasses(this.opts.align);
        this.$block.addClass(this.opts.align[value]);
    },
    setValign: function(value) {
        this._removeObjClasses(this.opts.valign);

        if (value !== 'none') {
            this.$block.addClass(this.opts.valign[value]);
        }
    },
    setOutset: function(value) {
        this._removeObjClasses(this.opts.outset);

        if (value !== 'none') {
            this.$block.addClass(this.opts.outset[value]);
        }

        // ui
        this.app.control.updatePosition();
    },
    setCaption: function(value) {
        if (value === '') {
            this.$block.find('figcaption').remove();
        }
        else {
            var $caption = this.$block.find('figcaption');
            if ($caption.length === 0) {
                $caption = this.dom('<figcaption>');
                $caption.attr('data-placeholder', this.lang.get('placeholders.figcaption'));
                this.$block.append($caption);
                // create
                this.app.create('block.figcaption', $caption);
            }

            $caption.html(value);
        }
    },
    setClassFromObj: function(obj, key) {
        this._removeObjClasses(obj);

        var value = obj[key];
        if (value !== 'none' || value !== false) {
            this.$block.addClass(value);
        }
    },

    // has
    hasClass: function(value) {
        value = (typeof value === 'string') ? [value] : value;
        for (var i = 0; i < value.length; i++) {
            if (this.$block.hasClass(value[i])) {
                return value[i];
            }
        }

        return false;
    },

    // remove
    remove: function(broadcast) {
        var parent = this.getParent();
        var type = this.getType();

        this.$block.remove();

        // emptiable
        if (parent && parent.isEmptiable() && parent.isEmpty()) {
            parent.setEmpty();
        }

        // broadcast
        if (broadcast) {
            this.app.broadcast('block.remove', { type: type, parent: parent });
        }
    },

    // duplicate
    duplicate: function(empty) {
        var type = this.getType();
        var $clone = this.$block.clone();
        $clone.removeClass(this.prefix + '-block-focus ' + this.prefix + '-block-multiple-hover');

        if (empty) {
            $clone.html('');
        }

        return this.app.create('block.' + type, $clone);
    },
    duplicateEmpty: function() {
        return this.duplicate(true);
    },

    // insert
    insertEmpty: function(params) {
        params = params || {};
        params.instance = this.app.block.create();

        return this.insert(params);
    },
    insert: function(params) {
        var defs = {
            instance: false,
            position: false,
            caret: false,
            remove: true,
            type: 'input'
        };

        // params
        var p = $ARX.extend({}, defs, params);
        var $block = p.instance.getBlock();

        // delete selection
        if (this.isEditable()) {
            this.app.selection.deleteContents();
        }

        // list to list
        if (p.instance.getType() === 'list' && this.getType() === 'list') {
            if (p.type === 'duplicate') {
                p.position = p.position || 'after';
                this.$block[p.position]($block);

                // set caret
                if (p.caret) {
                    this.app.block.set(p.instance, p.caret);
                }
            }
            else {
                this.app.insertion.insertListToList($block, this.$block, p.caret);
            }
        }
        else {
            // variable to variable
            if (p.instance.isInlineBlock() && this.isInlineBlock()) {
                this.$block.after($block);
                this.$block.remove();
            }
            // like variable
            else if (p.instance.isInlineBlock() && this.isEditable()) {
                this.app.insertion.insertNode(p.instance.getBlock(), false, true);
            }
            // editable
            else if (this.isEditable() && this.getType() !== 'card') {
                // detect position
                p.position = this.app.insertion.detectPosition(this.$block, p.position);

                // insert
                if (p.position === 'split') {
                    this.app.element.split(this.$block).before($block);
                }
                else {
                    this.$block[p.position]($block);

                    // remove
                    if (p.remove && this.isEmpty()) {
                        this.$block.remove();
                    }
                }
            }
            // non editable
            else {
                p.position = p.position || 'after';
                this.$block[p.position]($block);
            }

            // rebuild
            this.app.editor.build();

            // set caret
            if (p.caret) {
                this.app.block.set(p.instance, p.caret);
            }

            // observe
            this.app.toolbar.observe();

            // broadcast
            this.app.broadcast('block.add', { instance: p.instance, type: p.type });

            return p.instance;
        }
    },

    // append
    appendNext: function() {
        var next = this.getNext();

        // next empty
        if (next.isEmpty()) {
            next.remove();
            return;
        }
        // current empty
        else if (this.isEmpty()) {
            this.remove();
            this.app.block.set(next, 'start');
            return;
        }

        // not empty
        var html = next.getHtml();
        var type = this.getType();
        var nextType = next.getType();
        var insert = true;
        var remove = true;

        // code
        if (type === 'code' && nextType !== 'code') {
            html = next.getPlainText();
        }

        // next type
        if (nextType === 'dlist') {

            if (type === 'dlist') {
                // append as nodes
                var nodes = next.getBlock().children();
                this.$block.append(nodes);
                insert = false;
            }
            else {
                // insert with br
                html = next.getPlainText(true);
            }
        }
        else if (nextType === 'list') {
            if (type === 'list') {
                var $items = next.getBlock().children();
                this.$block.append($items);

                insert = false;
                remove = true;
            }
            else {
                html = this._appendListHtml(next.getBlock(), html);
                remove = next.isEmpty();
            }
        }

        // append
        if (insert) {

            // set caret after inline
            var inline = this.app.selection.getTopInline();
            if (inline) {
                this.app.caret.set(inline, 'after');
            }

            // insert
            this.app.insertion.insertHtml(html, 'start');
            this._buildInstancesInside(this.$block);
        }

        // remove
        if (remove) {
            next.remove();
        }

    },
    appendToPrev: function() {
        var prev = this.getPrev();

        // current empty
        if (this.isEmpty()) {
            this.remove();
            this.app.block.set(prev, 'end');
            return;
        }
        // prev empty
        else if (prev.isEmpty()) {
            prev.remove();
            this.app.control.updatePosition();
            return;
        }

        // not empty
        var prevType = prev.getType();
        var html = this.getHtml();
        var type = this.getType();
        var insert = true;
        var remove = true;

        // code
        if (type !== 'code' && prevType === 'code') {
            html = this.getPlainText();
        }

        // current type
        if (type === 'dlist') {
            if (prevType === 'dlist') {
                // append as nodes
                var nodes = this.getBlock().children();
                this.app.block.set(prev, 'end');
                prev.getBlock().append(nodes);

                insert = false;
            }
            else {
                // insert with br
                html = this.getPlainText(true);
            }
        }
        else if (type === 'list') {
            if (prevType === 'list') {
                var $items = this.getBlock().children();
                this.app.block.set(prev, 'end');
                prev.getBlock().append($items);

                insert = false;
                remove = true;
            }
            else {
                html = this._appendListHtml(this.getBlock(), html);
                remove = this.isEmpty();
            }
        }

        // append
        if (insert) {

            // set
            this.app.block.set(prev, 'end');

            // set caret after inline
            var inline = this.app.selection.getTopInline();
            if (inline) {
                this.app.caret.set(inline, 'after');
            }

            // insert
            this.app.insertion.insertHtml(html, 'start');
            this._buildInstancesInside(prev.getBlock());
        }

        // remove
        if (remove) {
            this.remove();
        }
    },
    append: function(instance, set) {
        if (this.isEmptiable() && this.isEmpty()) {
            this.$block.html('');
            this.$block.removeClass(this.prefix + '-empty-layer');
        }

        this.$block.append(instance.getBlock());

        if (set !== false) {
            this.app.block.set(instance);
        }

        // broadcast
        this.app.broadcast('block.add', { instance: instance });
    },

    // change
    change: function(newInstance, broadcast) {
        var $newBlock = newInstance.getBlock();

        this.$block.after($newBlock);
        this.$block.remove();

        // rebuild
        this.app.editor.build();
        this.app.toolbar.observe();

        // set
        this.app.block.set(newInstance);

        // broadcast
        if (broadcast !== false) {
            this.app.broadcast('block.change', { instance: newInstance });
        }
    },

    // move
    moveUp: function() {
        var target = this.getPrev();
        if (!target) return;

        this._move(target, 'before');
    },
    moveDown: function(direction) {
        var target = this.getNext();
        if (!target) return;

        this._move(target, 'after');
    },

    // private
    _appendListHtml: function($target, html) {
        var $item = $target.find('li').first();
        html = $item.html().trim();
        html = html.replace(/<\/li>/gi, '</li><br>');
        html = html.replace(/<(ul|ol)/gi, '<br><$1');
        html = this.app.content.removeTags(html, ['ul', 'ol', 'li']);
        html = html.trim();
        html = html.replace(/<br\s?\/?>$/gi, '');

        $item.remove();

        return html;
    },
    _move: function(target, func) {
        // save selection
        if (this.isEditable()) this.app.selection.save(this.$block);

        // move
        var $targetBlock = target.getBlock();
        $targetBlock[func](this.$block, true);

        // set force
        this.app.block.set(this.$block, false, true);

        // restore selection
        if (this.isEditable()) this.app.selection.restore(this.$block);
    },
    _build: function(params) {
        // build empty
        if (this.isEmptiable() && this.isEmpty()) {
            this._addEmptyButton(this.$block);
        }

        // build
        if (this.build) {
            this.build(params);
        }

        // instances inside
        this._buildInstancesInside(this.$block);
    },
    _buildData: function() {
        if (!this.data) this.data = {};
        this.data = $ARX.extend({}, true, this.defaults, this.data);
    },
    _buildInstancesInside: function($block) {
        $block.find('[data-' + this.prefix + '-type]').each(this._buildInstanceInside.bind(this));
    },
    _buildInstanceInside: function($node) {
        var instance = $node.dataget('instance');
        if (!instance) {
            var type = $node.attr('data-' + this.prefix + '-type');
            this.app.create('block.' + type, $node);
        }
    },
    _buildItems: function(selector, type) {
        var $items = this.$block.find(selector);
        if ($items.length !== 0) {
            $items.each(function($node) {
                this.app.create('block.' + type, $node);
            }.bind(this));
        }
    },
    _buildCaption: function() {
        if (this.getTag() !== 'figure') return;

        this.$block.find('figcaption').attr('data-placeholder', this.lang.get('placeholders.figcaption'));
    },
    _isEmpty: function() {
        var html = this.$block.text();
        html = this._cleanEmpty(html);

        return (html === '');
    },
    _getNameByTag: function() {
        var tag = this.getTag();
        var name = this.app.utils.capitalize(tag);

        return name;
    },
    _render: function() {
        this._renderEdit();
        this._renderDraggable();
        this._renderEditable();
    },
    _renderDraggable: function() {

        if (typeof this.draggable !== 'undefined' && this.draggable === false) {
            this.$block.on('dragstart', function(e) { e.preventDefault(); return false; });
            this.$block.find('img').on('dragstart', function(e) { e.preventDefault(); return false; });
        }
    },
    _renderEditable: function() {

        if (this.isEditable()) {
            this.$block.attr('contenteditable', true);
        }
        else if (typeof this.editable !== 'undefined' && this.editable === false) {
            this.$block.attr('contenteditable', false);
        }

        if (this.isEditable() && !this.opts.editor.grammarly) this.$block.attr('data-gramm_editor', false);
    },
    _renderEdit: function() {
        this.$block.dataset('instance', this);
        this.$block.attr('data-' + this.prefix + '-type', this.getType());
    },
    _cleanEmpty: function(html) {
        html = this.app.utils.removeInvisibleChars(html);
        html = (html.search(/^<br\s?\/?>$/) !== -1) ? '' : html;
        html = html.replace(/\n/g, '');

        return html;
    },
    _removeObjClasses: function(obj) {
        var classes = this._buildObjClasses(obj);
        this.$block.removeClass(classes.join(' '));
        this.app.element.removeEmptyAttrs(this.$block, ['class']);
    },
    _buildObjClasses: function(obj) {
        var classes = [];
        for (var key in obj) {
            if (obj[key]) {
                classes.push(obj[key]);
            }
        }

        return classes;
    },
    _addEmptyButton: function($el) {
        if ($el.hasClass(this.prefix + '-empty-layer')) return;

        $el.addClass(this.prefix + '-empty-layer');

        var $plus = this.dom('<span>').addClass(this.prefix + '-plus-button');

        // button
        this.app.create('button', { name: 'plus', element: $plus }, { command: 'addbar.popup' });

        // append
        $el.append($plus);
    }
});
ArticleEditor.add('mixin', 'tool', {
    init: function(name, obj, popup, data) {
        this.name = name;
        this.setter = popup.get('setter');
        this.popup = popup;
        this.data = data;
        this.obj = this._observe(obj);

        if (this.obj) {
            this._build();
        }
    },
    getElement: function() {
        return this.$tool;
    },
    getInput: function() {
        return this.$input;
    },
    getValue: function() {
        var value = this.$input.val();
        return value.trim();
    },
    setValue: function(value) {
        this.$input.val(value);
    },
    setFocus: function() {
        this.$input.focus();
    },
    trigger: function(value) {
        this.setValue(value);

        if (this.setter) {
            this.app.api(this.setter, this.popup);
        }
    },

    // private
    _build: function() {
        this._buildTool();
        this._buildLabel();
        this._buildInputElement();
        this._buildInput();
        this._buildEvent();

        // props
        if (this._has('placeholder')) this.$input.attr('placeholder', this.lang.parse(this.obj.placeholder));
        if (this._has('width')) this.$input.css('width', this.obj.width);
        if (this._has('classname')) this.$input.addClass(this.obj.classname);
    },
    _buildInputElement: function() {
        this.$input = this.dom('<' + this._getInputParam('tag') + '>').addClass(this.prefix + this._getInputParam('classname'));
        this.$input.attr({ 'name': this.name, 'type': this._getInputParam('type'), 'data-type': this.type });
        this.$input.dataset('instance', this);
    },
    _buildInput: function() {
        return;
    },
    _buildEvent: function() {
        var types = ['segment'];
        if (types.indexOf(this.type) === -1 && this.setter) {
            var events = (this.type === 'checkbox' || this.type === 'select') ? 'change' : 'keydown blur';
            events = (this.type === 'number') ? events + ' change' : events;
            this.$input.on(events, this._catchSetter.bind(this));
        }
    },
    _buildTool: function() {
        this.$tool = this.dom('<div>').addClass(this.prefix + '-form-item').dataset('instance', this);
    },
    _buildLabel: function() {
        if (this.type !== 'checkbox' && this._has('label')) {
            this.$label = this.dom('<label>').addClass(this.prefix + '-form-label').html(this.lang.parse(this.obj.label));
            this.$tool.append(this.$label);
        }
    },
    _getInputParam: function(name) {
        return (this.input && typeof this.input[name] !== 'undefined') ? this.input[name] : '';
    },
    _get: function(name) {
        return this.obj[name];
    },
    _has: function(name) {
        return Object.prototype.hasOwnProperty.call(this.obj, name);
    },
    _observe: function(obj) {
        if (Object.prototype.hasOwnProperty.call(obj, 'observer')) {
            obj = this.app.api(obj.observer, obj, this.name);
        }

        return obj;
    },
    _catchSetter: function(e) {
        if (e.type === 'keydown' && e.which !== 13) return;
        if (e.type === 'keydown') e.preventDefault();

        // call setter
        this.app.api(this.setter, this.popup);
    }
});
ArticleEditor.add('module', 'lang', {
    init: function() {
        this.langKey = this.app.setting.get('editor.lang');
        this.vars = this._build();
    },
    get: function(name) {
        var value = this._get(name, this.vars);
        if (typeof value === 'undefined' && this.langKey !== 'en') {
            value = this._get(name, $ARX.lang.en);
        }

        return (typeof value === 'undefined') ? '' : value;
    },
    parse: function(str) {
        if (typeof str !== 'string') return str;

        var matches = str.match(/## (.*?) ##/g);
        if (matches) {
            for (var i = 0; i < matches.length; i++) {
                var key = matches[i].replace(/^##\s/g, '').replace(/\s##$/g, '');
                str = str.replace(matches[i], this.get(key));
            }
        }

        return str;
    },

    // private
    _get: function(name, vars) {
        var value;
        var arr = name.split('.');

        if (arr.length === 1) value = vars[name];
        else value = (typeof vars[arr[0]] !== 'undefined') ? vars[arr[0]][arr[1]] : undefined;

        return value;
    },
    _build: function() {
        var vars = $ARX.lang.en;
        if (this.langKey !== 'en') {
            vars = ($ARX.lang[this.langKey] !== 'undefined') ? $ARX.lang[this.langKey] : vars;
        }

        return vars;
    }
});
ArticleEditor.add('module', 'setting', {
    init: function() {
        this.opts = this._build();
    },
    dump: function() {
        return this.opts;
    },
    has: function(name) {
        var value;
        var arr = name.split('.');

        if (arr.length === 1) value = (typeof this.opts[name] !== 'undefined');
        else value = (typeof this.opts[arr[0]] !== 'undefined' && typeof this.opts[arr[1]] !== 'undefined');

        return value;
    },
    set: function(section, name, value) {
        if (typeof this.opts[section] === 'undefined') this.opts[section] = {};

        if (typeof value === 'undefined') this.opts[section] = name;
        else this.opts[section][name] = value;
    },
    get: function(name) {
        var value;
        var arr = name.split('.');

        if (arr.length === 1) value = this.opts[name];
        else value = (typeof this.opts[arr[0]] !== 'undefined') ? this.opts[arr[0]][arr[1]] : undefined;

        return value;
    },

    // private
    _build: function() {
        var opts = $ARX.extend(true, {}, $ARX.opts, this.app.initialSettings);
        opts = $ARX.extend(true, opts, $ARX.settings);

        return opts;
    }
});
ArticleEditor.add('module', 'container', {
    init: function() {
        this.blurclass = this.prefix + '-in-blur';
        this.focusclass = this.prefix + '-in-focus';
    },
    start: function() {
        this._buildMain();
        this._buildContainers(this.$main, this.opts.containers.main);
        this._buildBSModal();
    },
    stop: function() {
        this.$main.remove();
    },
    get: function(name) {
        return this['$' + name];
    },
    setFocus: function() {
        this.$main.removeClass(this.blurclass).addClass(this.focusclass);
    },
    setBlur: function() {
        this.$main.removeClass(this.focusclass).addClass(this.blurclass);
    },
    isFocus: function() {
        return this.$main.hasClass(this.focusclass);
    },

    // private
    _buildMain: function() {
        this.$main = this.dom('<div>').attr(this.prefix + '-uuid', this.uuid);
        this.$main.addClass(this.prefix + '-container ' + this.prefix + '-container-' + this.uuid);

        // place
        this.app.$element.after(this.$main);
    },
    _buildContainers: function($target, containers) {
        for (var i = 0; i < containers.length; i++) {
            var name = containers[i];
            var elName = '$' + name;

            // create
            this[elName] = this._createContainer(name);

            // nested
            if (typeof this.opts.containers[name] !== 'undefined') {
                this._buildContainers(this[elName], this.opts.containers[name]);
            }

            // append
            $target.append(this[elName]);
        }
    },
    _buildBSModal: function() {
        this.opts.bsmodal = (this.$main.closest('.modal-dialog').length !== 0);
    },
    _createContainer: function(name) {
        return this.dom('<div>').addClass(this.prefix + '-' + name + '-container');
    }
});
ArticleEditor.add('module', 'accessibility', {
    start: function() {
        this._buildRole();
        this._buildLabel();
    },
    _buildRole: function() {
        this.app.editor.getEditor().attr({ 'aria-labelledby': this.prefix + '-voice', 'role': 'presentation' });
    },
    _buildLabel: function() {
        var html = this.lang.get('accessibility.help-label');
        var $label = this._createLabel(html);

        // append
        this.app.container.get('main').prepend($label);
    },
    _createLabel: function(html) {
        var $label = this.dom('<span />').addClass(this.prefix + '-voice-label');
        $label.attr({ 'id': this.prefix + '-voice-' + this.uuid, 'aria-hidden': false });
        $label.html(html);

        return $label;
    }
});
ArticleEditor.add('module', 'utils', {

    // mobile
    isMobile: function() {
        return ("ontouchstart" in document.documentElement);
    },

    // invisible chars
    createInvisibleChar: function() {
        return document.createTextNode(this.opts.markerChar);
    },
    searchInvisibleChars: function(str) {
        return str.search(/^\uFEFF$/g);
    },
    removeInvisibleChars: function(str) {
        return str.replace(/\uFEFF/g, '');
    },

    // wrapper
    wrap: function(html, func) {
        var $w = this.dom('<div>').html(html);
        func($w);

        html = $w.html();
        $w.remove();

        return html;
    },

    // arrays
    extendArray: function(arr, extend) {
        arr = arr.concat(arr);
        if (extend) {
            for (var i = 0 ; i < extend.length; i++) {
                arr.push(extend[i]);
            }
        }

        return arr;
    },
    removeFromArrayByValue: function(arr, val) {
        val = (Array.isArray(val)) ? val : [val];
        var index;
        for (var i = 0; i < val.length; i++) {
            index = arr.indexOf(val[i]);
            if (index > -1) arr.splice(index, 1);
        }
        return arr;
    },
    sumOfArray: function(arr) {
        return arr.reduce(function(a, b) {
            return parseInt(a) + parseInt(b);
        }, 0);
    },

    // object
    getObjectIndex: function(obj, key) {
        return Object.keys(obj).indexOf(key);
    },
    insertToObject: function (key, value, obj, pos) {
        return Object.keys(obj).reduce(function(ac, a, i) {
            if (i === pos) ac[key] = value;
            ac[a] = obj[a];
            return ac;
        }, {});
    },

    // random
    getRandomId: function() {
        var id = '';
        var possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

        for (var i = 0; i < 12; i++) {
            id += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return id;
    },

    // escape
    escapeRegExp: function(s) {
        return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    },

    // string
    capitalize: function(str) {
        str = str.toLowerCase();

        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // data
    extendData: function(data, obj) {
        for (var key in obj) {
            if (key === 'elements') {
                data = this._extendDataElements(data, obj[key]);
            }
            else {
                data = this._setData(data, key, obj[key]);
            }
        }

        return data;
    },
    _extendDataElements: function(data, value) {
        this.dom(value).each(function($node) {
            if ($node.get().tagName === 'FORM') {
                var serializedData = $node.serialize(true);
                Object.keys(serializedData).forEach(function(key) {
                    data = this._setData(data, key, serializedData[key]);
                }.bind(this));
            }
            else {
                var name = ($node.attr('name')) ? $node.attr('name') : $node.attr('id');
                data = this._setData(data, name, $node.val());
            }
        }.bind(this));

        return data;
    },
    _setData: function(data, name, value) {
        if (data instanceof FormData) data.append(name, value);
        else data[name] = value;

        return data;
    }
});
ArticleEditor.add('module', 'paragraphizer', {
    init: function() {
        this.remStart = '#####replace';
        this.remEnd = '#####';

        var extendTags =  ['form', 'audio', 'figcaption', 'object', 'style', 'script', 'iframe', 'select', 'input', 'textarea',
                    'button', 'option', 'map', 'area', 'math', 'fieldset', 'legend', 'hgroup', 'nav', 'details', 'menu', 'summary'];
        this.tags = this.opts.tags.parser.concat(extendTags);
    },
    paragraphize: function(html) {
        // build markup tag
        var tag = 'p';
        var stored = [];
        var storedComments = [];

        // store
        html = this._storeTags(html, stored);
        html = this.app.content.storeComments(html, storedComments);

        // trim
        html = html.trim();
        html = this._trimLinks(html);

        // replace new lines
        html = html.replace(/xparagraphmarkerz(?:\r\n|\r|\n)$/g, '');
        html = html.replace(/xparagraphmarkerz$/g, '');
        html = html.replace(/xparagraphmarkerz(?:\r\n|\r|\n)/g, '\n');
        html = html.replace(/xparagraphmarkerz/g, '\n');
        html = html.replace(/[\n]+/g, "\n");

        // wrap to tag
        var str = '';
        var arr = html.split("\n");
        for (var i = 0; i < arr.length; i++) {
            str += '<' + tag + '>' + arr[i].trim() + '</' + tag + '>\n';
        }

        // trim new line at the end
        html = str.replace(/\n$/, '');

        // clean
        html = html.replace(new RegExp('<' + tag + '>\\s+#####', 'gi'), '#####');
        html = html.replace(new RegExp('<' + tag + '>#####', 'gi'), '#####');
        html = html.replace(new RegExp('#####</' + tag + '>', 'gi'), '#####');

        // restore
        html = this._restoreTags(html, stored);
        html = this.app.content.restoreComments(html, storedComments);

        // clean empty
        html = html.replace(/<(p|h1|h2|h3|h4|h5|h6|li|td|th)(.*?)>[\s\n]*<\/\1>/gi, '<$1$2></$1>');
        html = html.replace(/<p(.*?)><\/?br\s?\/?><\/p>/gi, "<p$1></p>");
        html = html.replace(/<div(.*?)><\/?br\s?\/?><\/div>/gi, "<div$1></div>");
        html = html.replace(/<\/?br\s?\/?><\/div>/gi, "</div>");
        html = html.replace(/<\/?br\s?\/?><\/li>/gi, "</li>");

        return html;
    },

    // private
    _storeTags: function(html, stored) {
        return this.app.utils.wrap(html, function($w) {
            $w.find(this.tags.join(', ')).each(function($node, i) { this._replaceTag($node, i, stored); }.bind(this));
        }.bind(this));
    },
    _restoreTags: function(html, stored) {
        for (var i = 0; i < stored.length; i++) {
            var str = stored[i].replace(/\$/gi, '&#36;');
            html = html.replace(this.remStart + i + this.remEnd, str);
        }

        return html;
    },
    _replaceTag: function($node, i, stored) {
        var node = $node.get();
        var replacement = document.createTextNode(this.remStart + i + this.remEnd + 'xparagraphmarkerz');
        stored.push(node.outerHTML);
        node.parentNode.replaceChild(replacement, node);
    },
    _trimLinks: function(html) {
        return this.app.utils.wrap(html, function($w) {
            $w.find('a').each(this._trimLink.bind(this));
        }.bind(this));
    },
    _trimLink: function($node) {
        $node.html($node.html().trim());
    }
});
ArticleEditor.add('module', 'element', {
    // is
    is: function(el, type, extend) {
        var res = false;
        var node = (type === 'text') ? el : this._getNode(el);

        if (type === 'inline') {
            res = (this._isElement(node) && this._isInlineTag(node.tagName, extend));
        }
        else if (type === 'blocks') {
            res = (this._isElement(node) && node.hasAttribute('data-' + this.prefix + '-type'));
        }
        else if (type === 'blocks-first') {
            res = (this._isElement(node) && node.hasAttribute('data-' + this.prefix + '-first-level'));
        }
        else if (type === 'block') {
            res = (this._isElement(node) && this._isBlockTag(node.tagName, extend));
        }
        else if (type === 'element') {
            res = this._isElement(node);
        }
        else if (type === 'text') {
            res = (typeof node === 'string' && !/^\s*<(\w+|!)[^>]*>/.test(node)) ? true : this.isTextNode(node);
        }
        else if (type === 'list') {
            res = (this._isElement(node) && (['ul', 'ol'].indexOf(node.tagName.toLowerCase()) !== -1));
        }
        else if (type === 'heading') {
            res = (this._isElement(node) && (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].indexOf(node.tagName.toLowerCase()) !== -1));
        }

        return res;
    },
    isEmptyOrImageInline: function(el) {
        var node = this.dom(el).get();
        if (!node || node.nodeType === 3) {
            return false;
        }

        var tag = node.tagName.toLowerCase();
        var tags = ['svg', 'img'];
        var noeditattr = (node.getAttribute('contenteditable') === 'false');
        var isInline = this.is(node, 'inline');
        if (
                (isInline && this.isEmpty(node)) ||
                (isInline && noeditattr) ||
                (tags.indexOf(tag) !== -1)
            ) {
            return true;
        }

        return false;
    },
    isEmpty: function(el) {
        var node = this._getNode(el);
        if (node) {
            return (node.nodeType === 3) ? (node.textContent.trim().replace(/\n/, '') === '') : (node.innerHTML === '');
        }

        return false;
    },
    isTag: function(el, tag) {
        return (this._getNode(el).tagName.toLowerCase() === tag);
    },
    isTextNode: function(el) {
        var node = this._getNode(el);

        return (node && node.nodeType && node.nodeType === 3);
    },
    isVisible: function(el) {
        var node = this._getNode(el);

        return !!(node.offsetWidth || node.offsetHeight || node.getClientRects().length);
    },
    isScrollVisible: function(el) {
        var $scrollTarget = this.app.scroll.getTarget();
        var $el = this.dom(el);
        var docViewTop = $scrollTarget.scrollTop();
        var docViewBottom = docViewTop + $scrollTarget.height();
        var elemTop = $el.offset().top;

        return (elemTop <= docViewBottom);
    },

    // get
    getFirstLevel: function(el) {
        return this.dom(el).closest('[data-' + this.prefix + '-first-level]');
    },
    getDataBlock: function(el) {
        return this.dom(el).closest('[data-' + this.prefix + '-type]');
    },
    getType: function(el) {
        return this.dom(el).attr('data-' + this.prefix + '-type');
    },
    getAllInlines: function(inline) {
        var inlines = [];
        var node = inline;
        while (node) {
            if (this.is(node, 'inline')) {
                inlines.push(node);
            }

            node = node.parentNode;
        }

        return inlines;
    },
    getClosest: function(el, types) {
        return this.dom(el).closest(this.getTypesSelector(types));
    },
    getParents: function(el, types) {
        return this.dom(el).parents(this.getTypesSelector(types));
    },
    getChildren: function(el, types) {
        return this.dom(el).find(this.getTypesSelector(types));
    },
    getTypesSelector: function(types) {
        return '[data-' + this.prefix + '-type=' + types.join('],[data-' + this.prefix + '-type=') + ']';
    },

    // has
    hasClass: function(el, value) {
        value = (typeof value === 'string') ? [value] : value;

        var $el = this.dom(el);
        var count = value.length;
        var z = 0;
        for (var i = 0; i < count; i++) {
            if ($el.hasClass(value[i])) {
                z++;
            }
        }

        return (count === z);
    },

    // scroll
    scrollTo: function($el, tolerance) {
        if (!this.isScrollVisible($el)) {
            tolerance = tolerance || 60;
            var offset = $el.offset();
            var $target = this.app.scroll.getTarget();
            var value = offset.top - tolerance;
            $target.scrollTop(value);

            setTimeout(function() {
                $target.scrollTop(value);
            }, 1);

        }
    },

    // replace
    replaceToTag: function(el, tag, keepchildnodes) {
        return this.dom(el).replaceWith(function(node) {

            var $el = this.dom('<' + tag + '>');
            if (!keepchildnodes) {
                $el.append(node.innerHTML);
            }

            if (node.attributes) {
                var attrs = node.attributes;
                for (var i = 0; i < attrs.length; i++) {
                    $el.attr(attrs[i].nodeName, attrs[i].value);
                }
            }

            if (keepchildnodes) {
                while (node.childNodes.length > 0) {
                    $el.append(this.dom(node.firstChild));
                }
            }

            return $el;
        }.bind(this));
    },

    // split
    split: function(el) {
        var $el = this.dom(el);
        el = $el.get();
        var tag = el.tagName.toLowerCase();
        var fragment = this.app.content.extractHtmlFromCaret(el);
        if (fragment.nodeType && fragment.nodeType === 11) {
            fragment = this.dom(fragment.childNodes);
        }

        var $secondPart = this.dom('<' + tag + ' />');
        $secondPart = this.cloneAttrs(el, $secondPart);
        $secondPart.append(fragment);
        $el.after($secondPart);

        var $last = $el.children().last();
        if (this.is($last, 'inline')) {
            var html = $last.html();
            html = this.app.utils.removeInvisibleChars(html);
            if (html === '') {
                $last.remove();
            }
        }

        var type = this.getType($secondPart);
        if (type) {
            this.app.create('block.' + type, $secondPart, true);
        }

        if ($el.html() === '') $el.remove();

        return $secondPart;
    },

    // clone
    cloneEmpty: function(el) {
        var $el = this.dom(el);
        var tag =  $el.get().tagName.toLowerCase();
        var $clone = this.dom('<' + tag + '>');

        return $clone;
    },
    cloneAttrs: function(elFrom, elTo) {
        var $elTo = this.dom(elTo);
        var attrs = this._getNode(elFrom).attributes;
        var len = attrs.length;
        while (len--) {
            var attr = attrs[len];
            $elTo.attr(attr.name, attr.value);
        }

        return $elTo;
    },

    // attrs
    getAttrs: function(el) {
        var node = this._getNode(el);
        var attr = {};
        if (node.attributes != null && node.attributes.length) {
            for (var i = 0; i < node.attributes.length; i++) {
                var val = node.attributes[i].nodeValue;
                val = (this._isNumber(val)) ? parseFloat(val) : this._getBooleanFromStr(val);
                attr[node.attributes[i].nodeName] = val;
            }
        }

        return attr;
    },
    removeEmptyAttrs: function(el, attrs) {
        var $el = this.dom(el);
        var name = attrs.join(' ');
        var res = false;

        if (typeof $el.attr(name) === 'undefined' || $el.attr(name) === null) {
            res = true;
        }
        else if ($el.attr(name) === '') {
            $el.removeAttr(name);
            res = true;
        }

        return res;
    },

    // blocks
    getBlocks: function(el, parsertags, extendtags) {
        var node = this._getNode(el);
        var nodes = node.childNodes;
        var finalNodes = [];
        var tags = parsertags || this.opts.tags.parser;
        if (extendtags) {
            tags = this.app.utils.extendArray(tags, extendtags);
        }

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType === 1 && tags.indexOf(nodes[i].tagName.toLowerCase()) !== -1) {
                finalNodes.push(nodes[i]);
            }
        }

        return finalNodes;
    },
    hasBlocks: function(el) {
        return (this.getBlocks(el).length !== 0);
    },

    // siblings
    hasTextSiblings: function(el) {
        var node = this._getNode(el);
        var hasPrev = (node.previousSibling && node.previousSibling.nodeType === 3 && !this.isEmpty(node.previousSibling));
        var hasNext = (node.nextSibling && node.nextSibling.nodeType === 3 && !this.isEmpty(node.nextSibling));

        return (hasPrev || hasNext);
    },

    // private
    _getNode: function(el) {
        return this.dom(el).get();
    },
    _getBooleanFromStr: function(str) {
        if (str === 'true') return true;
        else if (str === 'false') return false;

        return str;
    },
    _isBlockTag: function(tag, extend) {
        var arr = this.app.utils.extendArray(this.opts.tags.block, extend);

        return (arr.indexOf(tag.toLowerCase()) !== -1);
    },
    _isInlineTag: function(tag, extend) {
        var arr = this.app.utils.extendArray(this.opts.tags.inline, extend);

        return (arr.indexOf(tag.toLowerCase()) !== -1);
    },
    _isElement: function(node) {
        return (node && node.nodeType && node.nodeType === 1);
    },
    _isTag: function(tag) {
        return (tag !== undefined && tag);
    },
    _isNumber: function(str) {
        return !isNaN(str) && !isNaN(parseFloat(str));
    }
});
ArticleEditor.add('module', 'scroll', {
    init: function() {
        this.scrolltop = false;
    },
    save: function() {
        this.scrolltop = this.getTarget().scrollTop();
    },
    restore: function() {
        if (this.scrolltop !== false) {
            this.getTarget().scrollTop(this.scrolltop);
            this.scrolltop = false;
        }
    },
    isTarget: function() {
        return (this.opts.editor.scrollTarget !== window);
    },
    getTarget: function() {
        return this.dom(this.opts.editor.scrollTarget);
    }
});
ArticleEditor.add('module', 'button', {
    init: function(name, obj, $container, type) {
        // build
        if (typeof name === 'object') {
            this.name = name.name;
            this.obj = obj;
            this._buildFromElement(name.element);
        }
        else if (name) {
            this.type = type || false;
            this.name = name;

            var res = this._observe(obj);
            this.obj = (typeof res === 'undefined') ? obj : res;

            if (this.obj) {
                this._build(name, $container);
            }
        }
    },
    setColor: function(stack, data) {
        var name = stack.getName();
        if (name === 'background' || name === 'text-color') {
            var key = (name === 'background') ? 'background-color' : 'color';
            this.setBackground(data[key]);
        }
    },
    isButton: function() {
        return true;
    },
    isAddbar: function() {
        return this._has('addbar');
    },
    isControl: function() {
        return this._has('control');
    },
    getName: function() {
        return this.name;
    },
    getTitle: function() {
        return this.title;
    },
    getParams: function() {
        return (this._has('params')) ? this.obj.params : false;
    },
    getOffset: function() {
        return this.$button.offset();
    },
    getDimension: function() {
        return {
            width: this.$button.width(),
            height: this.$button.height()
        };
    },
    getElement: function() {
        return this.$button;
    },
    setBackground: function(color) {
        this._background('add', color);
    },
    resetBackground: function() {
        this._background('remove', '');
    },

    // private
    _has: function(name) {
        return Object.prototype.hasOwnProperty.call(this.obj, name);
    },
    _observe: function(obj) {
        if (Object.prototype.hasOwnProperty.call(obj, 'observer')) {
            obj = this.app.api(obj.observer, obj, this.name);
        }

        return obj;
    },
    _background: function(type, color) {
        var func = (type === 'remove') ? 'removeClass' : 'addClass';
        this.$icon[func](this.prefix + '-button-icon-color').css({
            'background-color': color,
            'color': (color !== '') ? this.app.color.invert(color) : ''
        });
    },
    _buildFromElement: function(element) {
        this.$button = this.dom(element);
        this.$button.addClass(this.prefix + '-button-target');
        this._buildData();
    },
    _build: function(name, $container) {

        this._buildTitle();
        this._buildElement();
        this._buildIcon();
        this._buildData($container);
    },
    _buildData: function($container) {

        // data
        this.$button.attr({
            'tabindex': '-1',
            'data-name': this.name,
            'data-command': this.obj.command || false
        });

        this.$button.dataset('instance', this);

        // func
        var func = (this._has('command')) ? '_catch' : '_stop';

        // events
        this.$button.on('click.' + this.prefix + '-button', this[func].bind(this));
        this.$button.on('dragstart.' + this.prefix + '-button', function(e) { e.preventDefault(); return; });

        if ($container) {
            this._buildTooltip();
            this._buildBackground();
            this._buildPosition($container);
        }
    },
    _buildTitle: function() {
        this.title = (typeof this.obj.title !== 'undefined') ? this.lang.parse(this.obj.title) : '';
    },
    _buildElement: function() {
        this.$button = this.dom('<a href="#"></a>');
        this.$button.addClass(this.prefix + '-button ' + this.prefix + '-button-target');

        if (this.type) {
            this.$button.addClass(this.prefix + '-button-' + this.type);
        }

        if (this._has('classname')) {
            this.$button.addClass(this.obj.classname);
        }
    },
    _buildIcon: function() {
        var isIcon = this._has('icon');
        var span = '<span class="' + this.prefix + '-icon-' + this.name + '"></span>';

        this.$icon = this._buildIconElement();

        if (isIcon && this.obj.icon !== true) {
            if (this.obj.icon.search(/</) !== -1) {
                span = this.obj.icon;
            }
            else {
                span = '<span class="' + this.prefix + '-icon-' + this.obj.icon + '"></span>';
            }
        }

        // buttons.icons
        if (this.opts.buttons.icons && typeof this.opts.buttons.icons[this.name] !== 'undefined') {
            span = this.opts.buttons.icons[this.name];
        }

        this.$icon.append(span);
        this.$button.append(this.$icon);
    },
    _buildIconElement: function() {
        return this.dom('<span>').addClass(this.prefix + '-button-icon');
    },
    _buildTooltip: function() {
        if (this.type === 'toolbar' || (this.type === 'context' && this.opts.tooltip.context)) {
            this.app.tooltip.build(this.$button, this.title);
        }
    },
    _buildBackground: function() {
        if (this._has('background')) {
            this.setBackground(this.obj.background);
        }
    },
    _buildPosition: function($container) {
        if (this._has('position')) {
            var pos = this.obj.position;
            if (pos === 'first') {
                $container.prepend(this.$button);
            }
            else if (typeof pos === 'object') {

                var type = (Object.prototype.hasOwnProperty.call(pos, 'after')) ? 'after' : 'before';
                var name = pos[type];
                var $el = this._findPositionElement(name, $container);

                if ($el) {
                    $el[type](this.$button);
                }
                else {
                    $container.append(this.$button);
                }
            }
        }
        else {
            $container.append(this.$button);
        }
    },
    _findPositionElement: function(name, $container) {
        var $el;
        if (Array.isArray(name)) {
            for (var i = 0; i < name.length; i++) {
                $el = $container.find('[data-name=' + name[i] + ']');
                if ($el.length !== 0) break;
            }
        }
        else {
            $el = $container.find('[data-name=' + name + ']');
        }

        return ($el.length !== 0) ? $el : 0;
    },
    _stop: function(e) {
        e.preventDefault();
        e.stopPropagation();
    },
    _catch: function(e) {
        e.preventDefault();
        e.stopPropagation();

        var $btn = this.dom(e.target).closest('.' + this.prefix + '-button-target');
        if ($btn.hasClass('disable')) return;

        // editor focus
        this.app.editor.setFocus();

        var command = $btn.attr('data-command');
        var name = $btn.attr('data-name');
        var instance = $btn.dataget('instance');

        // command
        this.app.api(command, this.getParams(), instance, name, e);
        this.app.tooltip.close();
    }
});
ArticleEditor.add('module', 'tooltip', {
    init: function() {
        this.classname = this.prefix + '-tooltip';
        this.eventname = this.prefix + '-button-' + this.uuid;
    },
    stop: function() {
        this.close();
    },
    build: function($btn, title) {
        title = this._cleanTitle(title);
        if (title) {
            $btn.attr('data-tooltip', title);
            $btn.on('mouseover.' + this.eventname, this.open.bind(this));
            $btn.on('mouseout.' + this.eventname, this.close.bind(this));
        }
    },
    open: function(e) {
        var $btn = this._getButton(e);
        if (this.app.popup.isOpen() || $btn.hasClass('disable')) {
            return;
        }

        // create
        this.$tooltip = this._create($btn);

        // position
        this._setPosition($btn);
        this._fixBSModal();

        // append
        this.app.$body.append(this.$tooltip);
    },
    close: function() {
        this.app.$body.find('.' + this.classname).remove();
    },

    // private
    _create: function($btn) {
        return this.dom('<span>').addClass(this.classname).html($btn.attr('data-tooltip'));
    },
    _cleanTitle: function(title) {
        return (title) ? title.replace(/(<([^>]+)>)/gi, '') : false;
    },
    _setPosition: function($btn) {
        var offset = $btn.offset();
        var height = $btn.height();

        this.$tooltip.css({
            top: (offset.top + height) + 'px',
            left: (offset.left) + 'px'
        });
    },
    _fixBSModal: function() {
        if (this.opts.bsmodal) {
            this.$tooltip.css('z-index', 1060);
        }
    },
    _getButton: function(e) {
        return this.dom(e.target).closest('.' + this.prefix + '-button-target');
    }
});
ArticleEditor.add('module', 'fragment', {
    build: function(node) {
        return (this.is(node)) ? node : this.create(node);
    },
    insert: function(fragment) {
        var sel = this.app.selection.get();
        if (!sel.range) return;

        if (sel.collapsed) {
            var start = sel.range.startContainer;
            if (start.nodeType !== 3 && start.tagName === 'BR') {
                start.parentNode.removeChild(start);
            }
        }
        else {
            sel.range.deleteContents();
        }

        if (fragment.frag) {
            sel.range.insertNode(fragment.frag);
        }
        else {
            sel.range.insertNode(fragment);
        }
    },
    createContainer: function(html) {
        var $div = this.dom('<div>');

        if (typeof html === 'string') $div.html(html);
        else $div.append(this.dom(html).clone(true));

        return $div.get();
    },
    create: function(html) {
        var el = (typeof html === 'string') ? this.createContainer(html) : html;
        var frag = document.createDocumentFragment(), node, firstNode, lastNode;
        var nodes = [];
        var i = 0;
        while ((node = el.firstChild)) {
            i++;
            var n = frag.appendChild(node);
            if (i === 1) firstNode = n;

            nodes.push(n);
            lastNode = n;
        }

        return { frag: frag, first: firstNode, last: lastNode, nodes: nodes };
    },
    is: function(obj) {
        return (typeof obj === 'object' && obj.frag);
    }
});
ArticleEditor.add('module', 'clipboard', {
    getContent: function(clipboard) {
        var type = (this.isPlainText(clipboard)) ? 'text/plain' : 'text/html';
        var html = clipboard.getData(type);

        // html
        return (type === 'text/plain') ?  this.app.content.escapeHtml(html) : html;
    },
    setContent: function(e, html, text) {
        var clipboard = e.clipboardData;

        // unparse
        html = this.app.parser.unparse(html);
        html = '<meta type="' + this.prefix + '-editor"/>' + html;

        // text
        text = text || this.app.content.getTextFromHtml(html, { nl: true });

        // set
        clipboard.setData('text/html', html);
        clipboard.setData('text/plain', text);
    },
    isPlainText: function(clipboard) {
        var text = clipboard.getData('text/plain');
        var html = clipboard.getData('text/html');

        if (html && html.trim() !== '') {
            return false;
        }
        else {
            return (text !== null);
        }
    }
});
ArticleEditor.add('module', 'codemirror', {
    init: function() {
        this.cm = false;
    },
    create: function(params) {
        if (!this.is()) return;

        var opts = (typeof this.opts.codemirror === 'object') ? this.opts.codemirror : {};
        var instance = (this.opts.codemirrorSrc) ? this.opts.codemirrorSrc : CodeMirror;

        this.cm = instance.fromTextArea(this.dom(params.el).get(), opts);

        if (params.height) this.cm.setSize(null, params.height);
        if (params.focus) this.cm.focus();

        return this.cm;
    },
    destroy: function() {
        if (this.cm) {
            this.cm.toTextArea();
            this.cm = false;
        }
    },
    is: function() {
        return this.opts.codemirror;
    },
    val: function(html) {
        if (this.is() && this.cm) {
            html = this.cm.getValue();
        }

        return html;
    }
});
ArticleEditor.add('class', 'upload', {
    defaults: {
        type: 'image',
        box: false,
        url: false,
        cover: true, // 'cover'
        name: 'file',
        data: false,
        multiple: true,
        placeholder: false,
        hidden: true,
        target: false,
        success: false,
        error: false,
        remove: false,
        trigger: false,
        input: false
    },
    init: function($el, params, trigger) {
        this.eventname = this.prefix + '-upload';

        if ($el) {
            this._build($el, params, trigger);
        }
    },
    send: function(e, files, params, trigger) {
        this.p = this._buildParams(params, trigger);
        this._send(e, files);
    },
    complete: function(response, e) {
        this._complete(response, e);
    },

    // api
    setImage: function(url) {
        if (this.p.input) return;

        if (this.$image) this.$image.remove();
        if (this.$remove) this.$remove.remove();

        if (url === '') {
            this.$placeholder.show();
        }
        else {
            this.$placeholder.hide();
            this._buildImage(url);

            if (this.p.remove) {
                this._buildRemove();
            }
        }
    },

    // build
    _build: function($el, params, trigger) {
        this.p = this._buildParams(params, trigger);
        this.$element = this.dom($el);

        var tag = this.$element.get().tagName;
        if (tag === 'INPUT') {
            this._buildByInput();
        }
        else {
            this._buildByBox();
        }
    },
    _buildImage: function(url) {
        this.$image = this.dom('<img>');
        this.$image.attr('src', url);
        this.$box.append(this.$image);

        if (this.p.input === false) {
            this.$box.off('click.' + this.eventname);
            this.$image.on('click.' + this.eventname, this._click.bind(this));
        }
    },
    _buildRemove: function() {
        this.$remove = this.dom('<span>');
        this.$remove.addClass(this.prefix + '-upload-remove');
        this.$remove.on('click', this._removeImage.bind(this));
        this.$box.append(this.$remove);
    },
    _buildParams: function(params, trigger) {
        params = $ARX.extend(true, this.defaults, params);
        if (trigger) params.trigger = trigger;

        return params;
    },
    _buildByInput: function() {

        this.$input = this.$element;

        // box
        if (this.p.box) {
            this._buildBox();
            this._buildPlaceholder();
        }
        // input
        else {
            this.p.input = true;
        }

        this._buildAccept();
        this._buildMultiple();
        this._buildEvents();
    },
    _buildByBox: function() {
        this._buildInput();
        this._buildAccept();
        this._buildMultiple();
        this._buildBox();
        this._buildPlaceholder();
        this._buildEvents();
    },
    _buildBox: function() {
        this.$box = this.dom('<div>').addClass(this.prefix + '-form-upload-box');
        this.$element.before(this.$box);

        // cover
        if (this.p.cover === false) {
            this.$box.addClass(this.prefix + '-form-upload-cover-off');
        }

        // hide
        if (this.p.hidden) {
            this.$element.hide();
        }
    },
    _buildPlaceholder: function() {
        if (!this.p.placeholder) return;
        this.$placeholder = this.dom('<span>').addClass(this.prefix + '-form-upload-placeholder');
        this.$placeholder.html(this.p.placeholder);
        this.$box.append(this.$placeholder);
    },
    _buildInput: function() {
        this.$input = this.dom('<input>');
        this.$input.attr('type', 'file');
        this.$input.attr('name', this._getUploadParam());
        this.$input.hide();

        this.$element.before(this.$input);
    },
    _buildAccept: function() {
        if (this.p.type !== 'image') return;

        var types = this.opts.image.types.join(',');
        this.$input.attr('accept', types);
    },
    _buildMultiple: function() {
        if (this.p.type !== 'image') return;

        if (this.p.multiple) {
            this.$input.attr('multiple', 'multiple');
        }
        else {
            this.$input.removeAttr('multiple');
        }
    },
    _buildEvents: function() {
        this.$input.on('change.' + this.eventname + '-' + this.uuid, this._change.bind(this));

        if (this.p.input === false) {
            this.$box.on('click.' + this.eventname, this._click.bind(this));
            this.$box.on('drop.' + this.eventname, this._drop.bind(this));
            this.$box.on('dragover.' + this.eventname, this._dragover.bind(this));
            this.$box.on('dragleave.' + this.eventname, this._dragleave.bind(this));
        }
    },
    _buildData: function(name, files, data) {
        if (this.p.multiple === 'single') {
            data.append(name, files[0]);
        }
        else if (this.p.multiple) {
            for (var i = 0; i < files.length; i++) {
                data.append(name + '[]', files[i]);
            }
        }
        else {
            data.append(name + '[]', files[0]);
        }

        return data;
    },

    // remove
    _removeImage: function(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (this.$image) this.$image.remove();
        if (this.$remove) this.$remove.remove();

        this.$placeholder.show();

        if (this.p.input === false) {
            this.$box.on('click.' + this.eventname, this._click.bind(this));
        }

        if (e) {
            this.app.api(this.p.remove, e);
        }
    },

    // get
    _getUploadParam: function() {
        return this.p.name;
    },


    // events
    _click: function(e) {
        e.preventDefault();
        this.$input.click();
    },
    _change: function(e) {
        this._send(e, this.$input.get().files);
    },
    _drop: function(e) {
        e.preventDefault();
        this._send(e);
    },
    _dragover: function(e) {
        e.preventDefault();
        this._setStatus('hover');
        return false;
    },
    _dragleave: function(e) {
        e.preventDefault();
        this._removeStatus();
        return false;
    },

    // set
    _setStatus: function(status) {
        if (this.p.input || !this.p.box) return;
        this._removeStatus();
        this.$box.addClass(this.prefix + '-form-upload-' + status);
    },

    // remove
    _removeStatus: function() {
        if (this.p.input || !this.p.box) return;
        var status = ['hover', 'error'];
        for (var i = 0; i < status.length; i++) {
            this.$box.removeClass(this.prefix + '-form-upload-' + status[i]);
        }
    },

    // send
    _send: function(e, files) {
        files =  files || e.dataTransfer.files;

        var data = new FormData();
        var name = this._getUploadParam();

        data = this._buildData(name, files, data);
        data = this.app.utils.extendData(data, this.p.data);

        // send data
        this._sendData(e, files, data);
    },
    _sendData: function(e, files, data) {
        if (typeof this.p.url === 'function') {
            this.p.url.call(this.app, this, { data: data, files: files, e: e });
        }
        else {
            this.app.progress.show();
            this.ajax.post({
                url: this.p.url,
                data: data,
                before: function(xhr) {
                    var event = this.app.broadcast('upload.before.send', { xhr: xhr, data: data, files: files, e: e });
                    if (event.isStopped()) {
                        this.app.progress.hide();
                        return false;
                    }
                }.bind(this),
                success: function(response) {
                    this._complete(response, e);
                }.bind(this),
                error: function(response) {
                    this._complete(response, e);
                }.bind(this)
            });
        }
    },

    // complete
    _complete: function(response, e) {
        if (response && response.error) {
            this._setStatus('error');

            if (this.p.error) {
                this.app.broadcast('upload.error', { response: response });
                this.app.api(this.p.error, response, e);
            }
        }
        else {
            this._removeStatus();
            this._trigger(response);

            if (this.p.success) {
                this.app.broadcast('upload.complete', { response: response });
                this.app.api(this.p.success, response, e);
            }
        }

        setTimeout(function() {
            this.app.progress.hide();
        }.bind(this), 500);
    },
    _trigger: function(response) {
        if (this.p.trigger) {
            if (response && response.url) {
                var instance = this.p.trigger.instance;
                var method = this.p.trigger.method;
                instance[method].call(instance, response.url);
            }
        }
    }
});
ArticleEditor.add('module', 'progress', {
    stop: function() {
        this.hide();
    },
    show: function() {
        this.hide();

        this.$progress = this.dom('<div>').addClass(this.prefix + '-editor-progress');
        this.$progress.attr('id', this.prefix + '-progress');

        this.$progressBar = this.dom('<span>');
        this.$progress.append(this.$progressBar);
        this.app.$body.append(this.$progress);
    },
    hide: function() {
        this.app.$body.find('#' + this.prefix + '-progress').remove();
    }
});
ArticleEditor.add('module', 'autosave', {
    send: function() {
        if (this.opts.autosave.url) {
            this._sending();
        }
    },

    // private
    _getName: function() {
        var name;
        if (this.opts.autosave.name) {
            name = this.opts.autosave.name;
        }
        else {
            name = this.app.$element.attr('name');
            name = (!name) ? 'content' + this.uuid : name;
        }

        return name;
    },
    _sending: function() {
        var name = this._getName();
        var data = {};
        data[name] = this.app.$element.val();
        data = this.app.utils.extendData(data, this.opts.autosave.data);

        this.ajax.request(this.opts.autosave.method, {
            url: this.opts.autosave.url,
            data: data,
            before: function(xhr) {
                var event = this.app.broadcast('autosave.before.send', { xhr: xhr, name: name, data: data });
                if (event.isStopped()) {
                    return false;
                }
            }.bind(this),
            success: function(response) {
                this._complete(response, name, data);
            }.bind(this)
        });
    },
    _complete: function(response, name, data) {
        var callback = (response && response.error) ? 'autosave.error' : 'autosave.send';
        this.app.broadcast(callback, { name: name, data: data, response: response });
    }
});
ArticleEditor.add('module', 'statusbar', {
    init: function() {
        this.classname = this.prefix + '-statusbar';
    },
    start: function() {
        this._build();
    },
    add: function(name, html) {
        return this.update(name, html);
    },
    update: function(name, html) {
        var $item = this.get(name);
        if ($item.length === 0) {
            $item = this._buildItem(name);
        }

        return $item.html(html);
    },
    get: function(name) {
        var s = (name) ? '[data-name=' + name + ']' : '[data-name]';
        return this.$statusbar.find(s);
    },
    remove: function(name) {
        this.get(name).remove();
    },
    clear: function() {
        this.$statusbar.html('');
    },

    // private
    _build: function() {
        this.$statusbar = this.dom('<div>').attr('dir', this.opts.editor.direction);
        this.$statusbar.addClass(this.classname + ' ' + this.classname + '-' + this.uuid);

        this.app.container.get('statusbar').append(this.$statusbar);
    },
    _buildItem: function(name) {
        var $item = this.dom('<span>').addClass(this.classname + '-item');
        $item.attr('data-name', name);

        // append
        this.$statusbar.append($item);

        return $item;
    }
});
ArticleEditor.add('module', 'shortcut', {
    init: function() {
        // remove
        if (this.opts.shortcutsRemove) {
            var keys = this.opts.shortcutsRemove;
            for (var i = 0; i < keys.length; i++) {
                this.remove(keys[i]);
            }
        }

        // local
        this.shortcuts = this.opts.shortcuts;

        // based on https://github.com/jeresig/jquery.hotkeys
        this.hotkeys = {
            8: "backspace", 9: "tab", 10: "return", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
            20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
            37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del", 59: ";", 61: "=",
            96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
            104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/",
            112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8",
            120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 173: "-", 186: ";", 187: "=",
            188: ",", 189: "-", 190: ".", 191: "/", 192: "`", 219: "[", 220: "\\", 221: "]", 222: "'"
        };

        this.hotkeysShiftNums = {
            "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",
            "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<",
            ".": ">",  "/": "?",  "\\": "|"
        };
    },
    add: function(keys, obj) {
        this.shortcuts[keys] = obj;
    },
    remove: function(keys) {
        this.opts.shortcutsBase = this._remove(keys, this.opts.shortcutsBase);
        this.opts.shortcuts = this._remove(keys, this.opts.shortcuts);
    },
    popup: function(params, button) {

        var meta = (/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)) ? '<b>&#8984;</b>' : 'ctrl';
        var items = {};
        var z = 0;

        // items
        z = this._buildPopupItems(items, z, this.opts.shortcutsBase, meta, 'base');
        this._buildPopupItems(items, z, this.opts.shortcuts, meta);

        // create
        this.app.popup.create('shortcuts', {
            width: '360px',
            items: items
        });

        // open
        this.app.popup.open({ button: button });
    },
    handle: function(e) {
        this.triggered = false;

        // disable browser's hot keys for bold and italic if shortcuts off
        if (this.shortcuts === false) {
            if ((e.ctrlKey || e.metaKey) && (e.which === 66 || e.which === 73)) {
                e.preventDefault();
            }
            return true;
        }

        // build
        if (e.ctrlKey || e.metaKey || e.shoftKey || e.altKey) {
            for (var key in this.shortcuts) {
                if (this.shortcuts.hasOwnProperty(key)) {
                    this._build(e, key, this.shortcuts[key]);
                }
            }
        }

        return (this.triggered);
    },

    // private
    _buildPopupItems: function(items, z, shortcuts, meta, type) {
        for (var key in shortcuts) {
            if (shortcuts.hasOwnProperty(key)) {
                var $item = this.dom('<div>').addClass(this.prefix + '-popup-shortcut-item');
                var title = (type === 'base') ? shortcuts[key] : shortcuts[key].title;

                var $title = this.dom('<span>').addClass(this.prefix + '-popup-shortcut-title').html(this.lang.parse(title));
                var $kbd = this.dom('<span>').addClass(this.prefix + '-popup-shortcut-kbd');

                var name = (type === 'base') ? key.replace('meta', meta) : shortcuts[key].name.replace('meta', meta);
                var arr = name.split('+');
                for (var i = 0; i < arr.length; i++) {
                    arr[i] = '<span>' + arr[i] + '</span>';
                }
                $kbd.html(arr.join('+'));

                $item.append($title);
                $item.append($kbd);

                items[z] = { html: $item };

                z++;
            }
        }

        return z;
    },
    _build: function(e, str, obj) {
        var keys = str.split(',');
        var len = keys.length;
        for (var i = 0; i < len; i++) {
            if (typeof keys[i] === 'string' && !Object.prototype.hasOwnProperty.call(obj, 'trigger')) {
                this._handler(e, keys[i].trim(), obj);
            }
        }
    },
    _handler: function(e, keys, obj) {
        keys = keys.toLowerCase().split(" ");

        var special = this.hotkeys[e.keyCode];
        var character = (e.which !== 91) ? String.fromCharCode(e.which).toLowerCase() : false;
        var modif = "", possible = {};
        var cmdKeys = ["meta", "ctrl", "alt", "shift"];

        for (var i = 0; i < cmdKeys.length; i++) {
            var specialKey = cmdKeys[i];
            if (e[specialKey + 'Key'] && special !== specialKey) {
                modif += specialKey + '+';
            }
        }

        // right cmd
        if (e.keyCode === 93) {
            modif += 'meta+';
        }

        if (special) possible[modif + special] = true;
        if (character) {
            possible[modif + character] = true;
            possible[modif + this.hotkeysShiftNums[character]] = true;

            // "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
            if (modif === "shift+") {
                possible[this.hotkeysShiftNums[character]] = true;
            }
        }

        var len = keys.length;
        for (var z = 0; z < len; z++) {
            if (possible[keys[z]]) {

                e.preventDefault();
                this.triggered = true;

                this.app.api(obj.command, obj.params, e);
                return;
            }
        }
    },
    _remove: function(keys, obj) {
        return Object.keys(obj).reduce(function(object, key) {
            if (key !== keys) { object[key] = obj[key]; }
            return object;
        }, {});
    }
});
ArticleEditor.add('module', 'offset', {
    get: function(el) {
        el = this._getEl(el);

        var sel = this.app.editor.getWinNode().getSelection();
        var offset = false;

        if (sel && sel.rangeCount > 0) {
            var range = sel.getRangeAt(0);
            if (el.contains(sel.anchorNode)) {
                var cloned = range.cloneRange();
                cloned.selectNodeContents(el);
                cloned.setEnd(range.startContainer, range.startOffset);

                var start = cloned.toString().length;
                offset = {
                    start: start,
                    end: start + range.toString().length
                };
            }
        }

        return offset;
    },
    set: function(el, offset) {
        if (offset === false) {
            offset = { start: 0, end: 0 };
        }

        el = this._getEl(el);

        var charIndex = 0, range = this.app.editor.getDocNode().createRange();
        var nodeStack = [el], node, foundStart = false, stop = false;

        range.setStart(el, 0);
        range.collapse(true);

        while (!stop && (node = nodeStack.pop())) {
            if (node.nodeType === 3) {
                var nextCharIndex = charIndex + node.length;

                if (!foundStart && offset.start >= charIndex && offset.start <= nextCharIndex) {
                    range.setStart(node, offset.start - charIndex);
                    foundStart = true;
                }

                if (foundStart && offset.end >= charIndex && offset.end <= nextCharIndex) {
                    range.setEnd(node, offset.end - charIndex);
                    stop = true;
                }

                charIndex = nextCharIndex;
            }
            else {
                var i = node.childNodes.length;
                while (i--) {
                    nodeStack.push(node.childNodes[i]);
                }
            }
        }

        this.app.selection.setRange(range);
    },

    // private
    _getEl: function(el) {
        return (!el) ? this.app.editor.getLayout().get() : this.dom(el).get();
    }
});
ArticleEditor.add('module', 'marker', {
    build: function(pos) {
        var $marker = this.dom('<span>').attr('id', 'selection-marker-' + pos);
        $marker.addClass(this.prefix + '-selection-marker');
        $marker.html(this.opts.markerChar);

        return $marker.get();
    },
    insert: function() {
        this.remove();

        var sel = this.app.selection.get();
        var both = (!sel.collapsed);

        if (!sel.range) return;

        var start = this.build('start');
        var end = this.build('end');

        var cloned = sel.range.cloneRange();

        if (both) {
            cloned.collapse(false);
            cloned.insertNode(end);
        }

        cloned.setStart(sel.range.startContainer, sel.range.startOffset);
        cloned.collapse(true);
        cloned.insertNode(start);

        sel.range.setStartAfter(start);

        if (both) {
            sel.range.setEndBefore(end);
        }

        this.app.selection.setRange(sel.range);
    },
    restore: function() {
        var start = this.find('start');
        var end = this.find('end');

        var sel = this.app.selection.get();
        var range = (sel.range) ? sel.range : this.app.editor.getDocNode().createRange();

        if (start) {
            var prev = (end) ? end.previousSibling : false;
            var next = start.nextSibling;
            next = (next && next.nodeType === 3 && next.textContent.replace(/[\n\t]/g, '') === '') ? false : next;

            if (!end) {
                if (next) {
                    range.selectNodeContents(next);
                    range.collapse(true);
                }
                else {
                    this._restoreInject(range, start);
                }
            }
            else if (next && next.id === 'selection-marker-end') {
                this._restoreInject(range, start);
            }
            else {
                if (prev && next) {
                    range.selectNodeContents(prev);
                    range.collapse(false);
                    range.setStart(next, 0);
                }
                else if (prev && !next) {
                    range.selectNodeContents(prev);
                    range.collapse(false);
                    range.setStartAfter(start);
                }
                else {
                    range.setStartAfter(start);
                    range.setEndBefore(end);
                }
            }

            this.app.selection.setRange(range);

            var fix = (start && end) ? 2 : 1;
            var offset = this.app.offset.get();
            offset = {
                start: offset.start-fix,
                end: offset.end-fix
            };

            if (start) start.parentNode.removeChild(start);
            if (end) end.parentNode.removeChild(end);

            this.app.editor.setWinFocus();
            this.app.offset.set(false, offset);
        }
    },
    find: function(pos) {
        var $editor = this.app.editor.getLayout();
        var $marker = $editor.find('#selection-marker-' + pos);

        return ($marker.length !== 0) ? $marker.get() : false;
    },
    remove: function() {
        var start = this.find('start');
        var end = this.find('end');

        if (start) start.parentNode.removeChild(start);
        if (end) end.parentNode.removeChild(end);
    },

    // private
    _restoreInject: function(range, start) {
        var textNode = this.app.utils.createInvisibleChar();
        this.dom(start).after(textNode);

        range.selectNodeContents(textNode);
        range.collapse(false);
    }
});
ArticleEditor.add('module', 'state', {
    init: function() {
        this.started = false;
        this.storage = false;
        this.state = false;
        this.passed = true;
        this.undoStorage = [];
        this.redoStorage = [];
    },
    load: function() {
        this.clear();
        this.trigger(true);
    },
    stop: function() {
        this.clear();
    },
    clear: function() {
        this.storage = false;
        this.state = false;
        this.passed = true;
        this.undoStorage = [];
        this.redoStorage = [];
    },
    get: function() {
        return this.undoStorage;
    },
    add: function(e) {
        if ((e && (e.ctrlKey || e.metaKey || this._isUndo(e) || this._isRedo(e))) || !this.app.observer.trigger) {
            return;
        }

        // state
        this.state = this._createState();
        if (this.started === false) {
            this._setState(this.state, 0);
            this.started = true;
        }
    },
    trigger: function(start) {
        if (!this.passed) {
            return;
        }

        // storage
        var storage = this._createState();

        // storage
        if (this.state) {
            storage = this.state;
        }
        else if (!this.state && !start) {
            storage = this.storage;
            this.started = true;
        }

        this._addState(storage);

        // previous state
        this.storage = this._createState();
        this.state = false;
    },
    listen: function(e) {
        // undo
        if (this._isUndo(e)) {
            e.preventDefault();
            this.undo();
            return true;
        }
        // redo
        else if (this._isRedo(e)) {
            e.preventDefault();
            this.redo();
            return true;
        }

        this.passed = true;
    },
    undo: function() {
        if (!this._hasUndo()) return;

        this.passed = false;
        var state = this._getUndo();
        this._setRedo();

        var $parsed = this.app.parser.parse(state[0]);
        this.app.editor.getLayout().html($parsed.children());
        this._rebuild(state, 'undo');

        var instance = this.app.block.get();
        var el = (instance && instance.isEditable()) ? instance.getBlock() : false;

        this.app.offset.set(el, state[1]);
    },
    redo: function() {
        if (!this._hasRedo()) return;

        this.passed = false;
        var state = this.redoStorage.pop();

        this._addState({
            html: state[0],
            offset: state[1]
        });

        var $parsed = this.app.parser.parse(state[0]);
        this.app.editor.getLayout().html($parsed.children());
        this._rebuild(state, 'redo');

        var instance = this.app.block.get();
        var el = (instance && instance.isEditable()) ? instance.getBlock() : false;

        this.app.offset.set(el, state[1]);

    },

    // private
    _rebuild: function(state, type) {
        this.app.editor.build();
        this.app.editor.getLayout().find('.' + this.prefix + '-block-state').each(function($node) {
            this.app.block.set($node);
        }.bind(this));

        this.app.broadcast('state.' + type, { html: state[0], offset: state[1] });
    },
    _isUndo: function(e) {
        var key = e.which;
        var ctrl = e.ctrlKey || e.metaKey;

        return (ctrl && key === 90 && !e.shiftKey && !e.altKey);
    },
    _isRedo: function(e) {
        var key = e.which;
        var ctrl = e.ctrlKey || e.metaKey;

        return (ctrl && ((key === 90 && e.shiftKey) || (key === 89 && !e.shiftKey)) && !e.altKey);
    },
    _hasUndo: function() {
        return (this.undoStorage.length !== 0);
    },
    _hasRedo: function() {
        return (this.redoStorage.length !== 0);
    },
    _getUndo: function() {
        return (this.undoStorage.length === 1) ? this.undoStorage[0] : this.undoStorage.pop();
    },
    _createState: function() {
        var html = this.app.editor.getLayout().html();
        html = this.app.utils.wrap(html, function($w) {
            $w.find('.' + this.prefix + '-block-focus').addClass(this.prefix + '-block-state');
        }.bind(this));

        var instance = this.app.block.get();
        var el = (instance && instance.isEditable()) ? instance.getBlock() : false;
        var unparsed = this.app.parser.unparse(html, true);
        var offset = this.app.offset.get(el);

        return { html: unparsed, offset: offset };
    },
    _setState: function(state, pos) {
        this.undoStorage[pos] = [state.html, state.offset];
    },
    _addState: function(state) {
        var last = this.undoStorage[this.undoStorage.length-1];
        if (typeof last === 'undefined' || last[0] !== state.html) {
            this.undoStorage.push([state.html, state.offset]);
            this._removeOverStorage();
        }
        else {
            last[1] = state.offset;
        }
    },
    _setRedo: function() {
        var state = this._createState();

        this.redoStorage.push([state.html, state.offset]);
        this.redoStorage = this.redoStorage.slice(0, this.opts.state.limit);
    },
    _removeOverStorage: function() {
        if (this.undoStorage.length > this.opts.state.limit) {
            this.undoStorage = this.undoStorage.slice(0, (this.undoStorage.length - this.opts.state.limit));
        }
    }
});
ArticleEditor.add('module', 'sync', {
    build: function() {
        this.syncedHtml = this.app.$element.val();
    },
    trigger: function() {
        if (!this.opts.editor.sync) return;

        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
        }
        this.typingTimer = setTimeout(function() {
            var html = this._getHtml();
            if (this.is(html)) {
                this._sync(html);
            }
        }.bind(this), 300);
    },
    invoke: function() {
        var html = this._getHtml();
        this.syncedHtml = html;
        this._sync(html);
    },
    is: function(html) {
        var sync = false;
        if (this.syncedHtml !== html) {
            this.syncedHtml = html;
            sync = true;
        }

        return sync;
    },

    // private
    _getHtml: function() {
        var html = this.app.editor.getLayout().html();
        return this.app.parser.unparse(html);
    },
    _sync: function(html) {
        var event = this.app.broadcast('editor.before.change', { html: html });
        if (!event.isStopped()) {
            this.app.$element.val(event.get('html'));
            this.app.autosave.send();
            this.app.state.trigger();
            this.app.broadcast('editor.change', event);
        }
    }
});
ArticleEditor.add('module', 'placeholder', {
    start: function() {
        this.placeholder = false;
        this.$layout = this.app.editor.getLayout();

        // build
        this._build();
    },
    handleClick: function(e) {
        if (this.dom(e.target).hasClass(this.prefix + '-placeholder')) {
            e.preventDefault();
            e.stopPropagation();
            this.app.editor.setFocus('start');
        }
    },
    trigger: function() {
        if (this.placeholder && this.app.editor.isEmpty(true)) {
            this.show();
        }
        else {
            this.hide();
        }
    },
    toggle: function() {
        if (this.observerTimer) {
            clearTimeout(this.observerTimer);
        }
        this.observerTimer = setTimeout(this.trigger.bind(this), 10);
    },
    show: function() {
        this.$layout.addClass(this.prefix + '-placeholder');
    },
    hide: function() {
        this.$layout.removeClass(this.prefix + '-placeholder');
    },
    change: function(value) {
        this.opts.placeholder = value;
        this._rebuild();
        if (this.app.editor.isEmpty(true)) {
            this.app.editor.setEmpty();
        }
    },

    // private
    _build: function() {
        this._rebuild()
        this.toggle();
    },
    _rebuild: function() {
        var o = this.opts.placeholder;
        var p = this.app.$element.attr('placeholder');
        var is = (o !== false || p);
        if (!is) return;

        this.$layout.attr('placeholder', (o !== false) ? o : p);
        this.placeholder = true;
    }
});
ArticleEditor.add('module', 'list', {
    indent: function() {

        var sel = this.app.selection.get();
        var item = this.app.selection.getBlock();
        var $item = this.dom(item);
        var $prev = $item.prevElement();
        var prev = $prev.get();
        var isIndent = (sel.collapsed && item && prev && prev.tagName === 'LI');

        this.app.selection.save(item);

        if (isIndent) {
            $prev = this.dom(prev);
            var $prevChild = $prev.children('ul, ol');
            var $list = $item.closest('ul, ol');

            if ($prevChild.length !== 0) {
                $prevChild.append($item);
            }
            else {
                var listTag = $list.get().tagName.toLowerCase();
                var $newList = this.dom('<' + listTag + '>');

                $newList.append($item);
                $prev.append($newList);
            }
        }

        this.app.selection.restore();

        return isIndent;
    },
    outdent: function() {

        var sel = this.app.selection.get();
        var item = this.app.selection.getBlock();
        var $item = this.dom(item);
        var isOutdent = false;

        if (sel.collapsed && item) {

            var $listItem = $item.parent();
            var $liItem = $listItem.closest('li');
            var $prev = $item.prevElement();
            var $next = $item.nextElement();
            var prev = $prev.get();
            var next = $next.get();
            var nextItems, $newList;
            var isTop = (prev === false);
            var isMiddle = (prev !== false && next !== false);

            this.app.selection.save(item);

            // out
            if ($liItem.length !== 0) {
                if (isMiddle) {
                    nextItems = this._getAllNext($item.get());
                    $newList = this.dom('<' + $listItem.get().tagName.toLowerCase() + '>');

                    for (var i = 0; i < nextItems.length; i++) {
                        $newList.append(nextItems[i]);
                    }

                    $liItem.after($item);
                    $item.append($newList);
                }
                else {
                    $liItem.after($item);

                    if ($listItem.children().length === 0) {
                        $listItem.remove();
                    }
                    else {
                        if (isTop) $item.append($listItem);
                    }
                }

                isOutdent = true;
            }

            this.app.selection.restore();
        }

        return isOutdent;
    },

    // private
    _getAllNext: function(next) {
        var nodes = [];

        while (next) {
            var $next = this.dom(next).nextElement();
            next = $next.get();

            if (next) nodes.push(next);
            else return nodes;
        }

        return nodes;
    }
});
ArticleEditor.add('module', 'cleaner', {
    cleanHtml: function(html) {

        html = this.app.broadcastHtml('editor.before.clean', html);

        // local
        var stored = {};
        var storedIndex = 0;
        var exceptedTags = this.opts.paste.blockTags.concat(this.opts.paste.inlineTags).concat(this.opts.paste.formTags);

        // gdocs & word
        var isPages = this._isPages(html);
        var isMsWord = this._isHtmlMsWord(html);
        var isEditor = this._isEditor(html);

        // store
        html = this.app.content.store(html, 'embed', stored, storedIndex);

        // remove doctype tag
        html = this.app.content.removeDoctype(html);

        // remove denied tags
        html = this.app.content.removeTags(html, this.opts.tags.denied);
        html = html.trim();

        // remove comments
        html = this.app.content.removeComments(html);

        // remove style & script tag
        html = this.app.content.removeTagsWithContent(html, ['script', 'style']);

        // clean pages
        html = (isPages) ? this._cleanPages(html) : html;

        // clean gdocs
        html = (isMsWord) ? html : this._cleanGDocs(html);

        // encode php code
        html = this._encodePhp(html);

        // remove tags
        html = this.app.content.removeTagsExcept(html, exceptedTags);

        // clean ms word
        html = (isMsWord) ? this._cleanMsWord(html) : html;

        var restored = false;
        // paste event clean embed figure/frame
        if (!isEditor && this.app.event.pasteEvent) {
            html = this.app.content.restore(html, 'embed', stored);
            restored = true;
        }

        // remove class && attrs if the pasting is not from the editor
        if (!isEditor) {
            var filterClass = (this.opts.paste.keepClass.length !== 0) ? this.opts.paste.keepClass.join(',') : '';
            var filterAttrs = (this.opts.paste.keepAttrs.length !== 0) ? this.opts.paste.keepAttrs.join(',') : '';
            html = this.app.utils.wrap(html, function($w) {
                var $elms = $w.find('*');
                $elms.not(filterClass).removeAttr('class');
                $elms.not(filterAttrs).each(function($node) {
                    var node = $node.get();
                    var attrs = node.attributes;

                    for (var i = attrs.length - 1; i >= 0; i--) {
                        var name = attrs[i].name;

                        if (name === 'class' || name === 'dir' || name.search(/^data-/) !== -1) continue;
                        if (node.tagName === 'IMG' && (name === 'src' || name === 'alt')) continue;
                        if (node.tagName === 'A' && (name === 'href' || name === 'target')) continue;

                        node.removeAttribute(name);
                    }
                });
            });
        }

        // restore
        if (!restored) {
            html = this.app.content.restore(html, 'embed', stored);
        }

        // work with style
        if (isEditor) {
            // cache styles for block and inline tags and img
            html = this.app.content.cacheStyle(html);
        }
        else {
            // remove style
            html = this.app.content.removeStyleAttr(html);
        }

        // remove empty inline
        html = this.app.content.removeEmptyInlines(html);

        // clean empty
        html = html.replace(/<figure[^>]*><\/figure>/gi, '');
        html = html.replace(/<p>&nbsp;<\/p>/gi, '<p></p>');
        html = html.replace(/<p><br\s?\/?><\/p>/gi, '<p></p>');

        // gmail list paste
        html = html.replace(/^<li/gi, '<ul><li');
        html = html.replace(/<\/li>$/gi, '</li></ul>');

        if (isMsWord || isPages) {
            html = html.replace(/<p><\/p>/gi, '');
            html = html.replace(/<p>\s<\/p>/gi, '');
        }

        html = this.app.utils.wrap(html, function($w) {
            // clean apple space
            $w.find('.Apple-converted-space').unwrap();

            // tidy lists
            // place ul/ol into li
            $w.find('ul, ol').each(this._placeListToItem.bind(this));

            // remove p in li
            $w.find('li p').unwrap();

        }.bind(this));


        // broadcast
        return this.app.broadcastHtml('editor.clean', html);
    },


    // private
    _encodePhp: function(html) {
        html = html.replace('<?php', '&lt;?php');
        html = html.replace('<?', '&lt;?');
        html = html.replace('?>', '?&gt;');

        return html;
    },
    _isEditor: function(html) {
        return html.match(new RegExp('meta\\stype="' + this.prefix + '-editor"', 'i'));
    },
    _isHtmlMsWord: function(html) {
        return html.match(/class="?Mso|style="[^"]*\bmso-|style='[^'']*\bmso-|w:WordDocument/i);
    },
    _isPages: function(html) {
        return html.match(/name="Generator"\scontent="Cocoa\sHTML\sWriter"/i);
    },
    _placeListToItem: function($node) {
        var node = $node.get();
        var prev = node.previousSibling;
        if (prev && prev.tagName === 'LI') {
            var $li = this.dom(prev);
            $li.find('p').unwrap();
            $li.append(node);
        }
    },
    _cleanPages: function(html) {
        html = html.replace(/\sclass="s[0-9]"/gi, '');
        html = html.replace(/\sclass="p[0-9]"/gi, '');

        return html;
    },
    _cleanGDocs: function(html) {
        if (html.search(/docs-internal-guid/i) !== -1) {
            html = this.app.utils.wrap(html, function($w) {
                var $elms = $w.find('h1, h2, h3, h4, h5, h6');
                $elms.each(function($node) {
                    $node.find('span').unwrap();
                })
            });
            html = html.replace(/ dir="[^>]*"/gi, '');
        }

        html = html.replace(/<b\sid="internal-source-marker(.*?)">([\w\W]*?)<\/b>/gi, "$2");
        html = html.replace(/<b(.*?)id="docs-internal-guid(.*?)">([\w\W]*?)<\/b>/gi, "$3");
        html = html.replace(/<span[^>]*(font-style:\s?italic;\s?font-weight:\s?(bold|600|700)|font-weight:\s?(bold|600|700);\s?font-style:\s?italic)[^>]*>([\w\W]*?)<\/span>/gi, '<b><i>$4</i></b>');
        html = html.replace(/<span[^>]*font-style:\s?italic[^>]*>([\w\W]*?)<\/span>/gi, '<i>$1</i>');
        html = html.replace(/<span[^>]*font-weight:\s?(bold|600|700)[^>]*>([\w\W]*?)<\/span>/gi, '<b>$2</b>');


        return html;
    },
    _cleanMsWord: function(html) {

        // comments
        html = html.replace(/<!--[\s\S]+?-->/gi, '');
        html = html.trim();
        html = html.replace(/<(!|script[^>]*>.*?<\/script(?=[>\s])|\/?(\?xml(:\w+)?|meta|link|style|\w:\w+)(?=[\s/>]))[^>]*>/gi, '');
        html = html.replace(/<(\/?)s>/gi, "<$1strike>");
        html = html.replace(/&nbsp;/gi, ' ');
        html = html.replace(/<span\s+style\s*=\s*"\s*mso-spacerun\s*:\s*yes\s*;?\s*"\s*>([\s\u00a0]*)<\/span>/gi, function(str, spaces) {
            return (spaces.length > 0) ? spaces.replace(/./, " ").slice(Math.floor(spaces.length/2)).split("").join("\u00a0") : '';
        });

        html = this.app.utils.wrap(html, function($w) {
            // build lists
            $w.find('p').each(function($node) {
                var matches = /mso-list:\w+ \w+([0-9]+)/.exec($node.attr('style'));
                if (matches) {
                    $node.attr('data-listLevel',  parseInt(matches[1], 10));
                }
            });

            // parse Lists
            this._parseWordLists($w);

            $w.find('[align]').removeAttr('align');
            $w.find('[name]').removeAttr('name');
            $w.find('span').each(function($node) {
                var str = $node.attr('style');
                var matches = /mso-list:Ignore/.exec(str);
                if (matches) $node.remove();
                else $node.unwrap();
            });
            $w.find('[style]').removeAttr('style');
            $w.find("[class^='Mso']").removeAttr('class');
            $w.find('a').filter(function($node) { return !$node.attr('href'); }).unwrap();

        }.bind(this));

        html = html.replace(/<p><img(.*?)>/gi, "<p><img$1></p><p>");
        html = html.replace(/<p[^>]*><\/p>/gi, '');
        html = html.replace(/<li>·/gi, '<li>');
        html = html.trim();

        // remove spaces between
        html = html.replace(/\/(p|ul|ol|h1|h2|h3|h4|h5|h6|blockquote)>\s+<(p|ul|ol|h1|h2|h3|h4|h5|h6|blockquote)/gi, '/$1>\n<$2');

        var result = '';
        var lines = html.split(/\n/);
        for (var i = 0; i < lines.length; i++) {
            var space = (lines[i] !== '' && lines[i].search(/>$/) === -1) ? ' ' : '\n';
            result += lines[i] + space;
        }

        result = result.trim();

        return result;
    },
    _parseWordLists: function($w) {
        var lastLevel = 0;
        var $item = null;
        var $list = null;
        var $listChild = null;

        $w.find('p').each(function($node) {
            var level = $node.attr('data-listLevel');
            if (level === null && $node.hasClass('MsoListParagraphCxSpMiddle')) {
                level = 1;
            }

            if (level !== null) {
                var txt = $node.text();
                var listTag = (/^\s*\w+\./.test(txt)) ? '<ol></ol>' : '<ul></ul>';

                // new parent list
                if ($node.hasClass('MsoListParagraphCxSpFirst') || $node.hasClass('MsoNormal')) {
                    $list = this.dom(listTag);
                    $node.before($list);
                }
                // new child list
                else if (level > lastLevel && lastLevel !== 0) {
                    $listChild = this.dom(listTag);
                    $item.append($listChild);
                    $list = $listChild;
                }
                // level up
                if (level < lastLevel) {
                    var len = lastLevel - level + 1;
                    for (var i = 0; i < len; i++) {
                        $list = $list.parent();
                    }
                }

                // create item
                $node.find('span').first().unwrap();
                $item = this.dom('<li>' + $node.html().trim() + '</li>');
                if ($list === null) {
                    $node.before(listTag);
                    $list = $node.prev();
                }

                // append
                $list.append($item);
                $node.remove();

                lastLevel = level;
            }
            else {
                $list = null;
                lastLevel = 0;
            }
        }.bind(this));
    }
});
ArticleEditor.add('module', 'tidy', {
    init: function() {},
    parse: function(code) {

        code = this.app.content.encodeAttrSings(code);

        // clean setup
        var ownLine = ['li'];
        var contOwnLine = ['li'];
        var newLevel = ['p', 'ul', 'ol', 'li', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'figure',
        'figcaption', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'dl', 'dt', 'dd'];

        this.lineBefore = new RegExp('^<(/?' + ownLine.join('|/?' ) + '|' + contOwnLine.join('|') + ')[ >]');
        this.lineAfter = new RegExp('^<(/?' + ownLine.join('|/?' ) + '|/' + contOwnLine.join('|/') + ')[ >]');
        this.newLevel = new RegExp('^</?(' + newLevel.join('|' ) + ')[ >]');

        var i = 0,
        codeLength = code.length,
        point = 0,
        start = null,
        end = null,
        tag = '',
        out = '',
        cont = '';

        this.cleanlevel = 0;

        for (; i < codeLength; i++) {
            point = i;

            // if no more tags, copy and exit
            if (-1 === code.substr(i).indexOf('<')) {
                out += code.substr(i);

                return this.finish(out);
            }

            // copy verbatim until a tag
            while (point < codeLength && code.charAt(point) !== '<') {
                point++;
            }

            if (i !== point) {
                cont = code.substr(i, point - i);
                if (!cont.match(/^\s{2,}$/g)) {
                    if ('\n' === out.charAt(out.length - 1)) out += this.getTabs();
                    else if ('\n' === cont.charAt(0)) {
                        out += '\n' + this.getTabs();
                        cont = cont.replace(/^\s+/, '');
                    }

                    out += cont;
                }

                //if (cont.match(/\n/)) out += '\n' + this.getTabs();
            }

            start = point;

            // find the end of the tag
            while (point < codeLength && '>' !== code.charAt(point)) {
                point++;
            }

            tag = code.substr(start, point - start);
            i = point;

            var t;

            if ('!--' === tag.substr(1, 3)) {
                if (!tag.match(/--$/)) {
                    while ('-->' !== code.substr(point, 3)) {
                        point++;
                    }
                    point += 2;
                    tag = code.substr(start, point - start);
                    i = point;
                }

                if ('\n' !== out.charAt(out.length - 1)) out += '\n';

                out += this.getTabs();
                out += tag + '>\n';
            }
            else if ('!' === tag[1]) {
                out = this.placeTag(tag + '>', out);
            }
            else if ('?' === tag[1]) {
                out += tag + '>\n';
            }
            else if (t === tag.match(/^<(script|style|pre)/i)) {
                t[1] = t[1].toLowerCase();
                tag = this.cleanTag(tag);
                out = this.placeTag(tag, out);
                end = String(code.substr(i + 1)).toLowerCase().indexOf('</' + t[1]);

                if (end) {
                    cont = code.substr(i + 1, end);
                    i += end;
                    out += cont;
                }
            }
            else {
                tag = this.cleanTag(tag);
                out = this.placeTag(tag, out);
            }
        }

        return this.finish(out);
    },
    getTabs: function() {
        var s = '';
        for ( var j = 0; j < this.cleanlevel; j++ ) {
            s += '    ';
        }

        return s;
    },
    finish: function(code) {
        code = code.replace(/\n\s*\n/g, '\n');
        code = code.replace(/^[\s\n]*/, '');
        code = code.replace(/[\s\n]*$/, '');
        code = code.replace(/<li(.*?)>[\s\n]*/gi, '<li$1>');
        code = code.replace(/<(p|h1|h2|h3|h4|h5|h6|li|td|th)(.*?)>[\s\n]*<\/\1>/gi, '<$1$2></$1>');
        code = code.replace(/[\s\n]*<\/li>/gi, '</li>');
        code = code.replace(/<script(.*?)>\n<\/script>/gi, '<script$1></script>');
        code = this.app.content.decodeAttrSings(code);

        this.cleanlevel = 0;

        return code;
    },
    cleanTag: function (tag) {
        var tagout = '';
        tag = tag.replace(/\n/g, ' ');
        tag = tag.replace(/\s{2,}/g, ' ');
        tag = tag.replace(/^\s+|\s+$/g, ' ');

        var suffix = '';
        if (tag.match(/\/$/)) {
            suffix = '/';
            tag = tag.replace(/\/+$/, '');
        }

        var m;
        while (m = /\s*([^= ]+)(?:=((['"']).*?\3|[^ ]+))?/.exec(tag)) {
            if (m[2]) tagout += m[1].toLowerCase() + '=' + m[2];
            else if (m[1]) tagout += m[1].toLowerCase();

            tagout += ' ';
            tag = tag.substr(m[0].length);
        }

        return tagout.replace(/\s*$/, '') + suffix + '>';
    },
    placeTag: function (tag, out) {
        var nl = tag.match(this.newLevel);

        if (tag.match(this.lineBefore) || nl) {
            out = out.replace(/\s*$/, '');
            out += '\n';
        }

        if (nl && '/' === tag.charAt(1)) this.cleanlevel--;
        if ('\n' === out.charAt(out.length - 1)) out += this.getTabs();
        if (nl && '/' !== tag.charAt(1)) this.cleanlevel++;

        out += tag;

        if (tag.match(this.lineAfter) || tag.match(this.newLevel)) {
            out = out.replace(/ *$/, '');
            out += '\n';
        }

        return out;
    }
});
ArticleEditor.add('module', 'source', {
    start: function() {
        this.eventname = this.prefix + '-source-events';
        this._build();
    },
    toggle: function() {
        if (this.is()) this.close();
        else this.open();
    },
    is: function() {
        return (this.app.container.get('source').css('display') !== 'none');
    },
    open: function() {
        this.app.broadcast('source.before.open');

        var html = this.app.editor.getContent();
        html = this.app.tidy.parse(html);

        var height = this.app.container.get('editor').height();

        this.$source.height(height);
        this.$source.val(html);
        this.$source.on('focus.' + this.eventname, this._handleFocus.bind(this));
        this.$source.on('input.' + this.eventname, this._handleChanges.bind(this));
        this.$source.on('keydown.' + this.eventname, this.app.input.handleTextareaTab.bind(this));

        this.app.editor.unselectAll();

        this.app.container.get('editor').hide();
        this.app.container.get('source').show();

        // codemirror
        var codemirror = this.app.codemirror.create({ el: this.$source, height: height, focus: true });
        if (codemirror) {
            codemirror.on('change', this._handleChanges.bind(this));
            codemirror.on('focus', this._handleFocus.bind(this));
        }

        // ui
        this.app.editor.disableUI();
        this.app.toolbar.setToggled('html');

        // broadcast
        this.app.broadcast('source.open');
    },
    close: function() {
        this.app.broadcast('source.before.close');

        var html = this.getContent();
        this.app.codemirror.destroy();

        this.$source.off('.' + this.eventname);

        this.app.container.get('source').hide();
        this.app.container.get('editor').show();

        // set code
        this.app.editor.setContent({ html: html, caret: 'start' });

        // ui
        this.app.editor.enableUI();
        this.app.toolbar.unsetToggled('html');

        // broadcast
        this.app.broadcast('source.close');
    },
    update: function(html) {
        var func = (this.app.editor.isTextarea()) ? 'val' : 'html';
        this.app.$element[func](html);
    },
    getContent: function() {
        var html = this.$source.val();
        html = this.app.codemirror.val(html);

        return html;
    },

    // private
    _build: function() {
        if (!this.opts.source) return;

        this.$source = this.dom('<textarea>').addClass(this.prefix + '-source');
        this.$source.attr('data-gramm_editor', false);

        this.app.container.get('source').append(this.$source);
    },
    _handleFocus: function() {
        this.app.editor.setFocus();
    },
    _handleChanges: function(e) {
        var html = this.getContent();

        this.update(html);
        this.app.broadcast('source.change', { e: e });
    }
});
ArticleEditor.add('module', 'content', {
    init: function() {
        this._selectors = {
            code: ['pre', 'code'],
            embed: ['figure'],
            noneditable: ['.' + this.opts.noneditable.classname],
            images: ['img'],
            links: ['a']
        };
    },

    // paragraphize
    paragraphize: function(html) {
        return this.app.paragraphizer.paragraphize(html);
    },

    // encode
    encodeEntities: function(str) {
        return this.decodeEntities(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },
    encodeCode: function(html) {

        html = this.encodeAttrSings(html);

        // replace all tags
        html = html.replace(/<\s/gi, '&lt; ');
        html = html.replace(/<([^>]+)</gi, '&lt;$1<');
        html = html.replace(/<(.*?)>/gi, 'xtagstartz$1xtagendz');

        // revert pre / code
        html = html.replace(/xtagstartzpre(.*?)xtagendz/g, '<pre$1>');
        html = html.replace(/xtagstartzcode(.*?)xtagendz/g, '<code$1>');
        html = html.replace(/xtagstartz\/codextagendz/g, '</code>');
        html = html.replace(/xtagstartz\/prextagendz/g, '</pre>');

        // encode
        html = this._encodeCode(html);

        // revert all tags
        html = html.replace(/xtagstartz([\w\W]*?)xtagendz/g, '<$1>');
        html = html.replace(/xtagstartz\/(.*?)xtagendz/g, '</$1>');

        html = this.decodeAttrSings(html);

        return html;
    },
    encodeAttrSings: function(html) {
        var matches = html.match(/="(.*?)"/g);
        if (matches !== null) {
            for (var i = 0; i < matches.length; i++) {
                if (matches[i].search(/^"</) !== -1 || matches[i].search(/>"$/) !== -1) {
                    continue;
                }

                var str = matches[i].replace('>', 'xmoresignz');
                str = str.replace('<', 'xlesssignz');
                html = html.replace(matches[i], str);
            }
        }

        return html;
    },

    // decode
    decodeAttrSings: function(html) {
        html = html.replace(/xmoresignz/gi, '>');
        html = html.replace(/xlesssignz/gi, '<');

        return html;
    },
    decodeEntities: function(str) {
        return String(str).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    },
    decodeHref: function(html) {
        var pattern = "(href=\".*?)(&amp;)(.*?\">)";
        var matches = html.match(new RegExp(pattern, 'g'));
        if (matches !== null) {
            for (var i = 0; i < matches.length; i++) {
                html = html.replace(matches[i], matches[i].replace(/&amp;/g, '&'));
            }
        }

        return html;
    },

    // sanitize
    sanitize: function(html) {
        html = this.app.utils.wrap(html, function($w) {
            $w.find('[src]').each(this._sanitizeSrc);
            $w.find('a').each(this._sanitizeHref);
            $w.find('a,b,i,strong,em,svg,img,details,audio').each(this._sanitizeEvents);
        }.bind(this));

        return html;
    },

    // escape
    escapeHtml: function(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    },

    // store / restore
    store: function(html, name, stored, storedIndex) {
        var selectors = this._selectors[name];
        for (var i = 0; i < selectors.length; i++) {
            var matched = this._getElementsFromHtml(html, selectors[i]);
            html = this._store(html, name, matched, stored, storedIndex);
        }

        return html;
    },
    restore: function(html, name, stored) {
        if (typeof stored[name] === 'undefined') return html;
        for (var i = 0; i < stored[name].length; i++) {
            html = html.replace('####_' + name + i + '_####', stored[name][i]);
        }

        return html;
    },
    storeComments: function(html, storedComments) {
        var comments = html.match(new RegExp('<!--([\\w\\W]*?)-->', 'gi'));
        if (comments === null) return html;

        for (var i = 0; i < comments.length; i++) {
            html = html.replace(comments[i], '#####xstarthtmlcommentzz' + i + 'xendhtmlcommentzz#####');
            storedComments.push(comments[i]);
        }

        return html;
    },
    restoreComments: function(html, storedComments) {
        for (var i = 0; i < storedComments.length; i++) {
            var str = storedComments[i].replace(/\$/gi, '&#36;');
            html = html.replace('#####xstarthtmlcommentzz' + i + 'xendhtmlcommentzz#####', str);
        }

        return html;
    },

    // cache / recache
    cacheStyle: function(html) {
        var selector = this.opts.tags.block.join(',') + ',img,' + this.opts.tags.inline.join(',');

        return this.app.utils.wrap(html, function($w) {
            $w.find(selector).each(this._cacheStyle.bind(this));
        }.bind(this));
    },
    recacheStyle: function(html) {
        return this.app.utils.wrap(html, function($w) {
            $w.find('[data-' + this.prefix + '-style-cache]').each(this._recacheStyle.bind(this));
        }.bind(this));
    },

    // fix
    fixListMargin: function($block) {
        var ml = parseInt($block.css('margin-left'));
        if (ml !== 0) {
            var pl = parseInt($block.css('padding-left'));
            $block.css({ 'margin-left': 0, 'padding-left': (pl + ml) + 'px' });
            $block.attr(this.prefix + '-list-left', ml);
        }
    },
    unfixListMargin: function($block) {
        if ($block.attr(this.prefix + '-list-left')) {
            $block.css({ 'padding-left': '', 'margin-left': '' });
            $block.removeAttr(this.prefix + '-list-left');
        }
    },

    // add
    addNofollow: function(html) {
        if (!this.opts.link.nofollow) return html;

        return this.app.utils.wrap(html, function($w) {
            $w.find('a').attr('rel', 'nofollow');
        });
    },
    addHttps: function(html) {
        if (!this.opts.editor.https) {
            return html;
        }

        html = html.replace('href="http://', 'href="https://');
        html = html.replace('src="http://', 'src="https://');
        html = html.replace('srcset="http://', 'srcset="https://');

        return html;
    },
    addSpaceToBlocks: function(html) {
        return html.replace(/<\/(div|li|dt|dd|td|p|H[1-6])>\n?/gi, '</$1> ');
    },
    addBrToBlocks: function(html) {
        return html.replace(/<\/(div|li|dt|dd|td|p|H[1-6])>\n?/gi, '</$1><br>');
    },
    addPredefinedTagClass: function($node) {
        var tag = $node.get().tagName.toLowerCase();
        var classes = (typeof this.opts.classes.tags !== 'undefined') ? this.opts.classes.tags : this.opts.classes;
        if (typeof classes[tag] !== 'undefined') {
            $node.addClass(classes[tag]);
        }
    },
    addPredefinedBlockClass: function($node) {
        var type = $node.attr('data-' + this.prefix + '-type');
        var classes = this.opts.classes.blocks;
        if (typeof classes[type] !== 'undefined') {
            $node.addClass(classes[type]);
        }
    },

    // get
    getPredefinedBlocks: function() {
        var blocks = [];
        Object.keys(this.opts.classes.blocks).forEach(function(key) {
            blocks.push(key);
        });

        return blocks;
    },
    getPredefinedTags: function() {
        var tags = [];
        var classes = (typeof this.opts.classes.tags !== 'undefined') ? this.opts.classes.tags : this.opts.classes;
        Object.keys(classes).forEach(function(key) {
            tags.push(key);
        });

        return tags;
    },
    getText: function (n) {
        var rv = '';

        if (n.nodeType === 3) {
            rv = n.nodeValue;
        }
        else {
            for (var i = 0; i < n.childNodes.length; i++) {
                rv += this.getText(n.childNodes[i]);
            }

            var d = (n.nodeType === 1) ? getComputedStyle(n).getPropertyValue('display') : '';
            if (d.match(/^block/) || d.match(/list/) || n.tagName === 'BR' || n.tagName === 'HR') {
                rv += "\n";
            }
        }

        return rv;
    },
    getTextFromHtml: function(html, params) {
        var stored = {};
        var storedIndex = 0;
        var defaults = {
            br: false,
            nl: false,
            trimlines: true,
            images: false,
            links: false
        };

        params = $ARX.extend({}, defaults, params);

        html = this.store(html, 'code', stored, storedIndex);
        html = (params.links) ? this.store(html, 'links', stored, storedIndex) : html;
        html = (params.images) ? this.store(html, 'images', stored, storedIndex) : html;

        html = html.replace(/<(ul|ol)>\s+<li>/gi, '<$1><li>');
        html = html.replace(/<li[^>]*>\n/gi, '<li$1>');
        html = html.replace(/<p[^>]*>(\s+|)<\/p>/gi, 'xemptyz');
        html = html.replace(/<!--[\s\S]*?-->/gi, '');
        html = html.replace(/<style[\s\S]*?style>/gi, '');
        html = html.replace(/<script[\s\S]*?script>/gi, '');
        html = html.replace(/<\/(div|li|dt|dd|td|p|H[1-6])>\n?/gi, '</$1>\n');
        html = html.replace(/&(lt|gt);/gi, 'x$1z');

        var $tmp = this.dom('<div>').html(html);

        html = this.getText($tmp.get());

        // trim lines
        if (params.trimlines) {
            var str = '';
            var arr = html.split("\n");
            for (var i = 0; i < arr.length; i++) {
                str += arr[i].trim() + '\n';
            }
            html = str;
        }

        html = html.replace(/[\n]+/g, "\n");
        html = html.replace('xemptyz', "\n");
        html = html.replace(/x(lt|gt)z/gi, '&$1;');

        // keep newlines
        if (params.br) {
            html = html.replace(/\n/g, "<br>\n");
            html = html.replace(/<br\s?\/?>\n?$/gi, '');
        }
        else {
            html = (params.nl) ? html : html.replace(/\n/gi, ' ');
        }

        html = this.restore(html, 'code', stored);
        html = (params.links) ? this.restore(html, 'links', stored) : html;
        html = (params.images) ? this.restore(html, 'images', stored) : html;
        html = html.replace(/<pre[^>]*>/g, '');
        html = html.replace(/<code[^>]*>/g, '');
        html = html.replace(/<\/pre>\n?/g, '');
        html = html.replace(/<\/code>/g, '');

        if (!params.images) {
            html = html.replace(/<img[\s\S]*?>/gi, '');
            html = html.replace(/<a[^>]*>(\s+|)<\/a>/gi, '');
        }

        return html.trim();

    },

    // extract
    extractHtmlFromCaret: function(el) {
        var node = this.dom(el).get();
        var range = this.app.selection.getRange();
        if (range) {
            var cloned = range.cloneRange();
            cloned.selectNodeContents(node);
            cloned.setStart(range.endContainer, range.endOffset);

            return cloned.extractContents();
        }
    },

    // is
    isEmptyHtml: function(html, emptyparagraph) {
        html = html.trim();
        html = this.app.utils.removeInvisibleChars(html);
        html = html.replace(/^&nbsp;$/gi, '1');
        html = html.replace(/&nbsp;/gi, '');
        html = html.replace(/<\/?br\s?\/?>/g, '');
        html = html.replace(/\s/g, '');
        html = html.replace(/^<p>\s\S<\/p>$/i, '');
        html = html.replace(/<hr(.*?[^>])>$/i, 'hr');
        html = html.replace(/<iframe(.*?[^>])>$/i, 'iframe');
        html = html.replace(/<source(.*?[^>])>$/i, 'source');

        // remove comments
        html = this.removeComments(html);

        // remove empty tags
        html = (emptyparagraph) ? html.replace(/<p[^>]*><\/p>/gi, '') : html;
        html = html.replace(/<[^/>]><\/[^>]+>/gi, '');
        html = html.replace(/<[^/>]><\/[^>]+>/gi, '');

        // trim
        html = html.trim();

        return (html === '');
    },
    isLine: function(html) {
        var element = document.createElement("div");
        element.innerHTML = html;

        return (this.dom(element).find(this.opts.tags.block.join(',') + ',img').length === 0);
    },

    // remove
    removeDoctype: function(html) {
        return html.replace(new RegExp("<!doctype[^>]*>", 'gi'), '');
    },
    removeComments: function(html) {
        return html.replace(/<!--[\s\S]*?-->\n?/g, '');
    },
    removeTags: function(input, denied) {
        var re = (denied) ? /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi : /(<([^>]+)>)/gi;
        var replacer = (!denied) ? '' : function ($0, $1) {
            return denied.indexOf($1.toLowerCase()) === -1 ? $0 : '';
        };

        return input.replace(re, replacer);
    },
    removeTagsExcept: function(input, except) {
        if (except === undefined) {
            return input.replace(/(<([^>]+)>)/gi, '');
        }
        var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
        return input.replace(tags, function($0, $1) {
            return except.indexOf($1.toLowerCase()) === -1 ? '' : $0;
        });
    },
    removeTagsWithContent: function(html, tags) {
        return this.app.utils.wrap(html, function($w) {
            $w.find(tags.join(',')).remove();
        });
    },
    removeMarkers: function(html) {
        return this.app.utils.wrap(html, function($w) {
            $w.find('.' + this.prefix + '-plus-button').remove();
            $w.find('.' + this.prefix + 'pastemarker').removeClass(this.prefix + 'pastemarker');
            $w.find('.' + this.prefix + 'pasteitems').removeClass(this.prefix + 'pasteitems');
            $w.find('.' + this.prefix + '-selection-marker').remove();
        }.bind(this));
    },
    removeEmptySpans: function(html) {
        return this.app.utils.wrap(html, function($w) {
            $w.find('span').each(this._removeEmptySpan.bind(this));
        }.bind(this));
    },
    removeEmptyInlines: function(html) {
        return this.app.utils.wrap(html, function($w) {
            $w.find(this.opts.tags.inline.join(',')).each(this._removeEmptyTag.bind(this));
        }.bind(this));
    },
    removeEmptyAttrs: function(html, attrs) {
        return this.app.utils.wrap(html, function($w) {
            for (var i = 0; i < attrs.length; i++) {
                $w.find('[' + attrs[i] + '=""]').removeAttr(attrs[i]);
            }
        });
    },
    removeBlockTags: function(html, tags, except) {
        var blocks = this.opts.tags.block.concat();

        // except
        if (except) {
            blocks = this.app.utils.removeFromArrayByValue(blocks, except);
        }

        // extend
        if (tags) {
            tags = (tags) ? this.app.utils.extendArray(blocks, tags) : blocks;
        }

        return this.removeTags(html, tags);
    },
    removeBlockTagsInside: function(html, tags) {
        this.blockListTags = this.app.utils.removeFromArrayByValue(this.opts.tags.block.concat(), ['ul', 'ol', 'li']);

        return this.app.utils.wrap(html, function($w) {
            $w.find(tags.join(',')).each(this._removeBlockTagsInside.bind(this));
        }.bind(this));
    },
    removeInlineStyles: function(html) {
        var inlines = this.app.utils.removeFromArrayByValue(this.opts.tags.inline, 'a');

        return this.app.utils.wrap(html, function($w) {
            $w.find(inlines.join(',')).removeAttr('style');
        });
    },
    removeStyleAttr: function(html, filter) {
        filter = filter || '';

        return this.app.utils.wrap(html, function($w) {
            $w.find('*').not('[data-' + this.prefix + '-style-cache]' + filter).removeAttr('style');
        }.bind(this));
    },

    // private
    _cacheStyle: function($el) {
        var name = 'data-' + this.prefix + '-style-cache';
        var style = $el.attr('style');
        if (style) {
            style = style.replace(/"/g, '');
            $el.attr(name, style);
        }
        else if (!style || style === '') {
            $el.removeAttr(name);
        }
    },
    _recacheStyle: function($el) {
        var name = 'data-' + this.prefix + '-style-cache';
        var style = $el.attr(name);
        $el.attr('style', style).removeAttr(name);
    },

    // clean
    _cleanEmpty: function(html) {
        html = html.trim();
        html = this.app.utils.removeInvisibleChars(html);
        html = html.replace(/<\/?br\s?\/?>/g, '');
        html = html.replace(/\s/g, '');

        return html;
    },

    // remove
    _removeEmptySpan: function($node) {
        if ($node.get().attributes.length === 0) {
            $node.unwrap();
        }
    },
    _removeEmptyTag: function($node) {
        var html = $node.html().trim();
        if ($node.get().attributes.length === 0 && html === '') {
            $node.unwrap();
        }
    },
    _removeBlockTagsInside: function($node) {
        var tags = ($node.get().tagName === 'LI') ? this.blockListTags : this.opts.tags.block;
        $node.find(tags.join(',')).append('<br>').unwrap();
    },

    // store
    _store: function(html, name, matched, stored, storedIndex) {
        if (!matched) return html;
        if (typeof stored[name] === 'undefined') stored[name] = [];

        for (var i = 0; i < matched.length; i++) {
            stored[name][storedIndex] = matched[i];
            html = html.replace(matched[i], '####_' + name + storedIndex + '_####');
            storedIndex++;
        }

        return html;
    },

    // get
    _getElementsFromHtml: function(html, selector) {
        var matched = [];
        var $div = this.dom('<div>').html(html);
        $div.find(selector).each(function($node) {
            matched.push($node.get().outerHTML);
        });

        return matched;
    },

    // sanitize
    _sanitizeSrc: function($node) {
        var node = $node.get();
        var src = node.getAttribute('src');
        if (src.search(/^javascript:/i) !== -1 || (node.tagName !== 'IMG' && src.search(/^data:/i) !== -1)) {
            node.setAttribute('src', '');
        }
    },
    _sanitizeHref: function($node) {
        var node = $node.get();
        var str = node.getAttribute('href');
        if (str && str.search(/^javascript:/i) !== -1) {
            node.setAttribute('href', '');
        }
    },
    _sanitizeEvents: function($node) {
        $node.removeAttr('onload onerror ontoggle onwheel onmouseover oncopy');
    },

    // encode
    _encodeCode: function(html) {
        return this.app.utils.wrap(html, function($w) {
            $w.find('pre code, pre, code').each(this._encodeNode.bind(this));
        }.bind(this));
    },
    _encodeNode: function($node) {
        var node = $node.get();
        var first = node.firstChild;
        var html = node.innerHTML;
        if (node.tagName === 'PRE' && first && first.tagName === 'CODE') {
            return;
        }

        html = html.replace(/xtagstartz/g, '<');
        html = html.replace(/xtagendz/g, '>');

        var encoded = this.decodeEntities(html);
        node.textContent = this._encodeNodeHtml(encoded);
    },
    _encodeNodeHtml: function(html) {
        html = html.replace(/&nbsp;/g, ' ').replace(/<br\s?\/?>/g, '\n');
        html = (this.opts.code.spaces) ? html.replace(/\t/g, new Array(this.opts.code.spaces + 1).join(' ')) : html;

        return html;
    }
});
ArticleEditor.add('module', 'autoparse', {
    parse: function(html) {
        if (!this.opts.paste.autoparse) {
            return html;
        }

        var instance = this.app.block.get();
        var storedComments = [];

        // store comments
        html = this.app.content.storeComments(html, storedComments);

        // remove doctype tag
        html = this.app.content.removeDoctype(html);

        var tags = ['figure', 'html', 'form', 'pre', 'div', 'span', 'video', 'object', 'iframe', 'code', 'a', 'img', 'link', 'script'];
        var singleTags = ['div', 'img', 'html', 'span'];
        var stored = [];
        var z = 0;
        var i;

        // store tags
        for (i = 0; i < tags.length; i++) {
            var reTags = (singleTags.indexOf(tags[i]) !== -1) ? '<' + tags[i] + '[^>]*>' : '<' + tags[i] + '[^>]*>([\\w\\W]*?)</' + tags[i] + '>';
            var matched = html.match(new RegExp(reTags, 'gi'));

            if (matched !== null) {
                for (var y = 0; y < matched.length; y++) {
                    html = html.replace(matched[y], '#####replaceparse' + z + '#####');
                    stored.push(matched[y]);
                    z++;
                }
            }
        }

        // links
        html = html.replace('&amp;', '&');
        if ((html.match(this.opts.regex.aurl1) || html.match(this.opts.regex.aurl2)) && !html.match(this.opts.regex.imageurl)) {
            html = this._formatLinks(html);
        }

        // images
        if (html.match(this.opts.regex.imageurl)) {
            var imagesMatches = html.match(this.opts.regex.imageurl);
            for (i = 0; i < imagesMatches.length; i++) {
                html = html.replace(imagesMatches[i], this._splitBlock(instance, '<img src="' + imagesMatches[i] + '">'));
            }
        }

        // restore
        html = this._restoreReplaced(stored, html);
        html = this.app.content.restoreComments(html, storedComments);

        // repeat for nested tags
        html = this._restoreReplaced(stored, html);

        return html;
    },

    // private
    _splitBlock: function(instance, str) {
        return (instance) ? str = "\n" + str + "\n" : str;
    },
    _formatLinks: function(content) {
        var target = (this.opts.paste.linkTarget !== false) ? ' target="' + this.opts.paste.linkTarget + '"' : '';
        var protocol = (this.opts.editor.https) ? 'https' : 'http';
        var self = this;

        content = content.replace(this.opts.regex.aurl1, function(url) {
            return '<a href="' + url + '"' + target + '>' + self._subLinkText(url) + '</a>';
        });

        content = content.replace(this.opts.regex.aurl2, function(match, before, url) {
            return before + '<a href="' + protocol + '://' + url + '"' + target + '>' + self._subLinkText(url) + '</a>';
        });

        return content;
    },
    _subLinkText: function(text) {
        text = (text.length > this.opts.link.size) ? text.substring(0, this.opts.link.size) + '...' : text;
        text = (text.search('%') === -1) ? decodeURIComponent(text) : text;

        return text;
    },
    _restoreReplaced: function(stored, html) {
        for (var i = 0; i < stored.length; i++) {
            html = html.replace('#####replaceparse' + i + '#####', stored[i]);
        }

        return html;
    }
});
ArticleEditor.add('module', 'caret', {
    set: function(el, type) {
        var node = this.dom(el).get();
        var range = this.app.editor.getDocNode().createRange();
        var map = { 'start': '_setStart', 'end': '_setEnd', 'before': '_setBefore', 'after': '_setAfter' };

        if (!node || !this._isInPage(node)) {
            return;
        }

        // focus
        this.app.editor.setWinFocus();

        // non editable inline node
        if (this._isInline(node) && this._isNon(node)) {
            if (type === 'start') type = 'before';
            else if (type === 'end') type = 'after';
        }

        // set
        this[map[type]](range, node);
        this.app.selection.setRange(range);
    },
    is: function(el, type, removeblocks, trimmed, br) {
        var node = this.dom(el).get();
        var sel = this.app.editor.getWinNode().getSelection();
        var result = false;

        if (!node || !sel.isCollapsed) {
            return result;
        }

        var position = this._getPosition(node, trimmed, br);
        var size = this._getSize(node, removeblocks, trimmed);

        if (type === 'end') {
            result = (position === size);
        }
        else if (type === 'start') {
            result = (position === 0);
        }

        return result;
    },

    // private
    _setStart: function(range, node) {
        range.setStart(node, 0);
        range.collapse(true);

        // block node has first inline
        var inline = this._getInlineInside(node);
        if (inline) {
            range = this._setStartInline(range, inline);
        }

        // inline node
        if (this._isInline(node)) {
            this._insertInvisibleNode(range);
        }
    },
    _setStartInline: function(range, inline) {
        var inlines = this.app.element.getAllInlines(inline);
        var node = inlines[0];
        range.selectNodeContents(node);
        range.collapse(true);
    },
    _setEnd: function(range, node) {

        // block node has last inline
        var last = (node.nodeType === 1) ? node.lastChild : false;
        var lastInline = (last && this._isInline(last));
        if (lastInline) {
            node = last;
        }

        range.selectNodeContents(node);
        range.collapse(false);
    },
    _setBefore: function(range, node) {
        range.setStartBefore(node);
        range.collapse(true);

        // inline node
        if (this._isInline(node)) {
            this._insertInvisibleNode(range, node);
        }
    },
    _setAfter: function(range, node) {
        range.setStartAfter(node);
        range.collapse(true);

        // inline node
        var tag = (node.nodeType !== 3) ? node.tagName.toLowerCase() : false;
        if (this._isInline(node) || tag === 'br' || tag === 'svg') {
            this._insertInvisibleNode(range);
        }
    },
    _insertInvisibleNode: function(range, before) {
        var textNode = this.app.utils.createInvisibleChar();

        if (before) {
            before.parentNode.insertBefore(textNode, before);
        }
        else {
            range.insertNode(textNode);
        }

        range.selectNodeContents(textNode);
        range.collapse(false);

        return textNode;
    },
    _getInlineInside: function(node) {
        var inline = node.firstChild;
        if (this._isInline(inline)) {
            var inside = inline.firstChild;
            while (inside) {
                if (this._isInline(inside)) {
                    return inside;
                }
                inside = inside.firstChild;
            }

            return inline;
        }
    },
    _getSize: function(node, removeblocks, trimmed) {
        var str;
        var isTextNode = (node.nodeType === 3);

        if (removeblocks && removeblocks.length !== 0) {
            var $node = this.dom(node);
            var $cloned = $node.clone();
            $cloned.find(removeblocks.join(',')).remove();
            str = $cloned.html().trim();
        }
        else {
            str = (isTextNode) ? node.textContent : node.innerHTML;
            str = (isTextNode || trimmed === false) ? str : str.trim();
        }

        return this._trimmed(str, isTextNode, trimmed).length;
    },
    _getPosition: function(node, trimmed, br) {
        var range = this.app.editor.getWinNode().getSelection().getRangeAt(0);
        var caretRange = range.cloneRange();
        var tmp = document.createElement("div");
        var isTextNode = (node.nodeType === 3);

        caretRange.selectNodeContents(node);
        caretRange.setEnd(range.endContainer, range.endOffset);
        tmp.appendChild(caretRange.cloneContents());

        var str = (isTextNode || trimmed === false) ? tmp.innerHTML : tmp.innerHTML.trim();
        var brEnd = (str.search(/<\/?br\s?\/?>$/g) !== -1) ? 1 : 0;
        if (br === false) brEnd = 0;

        str = this._trimmed(str, isTextNode, trimmed);

        return str.length + brEnd;
    },
    _trimmed: function(str, isTextNode, trimmed) {
        if (trimmed === false) {
            str = str.replace(/\n$/g, '');
            return str;
        }

        str = this.app.utils.removeInvisibleChars(str);
        str = str.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, '');
        str = str.replace(/\s+/g, ' ');
        if (str !== '' && !isTextNode) {
            str = str.replace(/\s$/, '');
        }

        return str;
    },
    _isInline: function(node) {
        return this.app.element.is(node, 'inline');
    },
    _isInPage: function(node) {
        var isIn = false;
        var doc = this.app.editor.getDocNode();
        if (node && node.nodeType) {
            isIn = (node === doc.body) ? false : doc.body.contains(node);
        }

        return isIn;
    },
    _isNon: function(node) {
        return (node.getAttribute('contenteditable') === 'false');
    }
});
ArticleEditor.add('module', 'selection', {
    init: function() {
        this.savedSelection = false;
        this.savedMarker = false;
        this.savedPosition = false;
        this.savedRange = false;
    },
    // get
    get: function() {
        var sel = this._getSelection();
        var range = this._getRange(sel);
        var current = this._getCurrent(sel);

        return {
            selection: sel,
            range: range,
            collapsed: this._getCollapsed(sel, range),
            current: current,
            parent: this._getParent(current)
        };
    },
    getRange: function() {
        return this._getRange(this.get().selection);
    },
    getNodes: function(data) {
        var sel = this.get();
        var isInline = (data && ((data.type && data.type === 'inline') || (data.tags && data.tags.indexOf('a') !== -1)));
        var func = (isInline) ? '_getAllRangeNodes' : '_getRangeNodes';
        var nodes = [];

        if (this.app.editor.isAllSelected()) {
            nodes = this.app.editor.getLayout().children().getAll();
        }
        else {
            nodes = (sel.selection && sel.range) ? this[func](sel.range) : nodes;
        }

        return (nodes.length > 0) ? this._filterNodes(nodes, sel.range, isInline, data) : nodes;
    },
    getCurrent: function() {
        var sel = this._getSelection();
        return this._getCurrent(sel);
    },
    getParent: function() {
        var current = this.getCurrent();
        return this._getParent(current);
    },
    getElement: function(el) {
        return this._getElement(el, 'element');
    },
    getInline: function(el) {
        return this._getElement(el, 'inline');
    },
    getTopInline: function(el) {
        var node = (el) ? this.dom(el).get() : this.getCurrent();
        var inlines = [];
        while (node) {
            if (this._getElement(node, 'inline')) {
                inlines.push(node);
            }
            else {
                break;
            }

            node = node.parentNode;
        }

        return inlines[inlines.length-1];
    },
    getDataBlock: function(el) {
        var sel = this._getSelection();
        var node = el || this._getCurrent(sel);

        if (node) {
            node = this.dom(node).get();
            while (node) {
                if (node.nodeType === 1 && node.getAttribute('data-' + this.prefix + '-type')) {
                    return this.dom(node);
                }

                node = node.parentNode;
            }
        }

        return this.dom();
    },
    getBlock: function(el) {
        return this._getElement(el, 'block');
    },
    getText: function(type, num) {
        var sel = this.get();
        var text = false;

        if (!sel.selection) return false;
        if (type && sel.range) {
            num = (typeof num === 'undefined') ? 1 : num;

            var el = this.app.editor.getLayout().get();
            var cloned = sel.range.cloneRange();

            if (type === 'before') {
                cloned.collapse(true);
                cloned.setStart(el, 0);

                text = cloned.toString().slice(-num);
            }
            else if (type === 'after') {
                cloned.selectNodeContents(el);
                cloned.setStart(sel.range.endContainer, sel.range.endOffset);

                text = cloned.toString().slice(0, num);
            }
        }
        else {
            text = (sel.selection) ? sel.selection.toString() : '';
        }

        return text;
    },
    getHtml: function() {
        var html = '';
        var sel = this.get();
        if (sel.selection) {
            var cloned = sel.range.cloneContents();
            var div = document.createElement('div');
            div.appendChild(cloned);
            html = div.innerHTML;
            html = html.replace(/<p><\/p>$/i, '');
        }

        return html;
    },
    getPosition: function() {
        var range = this.getRange();
        var pos = { top: 0, left: 0, width: 0, height: 0 };
        if (this.app.editor.getWinNode().getSelection && range.getBoundingClientRect) {
            range = range.cloneRange();
            var offset = (range.startOffset-1);
            range.setStart(range.startContainer, (offset < 0) ? 0 : offset);
            var rect = range.getBoundingClientRect();
            pos = { top: rect.top, bottom: rect.bottom, left: rect.left, width: (rect.right - rect.left) , height: (rect.bottom - rect.top) };
        }

        return pos;
    },

    // set
    set: function(sel, range) {
        if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
        }
    },
    setRange: function(range) {
        this.set(this.app.editor.getWinNode().getSelection(), range);
    },

    // is
    is: function(el) {
        if (typeof el !== 'undefined') {
            var node = this.dom(el).get();
            var nodes = this.getNodes();

            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i] === node) return true;
            }
        }
        else {
            return this.get().selection;
        }

        return false;
    },
    isCollapsed: function() {
        var sel = this.get();
        return this._getCollapsed(sel.selection, sel.range);

    },
    isIn: function(el) {
        var node = this.dom(el).get();
        var current = this.getCurrent();

        return (current && node) ? node.contains(current) : false;
    },
    isAll: function(el) {
        var isEditor = (!el);
        var node = (el) ? this.dom(el).get() : this.app.editor.getLayout().get();
        var selection = this.app.editor.getWinNode().getSelection();
        var range = this._getRange(selection);
        var isNode = (isEditor) ? true : this.is(node);

        if (selection.isCollapsed) return false;

        if (isNode) {
            return ((typeof node.textContent !== 'undefined') && (node.textContent.trim().length === range.toString().trim().length));
        }
        else {
            return false;
        }
    },

    // select
    select: function(el) {
        var node = (el) ? this.dom(el).get() : this.app.editor.getLayout().get();
        var range = this.app.editor.getDocNode().createRange();
        range.selectNodeContents(node);
        this.setRange(range);
    },

    // remove
    removeAllRanges: function() {
        var sel = this._getSelection();
        if (sel) {
            sel.removeAllRanges();
        }
    },

    // delete
    deleteContents: function() {
        var range = this.getRange();
        if (!this.isCollapsed() && range) {
            range.deleteContents();
        }
    },

    // collapse
    collapse: function(type) {
        type = type || 'start';
        var sel = this.get();
        if (sel.selection && !sel.collapsed) {
            if (type === 'start') sel.selection.collapseToStart();
            else sel.selection.collapseToEnd();
        }
    },

    // save & restore
    save: function(el) {
        if (!el) {
            var instance = this.app.block.get();
            if (instance) {
                el = instance.getBlock();
            }
            else {
                el = this.app.editor.getLayout();
            }
        }

        this.savedSelection = { el: el, offset: this.app.offset.get(el) };
    },
    restore: function(set) {
        if (this.savedMarker) return;
        if (!this.savedSelection) return;

        // focus
        this.app.editor.setWinFocus();

        var el = this.savedSelection.el;
        var instance = this.dom(el).dataget('instance');
        if (instance && set !== false) {
            this.app.block.set(el);
        }

        if (el) {
            el.focus();
            this.app.offset.set(el, this.savedSelection.offset);
        }

        this.savedSelection = false;
    },

    saveMarker: function() {
        this.savedMarker = true;
        this.app.marker.insert();
    },
    restoreMarker: function() {
        this.app.marker.restore();
        this.savedMarker = false;
        this.savedSelection = false;
    },

    // private
    _getSelection: function() {
        return this.app.editor.getSelection();
    },
    _getRange: function(selection) {
        return (selection) ? ((selection.rangeCount > 0) ? selection.getRangeAt(0) : false) : false;
    },
    _getCurrent: function(selection) {
        return (selection) ? selection.anchorNode : false;
    },
    _getParent: function(current) {
        return (current) ? current.parentNode : false;
    },
    _getElement: function(el, type) {
        var sel = this._getSelection();
        if (sel) {
            var node = el || this._getCurrent(sel);
            node = this.dom(node).get();
            while (node) {
                if (this.app.element.is(node, type)) {
                    return node;
                }

                node = node.parentNode;
            }
        }

        return false;
    },
    _getCollapsed: function(selection, range) {
        var collapsed = false;
        if (selection && selection.isCollapsed) collapsed = true;
        else if (range && range.toString().length === 0) collapsed = true;

        return collapsed;
    },
    _getNextNode: function(node) {
        if (node.firstChild) return node.firstChild;

        while (node) {
            if (node.nextSibling) return node.nextSibling;
            node = node.parentNode;
        }
    },
    _getRangeNodes: function(range, all) {
        var start = range.startContainer.childNodes[range.startOffset] || range.startContainer;
        var end = range.endContainer.childNodes[range.endOffset] || range.endContainer;
        var commonAncestor = range.commonAncestorContainer;
        var nodes = [];
        var node;

        if (all) {
            if (!this.app.editor.isLayout(start)) {
                nodes.push(start);
            }

            for (node = start.parentNode; node; node = node.parentNode) {
                if (this.app.editor.isLayout(node)) break;
                nodes.push(node);
                if (node === commonAncestor) break;
            }

            nodes.reverse();

            for (node = start; node; node = this._getNextNode(node)) {
                if (node.nodeType !== 3 && this.dom(node.parentNode).closest(commonAncestor).length === 0) break;

                nodes.push(node);
                if (node === end) break;
            }
        }
        else {
            // push first element
            if (start.nodeType === 3) {
                nodes.push(this.getBlock(start));
            }

            for (node = start; node; node = this._getNextNode(node)) {
                if (node === commonAncestor) break;
                if (node.nodeType !== 3 && this.dom(node.parentNode).closest(commonAncestor).length === 0) break;

                nodes.push(node);
                if (node === end) break;
            }
        }

        return nodes;
    },
    _getAllRangeNodes: function(range) {
        return this._getRangeNodes(range, true);
    },
    _filterNodes: function(nodes, range, isInline, data) {
        var selected = this.getText();
        selected = (selected) ? selected.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&") : '';

        var finalNodes = [];
        for (var i = 0; i < nodes.length; i++) {

            var push = true;
            if (this.app.editor.isLayout(nodes[i])) {
                push = false;
            }
            if (data) {
                push = (data.types) ? this._filterByTypes(push, data, nodes[i]) : push;
                push = (data.selected) ? this._filterBySelected(push, data, nodes[i], range, selected) : push;
                push = (data.type) ? this._filterByType(push, data, nodes[i], isInline) : push;
                push = (data.tags) ? this._filterByTags(push, data, nodes[i]) : push;
            }

            if (push) {
                finalNodes.push(nodes[i]);
            }
        }

        // filter blocks
        var blocks = [];
        if (data && (data.type === 'blocks' || data.type === 'blocks-first')) {

            for (var z = 0; z < finalNodes.length; z++) {
                var node;

                if (data.type === 'blocks-first') {
                    node = (!this.app.element.is(finalNodes[z], 'blocks-first')) ? this.app.element.getFirstLevel(finalNodes[z]).get() : finalNodes[z];
                }
                else if (data.type === 'blocks') {
                    node = (!this.app.element.is(finalNodes[z], 'blocks')) ? this.app.element.getDataBlock(finalNodes[z]).get() : finalNodes[z];
                }

                if (!this._isInNodesArray(blocks, node)) {
                    blocks.push(node);
                }
            }

            finalNodes = blocks;
        }

        return finalNodes;
    },
    _filterByTypes: function(push, data, node) {
        var type;
        if (data.types === true) {
            type = this.app.element.getType(node);
            if (!type) {
                push = false;
            }
        }
        else {
            type = this.app.element.getType(node);
            if (data.types.indexOf(type) === -1) {
                push = false;
            }
        }

        return push;
    },
    _filterByType: function(push, data, node, isInline) {
        var type = data.type;
        if (type === 'blocks' || type === 'blocks-first') {
            type = 'block';
        }

        if (isInline) {
            if (data.links) {
                if (!this.app.element.is(node, type)) {
                    push = false;
                }
            }
            else {
                if ((node.nodeType === 1 && node.tagName === 'A') || !this.app.element.is(node, type)) {
                    push = false;
                }
            }
        }
        else if (!this.app.element.is(node, type)) {
            push = false;
        }

        return push;
    },
    _filterByTags: function(push, data, node) {

        var isTagName = (typeof node.tagName !== 'undefined');
        if (!isTagName) {
            push = false;
        }
        else if (isTagName && data.tags.indexOf(node.tagName.toLowerCase()) === -1) {
            push = false;
        }

        return push;
    },
    _filterBySelected: function(push, data, node, range, selected) {
        if (data.selected === true && !this._containsNodeText(range, node)) {
            push = false;
        }
        else if (data.selected === 'inside') {
            if (node.nodeType === 1 && node.tagName === 'A') {
                push = true;
            }
            else if (!this._isTextSelected(node, selected)) {
                push = false;
            }
        }

        return push;
    },
    _isTextSelected: function(node, selected) {
        var text = (node.nodeType !== 9) ? this.app.utils.removeInvisibleChars(node.textContent) : '';

        return (
            selected === text || text.search(selected) !== -1 || selected.search(new RegExp('^' + this.app.utils.escapeRegExp(text) + '$')) !== -1
        );
    },
    _isBackwards: function() {
        var backwards = false;
        var sel = this.get();

        if (sel && !sel.collapsed) {
            var range = this.app.editor.getDocNode().createRange();
            range.setStart(sel.selection.anchorNode, sel.selection.anchorOffset);
            range.setEnd(sel.selection.focusNode, sel.selection.focusOffset);
            backwards = range.collapsed;
            range.detach();
        }

        return backwards;
    },
    _containsNodeText: function (range, node) {
        var treeWalker = this.app.editor.getDocNode().createTreeWalker(node, NodeFilter.SHOW_TEXT, { acceptNode: function(node) { return NodeFilter.FILTER_ACCEPT; } }, false);
        var first, last, textNode;
        while ((textNode = treeWalker.nextNode())) {
            if (!first) {
                first = textNode;
            }
            last = textNode;
        }
        var nodeRange = range.cloneRange();
        if (first) {
            nodeRange.setStart(first, 0);
            nodeRange.setEnd(last, last.length);
        }
        else {
            nodeRange.selectNodeContents(node);
        }
        return (range.compareBoundaryPoints(Range.START_TO_START, nodeRange) < 1 && range.compareBoundaryPoints(Range.END_TO_END, nodeRange) > -1);
    },
    _isInNodesArray: function(nodes, node) {
        return (nodes.indexOf(node) !== -1);
    }
});
ArticleEditor.add('module', 'inline', {
    removeFormat: function() {
        this.app.popup.close();
        var instance = this.app.block.get();
        var $block = instance.getBlock();
        this.app.selection.save($block);

        var nodes = this.app.selection.getNodes({ type: 'inline' });
        for (var i = 0; i < nodes.length; i++) {
            var $node = this.dom(nodes[i]);
            if (!$node.attr('data-' + this.prefix + '-type')) {
                $node.unwrap();
            }
        }

        this.app.selection.restore();
        this.app.editor.observeUI();
    },
    set: function(params) {
        // popup
        if (this.app.popup.isOpen()) {
            this.app.popup.close();
        }

        // params
        this.params = params;

        var nodes = [];
        var sel = this.app.selection.get();
        if (sel.collapsed) {
            nodes = this.formatCollapsed();
        }
        else {
            nodes = this.formatUncollapsed();
        }

        this.app.editor.observeUI();
        this.app.broadcast('inline.format', { nodes: nodes });
        this.app.sync.trigger();

        return nodes;
    },
    formatCollapsed: function() {
        var node;
        var inline = this.app.selection.getInline();
        var $inline = this.dom(inline);
        var tags = this._getParamsTags();
        var hasSameTag = this._isSameTag(inline, tags);
        var caret = (this.params && this.params.caret) ? this.params.caret : false;

        // 1) not inline
        if (!inline) {
            node = this._insertInline(this.params.tag, caret);
        }
        else {
            // 2) inline is empty
            if (this.app.content.isEmptyHtml(inline.innerHTML)) {
                // 2.1) has same tag
                if (hasSameTag) {
                    this.app.caret.set(inline, (caret) ? caret : 'after');
                    $inline.remove();
                }
                // 2.2) has a different tag
                else {
                    var $el = this.app.element.replaceToTag(inline, this.params.tag);
                    this.app.caret.set($el, (caret) ? caret : 'start');
                }
            }
            // 3) inline isn't empty
            else {
                // 3.1) has same tag
                if (hasSameTag) {
                    var isEnd = this.app.caret.is(inline, 'end');
                    var $target = inline;
                    if (isEnd) {
                        caret = 'after';
                    }
                    else {
                        var extractedContent = this.app.content.extractHtmlFromCaret(inline);
                        var $secondPart = this.dom('<' + this.params.tag + ' />');

                        var div = document.createElement("div");
                        div.appendChild(extractedContent);

                        $secondPart = this.app.element.cloneAttrs(inline, $secondPart);
                        $secondPart.append(div.innerHTML);

                        $inline.after($secondPart);
                        $target = $secondPart;
                    }

                    this.app.caret.set($target, (caret) ? caret : 'before');
                }
                // 3.2) has a different tag
                else {
                    node = this._insertInline(this.params.tag, caret);
                }
            }
        }

        // apply attr
        if (node && this.params && typeof this.params.attr !== 'undefined') {
            var $node = this.dom(node);
            Object.keys(this.params.attr).forEach(function(key) {
                $node.attr(key, this.params.attr[key]);
            }.bind(this));
        }

        return (node) ? node : [];
    },
    formatUncollapsed: function() {

        var instance = this.app.block.get();
        var $block = this._getBlock(instance);
        this.app.selection.save();

        // convert del / u
        this._convertTags('u', instance);
        this._convertTags('del', instance);

        this.app.selection.restore();

        // convert target tags
        var inlines = this.app.selection.getNodes({ type: 'inline' });

        this.app.selection.save();
        this._convertToStrike(inlines);
        this.app.selection.restore();

        // save selection
        this.app.selection.save();

        // apply strike
        this.app.editor.getDocNode().execCommand('strikethrough');

        // revert to inlines
        var nodes = this._revertToInlines(instance);

        // restore selection
        this.app.selection.restore();

        // filter if node is not selected
        var finalNodes = [];
        var selected = this.app.selection.getText();
        for (var i = 0; i < nodes.length; i++) {
            if (this._isInSelection(nodes[i], selected)) {
                finalNodes.push(nodes[i]);
            }
        }

        // clear and normalize
        this._clearEmptyStyle();

        // apply attr
        if (this.params && typeof this.params.attr !== 'undefined') {
            for (var z = 0; z < finalNodes.length; z++) {
                this._applyAttrs(finalNodes[z]);
            }
        }

        if ($block.length === 1) {
            $block.get().normalize();
        }
        this.app.selection.save();

        this._revertTags('u', instance);
        this._revertTags('del', instance);
        this.app.selection.restore();

        // caret
        if (this.params && this.params.caret) {
            var len = finalNodes.length;
            var last = finalNodes[len-1];
            this.app.caret.set(last, this.params.caret);
        }

        return finalNodes;
    },

    // private
    _applyAttrs: function(node) {
        Object.keys(this.params.attr).forEach(function(key) {
            node.setAttribute(key, this.params.attr[key]);
        }.bind(this));
    },
    _clearEmptyStyle: function() {
        var inlines = this.app.selection.getNodes({ type: 'inline' });
        for (var i = 0; i < inlines.length; i++) {
            this._clearEmptyStyleAttr(inlines[i]);

            var childNodes = inlines[i].childNodes;
            if (childNodes) {
                for (var z = 0; z < childNodes.length; z++) {
                    this._clearEmptyStyleAttr(childNodes[z]);
                }
            }
        }
    },
    _clearEmptyStyleAttr: function(node) {
        if (node.nodeType !== 3 && node.getAttribute('style') === '') {
            node.removeAttribute('style');
        }
    },
    _isSameTag: function(inline, tags) {
        return (inline && tags.indexOf(inline.tagName.toLowerCase()) !== -1);
    },
    _isInSelection: function(node, selected) {
        var text = this.app.utils.removeInvisibleChars(node.textContent);
        selected = selected.replace(/\n/g, '');
        selected = selected.replace(/\s/g, '');
        text = text.replace(/\s/g, '');
        return (selected.search(new RegExp(this.app.utils.escapeRegExp(text))) !== -1);
    },
    _insertInline: function(tag, caret) {
        return this.app.insertion.insertNode(document.createElement(tag), (caret) ? caret : 'start');
    },
    _convertTags: function(tag, instance) {
        if (this.params.tag !== tag) {
            var $block = this._getBlock(instance);
            $block.find(tag).each(function(node) {
                var $el = this.app.element.replaceToTag(node, 'span');
                $el.addClass(this.prefix + '-convertable-' + tag);
            }.bind(this));
        }
    },
    _revertTags: function(tag, instance) {
        var $block = this._getBlock(instance);
        $block.find('span.' + this.prefix + '-convertable-' + tag).each(function(node) {
            var $el = this.app.element.replaceToTag(node, tag);
            $el.removeClass(this.prefix + '-convertable-' + tag);
            if (this.app.element.removeEmptyAttrs($el, ['class'])) {
                $el.removeAttr('class');
            }

        }.bind(this));
    },
    _convertToStrike: function(inlines) {
        var tags = this._getParamsTags();
        for (var i = 0; i < inlines.length; i++) {
            var inline = inlines[i];
            var $inline = this.dom(inline);
            var tag = inlines[i].tagName.toLowerCase();

            if (tags.indexOf(tag) !== -1) {
                this._replaceToStrike($inline);
            }
        }
    },
    _getParamsTags: function() {
        var tags = [this.params.tag];
        if (this.params.tag === 'b' || this.params.tag === 'strong') {
            tags = ['b', 'strong'];
        }
        else if (this.params.tag === 'i' || this.params.tag === 'em') {
            tags = ['i', 'em'];
        }

        return tags;
    },
    _replaceToStrike: function($el) {
        $el.replaceWith(function() {
            return this.dom('<strike>').append($el.html());
        }.bind(this));
    },
    _revertToInlines: function(instance) {
        var nodes = [];
        var $block = this._getBlock(instance);

        // styled
        $block.find('*').each(function(node) {
            if (node.get().style.textDecorationLine) {
                node.css('text-decoration-line', '');
                node.wrap('<u>');
                if (node.attr('style') === '') {
                    node.removeAttr('style');
                }
            }
        }.bind(this));

        // strike
        $block.find('strike').each(function(node) {
            var $node = this.app.element.replaceToTag(node, this.params.tag);
            nodes.push($node.get());

        }.bind(this));

        return nodes;
    },
    _getBlock: function(instance) {
        if (!instance) {
            return this.dom(this.app.blocks.getSelectedBlocks());
        }

        return (this.app.editor.isBlocksSelection()) ? this.dom(this.app.blocks.getSelectedBlocks()) : instance.getBlock();
    }
});
ArticleEditor.add('module', 'popup', {
    init: function() {
        this.stack = false;
        this.stacks = [];
        this.name = false;
        this.supername = false;
        this.autoclose = true;
        this.control = false;
        this.saved = false;
    },
    start: function() {
        this._build();
        this._buildDepth();
    },
    stop: function() {
        this._stopEvents();
        this._stop();
    },
    stopStack: function() {
        this._stopEvents();
        this.app.toolbar.unsetToggled();
        this.$popup.removeAttr('data-' + this.prefix + '-popup-name');
        this.$popup.removeClass('open');
    },

    // is
    isOpen: function(name) {
        var opened = this.$popup.hasClass('open');
        if (name) {
            return (this._getName() === name && opened);
        }

        return opened;
    },

    // create
    create: function(name, params) {
        if (this.isOpen(name)) {
            return this.stack;
        }

        this._reset();
        this.name = name;
        this.supername = name;
        this.stack = this._createStack(name, params);

        return this.stack;
    },

    // add
    add: function(name, params) {
        return this._createStack(name, params, true);
    },

    // set
    setStack: function(stack) {
        this.stack = stack;
        this.name = stack.getName();
    },
    setData: function(data) {
        this.stack.setData(data);
    },
    setFocus: function(name) {
        this.stack.setFocus(name);
    },
    setWidth: function(width) {
        this.stack.setWidth(width);
    },

    // get
    getName: function() {
        return this.name;
    },
    getElement: function() {
        return this.$popup;
    },
    getButton: function() {
        return this.button;
    },
    getStack: function(name) {
        return (name) ? this.stacks[name] : this.stack;
    },
    getBody: function() {
        return this.stack.getBody();
    },
    getItems: function() {
        return this.stack.getItems();
    },
    getFooter: function() {
        return this.stack.getFooter();
    },
    getFooterPrimary: function() {
        return this.stack.getFooterPrimary();
    },
    getTool: function(name) {
        return this.stack.getTool(name);
    },
    getInput: function(name) {
        return this.stack.getInput(name);
    },
    getFormItem: function(name) {
        return this.stack.getFormItem(name);
    },
    getData: function(name) {
        return this.stack.getData(name);
    },

    // open
    open: function(params) {
        // all popups are closed
        if (!this.isOpen()) {
            this.saved = false;
            this._open(params);
        }
        // current open
        else if (this.isOpen(this.supername)) {
            this.saved = true;
            this.close(false);
        }
        // another is opened
        else {
            this.saved = true;
            this.close(false);
            this._open(params, false);
        }
    },
    openStack: function(name) {
        var stack = this.getStack(name);
        var params = {};

        if (this.stack && this.stack.isCollapsed()) {
            params = { collapse: true };
            this.removeStack(this.stack);
        }

        // open
        stack.open(params);
    },

    // close
    close: function(e, name) {
        if (this.autoclose === false) {
            if (e === true) {}
            else if (!name) {
                return;
            }
        }
        if (!this.isOpen()) return;
        if (e && this._isPopupTarget(e)) return;

        // close
        this._stopEvents();
        this._resetToolbarToggledButton();

        // selection
        if (e !== false && this.saved === false) {
            this.app.scroll.save();
            this.app.selection.restore();
            this.app.scroll.restore();
        }

        this.$popup.hide();
        this._closed();
    },
    closeStacks: function() {
        for (var key in this.stacks) {
            if (typeof this.stacks[key] === 'object') {
                this.stacks[key].close();
            }
        }
    },

    // remove
    removeStack: function(stack) {
        var name = stack.getName();

        // object
        delete this.stacks[name];

        // layer
        this.$popup.find('[data-' + this.prefix + '-stack-name=' + name + ']').remove();
    },

    // update
    updatePosition: function(e) {
        this._buildPosition(e);
        this._buildHeight();
    },

    // resize
    resize: function() {
        var data = this.$popup.attr('data-width');
        var width = this.app.editor.getWidth();
        if (data !== '100%') {
            var w = parseInt(data);
            if (w < width) {
                return;
            }
        }

        this.$popup.css('width', width + 'px');
    },


    // =private

    // build
    _build: function() {
        this.$popup = this.dom('<div>').addClass(this.prefix + '-popup ' + this.prefix + '-popup-' + this.uuid);
        this.$popup.hide();
        this.$popup.attr('dir', this.opts.editor.direction);

        // append
        this.app.$body.append(this.$popup);
    },
    _buildDepth: function() {
        if (this.opts.bsmodal) {
            this.$popup.css('z-index', 1061);
        }
    },
    _buildButton: function(params) {
        if (!params) return;
        this.button = (Object.prototype.hasOwnProperty.call(params, 'button')) ? params.button : false;
    },
    _buildControl: function(params) {
        if (!params) return;
        this.control = (Object.prototype.hasOwnProperty.call(params, 'control')) ? params.control : false;
    },
    _buildName: function() {
        this.$popup.attr('data-' + this.prefix + '-popup-name', this.name);
        this.$popup.addClass(this.prefix + '-popup-' + this.name);
    },
    _buildHeader: function() {
        this.header = this.app.create('popup.header', this);
    },
    _buildHeight: function() {
        var targetHeight, top;
        var $target = this.app.scroll.getTarget();
        var tolerance = 10;
        var offset = this.$popup.offset();

        if (this.app.scroll.isTarget()) {
            top = offset.top - $target.offset().top;
            targetHeight = $target.height() - parseInt($target.css('border-bottom-width'));
        }
        else {
            top = offset.top - $target.scrollTop();
            targetHeight = $target.height();
        }

        var cropHeight = targetHeight - top - tolerance;
        this.$popup.css('max-height', cropHeight + 'px');
    },
    _buildPosition: function() {
        var topFix = 1;
        var pos;

        // control
        if ((this._isButton() && this.button.isControl()) || this._isControl()) {
            pos = this._buildPositionControl();
        }
        // button
        else if (this._isButton()) {
            pos = this._buildPositionButton();
        }
        // modal
        else {
            pos = this._buildPositionModal();
        }

        // set
        this.$popup.css({
            top: (pos.top - topFix) + 'px',
            left: pos.left + 'px'
        });
    },
    _buildPositionButton: function() {
        var editorRect = this.app.editor.getRect();
        var offset = this.button.getOffset();
        var dim = this.button.getDimension();
        var popupWidth = this.$popup.width();
        var popupHeight = this.$popup.height();
        var pos = {};

        if (this._isToolbarButton() || this._isTopbarButton()) {
            pos = {
                top: (offset.top + dim.height),
                left: offset.left
            };

            // out of the right edge
            if ((pos.left + popupWidth) > editorRect.right) {
                pos.left = (offset.left + dim.width) - popupWidth;
            }
        }
        else {
            pos = {
                top: (offset.top + editorRect.top + dim.height),
                left: (offset.left + editorRect.left + (dim.width/2) - (popupWidth/2))
            };

            // out of the right edge
            if ((pos.left + popupWidth) > editorRect.right) {
                pos.left = editorRect.left + editorRect.width - popupWidth;
            }

            // out of the bottom edge
            if ((pos.top + popupHeight) > this.app.$doc.height()) {
                pos.top = pos.top - popupHeight - dim.height;
            }
        }

        // out of the left edge
        if (pos.left < editorRect.left || pos.left < 0) {
            pos.left = editorRect.left;
        }

        return pos;

    },
    _buildPositionControl: function() {
        var instance = this.app.block.get();
        if (instance.isSecondLevel()) {
            instance = instance.getFirstLevel();
        }

        var $block = instance.getBlock();
        var offset = $block.offset();

        // set
        return {
            top: offset.top,
            left: offset.left
        };
    },
    _buildPositionModal: function() {
        var offset, top, left;
        if (!this.opts.toolbar) {
            var instance = this.app.block.get();
            if (instance.isSecondLevel()) {
                instance = instance.getFirstLevel();
            }

            var $block = instance.getBlock();
            offset = $block.offset();
            top = offset.top;
            left = offset.left;
        }
        else {
            var $container = this.app.container.get('toolbar');
            var height = $container.height();

            offset = $container.offset();
            top = offset.top + height;
            left = offset.left;
        }


        return { top: top, left: left };
    },

    // get
    _getName: function() {
        return this.$popup.attr('data-' + this.prefix + '-popup-name');
    },

    // set
    _setToolbarToggledButton: function() {
        this.app.toolbar.unsetToggled();
        if (!this._isToolbarButton()) {
            return;
        }

        var name = this.button.getName();
        this.app.toolbar.setToggled(name);
    },

    // create
    _createStack: function(name, params, collapse) {
        if (Object.prototype.hasOwnProperty.call(params, 'collapse') && params.collapse === false) {
            collapse = false;
        }

        if (Object.prototype.hasOwnProperty.call(params, 'autoclose')) {
            this.autoclose = params.autoclose;
        }

        var stack = this.app.create('popup.stack', name, params, collapse, this);
        this.stacks[name] = stack;

        return stack;
    },

    // open
    _open: function(params, animation) {
        this._buildButton(params);
        this._buildControl(params);
        this._buildName();
        this._buildHeader();

        // broadcast
        var event = this.app.broadcast('popup.before.open');
        if (event.isStopped()) {
            this.stopStack();
            return;
        }

        // set & start
        this._setToolbarToggledButton();
        this._startEvents();

        // selection (all popups are closed)
        if (animation !== false && this.app.editor.isPopupSelection()) {
            this.app.selection.save();
        }

        // find active
        this.stack = this._findActiveStack();

        // open stack
        this.stack.open(params, false, false);

        // build position
        this._buildPosition();

        // show
        if (animation === false) {
            this.$popup.show();
            this._opened();
        }
        else {
            this.$popup.fadeIn(100, this._opened.bind(this));
        }
    },
    _opened: function() {
        this._buildHeight();
        this.$popup.addClass('open');

        // broadcast
        this.app.broadcast('popup.open');
        this.stack.renderFocus();
    },

    // closed
    _closed: function() {
        var attrname = 'data-' + this.prefix + '-popup-name';
        var name = this.$popup.attr(attrname);
        this.$popup.removeAttr(attrname);
        this.$popup.removeClass('open ' + this.prefix + '-popup-' + name);
        this.saved = false;

        // broadcast
        this.app.broadcast('popup.close');
    },

    // is
    _isPopupTarget: function(e) {
        return (this.dom(e.target).closest('.' + this.prefix + '-popup').length !== 0);
    },
    _isButton: function() {
        return this.button;
    },
    _isControl: function() {
        return this.control;
    },
    _isToolbarButton: function() {
        return (this.button && (this.button.type === 'toolbar' || this.button.type === 'context'));
    },
    _isTopbarButton: function() {
        return (this.button && this.button.type === 'topbar');
    },


    // find
    _findActiveStack: function() {
        for (var key in this.stacks) {
            if (typeof this.stacks[key] === 'object' && this.stacks[key].isActive()) {
                this.stack = this.stacks[key];
            }
        }

        return this.stack;
    },

    // reset
    _reset: function() {
        this.button = false;
        this.control = false;
        this.autoclose = true;
        this.stack = false;
        this.stacks = [];
        this.$popup.html('');
        this.$popup.removeClass('has-footer has-items has-form');
    },
    _resetToolbarToggledButton: function() {
        if (!this.button) return;
        var name = this.button.getName();
        this.app.toolbar.unsetToggled(name);
    },

    // start
    _startEvents: function() {
        var eventname = this.prefix + '-popup';
        this.app.scroll.getTarget().on('resize.' + eventname, this.updatePosition.bind(this));
        this.app.scroll.getTarget().on('scroll.' + eventname, this._buildPosition.bind(this));
    },

    // stop
    _stopEvents: function() {
        this.app.scroll.getTarget().off('.' + this.prefix + '-popup');
    },
    _stop: function() {
        if (this.$popup) this.$popup.remove();
    }
});
ArticleEditor.add('class', 'popup.item', {
    defaults: {
        container: false,
        title: false,
        html: false,
        toggle: true,
        active: false,
        divider: false,
        remover: false,
        classname: false,
        params: false,
        instance: false,
        observer: false,
        command: false
    },
    init: function(popup, name, params) {
        this.popup = popup;
        this.name = name;
        this.params = this._buildParams(params);

        this._build();
        this._buildContainer();
        this._buildIcon();
        this._buildTitle();
        this._buildImage();
        this._buildShortcut();
        this._buildActive();
        this._buildHidden();
        this._buildDivider();
        this._buildCommand();
        this._buildRemover();
    },

    // get
    getPopup: function() {
        return this.popup;
    },
    getName: function() {
        return this.name;
    },
    getParams: function() {
        return this.params.params;
    },
    getElement: function() {
        return this.$item;
    },
    getInstance: function() {
        return this.params.instance;
    },

    // is
    isControl: function() {
        return this.params.control;
    },

    // private
    _build: function() {
        this.$item = (this.params.html) ? this.dom(this.params.html) : this.dom('<div>');
        this.$item.addClass(this.prefix + '-popup-item ' + this.prefix + '-popup-stack-item');
        this.$item.attr({ 'data-name': this.name });
    },
    _buildContainer: function() {
        if (this.params.container) {
            this.$item.addClass(this.prefix + '-popup-item-container');
        }
    },
    _buildTitle: function() {
        if (this.params.title) {
            this.$title = this.dom('<span>').addClass(this.prefix + '-popup-item-title');
            this.$title.html(this.lang.parse(this.params.title));

            this.$item.append(this.$title);
        }
    },
    _buildImage: function() {
        if (this.params.image) {
            this.$image = this.dom('<span>').addClass(this.prefix + '-popup-item-image');
            this.$image.html(this.params.image);

            this.$item.append(this.$image);
        }
    },
    _buildIcon: function() {
        if (this.params.icon) {
            this.$icon = this.dom('<span>').addClass(this.prefix + '-popup-item-icon');

            // html icon
            if (this.opts.buttons.icons && typeof this.opts.buttons.icons[this.name] !== 'undefined') {
                this.$icon.html(this.opts.buttons.icons[this.name]);
            }
            else if (this.params.icon === true) {
                this.$icon.addClass(this.prefix + '-icon-' + this.name);
            }
            else if (this.params.icon.search(/</) !== -1) {
                this.$icon.html(this.params.icon);
            }
            else {
                this.$icon.addClass(this.prefix + '-icon-' + this.params.icon);
            }

            this.$item.append(this.$icon);
        }
    },
    _buildShortcut: function() {
        if (this.params.shortcut) {
            var meta = (/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform)) ? '<b>&#8984;</b>' : 'ctrl';
            meta = this.params.shortcut.replace('Ctrl', meta);

            this.$shortcut = this.dom('<span>').addClass(this.prefix + '-popup-item-shortcut');
            this.$shortcut.html(meta);

            this.$item.append(this.$shortcut);
        }
    },
    _buildParams: function(params) {
        return $ARX.extend({}, true, this.defaults, params);
    },
    _buildActive: function() {
       if (this.params.active) {
           this.$item.addClass('active');
       }
    },
    _buildHidden: function() {
        if (this.params.hidden) {
            this.$item.addClass(this.prefix + '-popup-item-hidden');
        }
    },
    _buildDivider: function() {
        if (this.params.divider) {
            this.$item.addClass(this.prefix + '-popup-item-divider-' + this.params.divider);
        }
    },
    _buildCommand: function() {
        if (this.params.command) {
            this.$item.on('click.' + this.prefix + '-popup-item-' + this.uuid, this._catch.bind(this));
            this.$item.attr('data-command', this.params.command);
        }
    },
    _buildRemover: function() {
        if (!this.params.title) return;
        if (this.params.remover) {
           var $trash = this.dom('<span>').addClass(this.prefix + '-popup-item-trash ' + this.prefix + '-icon-trash');
           $trash.attr('data-command', this.params.remover);
           $trash.on('click.' + this.prefix + '-popup-item-' + this.uuid, this._catchRemover.bind(this));

           this.$item.append($trash);
        }
    },
    _catchRemover: function(e) {
        e.preventDefault();
        e.stopPropagation();

        var $item = this.dom(e.target).closest('.' + this.prefix + '-popup-stack-item');
        var $trash = this.dom(e.target).closest('.' + this.prefix + '-popup-item-trash');
        var command = $trash.attr('data-command');
        var name = $item.attr('data-name');

        this.app.api(command, this, name);

        $item.fadeOut(200, function($node) {
            $node.remove();
        });
    },
    _catch: function(e) {
        e.preventDefault();
        e.stopPropagation();

        var $item = this.dom(e.target).closest('.' + this.prefix + '-popup-stack-item');
        var name = $item.attr('data-name');
        var command = $item.attr('data-command');

        this.popup.$items.find('.' + this.prefix + '-popup-stack-item').removeClass('active');

        if (this.params.toggle) {
            $item.addClass('active');
        }

        // command
        this.app.api(command, this.getParams(), this, name, e);
    }
});

ArticleEditor.add('class', 'popup.stack', {
    defaults: {
        active: false,
        title: false,
        type: false, // grid
        width: false, // string like '200px' or '100%'
        setter: false,
        getter: false,
        builder: false,
        observer: false,
        instance: false,
        collapse: false,
        form: false,
        items: false,
        focus: false,
        footer: false
    },
    init: function(name, params, collapse, popup) {
        this.defaultWidth = '240px';
        this.popup = popup;
        this.name = name;
        this.tools = {};
        this.data = false;
        this.items = false;
        this.formitems = false;
        this.params = $ARX.extend({}, true, this.defaults, params);
        if (collapse) {
            this.params.collapse = true;
        }

        // build
        this._build();
        this._observe();
    },

    // set
    set: function(name, value) {
        this.params[name] = value;
    },
    setData: function(data) {
        this.data = data;
    },
    setFocus: function(name) {
        if (typeof this.tools[name] !== 'undefined') {
            this.tools[name].setFocus();
        }
    },
    setWidth: function(width) {
        var $popup = this.app.popup.getElement();

        $popup.attr('data-width', width);

        if (width === '100%') {
            width = this.app.editor.getWidth() + 'px';
        }

        $popup.css('width', width);
        this.app.$win.on('resize.' + this.prefix + '-popup-' + this.uuid, this.popup.resize.bind(this.popup));
        this.popup.resize();
    },
    setItemsData: function(items) {
        this.items = items;
    },

    // get
    get: function(name) {
        return this.params[name];
    },
    getElement: function() {
        return this.$stack;
    },
    getName: function() {
        return this.name;
    },
    getBody: function() {
        return this.$body;
    },
    getInstance: function() {
        return this.get('instance');
    },
    getItemsData: function() {
        return this.items;
    },
    getItems: function() {
        return this.$items;
    },
    getFooter: function() {
        return this.$footer;
    },
    getFooterPrimary: function() {
        return this.$footer.find('.' + this.prefix + '-form-button-primary');
    },
    getTool: function(name) {
        return (typeof this.tools[name] !== 'undefined') ? this.tools[name] : false;
    },
    getInput: function(name) {
        var tool = this.getTool(name);
        return (tool) ? tool.getInput() : this.dom();
    },
    getFormItem: function(name) {
        var tool = this.getTool(name);

        return (tool) ? tool.getInput().closest('.' + this.prefix + '-form-item') : this.dom();
    },
    getData: function(name) {
        var data;
        if (name) {
            if (typeof this.tools[name] !== 'undefined') {
                data = this.tools[name].getValue();
            }
        }
        else {
            data = {};
            Object.keys(this.tools).forEach(function(key) {
                data[key] = this.tools[key].getValue();
            }.bind(this));
        }

        return data;
    },

    // has
    hasForm: function() {
        return this.formitems;
    },
    hasFooter: function() {
        return (this.footerbuttons !== 0);
    },
    hasItems: function() {
        return (this.items !== false);
    },

    // is
    isCollapsed: function() {
        return this.get('collapse');
    },
    isActive: function() {
        return this.get('active');
    },

    // open
    open: function(params, focus, direct) {
        // input focus
        if (params && params.focus) {
            this.set('focus', params.focus);
        }

        // close stacks
        this.popup.closeStacks();

        // set
        this.app.popup.setStack(this);

        // broadcast
        if (direct !== false) {
            var event = this.app.broadcast('popup.before.open');
            if (event.isStopped()) {
                this.popup.stopStack();
                return;
            }
        }

        // render
        if (params && params.collapse) {
            this._buildItems();
            this._renderItems();
        }
        else {
            this.render();
        }

        // header
        this.popup.header.render(this.popup.stacks);
        this.popup.header.setActive(this);

        // show
        this.$stack.show();
        this._renderWidth();
        this.popup._buildPosition();
        if (focus !== false) {
            this.renderFocus();
        }

        // broadcast
        if (direct !== false) {
            this.app.broadcast('popup.open');
        }
    },

    // close
    close: function() {
        this.$stack.hide();
    },
    collapse: function() {
        var prev = this._getPrev();

        if (this.isCollapsed()) {
            this.popup.removeStack(this);
        }

        // open
        prev.open({ collapse: true });
    },

    // render
    render: function() {
        this._renderType();
        this._renderItems();
        this._renderForm();
        this._renderFooter();
        this._renderEnv();
    },
    renderFocus: function() {
        if (this.get('focus')) {
            this.setFocus(this.get('focus'));
        }
    },

    // =private

    // observe
    _observe: function() {
        if (this.params.observer) {
            this.app.api(this.params.observer, this);
        }
    },

    // get
    _getPrev: function() {
        var prev;
        for (var key in this.popup.stacks) {
            if (this.popup.stacks.hasOwnProperty(key)) {
                if (key === this.name) {
                    return prev;
                }
                prev = this.popup.stacks[key];
            }
        }
    },

    // build
    _build: function() {
        this._buildElement();
        this._buildBody();
        this._buildFooter();
        this._buildParams();
    },
    _buildElement: function() {
        this.$stack = this.dom('<div>').addClass(this.prefix + '-popup-stack ' + this.prefix + '-popup-stack-' + this.name);
        this.$stack.hide();
        this.$stack.attr('data-' + this.prefix + '-stack-name', this.name);

        // append
        this.popup.getElement().append(this.$stack);
    },
    _buildBody: function() {
        this.$body = this.dom('<div>').addClass(this.prefix + '-popup-body');
        this.$stack.append(this.$body);
    },
    _buildFooter: function() {
        this.$footer = this.dom('<div>').addClass(this.prefix + '-popup-footer');
        this.$stack.append(this.$footer);
    },
    _buildParams: function() {
        this.params.width = (this.params.width) ? this.params.width : this.defaultWidth;
        this.params.setter = (this.params.setter) ? this.params.setter : false;
        this.params.getter = (this.params.getter) ? this.params.getter : false;
        this.data = (this.params.getter) ? this.app.api(this.params.getter, this) : false;
        this._buildItems();
    },
    _buildItems: function() {
        // items
        if (this.params.builder) {
            this.items = this.app.api(this.params.builder, this);
        }
        else if (this.params.items) {
            this.items = this.params.items;
        }
    },

    // render
    _renderWidth: function() {
        this.setWidth(this.get('width'));
    },
    _renderType: function() {
        this.$stack.removeClass(this.prefix + '-popup-type-grid');

        var type = this.get('type');
        if (type) {
            this.$stack.addClass(this.prefix + '-popup-type-' + type);
        }
    },
    _renderItems: function() {
        if (!this.items) return;

        if (this.$items) {
            this.$items.html('');
        }
        else {
            this.$items = this.dom('<div>').addClass(this.prefix + '-popup-items');
            this.$body.append(this.$items);
        }

        // build items
        for (var name in this.items) {
            if (this.items.hasOwnProperty(name)) {
                if (Object.prototype.hasOwnProperty.call(this.items[name], 'observer') && this.items[name].observer) {
                    var res = this.app.api(this.items[name].observer, this.items[name], name, this);
                    if (typeof res !== 'undefined') {
                        this.items[name] = res;
                    }
                }

                if (this.items[name] === false) continue;

                var item = this.app.create('popup.item', this, name, this.items[name]);
                var $item = item.getElement();

                this._renderItemPosition(this.$items, $item, this.items[name]);
            }
        }
    },
    _renderItemPosition: function($container, $item, params) {
         if (params.position) {
            var pos = params.position;
            if (pos === 'first') {
                $container.prepend($item);
            }
            else if (typeof pos === 'object') {
                var type = (Object.prototype.hasOwnProperty.call(pos, 'after')) ? 'after' : 'before';
                var name = pos[type];
                var $el = this._findPositionElement(name, $container);
                if ($el) {
                    $el[type]($item);
                }
                else {
                    $container.append($item);
                }
            }
        }
        else {
            $container.append($item);
        }
    },
    _renderEnv: function() {
        var $popup = this.popup.getElement();

        $popup.removeClass('has-footer has-items has-form');

        if (this.hasForm()) $popup.addClass('has-form');
        if (this.hasFooter()) $popup.addClass('has-footer');
        if (this.hasItems()) $popup.addClass('has-items');
    },
    _renderForm: function() {
        this.formitems = this.get('form');

        if (!this.formitems) return;

        // build form element
        if (this.$form) {
            this.$form.html('');
        }
        else {
            this.$form = this.dom('<form>').addClass(this.prefix + '-popup-form');
            this.$body.append(this.$form);
        }

        this._renderTools();
        this._renderData();

        // enter events
        this.$form.find('input[type=text],input[type=url],input[type=email]').on('keydown.' + this.prefix + '-popup', function(e) {
            if (e.which === 13) {
                e.preventDefault();
                return false;
            }
        }.bind(this));
    },
    _renderTools: function() {
        Object.keys(this.formitems).forEach(function(key) {
            this._renderTool(key, this.formitems[key]);
        }.bind(this));
    },
    _renderTool: function(name, obj) {
        var tool = this.app.create('tool.' + obj.type, name, obj, this, this.data);
        var $tool = tool.getElement();
        if ($tool) {
            this.tools[name] = tool;
            this.$form.append($tool);
        }
    },
    _renderData: function() {
        if (!this.data) return;
        for (var name in this.data) {
            if (typeof this.tools[name] !== 'undefined') {
                this.tools[name].setValue(this.data[name]);
            }
        }
    },
    _renderFooter: function() {
        this.footerbuttons = 0;
        var buttons = this.get('footer');
        if (!buttons) return;

        this.$footer.html('');

        // buttons
        for (var key in buttons) {
            if (buttons.hasOwnProperty(key)) {
                if (buttons[key] === false) continue;

                var button = this.app.create('popup.button', key, this, buttons[key]);
                this.$footer.append(button.getElement());
                this.footerbuttons++;
            }
        }
    },

    // find
    _findPositionElement: function(name, $container) {
        var $el;
        if (Array.isArray(name)) {
            for (var i = 0; i < name.length; i++) {
                $el = $container.find('[data-name=' + name[i] + ']');
                if ($el.length !== 0) break;
            }
        }
        else {
            $el = $container.find('[data-name=' + name + ']');
        }

        return ($el.length !== 0) ? $el : 0;
    }
});
ArticleEditor.add('class', 'popup.header', {
    init: function(popup) {
        this.popup = popup;

        // build
        this._build();
    },
    setActive: function(stack) {
        this.$headerbox.find('.' + this.prefix + '-popup-header-item').removeClass('active');
        this.$headerbox.find('[data-' + this.prefix + '-name=' + stack.getName() + ']').addClass('active');
    },
    render: function(stacks) {
        this._reset();
        var len = this._buildItems(stacks);
        if (len > 0) {
            this._buildClose();
        }
    },

    // private
    _build: function() {
        this.$header = this.dom('<div>').addClass(this.prefix + '-popup-header');
        this.$headerbox = this.dom('<div>').addClass(this.prefix + '-popup-header-box');

        this.$header.append(this.$headerbox);
        this.popup.getElement().prepend(this.$header);
    },
    _buildClose: function() {
        var $close = this.dom('<span>').addClass(this.prefix + '-popup-close');
        $close.one('click', this._catchClose.bind(this));

        this.$header.append($close);
    },
    _buildItems: function(stacks) {
        var len = Object.keys(stacks).length;
        var count = 0;
        var z = 0;
        for (var key in stacks) {
            if (stacks.hasOwnProperty(key)) {
                if (typeof stacks[key] !== 'object') {
                    continue;
                }
                z++;
                var title = stacks[key].get('title');
                if (title) {
                    count++;
                    this._buildItem(stacks[key], title, len);
                }
                else if (z === 1 && len > 1) {
                    count++;
                    this._buildItem(stacks[key], '## popup.back ##', len);
                }
            }
        }

        return count;
    },
    _buildItem: function(stack, title, len) {
        var isLink = (len > 1);
        var $item = (isLink) ? this.dom('<a>').attr('href', '#') : this.dom('<span>');

        if (isLink) {
            $item.dataset('stack', stack);
            $item.addClass(this.prefix + '-popup-header-item-link');
            $item.on('click', this._catchStack.bind(this));
        }

        $item.attr('data-' + this.prefix + '-name', stack.getName());
        $item.addClass(this.prefix + '-popup-header-item');
        $item.html(this.lang.parse(title));

        this.$headerbox.append($item);
    },
    _reset: function() {
        this.$headerbox.html('');
        this.$header.find('.' + this.prefix + '-popup-close').remove();
    },
    _catchStack: function(e) {
        e.preventDefault();
        e.stopPropagation();

        var $item = this.dom(e.target);
        var stack = $item.dataget('stack');
        var current = this.app.popup.getStack();

        // remove collapsable
        if (current.isCollapsed()) {
            this.app.popup.removeStack(current);
        }

        // open
        stack.open();
    },
    _catchClose: function(e) {
        e.preventDefault();
        e.stopPropagation();

        this.popup.close();
    }
});
ArticleEditor.add('class', 'popup.button', {
    init: function(name, popup, obj) {

        this.name = name;
        this.obj = obj;
        this.popup = popup;

        this.$button = this.dom('<button>').addClass(this.prefix + '-form-button');
        this.$button.attr('data-name', this.name);
        this.$button.html(this.lang.parse(this.obj.title));
        this.$button.dataset('instance', this);

        if (this._has('type')) this.$button.addClass(this.prefix + '-form-button-' + this.obj.type);
        if (this._has('classname')) this.$button.addClass(this.obj.classname);
        if (this._has('fullwidth')) this.$button.addClass(this.prefix + '-form-button-fullwidth');
        if (this._has('right')) this.$button.addClass(this.prefix + '-form-button-push-right');

        // event
        this.$button.on('click.' + this.prefix + '-popup-button' + this.uuid, this._catch.bind(this));
    },
    getName: function() {
        return this.name;
    },
    getElement: function() {
        return this.$button;
    },
    invokeCommand: function() {
        this._invoke();
    },


    // private
    _has: function(name) {
        return Object.prototype.hasOwnProperty.call(this.obj, name);
    },
    _catch: function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (this._has('command')) {
            this._invoke(e);
        }
        else if (this._has('close')) {
            this.app.popup.close();
        }
    },
    _invoke: function(e) {
        this.app.api(this.obj.command, this.popup, this.name, e);
    }
});
ArticleEditor.add('module', 'editor', {
    init: function() {
        this.mobileMode = false;
        this.customButtons = {};
    },
    start: function() {
        this._buildFrame();
        this._buildDisabled();
        this._buildBlurClass();
        this._buildOptions();
        this._buildMultiple();
        this._buildParserTags();
        this._buildStartHtml();
        this._buildLayout();
        this._buildContent();
    },
    stop: function() {
        this.$editor = false;
        this.customButtons = {};
        this.app.$element.show();
    },
    build: function() {
        this.app.embed.build();
        this.app.blocks.build();
        this.app.image.observeStates();
        this.app.parser.buildPredefinedClasses();

        // broadcast
        this.app.broadcast('editor.build');
    },

    // insert
    insertContent: function(params) {
        this.app.insertion.insertContent(params);
    },

    // set
    setContent: function(params) {
        this.app.insertion.setContent(params);
    },
    setEmpty: function() {
        this.app.insertion.setContent({ html: '' });
    },
    setWinFocus: function() {
        this.getWin().focus();
    },
    setFocus: function(caret) {
        if (this.opts.disableMode) return;
        if (caret) {
            this._setFocusCaret(caret);
        }
        else {
            this._setFocusEvent();
        }
    },
    setBlur: function() {
        if (this.opts.disableMode || !this.isFocus()) return;
        if (!this.$editor.get) return;

        this.app.container.setBlur();

        if (!this.app.source.is()) {
            this._enableToolbarButtons();
            this.app.block.unset();
            this.app.blocks.unset();
        }

        this.app.selection.removeAllRanges();

        // ui
        if (!this.app.source.is() && !this.isMobileView()) {
            this.app.path.build();
            this.app.toolbar.build();
            this.app.control.close();
        }

        this.app.popup.close(false);

        // broadcast
        this.app.broadcast('editor.blur');
    },

    // select
    selectAll: function(type) {
        if (this.isAllSelected()) return;

        this._setSelectAllClass();

        this.app.blocks.unset();
        this.app.blocks.setFirstLevel();
        this.app.selection.removeAllRanges();

        // ui
        this.app.path.build();
        this.app.toolbar.build();
        this.app.control.close();

    },

    // unselect
    unselectAll: function() {
        if (!this.isAllSelected()) return;

        this.unsetSelectAllClass();

        this.app.block.unset();
        this.app.blocks.unset();
    },

    // unset
    unsetSelectAllClass: function() {
        this.$editor.removeClass(this.prefix + '-select-all');
    },

    // add
    addButton: function(name, obj) {
        this.customButtons[name] = obj;
    },

    // get
    getButtons: function() {
        var buttons = this.getButtonsFromArr(this.opts.buttons.editor);
        var res = {};
        for (var name in buttons) {
            if (buttons.hasOwnProperty(name)) {
                if (name === 'html' && !this.opts.source) continue;
                if (name === 'templates' && !this.opts.templates.json) continue;

                res[name] = buttons[name];
            }
        }

        // custom buttons
        res = $ARX.extend(true, {}, res, this.customButtons);

        return res;
    },
    getContent: function(tidy) {
        var html = '';
        if (this.app.source.is()) {
            html = this.app.source.getContent();
        }
        else {
            html = this._getContent();
            html = (tidy) ? this.app.tidy.parse(html) : html;
        }

        // decode href
        html = this.app.content.decodeHref(html);

        return html;
    },
    getWidth: function() {
        var $editor = this.getEditor();
        var padLeft = parseInt($editor.css('padding-left'));
        var padRight = parseInt($editor.css('padding-right'));

        return ($editor.width() - padLeft - padRight);
    },
    getRect: function() {
        return this.getFrameRect();
    },
    getFrameRect: function() {
        var offset = this.$editor.offset();
        var width = this.$editor.width();
        var height = this.$editor.height();
        var top = Math.round(offset.top);
        var left = Math.round(offset.left);

        return {
            top: top,
            left: left,
            bottom: top + height,
            right: left + width,
            width: width,
            height: height
        };
    },
    getSelection: function() {
        var sel = this.getWinNode().getSelection();
        return (sel.rangeCount > 0) ? sel : false;
    },
    getEditor: function() {
        return this.getFrame();
    },
    getFrame: function() {
        return (this.$editor) ? this.$editor : this.dom();
    },
    getLayout: function() {
        return this.$layout;
    },
    getOverlay: function() {
        return this.$overlay;
    },
    getHead: function() {
        return this.getDoc().find('head');
    },
    getBody: function() {
        return (this.$editor) ? this.getDoc().find('body') : this.dom();
    },
    getDoc: function() {
        return this.dom(this.getDocNode());
    },
    getDocNode: function() {
        return (this.$editor === false) ? null : this.$editor.get().contentWindow.document;
    },
    getWin: function() {
        return this.dom(this.getWinNode());
    },
    getWinNode: function() {
        return this.$editor.get().contentWindow;
    },
    getButtonsFromArr: function(arr) {
        var buttons = {};

        if (!Array.isArray(arr) && typeof arr === 'object') {
            return arr;
        }
        else if (arr) {
            var obj = $ARX.extend(true, {}, this.opts.buttonsObj);
            for (var i = 0; i < arr.length; i++) {
                var name = arr[i];
                if (typeof obj[name] !== 'undefined') {
                    buttons[name] = obj[name];
                }
            }
        }

        return buttons;
    },

    // adjust
    adjustHeight: function() {
        if (!this.$editor || this.app.isStopped()) return;
        setTimeout(function() {
            this.$editor.height(this.getBody().height());
        }.bind(this), 1);
    },

    // toggle
    toggleView: function(button) {
        if (this.mobileMode) {
            this.$editor.css('width', '');
            this.enableUI();
            this.app.toolbar.unsetToggled('mobile');
            this.app.event.run();
            this.app.blocks.runEditableBlocks();
            this.app.observer.build();
            this.mobileMode = false;
        }
        else {
            this.$editor.css('width', this.opts.editor.mobile + 'px');
            this.disableUI();
            this.app.toolbar.setToggled('mobile');
            this.app.popup.close();
            this.app.control.close();
            this.app.event.pause();
            this.app.blocks.pauseEditableBlocks();
            this.app.observer.stop();
            this.mobileMode = true;
        }

        this.adjustHeight();
    },

    // ui
    observeUI: function() {
        this.app.toolbar.observe();
    },
    enableUI: function() {
        this.app.path.enable();
        this.app.topbar.enable();
        this.app.toolbar.enable();
        this.app.toolbar.enableSticky();
    },
    disableUI: function() {
        this.app.path.disable();
        this.app.topbar.disable();
        this.app.toolbar.disable();
        this.app.toolbar.disableSticky();
    },

    // is
    isEditor: function(el) {
         return this.isLayout(el);
    },
    isLayout: function(el) {
        return (this.dom(el).get() === this.$layout.get());
    },
    isTextarea: function() {
        return (this.opts.content === false);
    },
    isAllSelected: function() {
        return this.$editor.hasClass(this.prefix + '-select-all');
    },
    isFocus: function() {
        return this.app.container.isFocus();
    },
    isEmpty: function(emptyparagraph) {
        var blocks = this.app.blocks.getFirstLevel();
        if (blocks.length > 1) {
            return false;
        }
        else {
            return this.app.content.isEmptyHtml(this.$layout.html(), emptyparagraph);
        }
    },
    isMobileView: function() {
        return this.mobileMode;
    },
    isPopupSelection: function() {
        return true;
    },
    isBlocksSelection: function() {
        return false;
    },

    // build
    _buildFrame: function() {
        this.app.$element.hide();
        this.$editor = this.dom('<iframe>').addClass(this.prefix + '-editor-frame');

        // append
        this.app.container.get('editor').append(this.$editor);

        // overlay
        this.$overlay = this.dom('<div>').addClass(this.prefix + '-editor-overlay');
        this.app.container.get('editor').append(this.$overlay);
    },
    _buildDisabled: function() {
        this.opts.disableMode = (this.opts.editor.disabled || this.app.$element.attr('disabled') !== null);
    },
    _buildBlurClass: function() {
        this.app.container.get('main').addClass(this.prefix + '-in-blur');
    },
    _buildMultiple: function() {
        if (this.opts.selection.multiple === false) {
            this.app.shortcut.remove('meta+click');
        }
    },
    _buildOptions: function() {
        var $e = this.$editor;
        var o = this.opts.editor;

        // 2.3.0 legacy
        var p = this.opts.paste;
        if (Object.prototype.hasOwnProperty.call(p, 'autolink')) {
            p.autoparse = p.autolink;
        }

        $e.attr('dir', o.direction);
        $e.attr('scrolling', 'no');
        $e.css('visibility', 'hidden');

        if (o.minHeight) $e.css('min-height', o.minHeight);
        if (o.maxHeight) {
            $e.css('max-height', o.maxHeight);
            $e.attr('scrolling', 'yes');
        }
        if (o.notranslate) $e.addClass('notranslate');
        if (!o.spellcheck) $e.attr('spellcheck', false);
    },
    _buildStartHtml: function() {
        var doctype = this._createDoctype();
        var scripts = this._createScripts();
        var layout = '<div class="' + this.opts.editor.classname + '"></div>';
        var code = doctype + '<html><head></head><body>' + layout + scripts + '</body></html>';

        // write code
        this._writeCode(code);
    },
    _buildLayout: function() {
        var $body = this.getBody();
        var classes = this.opts.editor.classname.split(' ').join('.');

        this.$layout = $body.find('.' + classes).first();
        this.$layout.attr('dir', this.opts.editor.direction);

        if (this.opts.editor.padding === false) {
            this.$layout.css('padding', 0);
        }

        // body height
        $body.css('height', 'auto');
    },
    _buildContent: function() {
        var content = this._getContentValue();

        content = this.app.broadcastHtml('editor.before.load', content);

        // set parsed
        var $parsed = this.app.parser.parse(content, true, true);
        this.$layout.html($parsed.get().childNodes);

        // set unparsed
        var unparsed = this.app.parser.unparse(this.$layout.html());
        this.app.$element.val(unparsed);

        // load
        this._load();
    },
    _buildVisibility: function() {
        this.$editor.css('visibility', 'visible');
    },
    _buildEditorCss: function() {
        if (!this.opts.css) return;

        var css;
        if (Array.isArray(this.opts.css)) {
            css = this.opts.css;
        }
        else {
            css = [
                this.opts.css + 'arx-frame.min.css',
                this.opts.css + 'arx-content.min.css'
            ];
        }

        for (var i = 0; i < css.length; i++) {
            this._buildCssLink(css[i]);
        }
    },
    _buildCustomCss: function() {
        if (!this.opts.custom.css) return;

        for (var i = 0; i < this.opts.custom.css.length; i++) {
            this._buildCssLink(this.opts.custom.css[i]);
        }
    },
    _buildCssLink: function(href) {
        var obj = (typeof href === 'object') ? href : { href: href };
        var isMark = (typeof href === 'string') ? href.search(/\?/g) : href.href.search(/\?/g);
        var mark = (isMark === -1) ? '?' : '&';
        var tstamp = (this.opts.editor.csscache) ? '' : mark + new Date().getTime();
        obj.href = obj.href + tstamp;

        // link tag
        var $css = this.dom('<link>').attr({ 'class': this.prefix + '-css', 'rel': 'stylesheet' });

        $css.attr(obj);

        // append
        this.getHead().append($css);
    },
    _buildGridCssVar: function() {
        if (!this.opts.grid) return;

        var style = this.getDocNode().documentElement.style;
        style.setProperty('--' + this.prefix + '-grid-columns', this.opts.grid.columns);
        style.setProperty('--' + this.prefix + '-grid-gutter', this.opts.grid.gutter);
        style.setProperty('--' + this.prefix + '-grid-offset-left', this.opts.grid.offset.left);
        style.setProperty('--' + this.prefix + '-grid-offset-right', this.opts.grid.offset.right);

        // patterns opts
        if (this.app.initialSettings.grid && this.app.initialSettings.grid.patterns) {
            this.opts.grid.patterns = this.app.initialSettings.grid.patterns;
        }
    },
    _buildParserTags: function() {
        var parser = this.opts.parser;
        for (var key in parser) {
            // add tag
            if (parser[key].parse && parser[key].tag) {
                var tag = parser[key].tag;
                if (typeof this.opts.parserTags[tag] === 'undefined') this.opts.parserTags[tag] = [];
                this.opts.parserTags[tag].push(parser[key].parse);
            }
        }
    },
    _buildDraggable: function() {
        var $items = this.app.$body.find('[data-' + this.prefix + '-drop-id]');
        $items.each(function($node) {
            $node.attr('draggable', true);
            $node.on('dragstart', function(e) {
                var $target = this.dom(e.target);
                var id = $target.attr('data-' + this.prefix + '-drop-id');
                e.dataTransfer.setData('item', id);
            }.bind(this));
        }.bind(this));

    },

    // load
    _load: function() {
        try {
            this._loadImages();
            this._loaded();
        }
        catch(e) {
            $ARX.error(e);
        }
    },
    _loaded: function() {
        this.app.sync.build();
        this.app.event.build();
        this.app.embed.build();
        this.app.blocks.build();
        this.app.image.observeStates();

        this._buildVisibility();
        this._buildEditorCss();
        this._buildCustomCss();
        this._buildGridCssVar();
        this._buildDraggable();

        // adjust on resize
        this.getWin().on('resize.' + this.prefix + '-editor-frame', this.adjustHeight.bind(this));

        // broadcast
        this.app.broadcast('editor.load');

        // adjust height & build observer
        this.adjustHeight();
        setTimeout(function() {
            if (this.app.isStopped()) return;

            this.adjustHeight();
            this._setFocusOnStart();
            this.app.observer.build();
            this.app.broadcast('editor.ready');
        }.bind(this), 500);
        setTimeout(this.adjustHeight.bind(this), 3000);
    },
    _loadedImage: function() {
        this.imageslen--;
    },
    _loadImages: function() {
        var $doc = this.getDoc();
        var $images = $doc.find('img');
        this.imageslen = $images.length;

        $images.each(this._loadImage.bind(this));
        var timerImg = setInterval(function() {
            if (this.imageslen === 0) {
                this.adjustHeight();
                clearInterval(timerImg);
                return;
            }
        }.bind(this), 50);
    },
    _loadImage: function($img) {
        var img = $img.get();
        if (this.opts.editor.images) {
            var arr = img.src.split('/');
            var last = arr[arr.length-1];
            img.src = this.opts.editor.images + last;
        }

        $img.one('load', this._loadedImage.bind(this));
    },

    // set
    _setFocusOnStart: function() {
        if (!this.opts.editor.focus) return;

        this.setFocus();
        this.setFocus(this.opts.editor.focus);
    },
    _setSelectAllClass: function() {
        this.$editor.addClass(this.prefix + '-select-all');
    },
    _setFocusCaret: function(caret) {
        caret = this._getCaretPosition(caret);
        var target = this._getFocusTarget(caret);

        this.app.block.set(target, caret);
    },
    _setFocusEvent: function() {
        if (this.isFocus()) return;

        for (var i = 0; i < $ARX.instances.length; i++) {
            if ($ARX.instances[i] !== this.app) {
                $ARX.instances[i].editor.setBlur();
            }
        }

        this.app.container.setFocus();

        // broadcast
        this.app.broadcast('editor.focus');
    },

    // get
    _getCaretPosition: function(caret) {
        return (caret === true) ? 'start' : caret;
    },
    _getFocusTarget: function(caret) {
        return (caret === 'start') ? this.app.blocks.getFirst() : this.app.blocks.getLast();
    },
    _getContent: function() {
        var html = this.$layout.html();
        html = this.app.parser.unparse(html);

        return html;
    },
    _getContentValue: function() {
        return (this.opts.content) ? this.opts.content : this.app.$element.val();
    },

    // enable
    _enableToolbarButtons: function() {
        if (this.app.source.is() || this.isMobileView()) return;
        this.app.toolbar.enable();
    },

    // write
    _writeCode: function(html) {
        var doc = this.getDocNode();
        doc.open();
        doc.write(html);
        doc.close();
    },

    // create
    _createDoctype: function() {
        return this.opts.editor.doctype + '\n';
    },
    _createScripts: function() {
        if (!this.opts.custom.js) return '';

        var str = '';
        var scripts = this.opts.custom.js;
        for (var i = 0; i < scripts.length; i++) {
            var obj = (typeof scripts[i] === 'object') ? scripts[i] : { src: scripts[i] };
            obj.src = obj.src + '?' + new Date().getTime();

            // script tag
            var $el = this.dom('<script>').addClass(this.prefix + '-js').attr(obj);

            // all scripts str
            str = str + $el.get().outerHTML;
        }

        return str;
    }
});
ArticleEditor.add('module', 'observer', {
    init: function() {
        this.observer = false;
        this.trigger = true;
    },
    build: function() {
        if (window.MutationObserver) {
            var el = this.app.editor.getLayout().get();
            this.observer = this._build(el);
            this.observer.observe(el, {
                 attributes: true,
                 subtree: true,
                 childList: true,
                 characterData: true,
                 characterDataOldValue: true
            });
        }
    },
    stop: function() {
        if (this.observer) this.observer.disconnect();
        this.trigger = true;
    },

    // private
    _build: function(el) {
        var self = this;
        return new MutationObserver(function(mutations) {
            self._observe(mutations[mutations.length-1], el);
        });
    },
    _observe: function(mutation, el) {
        if (mutation.type === 'attributes' && mutation.target === el) {
            return;
        }

        // sync
        if (this.trigger) {
            this.app.editor.adjustHeight();
            this.app.broadcast('observer.change');
            this.app.placeholder.toggle();
            this.app.sync.trigger();
        }
    }
});
ArticleEditor.add('module', 'parser', {
    build: function(html) {
        this.$layout = this.dom('<div>');
        this.$layout.html(html);
        this.$layout.find('[data-' + this.prefix + '-type]').each(this._build.bind(this));

        return this.$layout;
    },
    buildElement: function($el) {
        $el.find('[data-' + this.prefix + '-type]').each(this._build.bind(this));
    },
    buildPredefinedClasses: function($el) {
        if (!this.opts.classes) return;

        $el = $el || this.app.editor.getLayout();

        var content = this.app.content;
        var findTags = true;
        var findBlocks = false;
        if (typeof this.opts.classes.blocks !== 'undefined') {
            findBlocks = true;
            if (typeof this.opts.classes.tags === 'undefined') {
                findTags = false;
            }
        }

        if (findTags) $el.find(content.getPredefinedTags().join(',')).each(content.addPredefinedTagClass.bind(this));
        if (findBlocks) {
            var types = content.getPredefinedBlocks();
            var datatype = 'data-' + this.prefix + '-type';
            var selector = '[' + datatype + '=' + types.join('],[' + datatype + '=') + ']';
            $el.find(selector).each(content.addPredefinedBlockClass.bind(this));
        }
    },

    // parse
    parse: function(html, build, start) {
        // parse
        html = html.trim();
        html = this.app.broadcastHtml('editor.before.parse', html);

        // check empty
        if (this.app.content.isEmptyHtml(html)) {
            html = this.app.block.createHtml();
        }
        // clean & parse
        else {
            html = this._clean(html, start);
            html = this._parse(html);
        }

        // broadcast
        html = this.app.broadcastHtml('editor.parse', html);

        // build
        return (build !== false) ? this.build(html) : html;
    },
    parseLine: function(html, build) {
        if (html === ' ') {
            html = '&nbsp;';
        }
        else {
            // broadcast
            html = this.app.broadcastHtml('editor.before.parse', html);

            // convert newlines to br
            html = html.replace(/\r?\n/g, "<br>");
            html = this.app.content.encodeCode(html);
            html = this.app.content.sanitize(html);
            html = this.app.content.removeEmptySpans(html);
            html = this.app.content.addHttps(html);

            // broadcast
            html = this.app.broadcastHtml('editor.parse', html);
        }

        // build
        return (build !== false) ? this.build(html) : html;
    },

    // unparse
    unparse: function(html, state) {
        var stored = {};
        var storedIndex = 0;

        html = html.trim();
        html = this.app.broadcastHtml('editor.before.unparse', html);

        // empty
        if (this.app.content.isEmptyHtml(html)) {
            return '';
        }

        // revert
        html = this._revertForms(html);
        html = this._revertFrames(html);

        // store
        html = this.app.content.store(html, 'noneditable', stored, storedIndex);
        html = this.app.content.store(html, 'embed', stored, storedIndex);

        // link nofollow
        html = this.app.content.addNofollow(html);

        // remove selection markers
        html = this.app.content.removeMarkers(html);
        html = this.app.utils.removeInvisibleChars(html);

        // restore data style cache
        html = this.app.content.recacheStyle(html);

        // restore
        html = this.app.content.restore(html, 'noneditable', stored);
        html = this.app.content.restore(html, 'embed', stored);

        // remove empty attrs
        html = this.app.content.removeEmptyAttrs(html, ['style', 'class', 'rel', 'alt', 'title']);

        // unparse
        html = this._unparseAllTags(html);
        html = this._unparseDataType(html, state);

        // remove empty attrs again
        html = this.app.content.removeEmptyAttrs(html, ['style', 'class', 'rel', 'alt', 'title']);

        // add predefined classes
        if (this.opts.classes) {
            html = this.app.utils.wrap(html, this.buildPredefinedClasses.bind(this));
        }

        if (html === '<p></p>') {
            html = '';
        }

        // revert embed frame
        html = this._revertEmbedFrames(html);

        // tidy
        //html = this.app.content.tidy.html(html);

        // broadcast
        return this.app.broadcastHtml('editor.unparse', html);
    },

    // private
    _build: function($node) {
        var type = $node.attr('data-' + this.prefix + '-type');
        this.app.create('block.' + type, $node);
    },
    _clean: function(html, start) {
        var stored = {};
        var storedIndex = 0;
        var storedComments = [];

        // store comments
        html = this.app.content.storeComments(html, storedComments);

        // fix &curren; entity in the links
        html = html.replace(/¤t/gi, '&current');

        // encode
        if (start && this.app.editor.isTextarea()) {
            html = this.app.content.encodeCode(html);
        }

        // sanitize
        html = this.app.content.sanitize(html);

        // convert
        html = this._convertFrames(html);
        html = this._convertForms(html);

        // store
        html = this.app.content.store(html, 'noneditable', stored, storedIndex);
        html = this.app.content.store(html, 'embed', stored, storedIndex);

        // remove denied tags
        html = this.app.content.removeTags(html, this.opts.tags.denied);

        // remove doctype tag
        html = this.app.content.removeDoctype(html);

        // remove style & script tag
        html = this.app.content.removeTagsWithContent(html, ['script', 'style']);

        // remove empty spans
        html = this.app.content.removeEmptySpans(html);

        // add https for links and images
        html = this.app.content.addHttps(html);

        // remove block tags in
        html = this.app.content.removeBlockTagsInside(html, ['th', 'td', 'li', 'dt', 'dd', 'address']);

        // cache styles for block and inline tags and img
        html = this.app.content.cacheStyle(html);

        // restore
        html = this.app.content.restore(html, 'noneditable', stored);
        html = this.app.content.restore(html, 'embed', stored);

        // restore comments
        html = this.app.content.restoreComments(html, storedComments);

        // remove comments
        if (this.opts.clean.comments) {
            html = this.app.content.removeComments(html);
        }

        // empty or paragraphize
        if (this.app.content.isEmptyHtml(html)) {
            html = this.app.block.createHtml();
        }
        else {
            html = this.app.content.paragraphize(html);
        }

        return html;
    },
    _parse: function(html) {
        return this.app.utils.wrap(html, function($w) {
            var nodes = this.app.element.getBlocks($w);
            for (var i = 0; i < nodes.length; i++) {
                this._parseHtml(nodes[i]);
            }

            // predefined classes
            this.buildPredefinedClasses($w);

        }.bind(this));
    },
    _parseHtml: function(el) {
        var tag = el.tagName.toLowerCase();
        var $el = this.dom(el);
        var type;

        // check custom
        var parser = this.opts.parserTags;
        if (parser[tag]) {
            for (var i = 0; i < parser[tag].length; i++) {
                type = parser[tag][i].call(this.app, $el);
                if (type) break;
            }
        }

        if (!type) {
            type = this._parseType($el, tag);
        }

        // set
        if (type) {
            $el.attr('data-' + this.prefix + '-type', type);

            // check image tag
            if (type === 'image') {
                if (tag !== this.opts.image.tag) {
                    $el = this.app.element.replaceToTag($el, this.opts.image.tag, true);
                }
            }

            // nested
            if (this.opts.nested.indexOf(type) !== -1) {
                this._parseNested($el);
            }
        }
    },
    _parseType: function($el, tag) {
        var type;
        if ($el.attr('data-' + this.prefix + '-type')) {
            type = $el.attr('data-' + this.prefix + '-type');
        }
        else if (this._isNoneditable($el)) {
            type = 'noneditable';
        }
        else {
            type = this._parseTypeByTag($el, tag);
        }

        return type;
    },
    _parseNested: function($el) {
        var nodes = this.app.element.getBlocks($el);
        for (var i = 0; i < nodes.length; i++) {
            this._parseHtml(nodes[i]);
        }
    },
    _parseTypeByTag: function($el, tag) {
        var type;
        switch (tag) {
            case 'p':
                type = 'paragraph';
                if (this._isImageBlock($el, 'p')) {
                    type = 'image';
                }
                break;
            case 'figure':
                type = 'embed';
                if (this._isImageBlock($el, 'figure')) {
                    type = 'image';
                }
                else if (this._hasChild($el, 'pre')) {
                    type = 'code';
                }
                else if (this._hasChild($el, 'blockquote')) {
                    type = 'quote';
                }
                break;
            case 'div':
                type = 'layer';
                if ($el.attr('data-' + this.prefix + '-type')) {
                    type = false;
                }
                else if (this._isGridBlock($el)) {
                    type = 'grid';
                }
                else if (this._isColumnBlock($el)) {
                    type = 'column';
                }
                else if (this._isTextBlock($el)) {
                    type = 'text';
                }
                else if (this._isCardBlock($el)) {
                    type = 'card';
                }
                else if (this._isImageBlock($el, 'div')) {
                    type = 'image';
                }
                break;
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6':
                type = 'heading';
                break;
            case 'blockquote':
                type = 'quote';
                break;
            case 'table':
                type = 'table';
                break;
            case 'pre':
                type = 'code';
                break;
            case 'hr':
                type = 'line';
                break;
            case 'dl':
                type = 'dlist';
                break;
            case 'address':
                type = 'address';
                break;
            case 'ul':
            case 'ol':
                type = 'list';
                break;
            case 'main':
            case 'section':
            case 'header':
            case 'footer':
            case 'aside':
            case 'article':
                type = 'layer';
                break;
            default:
                break;
        }

        return type;
    },

    // is
    _isNoneditable: function($el) {
        return $el.hasClass(this.opts.noneditable.classname);
    },
    _isColumnBlock: function($el) {
        if (!this.opts.grid) return;

        var $parent = $el.parent();
        if ($parent.length !== 0 && $parent.attr('data-' + this.prefix +'-type') === 'grid') {
            return true;
        }
    },
    _isGridBlock: function($el) {
        if (!this.opts.grid) return;

        return $el.hasClass(this.opts.grid.classname);
    },
    _isTextBlock: function($el) {
        return (this.opts.text && $el.hasClass(this.opts.text.classname));
    },
    _isCardBlock: function($el) {
        return (this.opts.card && $el.hasClass(this.opts.card.classname));
    },
    _isImageBlock: function($el, tag) {
        var $img = $el.find('img');
        if ($img.length === 0) return;
        if (tag === 'div' && $img.closest('figure').length !== 0) return;

        var $target = $img;
        var $parent = $img.parent();
        var parentTag = ($parent.length !== 0) ? $parent.get().tagName : false;

        if (parentTag && (parentTag === 'A' || parentTag === 'SPAN')) {
            $target = $parent;
        }
        else if (parentTag && $parent.get() !== $el.get()) {
            return;
        }

        if ($target.prevElement().length !== 0) return;
        if (tag !== 'figure' && $target.nextElement().length !== 0) return;

        return true;
    },

    // has
    _hasChild: function($el, tag) {
        if (tag === 'pre') {
            var $pre = $el.find('pre');
            if ($pre.length !== 0) {
                return true;
            }
        }
        else if (tag === 'blockquote') {
            var $quote = $el.find('blockquote');
            var $script = $el.find('script');
            if ($script.length === 0 && $quote.length !== 0) {
                return true;
            }
        }
    },

    // get
    _getPredefinedTags: function() {
        var tags = [];
        Object.keys(this.opts.classes).forEach(function(key) {
            tags.push(key);
        });

        return tags;
    },

    // add
    _addPredefinedClass: function($node) {
        var tag = $node.get().tagName.toLowerCase();
        if (typeof this.opts.classes[tag] !== 'undefined') {
            $node.addClass(this.opts.classes[tag]);
        }
    },

    // unparse
    _unparseAllTags: function(html) {
        return this.app.utils.wrap(html, function($w) {
            $w.find('*').removeAttr('contenteditable data-gramm_editor');

             // remove images states
             if (!this.opts.image.states) {
                 $w.find('img').removeAttr('data-image');
             }


        }.bind(this));
    },
    _unparseDataType: function(html, state) {
        return this.app.utils.wrap(html, function($w) {
            var $elms = $w.find('[data-' + this.prefix + '-type]');

            if (state !== true) {
                $elms.removeClass(this.prefix + '-block-state');
            }

            $elms.removeAttr('data-' + this.prefix + '-first-level data-' + this.prefix + '-parsed');
            $elms.removeClass(this.prefix + '-block-focus ' + this.prefix + '-block-multiple-focus ' + this.prefix + '-block-multiple-hover ' + this.prefix + '-editable-pause');
            $elms.removeClass(this.prefix + '-empty-layer');
            $elms.each(this._unparseByType.bind(this));
            $elms.removeAttr('data-' + this.prefix + '-type');
            $w.find('figcaption').removeAttr('data-' + this.prefix + '-type data-placeholder').each(this.app.content._removeEmptyTag.bind(this));

        }.bind(this));
    },
    _unparseByType: function($node) {
        var type = $node.attr('data-' + this.prefix + '-type');

        if (type === 'list') {
            this.app.content.unfixListMargin($node);
        }

        if (this.opts.parser[type] && this.opts.parser[type].unparse) {
            this.opts.parser[type].unparse.call(this.app, $node);
        }
    },

    // convert
    _convertFrames: function(html) {
        return this.app.utils.wrap(html, function($w) {
            $w.find('iframe').each(this._convertFrame.bind(this));
        }.bind(this));
    },
    _convertForms: function(html) {
        return this.app.utils.wrap(html, function($w) {
            $w.find('form').each(this._convertForm.bind(this));
        }.bind(this));
    },
    _convertFrame: function($node) {
        if ($node.closest('figure').length === 0) {
            $node.wrap('<figure>');
            $node.parent().addClass(this.prefix + '-figure-iframe');
        }
    },
    _convertForm: function($node) {
        var $el = this.app.element.replaceToTag($node, 'figure');
        $el.addClass(this.prefix + '-figure-form');
        $el.attr('data-' + this.prefix + '-type', 'form');
    },

    // revert
    _revertFrames: function(html) {
        return this.app.utils.wrap(html, function($w) {
            $w.find('.' + this.prefix + '-figure-iframe').each(this._revertFrame.bind(this));
        }.bind(this));
    },
    _revertEmbedFrames: function(html) {
        return this.app.utils.wrap(html, function($w) {
            $w.find('figure').each(this._revertEmbedFrame.bind(this));
        }.bind(this));
    },
    _revertForms: function(html) {
        return this.app.utils.wrap(html, function($w) {
            $w.find('.' + this.prefix + '-figure-form').each(this._revertForm.bind(this));
        }.bind(this));
    },
    _revertFrame: function($node) {
        var $figcaption = $node.find('figcaption');
        if ($figcaption.length !== 0) {
            $node.removeClass(this.prefix + '-figure-iframe');
        }
        else {
            $node.unwrap();
        }
    },
    _revertEmbedFrame: function($node) {
        if ($node.find('figcaption').length === 0 && $node.find('div').length === 0) {
            $node.unwrap();
        }
    },
    _revertForm: function($node) {
        var $el = this.app.element.replaceToTag($node, 'form');
        $el.removeClass(this.prefix + '-figure-form');
    }
});
ArticleEditor.add('module', 'blocks', {
    build: function() {
        this._buildFirstLevel();
    },
    is: function() {
        return (this.getSelected().length > 1);
    },
    set: function($block) {
        $block = $block.closest('[data-' + this.prefix + '-first-level]');

        // unset not first level
        this.unsetNotFirstLevel();

        // set focus class
        this._setFocus($block);
        setTimeout(function() {
            this.app.selection.removeAllRanges();
        }.bind(this), 0);

        // ui
        this.app.path.build();
        this.app.toolbar.build();
        this.app.control.close();

        // check all or one selected
        this._checkSelected();
    },
    setFirstLevel: function() {
        this.app.blocks.getFirstLevel().addClass(this.prefix + '-block-focus');
    },
    unset: function() {
        this.getBlocks().removeClass(this.prefix + '-block-focus ' + this.prefix + '-block-multiple-hover');
    },
    unsetNotFirstLevel: function() {
        this.getBlocks().not('[data-' + this.prefix + '-first-level]').removeClass(this.prefix + '-block-focus');
    },
    unsetHover: function() {
        this.getBlocks().removeClass(this.prefix + '-block-multiple-hover');
    },
    getBlocks: function() {
        return this.app.editor.getLayout().find('[data-' + this.prefix + '-type]');
    },
    getFirstLevel: function() {
        return this.app.editor.getLayout().find('[data-' + this.prefix + '-first-level]');
    },
    getEditableBlocks: function() {
        return this.app.editor.getLayout().find('[contenteditable=true]');
    },
    getSelected: function() {
        return this.app.editor.getLayout().find('.' + this.prefix + '-block-focus');
    },
    getSelectedBlocks: function() {
        return this.getSelectedBlocks();
    },
    getFirst: function() {
        return this.getBlocks().first().dataget('instance');
    },
    getFirstSelected: function() {
        return this.getSelected().first().dataget('instance');
    },
    getLast: function() {
        return this.getBlocks().last().dataget('instance');
    },
    getLastSelected: function() {
        return this.getSelected().last().dataget('instance');
    },
    pauseEditableBlocks: function() {
        this.getEditableBlocks().attr('contenteditable', false).addClass(this.prefix + '-editable-pause');
    },
    runEditableBlocks: function() {
        var $blocks = this.app.editor.getLayout().find('.' + this.prefix + '-editable-pause');
        $blocks.attr('contenteditable', true).removeClass(this.prefix + '-editable-pause');
    },
    removeSelected: function(traverse) {
        var last = this.getLastSelected();
        var next;
        if (traverse !== false && last) {
            next = last.getNext();
        }

        // remove
        this.getSelected().each(this._removeSelectedBlock.bind(this));

        // traverse
        if (next) {
            this.app.block.set(next, 'start');
        }
    },

    // private
    _buildFirstLevel: function() {
        var name = 'data-' + this.prefix + '-first-level';
        var $layout = this.app.editor.getLayout();

        $layout.find('[' + name + ']').removeAttr(name);
        $layout.children('[data-' + this.prefix + '-type]').attr(name, true);
    },
    _checkSelected: function() {
        var $all = this.getFirstLevel();
        var $selected = this.getSelected();
        if ($selected.length === 0) {
            this.unsetHover();
            this.app.block.unset();
        }
        else if ($selected.length === 1) {
            this.unsetHover();
            this.app.block.set($selected.eq(0), false, true);
        }
        else if ($all.length === $selected.length) {
            this.unsetHover();
            this.app.editor.selectAll();
        }
        else {
            this.app.editor.unsetSelectAllClass();
        }
    },
    _setFocus: function($block) {
       var func = ($block.hasClass(this.prefix + '-block-focus')) ? 'removeClass' : 'addClass';

       $block[func](this.prefix + '-block-focus');
       $block.removeClass(this.prefix + '-block-multiple-hover');
    },
    _removeSelectedBlock: function($node) {
        var instance = $node.dataget('instance');
        instance.remove({ traverse: false });
    }
});
ArticleEditor.add('module', 'block', {
    init: function() {
        this.instance = false;
        this.$block = false;
    },
    create: function(html) {
        var instance = this.app.create('block.' + this.opts.editor.markup);
        if (html) instance.getBlock().html(html);

        return instance;
    },
    createHtml: function(html) {
        return this.create(html).getOuterHtml();
    },
    is: function($el) {
        return ($el) ? this._isBlockActive($el) : this.get();
    },
    isType: function(type) {
        if (!this.is()) return;
        return this.get().isType(type);
    },
    isParent: function(type) {
        if (!this.is()) return;

        var types = (Array.isArray(type)) ? type : [type];
        var $block = this.get().getBlock();
        var $blocks = this.app.element.getParents($block, types);

        return ($blocks.length !== 0);
    },
    get: function() {
        return this.instance;
    },
    set: function(el, caret, force) {
        // is instance
        if (el.isBlock) {
            el = el.getBlock();
        }

        // check if active
        if (force !== true && this._isBlockActive(el)) return;

        // unset
        this.unset();

        // set
        this.instance = this._getInstance(el);
        this.$block = this.instance.getBlock();
        this.$block.addClass(this.prefix + '-block-focus');

        // caret
        this._setCaret(caret);

        // ui
        this.app.path.build();
        this.app.toolbar.build();
        this.app.control.build();

        // broadcast
        this.app.broadcast('block.set');
    },
    unset: function() {
        if (!this.instance) return;

        this.instance = false;
        this.$block = false;

        // unset
        this.app.blocks.unset();
        this.app.editor.unsetSelectAllClass();

        // ui
        this.app.path.build();
        this.app.toolbar.build();
        this.app.control.close();

        // broadcast
        this.app.broadcast('block.unset');
    },
    duplicate: function() {
        if (!this._isAction()) return;

        var instance = this.get();
        var clone = instance.duplicate();
        var newInstance = instance.insert({
            instance: clone,
            position: 'after',
            caret: 'start',
            type: 'duplicate'
        });

        this.app.broadcast('block.duplicate', { instance: newInstance });

        return newInstance;
    },
    moveUp: function() {
        if (!this._isAction()) return;
        this.get().moveUp();
    },
    moveDown: function() {
        if (!this._isAction()) return;
        this.get().moveDown();
    },
    change: function(instance) {
        if (!this.is()) return;

        var current = this.get();
        var $block = current.getBlock();
        var $newBlock = instance.getBlock();

        $block.after($newBlock);
        $block.remove();

        // rebuild
        this.app.parser.buildElement($newBlock);
        this.app.editor.build();

        // set
        this.set(instance);

        // broadcast
        this.app.broadcast('block.change', { instance: instance });
    },
    add: function(params) {

        this.app.popup.close();

        var current = this.get();
        if (params.type && params.type === 'image' && (current && current.getType() === 'cell')) {
            current = current.getParent('table');
        }

        var remove = false;
        var position = false;

        // create
        var newInstance = (params.instance) ? params.instance : this.app.create('block.' + params.name, params.source);

        // all selected
        if (this.app.editor.isAllSelected()) {
            current = this.create();
            this.app.editor.unsetSelectAllClass();
            this.app.editor.getLayout().html('').append(current.getBlock());
            position = 'after';
            remove = true;
        }
        // blocks
        else if (this.app.blocks.is()) {
            current = this.app.blocks.getLastSelected();
            position = 'after';
        }
        // not selected
        else if (!current) {
            if (this.opts.editor.add === 'top') {
                current = this.app.blocks.getFirst();
                position = 'before';
            }
            else {
                current = this.app.blocks.getLast();
                position = 'after';
            }
        }
        // like variable
        else if (current.isInlineBlock()) {
            if (newInstance.getType() !== 'variable') {
                var parent = current.getParent();
                this.app.caret.set(current.getBlock(), 'after');
                this.app.block.set(parent);
                current = this.get();
            }
        }
        // empty emptiable
        else if (current.isEmptiable() && current.isEmpty()) {
            var $block = current.getBlock();

            $block.removeClass(this.prefix + '-empty-layer');
            $block.html('');
            position = 'append';
        }

        // position
        position = (params.position) ? params.position : position;

        var currentremove = true;
        if (current) {
            var type = current.getType();
            var types = ['paragraph', 'text', 'heading'];
            // adding new paragraph without removing current empty
            if (params.name === 'paragraph' && types.indexOf(type) !== -1) {
                currentremove = false;
            }
        }

        // insert
        current.insert({
            instance: newInstance,
            position: position,
            caret: (params.caret) ? params.caret : 'end',
            remove: currentremove,
            type: 'add'
        });

        if (remove) {
            current.remove();
        }

        return newInstance;
    },
    format: function(params) {
        this.app.format.set(params);
    },
    remove: function(params) {
        var instance = this.get();
        if (!instance) return;

        var type = instance.getType();
        var parent = instance.getParent();
        var isTraverse = (params && typeof params.traverse !== 'undefined' && params.traverse === false) ? false : true;
        if (isTraverse) {
            var next = instance.getNext();
            var prev = instance.getPrev();
            instance.remove();

            if (next) {
                this.app.block.set(next, 'start');
            }
            else if (prev) {
                this.app.block.set(prev, 'end');
            }
            else {
                this.unset();
            }
        }
        else {
            this.unset();
            instance.remove();
        }

        // broadcast image
        if (type === 'image') {
            this.app.broadcast('image.remove', {
                url: instance.getSrc(),
                id: instance.getId()
            });
        }

        // broadcast
        this.app.broadcast('block.remove', { type: type, parent: parent });

        // check empty
        if (this.app.editor.isEmpty()) {
            this.app.editor.setEmpty();
        }
    },
    observe: function(obj, name) {
        var types = ['line', 'quote', 'layer', 'code'];
        if (types.indexOf(name) !== -1 && !this.opts[name]) return false;

        // align / valign / outset
        if (name === 'alignment' && !this.opts.align) return false;
        if (name === 'valign' && !this.opts.valign) return false;
        if (name === 'outset' && !this.opts.outset) return false;
    },
    observeCard: function(obj, name) {
        if (name === 'image') {
            var instance = this.get();
            if (!instance.hasImage()) return false;
        }
    },
    popup: function(params, button, name) {

        // alignment
        var form;
        if (name === 'alignment') {
            form = this._buildSegments('align', 'alignment');
        }
        // valign
        else if (name === 'valign') {
            form = this._buildSegments('valign');
        }
        // outset
        else if (name === 'outset') {
            form = this._buildSegments('outset');
        }

        // popup
        this.app.popup.create(name, {
            setter: 'block.setData',
            getter: 'block.getData',
            form: form
        });

        this.app.popup.open({ button: button });
    },
    css: function(name, value) {
        if (!this.is()) return;

        var $el = this.get().getBlock();
        $el.css(name, value);

        // save
        name = 'data-' + this.prefix + '-style-cache';
        var style = $el.attr('style');
        if (style) {
            style = style.replace(/"/g, '');
            $el.attr(name, style);
        }
    },

    // data
    getData: function() {
        if (!this.is()) return;

        var instance = this.get();
        return instance.getData();
    },
    setData: function(stack) {
        if (!this.is()) return;

        var data = stack.getData();
        var instance = this.get();
        instance.setData(data);
    },

    // private
    _isBlockActive: function(el) {
        if (this.app.blocks.is()) return false;
        return (this.instance && (this.dom(el).get() === this.$block.get()));
    },
    _isAction: function() {
        return (!this.app.blocks.is() && this.is());
    },
    _buildSegments: function(name, title) {
        var form = {};
        var segments = {};
        var obj = this.opts[name];
        for (var key in obj) {
            if (!obj[key]) continue;
            segments[key] = { name: obj[key], prefix: name };
        }

        title = title || name;
        form[name] = {
            type: 'segment',
            label: '## form.' + title + ' ##',
            segments: segments
        };

        return form;
    },
    _appendToEmptyBlock: function(instance) {
        var emptyBlock = this.app.block.create();
        emptyBlock.append(instance);

        return emptyBlock.getBlock();
    },
    _getInstance: function(el) {
        return this.dom(el).dataget('instance');
    },
    _setCaret: function(caret) {

        if (this.instance.isEditable()) {
            if (caret) {
                var $target = this.$block;
                if (this.instance.getType() === 'list' && (caret === 'start' || caret === 'end')) {
                    $target = (caret === 'start') ? this.$block.find('li').first() : this.$block.find('li').last();
                }

                this.app.caret.set($target, caret);
            }
        }
        else {
            this.app.scroll.save();
            this.app.editor.getWin().focus();
            this.$block.focus();
            setTimeout(function() {
                this.app.selection.removeAllRanges();
            }.bind(this), 0);
            this.app.scroll.restore();
        }
    }
});
ArticleEditor.add('module', 'event', {
    init: function() {
        // local
        this.dragoverEvent = false;
        this.imageDrag = false;
        this.pressedCmd = false;
        this.isPopupMouseUp = false;
        this.isBlockMouseUp = false;
        this.pasteEvent = false;

        // events
        this.events = {
            frame: ['click', 'contextmenu', 'touchstart', 'mouseover', 'mouseup', 'mousedown', 'keydown', 'keyup',
                    'paste', 'copy', 'cut', 'drop', 'dragstart', 'dragover', 'dragleave'],
            doc: ['keydown', 'mousedown', 'click'],
            win: ['focus'],
            editor: ['click']
        };
    },
    run: function() {
        this._runEvents();
    },
    pause: function() {
        this._pauseEvents();
    },
    build: function() {
        this._buildTargets();
        this._buildPreventLinks();
        this._buildEvents();
    },
    stop: function() {
        var eventname = this.prefix + '-events';

        this.$body.off('.' + eventname);
        this.$win.off('.' + eventname);
        this.app.$doc.off('.' + eventname);
    },

    // on
    onmouseover: function(e) {
        // multiple hover
        this._buildHover(e);

        // broadcast
        this.app.broadcast('editor.mouseover', { e: e });
    },
    oncontextmenu: function(e) {
        if (this.pressedCmd) {
            e.preventDefault();
            var $block = this._getBlock(e);
            this.app.blocks.set($block);
        }
    },
    onclick: function(e) {
        this.app.broadcast('editor.click', { e: e });
        if (this._isEditorClick(e) && !this.isBlockMouseUp) {
            this._setByClick(e);
        }
    },
    onmouseup: function(e) {
        // state
        this.app.state.add(e);

        // broadcast
        this.app.broadcast('editor.mouseup', { e: e });

        // ui
        this.app.toolbar.observe();
    },
    onmousedown: function(e) {
        if (this.app.popup.isOpen()) {
            this.app.popup.close();
        }

        this._setBlock(e);
        this._setCaretInline(e);
        this.app.placeholder.handleClick(e);

        if (this._isEditorClick(e)) {
            this.isBlockMouseUp = false;
            return;
        }
        else {
            this.isBlockMouseUp = true;
        }

        // state
        this.app.state.add(e);

        // broadcast
        this.app.broadcast('editor.mousedown', { e: e });
    },
    ontouchstart: function(e) {
        // state
        this.app.state.add(e);
    },
    onkeydown: function(e) {
        // broadcast
        var event = this.app.broadcast('editor.keydown', this._buildEventKeysObj(e));
        if (event.isStopped()) return e.preventDefault();

        // enter key
        if (this.opts.editor.enterKey === false && e.which === 13) {
            e.preventDefault();
            return;
        }

        // listen undo & redo
        if (this.app.state.listen(e)) {
            this.pressedCmd = false;
            return;
        }

        this.pressedCmd = this._isCmdPressed(e);

        // esc
        if (this._isEsc(e)) {
            this.app.block.unset();
            this.app.selection.removeAllRanges();
        }

        // handle shortcut
        if (this.app.shortcut.handle(e)) {
            this.pressedCmd = false;
            return;
        }

        // release keydown
        this.app.input.handle(event);
    },
    onkeyup: function(e) {
        // broadcast
        var event = this.app.broadcast('editor.keyup', this._buildEventKeysObj(e));
        if (event.isStopped()) return e.preventDefault();

        // catch tab
        var key = e.which;
        if (key === this.app.keycodes.TAB && !this.app.block.is()) {
            if (e.target && e.target.tagName === 'BODY') {
                var $first = this.app.blocks.getFirst();

                this.app.editor.setFocus();
                this.app.block.set($first);
            }
            else {
                this._setBlock(e);
            }
        }

        this.pressedCmd = false;
        this.app.blocks.unsetHover();

        // ui
        this.app.toolbar.observe();
    },
    onpaste: function(e) {
        this._paste(e);
    },
    oncopy: function(e) {
        this._copy(e);
    },
    oncut: function(e) {
        this._cut(e);
    },
    ondrop: function(e) {
        if (!this.opts.editor.drop) return e.preventDefault();

        // broadcast
        var event = this.app.broadcast('editor.drop', { e: e });
        if (event.isStopped()) return e.preventDefault();

        // drop
        var html;
        var dt = e.dataTransfer;
        var item = dt.getData('item');
        if (item !== '') {
            e.preventDefault();

            if (this.opts.draggable && typeof this.opts.draggable[item] !== 'undefined') {
                html = this.opts.draggable[item];
            }
            else {
                html = this.dom('[data-' + this.prefix + '-drop-item=' + item + ']').html();
                html = html.trim();
            }

            // drop
            if (html) {
                var position = 'after';
                var $over = this.app.editor.getBody().find('.' + this.prefix + '-draggable-over');
                if ($over.length !== 0) {
                    position = 'append';
                }

                this._drop(e, html, position, false);
            }
        }
        else if (this.opts.image && this.opts.image.upload && dt.files !== null && dt.files.length > 0) {
            e.preventDefault();
            this.app.image.drop(e, dt);
        }
        else {
            html = dt.getData("text/html");
            html = (html.trim() === '') ? dt.getData('Text') : html;

            // drop
            var dropped = this._drop(e, html);

            if (this.imageDrag && dropped.instances.length !== 0) {
                var instance = dropped.instances[0];
                instance.change(this.imageDrag, false);
            }
        }

        this._removeDragPlaceholder();

        this.imageDrag = false;
        this.app.observer.trigger = true;
    },
    ondragstart: function(e) {
        var $block = this._getBlock(e.target);
        if ($block.length !== 0 && this.app.element.getType($block) === 'image') {
            this.imageDrag = $block.dataget('instance');
        }

        // broadcast
        this.app.broadcast('editor.dragstart', { e: e });
    },
    ondragover: function(e) {
        e.preventDefault();
        this.dragoverEvent = true;
        this.app.observer.trigger = false;
        this._removeDragPlaceholder();

        // data
        var types = e.dataTransfer.types;
        if (types.indexOf('item') !== -1) {
            var $block = this._getBlock(e.target);
            if ($block.length !== 0) {

                var instance = $block.dataget('instance');
                if (instance.getType('layer') && instance.isEmpty()) {
                    $block.addClass(this.prefix + '-draggable-over');
                }
                else {
                    var $pl = this.dom('<div>').addClass(this.prefix + '-draggable-placeholder');
                    $block.after($pl);
                }
            }
        }

        // broadcast
        this.app.broadcast('editor.dragover', { e: e });
    },
    ondragleave: function(e) {
        e.preventDefault();
        this.dragoverEvent = false;

        this._removeDragPlaceholder();
        this.app.observer.trigger = true;

        // broadcast
        this.app.broadcast('editor.dragleave', { e: e });
    },

    // on editor (frame doc)
    oneditorclick: function(e) {
        if (e.target.tagName === 'HTML') {
            this._setByClick(e);
        }
    },

    // on win
    onwinfocus: function(e) {
        if (this._isRemoveRanges()) {
            setTimeout(function() {
                this.app.selection.removeAllRanges();
            }.bind(this), 0);
            return;
        }
    },

    // on doc
    ondockeydown: function(e) {
        if (this.app.popup.isOpen()) {
            if (this._isEnter(e)) {
                var stack = this.app.popup.getStack();
                if (stack.hasForm() !== false && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    var $btn = stack.getFooterPrimary();
                    $btn.dataget('instance').invokeCommand();
                    return;
                }
            }

            if (this._isEsc(e)) {
                this.app.popup.close(false);
            }
        }
    },
    ondocmousedown: function(e) {
        this.isPopupMouseUp = (this.dom(e.target).closest('.' + this.prefix + '-popup-' + this.uuid).length !== 0);
    },
    ondocclick: function(e) {
        if (!this._isOutsideEditor(e)) return;

        if (this.app.popup.isOpen()) {
            if (this.isPopupMouseUp === false) this.app.popup.close(false);
        }
        else {
            this.app.editor.setBlur();
        }

        this.pressedCmd = false;
    },

    // private
    _buildPreventLinks: function() {
        var eventname = this.prefix + '-prevent-events';
        this.$body.on('click.' + eventname  + ' dblclick.' + eventname, this._preventLinks.bind(this));
    },
    _buildTargets: function() {
        this.$body = this.app.editor.getBody();
        this.$win = this.app.editor.getWin();
    },
    _buildEventKeysObj: function(e) {
        var key = e.which;
        var arrowKeys = [this.app.keycodes.UP, this.app.keycodes.DOWN, this.app.keycodes.LEFT, this.app.keycodes.RIGHT];
        var isAlphaKeys = ((!e.ctrlKey && !e.metaKey) && ((key >= 48 && key <= 57) || (key >= 65 && key <= 90)));
        var k = this.app.keycodes;

        return {
            'e': e,
            'key': key,
            'ctrl': (e.ctrlKey || e.metaKey),
            'shift': (e.shiftKey),
            'alt': (e.altKey),
            'select': ((e.ctrlKey || e.metaKey) && !e.altKey && key === 65),
            'enter': (key === k.ENTER),
            'space': (key === k.SPACE),
            'esc': (key === k.ESC),
            'tab': (key === k.TAB && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey),
            'delete': (key === k.DELETE),
            'backspace': (key === k.BACKSPACE),
            'alpha': isAlphaKeys,
            'arrow': (arrowKeys.indexOf(key) !== -1),
            'left': (key === k.LEFT),
            'right': (key === k.RIGHT),
            'up': (key === k.UP),
            'down': (key === k.DOWN),
            'left-right': (key === k.LEFT || key === k.RIGHT),
            'up-left': (key === k.UP || key === k.LEFT),
            'down-right': (key === k.DOWN || key === k.RIGHT)
        };
    },
    _buildEvents: function() {
        var eventname = this.prefix + '-events';

        this._buildTargetEvents(this.$body, this.events.frame, eventname, '');
        this._buildTargetEvents(this.$win, this.events.win, eventname, 'win');
        this._buildTargetEvents(this.app.$doc, this.events.doc, eventname, 'doc');
        this._buildTargetEvents(this.app.editor.getDoc(), this.events.editor, eventname, 'editor');
    },
    _buildTargetEvents: function($target, events, eventname, type) {
        for (var i = 0; i < events.length; i++) {
            $target.on(events[i] + '.' + eventname, this['on' + type + events[i]].bind(this));
        }
    },
    _buildHover: function(e) {
        var instance = this.app.block.get();

        // check pressed & instance
        if (!this.pressedCmd || !instance) return;

        var $block = this.dom(e.target).closest('[data-' + this.prefix + '-first-level]');
        if ($block.length === 0) return;

        // unset
        this.app.blocks.unsetHover();

        // build hover
        if (!$block.hasClass(this.prefix + '-block-focus')) {
            $block.addClass(this.prefix + '-block-multiple-hover');
        }
    },
    _runEvents: function() {
        var eventname = this.prefix + '-events';

        this._buildTargetEvents(this.$body, this.events.frame, eventname, '');
        this._buildTargetEvents(this.$win, this.events.win, eventname, 'win');
    },
    _pauseEvents: function() {
        var eventname = this.prefix + '-events';

        if (this.$body) {
            this.$body.off('.' + eventname);
            this.$win.off('.' + eventname);
        }
    },
    _getBlock: function(target) {
        return this.dom(target).closest('[data-' + this.prefix + '-type]');
    },
    _setByClick: function(e) {
        var blocks = this.app.blocks.getFirstLevel();
        var coords = [];
        blocks.each(function($node) {
            var rect = $node.get().getBoundingClientRect();
            coords.push([rect.x, rect.y, rect.y + rect.height]);
        });

        var distances = [];
        var heightIndex = false;
        coords.forEach(function(coord, index) {
            var y = parseInt(e.clientY);
            var x = parseInt(e.clientX);
            if (coord[1] < y && y < coord[2]) {
                heightIndex = index;
                return;
            }
            var distance = Math.hypot(coord[0]-x, coord[1]-y);
            distances.push(parseInt(distance));
        });

        var closestIndex = (heightIndex !== false) ? heightIndex : distances.indexOf(Math.min.apply(Math, distances));

        var $block = blocks.eq(closestIndex);
        this.app.block.set($block.dataget('instance'), 'start');
        this.app.editor.setFocus();
    },
    _setCaretInline: function(e) {
        var instance = this.app.block.get();
        var code = false;
        if (instance && instance.isEditable()) {
            // svg or img
            if (this.app.element.isEmptyOrImageInline(e.target)) {
                this.app.caret.set(e.target, 'after');
            }
            // code
            else if (this.app.selection.isCollapsed() && e.target.tagName === 'CODE') {
                code = true;
                setTimeout(function() {
                    var current = this.app.selection.getElement();
                    if (current && code && current.tagName !== 'CODE') {
                        this.app.caret.set(e.target, 'start');
                        code = false;
                    }
                }.bind(this), 1);
            }
        }
    },
    _setBlock: function(e) {
        // set focus event
        this.app.editor.setFocus();

        var $block = (e) ? this._getBlock(e.target) : this.app.selection.getDataBlock();
        if ($block.length === 0) return;

        // prevent contenteditable false focus
        if ($block.attr('contenteditable') === false) {
            e.preventDefault();
        }

        // multiple
        if (this.pressedCmd) {
            if (e) e.preventDefault();
            this.app.blocks.set($block);
        }
        // single
        else {
            this.app.block.set($block);
        }
    },
    _isRemoveRanges: function() {
        var instance = this.app.block.get();
        return (this.app.blocks.is() || (instance && instance.isInlineBlock()));
    },
    _isEsc: function(e) {
        return (e.which === this.app.keycodes.ESC);
    },
    _isEnter: function(e) {
        return (e.which === this.app.keycodes.ENTER);
    },
    _isEditorClick: function(e) {
        if (this.app.editor.isEditor(e.target)) {
            e.preventDefault();
            return true;
        }
    },
    _isOutsideEditor: function(e) {
        var $target = this.dom(e.target);
        var targets = ['-container-', '-popup-', '-control-'];

        return ($target.closest('.' + this.prefix + targets.join(this.uuid + ',.' + this.prefix) + this.uuid).length === 0);
    },
    _isCmdPressed: function(e) {
        return (this.opts.selection.multiple) ? ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) : false;
    },
    _isLinkClick: function(e) {
        return (this.dom(e.target).closest('a').length !== 0);
    },
    _removeDragPlaceholder: function() {
        var $body = this.app.editor.getBody();
        $body.find('.' + this.prefix + '-draggable-placeholder').remove();
        $body.find('.' + this.prefix + '-draggable-over').removeClass(this.prefix + '-draggable-over');
    },
    _preventLinks: function(e) {
        if (this._isLinkClick(e)) e.preventDefault();
    },
    _drop: function(e, html, position, cleanDrop) {
        var target = this.app.element.getDataBlock(e.target);
        target = (target.length === 0) ? this.app.blocks.getFirst() : target;

        // set target
        this.app.block.set(target);

        // drop point
        if (!position) {
            this.app.insertion.insertPoint(e);
        }

        var clean = true;
        var parse = true;

        var instance = this.app.block.get();
        var isAll = this.app.editor.isAllSelected();
        if (instance && instance.getType() === 'code' && !isAll) {
            clean = false;
            parse = false;
            html = this.app.content.getTextFromHtml(html, { nl: true, trimlines: false });
        }

        if (cleanDrop === false) {
            clean = false;
        }

        // empty
        if (html === '') {
            return;
        }

        // autoparse
        html = (clean) ? this.app.autoparse.parse(html) : html;

        // insert
        return this.app.insertion.insertContent({ html: html, clean: clean, parse: parse, position: position });
    },
    _paste: function(e) {

        e.preventDefault();

        var clipboard = e.clipboardData;

        // image
        if (this.app.image.insertFromClipboard(clipboard)) {
            return;
        }

        // html / text
        var url = clipboard.getData('URL');
        var html = this.app.clipboard.getContent(clipboard);

        // broadcast
        this.pasteEvent = true;
        var event = this.app.broadcast('editor.before.paste', { e: e, html: html });
        if (event.isStopped()) {
            this.pasteEvent = false;
            return;
        }

        html = event.get('html');

        // get safari anchor links
        html = (!url || url === '') ? html : url;

        // clean
        var instance = this.app.block.get();
        var clean = true;
        var parse = true;
        var isAll = this.app.editor.isAllSelected();
        if (this.opts.paste.plaintext) {
            clean = false;
            parse = false;
            html = this.app.content.getTextFromHtml(html, { br: true });
        }
        else if (instance && instance.getType() === 'code' && !isAll) {
            clean = false;
            parse = false;
            html = this.app.content.getTextFromHtml(html, { nl: true, trimlines: false });
        }
        else if (!this.opts.paste.clean) {
            clean = false;
        }

        html = (this.opts.paste.links) ? html : this.app.content.removeTags(html, ['a']);
        html = (this.opts.paste.images) ? html : this.app.content.removeTags(html, ['img']);

        // empty
        if (html === '') {
            this.pasteEvent = false;
            return;
        }

        // local images
        var rtf = clipboard.getData('text/rtf');
        var images;
        if (rtf) {
            images = this._findLocalImages(html);
            html = this._replaceLocalImages(html, images, this._extractImagesFromRtf(rtf));
        }

        // autoparse
        html = (clean) ? this.app.autoparse.parse(html) : html;

        // insert
        var inserted = this.app.insertion.insertContent({ html: html, clean: clean, parse: parse });

        // upload inserted base64 or blob
        if (this.opts.image.upload) {
            this.app.image.parseInserted(inserted);
        }

        // placeholder
        this.app.placeholder.toggle();

        // broadcast
        this.app.broadcast('editor.paste', inserted);
        this.pasteEvent = false;
    },
    _copy: function(e) {
        this._action(e, 'copy');
    },
    _cut: function(e) {
        this._action(e, 'cut');
    },
    _action: function(e, name) {
        var instance = this.app.block.get();
        var isMultiple = this.app.blocks.is();
        var html = false;
        var obj = {
            html: false,
            remove: 'content'
        };

        // do nothing
        if (!isMultiple && !instance) return;
        if (!isMultiple && instance && instance.isEditable() && this.app.selection.isCollapsed()) return;

        // stop event
        e.preventDefault();

        // select all
        if (this.app.editor.isAllSelected()) {
            obj = { html: this.app.editor.getLayout().html(), remove: 'all' };
        }
        // multiple
        else if (isMultiple) {
            obj = { html: this._copyFromMultiple(name), remove: 'blocks' };
        }
        // single editable
        else if (instance && instance.isEditable()) {
            obj = this._copyFromEditable(name, instance);
        }
        // single non editable
        else if (instance) {
            obj = this._copyFromNonEditable(name, instance);
        }

        // broadcast
        var event = this.app.broadcast('editor.before.' + name, { e: e, html: obj.html });
        if (event.isStopped()) {
            return;
        }

        // delete content
        if (name === 'cut') {
            this._cutDeleteContent(obj);
        }

        html = event.get('html');

        // set to clipboard
        html = this.app.clipboard.setContent(e, html);

        // broadcast
        this.app.broadcastHtml('editor.' + name, html);
    },
    // copy
    _cutDeleteContent: function(obj) {
        if (obj.remove === 'instance') {
            obj.instance.remove(true);
            this.app.control.close();
        }
        else if (obj.remove === 'all') {
            this.app.editor.setEmpty();
        }
        else if (obj.remove === 'blocks') {
            this.app.blocks.removeSelected(false);
        }
        else if (obj.remove === 'row') {
            obj.instance.getBlock().find('td, th').html('');
        }
        else if (obj.remove === 'noneditable') {
            var type = obj.instance.getType();
            var parentInstance = obj.instance.getParent('layer');
            if (type === 'column') {
                obj.instance.setEmpty();
            }
            else {
                obj.instance.remove(true);
                this.app.control.close();
            }

            if (type === 'layer' && parentInstance && parentInstance.isEmpty()) {
                parentInstance.setEmpty();
            }
        }
        else if (obj.remove !== false) {
            this.app.selection.deleteContents();
        }
    },
    _copyFromMultiple: function(name) {
        var $blocks = this.app.blocks.getSelected();
        var $tmp = this.dom('<div>');
        $blocks.each(function($node) {
            $tmp.append($node.clone());
        });

        return $tmp.html();
    },
    _copyFromEditable: function(name, instance) {
        var type = instance.getType();
        var html = this.app.selection.getHtml();
        var remove = 'content';

        if (type === 'figcaption' || type === 'cell') {
            remove = 'content';
        }
        else if (instance.isAllSelected()) {
            html = instance.getOuterHtml();
            remove = 'instance';
        }
        else if (type === 'dlist') {
            // wrap to dlist
            if (html.search(/<dl/gi) === -1) {
                html = '<dl>' + html + '</dl>';
            }
        }
        else if (type === 'list') {
            var tag = instance.getTag();
            // contains li
            if (html.search(/<li/gi) !== -1) {
                // does not have li at start
                if (html.search(/^<li/g) === -1) {
                    html = '<li>' + html + '</li>';
                }

                // wrap to list
                html = '<' + tag + '>' + html + '</' + tag + '>';
            }
        }

        return { html: html, remove: remove, instance: instance };
    },
    _copyFromNonEditable: function(name, instance) {
        var $block = instance.getBlock();
        var type = instance.getType();
        var html = '';
        var remove = 'noneditable';

        // column
        if (type === 'column') {
            html = $block.html();
        }
        // row
        else if (type === 'row') {
            // wrap to table
            html = instance.getOuterHtml();
            html = '<table>' + html + '</table>';
            remove = 'row';
        }
        else {
            html = instance.getOuterHtml();
        }

        return { html: html, remove: remove, instance: instance };
    },
    // local images
    _findLocalImages: function(html) {
        var images = [];

        this.app.utils.wrap(html, function($w) {
            $w.find('img').each(function($node) {
                if ($node.attr('src').search(/^file:\/\//) !== -1) {
                    images.push($node.attr('src'));
                }
            });
        });

        return images;
    },
    _extractImagesFromRtf: function(rtf) {
        if (!rtf) return [];

        var reHeader = /{\\pict[\s\S]+?\\bliptag-?\d+(\\blipupi-?\d+)?({\\\*\\blipuid\s?[\da-fA-F]+)?[\s}]*?/;
        var reImage = new RegExp('(?:(' + reHeader.source + '))([\\da-fA-F\\s]+)\\}', 'g');
        var images = rtf.match(reImage);

        if (!images) return [];

        var res = [];
        for (var i = 0; i < images.length; i++) {
            var type = false;

            if (images[i].indexOf('\\pngblip') !== -1) {
                type = 'image/png';
            }
            else if (images[i].indexOf('\\jpegblip') !== -1) {
                type = 'image/jpeg';
            }

            if (type) {
                res.push({
                    hex: images[i].replace(reHeader, '').replace(/[^\da-fA-F]/g, ''),
                    type: type
                });
            }
        }

        return res;
    },
    _convertHexToBase64: function(str) {
        return btoa(str.match(/\w{2}/g).map(function(char) {
            return String.fromCharCode(parseInt(char, 16));
        }).join(''));
    },
    _replaceLocalImages: function(html, images, sources) {
        if (images.length === sources.length) {

            for (var i = 0; i < images.length; i++) {
                var src = 'data:' + sources[i].type + ';base64,' + this._convertHexToBase64(sources[i].hex);
                html = html.replace(new RegExp('src="' + images[i] + '"', 'g'), 'src="' + src + '"');
            }
        }

        return html;
    }
});
ArticleEditor.add('module', 'input', {
    handle: function(event) {
        var e = event.get('e');
        var key = event.get('key');

        if (this._doSelectAll(e, event)) {
            return;
        }

        // events
        if (event.is('enter') && event.is('shift')) {
            this.handleShiftEnter(e, key, event);
        }
        else if (event.is('enter')) {
            this.handleEnter(e, key, event);
        }
        else if (event.is('space') && event.is('shift')) {
            this.handleShiftSpace(e, key, event);
        }
        else if (event.is('space')) {
            this.handleSpace(e, key, event);
        }
        else if (event.is('tab') && this.opts.tab.key) {
            this.handleTab(e, key, event);
        }
        else if (event.is('arrow')) {
            if (event.is(['shift', 'alt', 'ctrl'])) return;
            this.handleArrow(e, key, event);
        }
        else if (event.is(['delete', 'backspace'])) {
            this.handleDelete(e, key, event);
        }
    },

    // handle
    handleDelete: function(e, key, event) {

        var instance = this.app.block.get();
        var isBackspace = event.is('backspace');
        var isDelete = event.is('delete');

        if (this.app.blocks.is()) {
            e.preventDefault();
            this.app.blocks.removeSelected();
            return;
        }

        // trim invisible char
        if (instance && instance.isEditable() && this._trimInvisibleChar(e, (event.is('backspace') ? 'left' : 'right'), isDelete)) {
            return;
        }

        // inline
        var inline = this.app.selection.getInline();
        if (inline && inline.innerHTML.length === 1) {
            e.preventDefault();
            inline.innerHTML = '';
            return;
        }

        // handle block
        if (instance.handleDelete && instance.handleDelete(e, key, event)) {
            return;
        }

        // instance
        var next = instance.getNext();
        var prev = instance.getPrev();

        // like variable
        if (instance.isInlineBlock()) {
            e.preventDefault();
            var $block = instance.getBlock();
            var parent = instance.getParent();
            this.app.caret.set($block, 'after');

            instance.remove(true);
            this.app.block.set(parent);
        }
        // non editable
        else if (!instance.isEditable()) {
            e.preventDefault();

            instance.remove(true);

            if (next) {
                this.app.block.set(next, 'start');
            }
            else if (prev) {
                this.app.block.set(prev, 'end');
            }
            else {
                if (this.app.editor.isEmpty()) {
                    this.app.editor.setEmpty();
                }
                else {
                    this.app.block.unset();
                }
            }
        }
        // editable
        else if (instance.isEditable()) {
            var type = instance.getType();

            // all block selected
            if (instance.isAllSelected()) {
                e.preventDefault();
                if (type === 'card') {
                    this.app.block.remove();
                }
                else {
                    instance.setEmpty();
                }
                return;
            }

            // delete & end
            if (isDelete && next && instance.isCaretEnd()) {
                e.preventDefault();

                if (next.getType() === 'card' || !next.isEditable()) {
                    this.app.block.set(next);
                }
                else {
                    if (type === 'card') {
                        return;
                    }
                    else {
                        instance.appendNext();
                    }
                }
            }
            // backspace & start
            else if (isBackspace && prev && instance.isCaretStart()) {
                e.preventDefault();
                if (prev.getType() === 'card' || !prev.isEditable()) {
                    this.app.block.set(prev);

                    // remove
                    if (instance.isEmpty()) {
                        instance.remove(true);
                    }
                }
                else {
                    if (type === 'card' || type === 'cell') {
                        return;
                    }
                    else {
                        instance.appendToPrev();
                    }
                }
            }
        }
    },
    handleArrow: function(e, key, event) {
        var instance = this.app.block.get();

        // multiple
        if (this.app.blocks.is()) {
            return;
        }

        // editable & inline code or like variable
        if (instance.isEditable()) {
            var current = this.app.selection.getCurrent();
            var inline = this.app.selection.getTopInline();

            // inline code
            if (event.is('right') && inline && inline.tagName === 'CODE') {
                var inlineEnd = this.app.caret.is(inline, 'end');
                var blockEnd = this.app.caret.is(instance.getBlock(), 'end');
                if (inlineEnd && blockEnd) {
                    e.preventDefault();
                    this.app.caret.set(inline, 'after');
                    return;
                }
            }

            // variable
            if (inline && this._catchInlineBlock(e, event, inline)) {
                return;
            }
            else if (current && this._catchInlineBlock(e, event, current)) {
                return;
            }
        }

        // trim invisible char
        if (instance.isEditable() && this._trimInvisibleChar(e, (event.is('left') ? 'left' : 'right'))) {
            return;
        }

        // handle block
        if (instance.handleArrow && instance.handleArrow(e, key, event)) {
            return;
        }

        // like variable
        if (instance.isInlineBlock()) {
            e.preventDefault();
            var $block = instance.getBlock();
            var parent = instance.getParent();

            var caret = (event.is('up-left')) ? 'before' : 'after';
            this.app.caret.set($block, caret);
            this.app.block.set(parent);
        }
        else {
            this._doArrow(e, event, instance);
        }
    },
    handleTab: function(e, key, event) {
        var instance = this.app.block.get();

        // multiple
        if (this.app.blocks.is()) {
            e.preventDefault();
            return;
        }

        // handle block tab
        if (instance.handleTab && instance.handleTab(e, key, event)) {
            return;
        }

        // tab as spaces
        if (this.opts.tab.spaces && instance.isEditable()) {
            e.preventDefault();
            var num = this.opts.tab.spaces;
            var node = document.createTextNode(Array(num + 1).join('\u00a0'));
            this.app.insertion.insertNode(node, 'end');
            return;
        }
        // like variable
        else if (instance.isInlineBlock()) {
            e.preventDefault();
            var $block = instance.getBlock();
            var parent = instance.getParent();
            this.app.caret.set($block, 'after');
            this.app.block.set(parent);
        }
        else {
            e.preventDefault();
            var next = instance.getNext();
            if (next) {
                this.app.block.set(next, 'start');
            }
        }
    },
    handleShiftSpace: function(e, key, event) {
        var instance = this.app.block.get();

        // multiple
        if (this.app.blocks.is()) return;

        // instance
        var $block = instance.getBlock();

        // editable
        if (instance.isEditable()) {
            // selected all
            if (instance.isAllSelected()) {
                instance.setEmpty();
                return;
            }
            else {
                if (instance.getType() !== 'code') {
                    e.preventDefault();
                    this.app.insertion.insertHtml('&nbsp;', 'end');
                }
            }
        }
        // like variable
        else if (instance.isInlineBlock()) {
            e.preventDefault();
            var parent = instance.getParent();
            this.app.caret.set($block, 'after');

            instance.remove(true);
            this.app.block.set(parent);
            this.app.insertion.insertHtml('&nbsp;', 'end');
        }
        // emptiable
        else if (instance.isEmptiable() && instance.isEmpty()) {
            e.preventDefault();

            $block.removeClass(this.prefix + '-empty-layer');
            $block.html('');

            instance.insertEmpty({ position: 'append', caret: 'start' });
        }
    },
    handleSpace: function(e, key, event) {
        var instance = this.app.block.get();

        // multiple
        if (this.app.blocks.is()) {
            e.preventDefault();
            var last = this.app.blocks.getLastSelected();
            last.insertEmpty({ position: 'after', caret: 'start' });
            this.app.blocks.removeSelected(false);
            return;
        }

        // instance
        var $block = instance.getBlock();
        var type = instance.getType();

        // handle block space
        if (instance.handleSpace && instance.handleSpace(e, key, event)) {
            return;
        }

        // do nothing
        if (type === 'row') {
            e.preventDefault();
            return;
        }
        // editable
        else if (instance.isEditable() && instance.isAllSelected()) {
            instance.setEmpty();
            return;
        }
        // like variable
        else if (instance.isInlineBlock()) {
            e.preventDefault();

            var parent = instance.getParent();
            this.app.caret.set($block, 'after');

            instance.remove(true);
            this.app.block.set(parent);
            this.app.insertion.insertHtml('&nbsp;', 'end');
        }
        // emptiable
        else if (instance.isEmptiable() && instance.isEmpty()) {
            e.preventDefault();

            $block.removeClass(this.prefix + '-empty-layer');
            $block.html('');

            instance.insertEmpty({ position: 'append', caret: 'start' });
        }
        // non editable
        else if (!instance.isEditable()) {
            e.preventDefault();
            instance.insertEmpty({ position: 'after', caret: 'start' });
            instance.remove(true);
            this.app.control.updatePosition();
        }
    },
    handleShiftEnter: function(e, key, event) {
        var instance = this.app.block.get();
        var type = instance.getType();
        var $block = instance.getBlock();

        if (this.app.blocks.is() || type === 'row') {
            e.preventDefault();
        }
        // like variable
        else if (instance.isInlineBlock()) {
            e.preventDefault();

            var parent = instance.getParent();
            this.app.caret.set($block, 'after');

            instance.remove(true);
            this.app.block.set(parent);
            this.app.insertion.insertBreakline();
        }
        // editable
        else if (instance.isEditable()) {
            e.preventDefault();
            this.app.insertion.insertBreakline();
        }
        // non editable
        else {
            e.preventDefault();
            var position = 'after';
            if (instance.isEmptiable() && instance.isEmpty()) {
                position = 'append';

                $block.removeClass(this.prefix + '-empty-layer');
                $block.html('');
            }

            instance.insertEmpty({ position: position, caret: 'start' });
        }

    },
    handleEnter: function(e, key, event) {
        var instance = this.app.block.get();

        // blocks
        if (this.app.blocks.is()) {
            e.preventDefault();
            var last = this.app.blocks.getLastSelected();
            last.insertEmpty({ position: 'after', caret: 'start' });
            return;
        }

        // instance
        var $block = instance.getBlock();

        // editable
        if (instance.isEditable()) {
            // all block selected
            if (instance.isAllSelected()) {
                e.preventDefault();
                instance.setEmpty();
                return;
            }
            // partial selected
            else if (!this.app.selection.isCollapsed()) {
                e.preventDefault();
                if (instance.getType() === 'code') {
                    this.app.insertion.insertNewline();
                }
                else {
                    this.app.insertion.insertBreakline();
                }
                return;
            }
        }

        // like variable
        if (instance.isInlineBlock()) {
            e.preventDefault();

            var parent = instance.getParent();
            this.app.caret.set($block, 'after');

            instance.remove(true);
            this.app.block.set(parent);
        }
        // emptiable
        else if (instance.isEmptiable() && instance.isEmpty()) {
            e.preventDefault();

            $block.removeClass(this.prefix + '-empty-layer');
            $block.html('');

            instance.insertEmpty({ position: 'append', caret: 'start' });
        }
        // non editable
        else if (!instance.isEditable()) {
            e.preventDefault();
            instance.insertEmpty({ position: 'after', caret: 'start' });
        }

        // handle block enter
        if (instance.handleEnter) {
            instance.handleEnter(e, key, event);
        }

        // ui
        this.app.control.updatePosition();
    },
    handleTextareaTab: function(e) {
        if (e.keyCode !== 9) return true;

        e.preventDefault();

        var el = e.target;
        var val = el.value;
        var start = el.selectionStart;

        el.value = val.substring(0, start) + "    " + val.substring(el.selectionEnd);
        el.selectionStart = el.selectionEnd = start + 4;
    },

    // private
    _isNextBlock: function(event, node) {
        return (event.is('right') && this.app.caret.is(node, 'end') && this.app.element.getType(node.nextSibling));
    },
    _isPrevBlock: function(event, node) {
       return (event.is('left') && this.app.caret.is(node, 'start') && this.app.element.getType(node.previousSibling));
    },
    _isSiblingInlineBlock: function(e, node) {
        var $el = this.dom(node);
        var instance = $el.dataget('instance');
        if (instance && instance.isInlineBlock()) {
            e.preventDefault();
            this.app.block.set(instance);
            return true;
        }
    },
    _isInvisibleChar: function(direction) {
        var sel = this.app.selection.get();
        var text = this.app.selection.getText(direction);
        return (sel.current && sel.current.nodeType === 3 && this.app.utils.searchInvisibleChars(text) === 0);
    },
    _catchInlineBlock: function(e, event, node) {
        if (event.is('left') && node.nodeType === 3) {
            var str = node.textContent;
            var isChar = (this.app.utils.searchInvisibleChars(str) !== -1);
            if (isChar) {
                var charnode = node;
                if (this._isSiblingInlineBlock(e, node.previousSibling)) {
                    charnode.parentNode.removeChild(charnode);
                    return true;
                }
            }
        }

        if (this._isPrevBlock(event, node)) {
            if (this._isSiblingInlineBlock(e, node.previousSibling)) return true;
        }
        else if (this._isNextBlock(event, node)) {
            if (this._isSiblingInlineBlock(e, node.nextSibling)) return true;
        }
    },
    _trimInvisibleChar: function(e, pointer, remove) {
        var direction = (pointer === 'left') ? 'before' : 'after';
        var sel = this.app.selection.get();
        var isChar = this._isInvisibleChar(direction);
        var el;
        if (isChar && pointer === 'left') {
            el = sel.current;
            var data = this.app.offset.get();
            this.dom(el).replaceWith(el.textContent.replace(/\uFEFF/g, ''));
            this.app.offset.set(false, { start: data.start - 1, end: data.end - 1 });
        }
        else if (isChar && remove && sel.current && sel.current.nextSibling) {
            el = sel.current.nextSibling;
            this.dom(el).replaceWith(el.textContent.replace(/\uFEFF/g, ''));
        }
        else if (isChar && pointer === 'right') {
            e.preventDefault();
            el = sel.current;
            var data = this.app.offset.get();
            this.app.offset.set(false, { start: data.start + 1, end: data.end + 1 });
            return true;
        }
    },
    _doSelectAll: function(e, event) {
        var instance = this.app.block.get();

        // if select all & action key - make empty
        if (this._isAllSelected(event)) {
            this._setEditorEmpty(e, event);
            return true;
        }

        // select all
        if (event.is('select')) {
            e.preventDefault();

            if (!this.app.blocks.is() && instance) {
                if (instance.isAllSelected() || instance.isEmpty()) {
                    this.app.editor.selectAll();
                }
                else {
                    instance.setSelectAll();
                }
            }
            else {
                this.app.editor.selectAll();
            }

            return true;
        }
    },
    _doArrow: function(e, event, instance) {
        var target, caret;
        var type = instance.getType();
        var types = ['code', 'line', 'image', 'embed', 'layer', 'grid'];

        if (event.is('up-left') && instance.isCaretStart()) {
            caret = 'end';
            target = instance.getPrev();

            // insert before
            if (!target && types.indexOf(type) !== -1) {
                this.app.insertion.insertEmptyBlock({ position: 'before', caret: 'start' });
                return;
            }
        }
        else if (event.is('down-right') && instance.isCaretEnd()) {
            caret = 'start';
            target = instance.getNext();

            // insert after
            if (!target && types.indexOf(type) !== -1) {
                this.app.insertion.insertEmptyBlock({ position: 'after', caret: 'start' });
                return;
            }
        }

        // set next or prev
        if (target) {
            e.preventDefault();
            this.app.block.set(target, caret);
        }
    },
    _isAllSelected: function(event) {
        return (this.app.editor.isAllSelected() && event.is(['enter', 'delete', 'backspace', 'alpha', 'space']));
    },
    _setEditorEmpty: function(e, event) {
        if (!event.is(['alpha', 'space'])) e.preventDefault();
        this.app.editor.setEmpty();
    }
});
ArticleEditor.add('module', 'toolbar', {
    init: function() {
        this.eventname = this.prefix + '-toolbar';
        this.activeClass = 'active';
        this.toggledClass = 'toggled';
        this.disableClass = 'disable';
        this.customButtons = {};
        this.aTags = {};
        this.aTypes = {};
    },
    start: function() {
        if (this.opts.toolbar) {
            this.sticky = this.opts.toolbar;
        }
        else if (this.opts.path && this.opts.path.sticky) {
            this.sticky = this.opts.path;
        }

        if (this._isToolbar()) {
            this.$container = this.app.container.get('toolbar');
            this._build();
        }

        this._buildSticky();
    },
    load: function() {
        this._buildActiveButtons();

        if (this._isToolbar()) {
            this.$toolbar.html('');
            this._buildButtons();
        }

    },
    stop: function() {
        if (!this._isToolbar()) return;
        this.$toolbar.remove();
        this.customButtons = {};
        this.editorButtons = {};
    },
    build: function() {
        if (!this._isToolbar()) return;

        this.$toolbar.html('');
        this._buildButtons();
    },
    observe: function() {
        if (!this._isToolbar()) return;

        this.unsetActive();

        if (this.app.blocks.is() || this.app.editor.isAllSelected()) return;
        if (!this._isObserveButtons()) return;

        var instance = this.app.block.get();
        var type = (instance) ? instance.getType() : false;
        var tag = (instance) ? instance.getTag() : false;
        var inlines = this.app.selection.getNodes({ type: 'inline', selected: 'inside', links: true });
        var tags = this._getObservedTags(tag, inlines);
        var buttons = [];
        var keys;

        // tags
        for (var i = 0; i < tags.length; i++) {
            keys = this.aTags[tags[i]];
            if (keys) {
                buttons = buttons.concat(keys);
            }
        }

        // types
        if (type) {
            keys = this.aTypes[type];
            if (keys) {
                buttons = buttons.concat(keys);
            }
        }

        // set active
        this._setActiveKeys(buttons);
    },

    // public
    getElement: function() {
        return this.$toolbar;
    },
    get: function(name) {
        return this._findButton(name);
    },
    add: function(name, obj) {
        this.customButtons[name] = obj;
    },
    setActive: function(name) {
        if (!this._isToolbar()) return;
        this._findButtons().removeClass(this.activeClass);
        this._findButton(name).removeClass(this.disableClass).addClass(this.activeClass);

    },
    setToggled: function(name) {
        if (!this._isToolbar()) return;
        this._findButtons().removeClass(this.toggledClass);
        this._findButton(name).removeClass(this.disableClass).addClass(this.toggledClass);
    },
    unsetActive: function(name) {
        if (!this._isToolbar()) return;

        var $elms = (name) ? this._findButton(name) : this._findButtons();
        $elms.removeClass(this.activeClass);

    },
    unsetToggled: function(name) {
        if (!this._isToolbar()) return;

        var $elms = (name) ? this._findButton(name) : this._findButtons();
        $elms.removeClass(this.toggledClass);
    },
    enable: function() {
        if (!this._isToolbar()) return;
        this._findButtons().removeClass(this.disableClass);
    },
    disable: function(except) {
        if (!this._isToolbar()) return;
        this._findButtons().removeClass(this.toggledClass).removeClass(this.activeClass).addClass(this.disableClass);
    },
    disableSticky: function() {
        if (!this._isToolbar()) return;

        var $container = this.app.container.get('bars');
        $container.removeClass(this.prefix + '-bars-sticky');
        $container.css('top', '');
    },
    enableSticky: function() {
        if (!this._isToolbar()) return;
        if (this.opts.toolbar.sticky) {
            var $container = this.app.container.get('bars');
            $container.addClass(this.prefix + '-bars-sticky');
            $container.css('top', this.opts.toolbar.stickyTopOffset + 'px');
        }
    },
    isSticky: function() {
        var $container = this.app.container.get('bars');
        var $main = this.app.container.get('main');
        var mainTop = $main.offset().top + parseInt($main.css('border-top-width'));
        var containerTop = $container.offset().top;

        return (containerTop > mainTop || containerTop < mainTop);
    },

    // private
    _build: function() {
        this.$toolbar = this.dom('<div>').addClass(this.prefix + '-toolbar');

        this.$container.append(this.$toolbar);
        this.app.container.get('bars').addClass('has-toolbar');
    },
    _buildSticky: function() {
        if (this.sticky) {

            var $container = this.app.container.get('bars');
            $container.addClass(this.prefix + '-bars-sticky');
            $container.css('top', this.sticky.stickyTopOffset + 'px');

            var $scrollTarget = this.app.scroll.getTarget();
            $scrollTarget.on('scroll.' + this.prefix + '-toolbar', this._observeSticky.bind(this));
        }
    },
    _buildActiveButtons: function() {

        this.aTags = (this.opts.buttons.tags) ? this.opts.buttons.tags : {};
        this.aTypes = (this.opts.buttons.types) ? this.opts.buttons.types : {};

        var btns = this.customButtons;
        Object.keys(btns).forEach(function(key) {
            var active = btns[key].active;
            if (active) {
                this._buildActiveButton(key, active.tags, this.aTags);
                this._buildActiveButton(key, active.types, this.aTypes);
            }
        }.bind(this));
    },
    _buildActiveButton: function(key, arr, obj) {
        if (!arr) return;

        for (var i = 0; i < arr.length; i++) {
            var item = arr[i];

            if (obj[item]) {
                obj[item].push(key);
            }
            else {
                obj[item]= [key];
            }
        }
    },
    _buildButtons: function() {
        var instance = this._getCurrentInstance();
        var buttons = (instance) ? this.app.editor.getButtonsFromArr(instance.toolbar) : this.app.editor.getButtons();

        // create button
        this._createButtons(buttons, instance);

        // create custom (plugin)
        if (instance) {
            this._createButtons(this.customButtons, instance);
        }
    },
    _createButtons: function(buttons, instance) {
        for (var name in buttons) {
            if (buttons.hasOwnProperty(name)) {
                if (instance && !instance.isAllowedButton(name, buttons[name])) continue;
                if (this._isHidden(name)) continue;
                if (name === 'add' && this.opts.addbar === false) continue;
                if (name === 'format' && this.opts.format === false) continue;

                this.app.create('button', name, buttons[name], this.$toolbar, 'toolbar');
            }
        }
    },
    _observeSticky: function() {
        if (this.app.source.is()) {
            this.app.container.get('bars').css('top', 0);
            return;
        }

        var $scrollTarget = this.app.scroll.getTarget();
        var paddingTop = (this.app.scroll.isTarget()) ? parseInt($scrollTarget.css('padding-top')) : 0;

        var $container = this.app.container.get('bars');
        $container.css('top', (0 - paddingTop + this.sticky.stickyTopOffset) + 'px');

        if (this.isSticky()) {
            this.app.broadcast('toolbar.sticky');
        }
        else {
            this.app.broadcast('toolbar.static');
        }
    },
    _findButtons: function() {
        return this.$toolbar.find('.' + this.prefix + '-button-toolbar');
    },
    _findButton: function(name) {
        return this.$toolbar.find('[data-name=' + name + ']');
    },
    _isHidden: function(name) {
        return (this.opts.toolbar.hide.indexOf(name) !== -1);
    },
    _isToolbar: function() {
        return this.opts.toolbar;
    },
    _isObserveButtons: function() {
        if (!this.opts.buttons.tags && !this.opts.buttons.types) return false;

        return true;
    },
    _setActiveKeys: function(keys) {
        for (var i = 0; i < keys.length; i++) {
            this._findButton(keys[i]).addClass(this.activeClass);
        }
    },
    _getCurrentInstance: function() {
        var instance = (this.app.block.is()) ? this.app.block.get() : false;
        return (this.app.blocks.is()) ? false : instance;
    },
    _getObservedTags: function(tag, inlines) {
        var tags = [];

        if (tag) {
            tags.push(tag);
        }

        if (inlines.length > 0) {
            for (var i = 0; i < inlines.length; i++) {
                tags.push(inlines[i].tagName.toLowerCase());
            }
        }

        return tags;
    }
});
ArticleEditor.add('module', 'path', {
    init: function() {
        this.activeClass = 'active';
        this.disableClass = 'disable';
        this.pathItemClass = this.prefix + '-path-item';
    },
    start: function() {
        if (!this.opts.path) return;

        this.$container = this.app.container.get('pathbar');
        this._build();
        this._buildRoot();
        this._buildActive();
    },
    build: function() {
        if (!this.opts.path) return;

        this._clear();
        this._buildRoot();

        if (this.app.blocks.is()) {
            this._buildMultipleItem();
        }
        else {
            this._buildItems();
            this._buildActive();
        }
    },
    disable: function() {
        if (!this.opts.path) return;

        this._getAll().addClass(this.disableClass);
    },
    enable: function() {
        if (!this.opts.path) return;

        this._getAll().removeClass(this.disableClass);
    },

    // private
    _clear: function() {
        this.$path.find('.' + this.pathItemClass).off('.' + this.prefix + '-path-' + this.uuid);
        this.$path.html('');
    },
    _getAll: function() {
        return this.$path.find('.' + this.pathItemClass);
    },
    _selectItem: function(e) {
        e.stopPropagation();
        e.preventDefault();

        var $item = this.dom(e.target).closest('.' + this.pathItemClass);
        if ($item.hasClass(this.disableClass)) return;

        var instance = $item.dataget('instance');
        if (instance) {
            this.app.popup.close();
            this.app.block.set(instance, 'start');
        }
        else {
            this._clear();
            this._buildRoot();
            this._buildActive();
            this.app.block.unset();
        }
    },
    _createItem: function() {
        return this.dom('<a href="#"></a>').attr('tabindex', '-1').addClass(this.pathItemClass);
    },
    _build: function() {
        this.$path = this.dom('<div>').addClass(this.prefix + '-path');

        this.$container.append(this.$path);
    },
    _buildRoot: function() {
        this._buildItem(false, this.lang.parse(this.opts.path.title));
    },
    _buildActive: function() {
        this.$path.find('a').removeClass(this.activeClass).last().addClass(this.activeClass);
    },
    _buildItems: function() {
        var current = this.app.block.get();
        if (!current) return;

        // parents
        var $parents = current.getBlock().parents('[data-' + this.prefix + '-type]');
        $parents.nodes.reverse();
        $parents.each(this._buildParentItem.bind(this));

        // current
        this._buildItem(current);
    },
    _buildParentItem: function($el) {
        var instance = $el.dataget('instance');

        this._buildItem(instance);
    },
    _buildMultipleItem: function() {
        var $item = this._createItem();
        $item.addClass(this.activeClass);

        this._buildTitle($item, this.lang.get('editor.multiple'));
        this.$path.append($item);
    },
    _buildItem: function(instance, root) {
        var $item = this._createItem();
        $item.dataset('instance', instance);
        $item.on('click.' + this.prefix + '-path-' + this.uuid, this._selectItem.bind(this));

        this._buildTitle($item, root || instance.getTitle());
        this.$path.append($item);
    },
    _buildTitle: function($item, title) {
        var $title = this.dom('<span>').html(title);
        $item.append($title);
    }
});
ArticleEditor.add('module', 'topbar', {
    init: function() {
        this.activeClass = 'active';
        this.toggledClass = 'disable';
        this.disableClass = 'disable';
        this.customButtons = {};
    },
    start: function() {
        if (!this._isTopbar()) return;

        this._build();
    },
    load: function() {
        this._buildButtons();
    },
    get: function(name) {
        return this._findButton(name);
    },
    add: function(name, obj) {
        this.customButtons[name] = obj;
    },
    setToggled: function(name) {
        if (!this._isTopbar()) return;
        this._findButtons().removeClass(this.toggledClass);
        this._findButton(name).addClass(this.toggledClass);
    },
    unsetToggled: function(name) {
        if (!this._isTopbar()) return;
        var $elms = (name)? this._findButton(name) : this._findButtons();
        $elms.removeClass(this.toggledClass);
    },
    enable: function() {
        if (!this._isTopbar()) return;
        this._findButtons().removeClass(this.disableClass);
    },
    disable: function() {
        if (!this._isTopbar()) return;
        var $btns = this._findButtons();
        $btns.removeClass(this.toggledClass).removeClass(this.activeClass).addClass(this.disableClass);
    },

    // private
    _isTopbar: function() {
        return this.opts.path;
    },
    _build: function() {
        this.$topbar = this.dom('<div>').addClass(this.prefix + '-topbar');
        this.app.container.get('pathbar').append(this.$topbar);
    },
    _buildButtons: function() {
        var buttons = this.app.editor.getButtonsFromArr(this.opts.buttons.topbar);
        for (var name in buttons) {
            if (buttons.hasOwnProperty(name)) {
                if (name === 'undo' && !this.opts.topbar.undoredo) continue;
                if (name === 'redo' && !this.opts.topbar.undoredo) continue;
                if (name === 'shortcut' && !this.opts.topbar.shortcuts) continue;

                this.app.create('button', name, buttons[name], this.$topbar, 'topbar');
            }
        }
    },
    _findButtons: function() {
        return this.$topbar.find('.' + this.prefix + '-button-topbar');
    },
    _findButton: function(name) {
        return this.$topbar.find('[data-name=' + name + ']');
    }
});
ArticleEditor.add('module', 'control', {
    init: function() {
        this.instance = false;
        this.customButtons = {};
        this.eventName = this.prefix + '-control';
    },
    start: function() {
        if (!this.opts.control) return;
        this._build();
    },
    stop: function() {
        if (this.opts.control) {
            this.$control.remove();
        }
        this.instance = false;
        this.customButtons = {};
    },
    isOpen: function() {
        return (this.$control.css('display') !== 'none');
    },
    getElement: function() {
        return this.$control;
    },
    get: function(name) {
        return this._findButton(name);
    },
    add: function(name, obj) {
        this.customButtons[name] = obj;
    },
    remove: function(name) {
        this._findButton(name).remove();
    },
    build: function() {
        if (!this.opts.control) return;
        var instance = this.app.block.get();
        if (!instance) {
            this.close();
        }
        else {
            this.open(instance);
        }
    },
    open: function(instance) {
        if (!this.opts.control) return;
        this.$control.html('');

        this.instance = instance;
        var len = this._buildButtons();

        if (len > 0) {
            var $scrollTarget = this.app.scroll.getTarget();

            this.updatePosition();
            $scrollTarget.on('resize.' + this.eventName, this.updatePosition.bind(this));
            $scrollTarget.on('scroll.' + this.eventName, this.updatePosition.bind(this));
            this.app.editor.getWin().on('scroll.' + this.eventName, this.updatePosition.bind(this));
            this.instance.getBlock().on('keyup.' + this.eventName, this.updatePosition.bind(this));
        }
        else {
            this.close();
        }
    },
    close: function() {
        if (!this.opts.control) return;
        this.$control.hide();

        if (this.instance) {
            var $block = this.instance.getBlock();
            this.app.content.unfixListMargin($block);
            $block.off('.' + this.eventName);
        }

        this.app.scroll.getTarget().off('.' + this.eventName);
        this.app.editor.getDoc().off('.' + this.eventName);
        this.instance = false;
    },
    updatePosition: function() {
        if (!this.opts.control) return;
        if (!this.instance) {
            this.close();
            return;
        }

        if (this.instance.getType() === 'list') {
            var $block = this.instance.getBlock();
            this.app.content.fixListMargin($block);
        }

        var isEditable = this.instance.isEditable();
        var offset = this.instance.getOffset();
        var width = this.$control.width();
        var scrollTop = this.app.editor.getWin().scrollTop();
        var topOutlineFix = (isEditable) ? 4 : 2;
        var leftOutlineFix = (isEditable) ? 6 : 4;
        var top = (offset.top - topOutlineFix - scrollTop);
        var left = (offset.left - width - leftOutlineFix);
        var $container = this.app.container.get('toolbar');
        var toolbarBottom = ($container.offset().top + $container.height()) - topOutlineFix;
        var frameRect = this.app.editor.getFrameRect();


        if (top < toolbarBottom || frameRect.bottom < top) {
            this.$control.hide();
        }
        else {
            this.$control.show();
        }


        // scroll target bottom hide
        if (this.app.scroll.isTarget()) {
            var $target = this.app.scroll.getTarget();
            var targetBottom = $target.offset().top + $target.height();
            var bottom = top + this.$control.height();
            if (bottom > targetBottom) {
                this.$control.hide();
            }
        }

        // left out of edge
        if (!isEditable && (left + width/2) < frameRect.left) {
            left = frameRect.left + 3;
            top = top + 6;
        }

        // position
        this.$control.css({
            top: top + 'px',
            left: left + 'px'
        });
    },

    // private
    _buildButtons: function() {
        var buttons = this.app.editor.getButtonsFromArr(this.instance.control);
        var count = 0;
        if (buttons !== false) {
            count = this._createButtons(buttons, count);
            count = this._createButtons(this.customButtons, count);
        }

        return count;
    },
    _build: function() {
        this.$control = this.dom('<div>').addClass(this.prefix + '-control ' + this.prefix + '-control-' + this.uuid).hide();

        // bs modal
        if (this.opts.bsmodal) {
            this.$control.css('z-index', 1060);
        }

        this.app.$body.append(this.$control);
    },
    _createButtons: function(buttons, count) {
        for (var name in buttons) {
            if (!this.instance.isAllowedButton(name, buttons[name])) continue;
            this.app.create('button', name, buttons[name], this.$control, 'control');
            count++;
        }

        return count;
    },
    _findButton: function(name) {
        return this.$control.find('[data-name=' + name + ']');
    }
});
ArticleEditor.add('module', 'insertion', {
    init: function() {
        this._clear();
    },
    start: function() {
        this.win = this.app.editor.getWinNode();
        this.doc = this.app.editor.getDocNode();
    },

    // get
    getFirstInserted: function() {
        return this.inserted.instances[0];
    },
    getLastInserted: function() {
        var len = this.inserted.instances.length;
        var last = this.inserted.instances[len-1];
        if (last && last.isInlineBlock()) {
            last = last.getParent();
        }

        return last;
    },
    getInserted: function() {
        return this.inserted;
    },

    // set
    setContent: function(params) {
        this._insert(params, 'set');

        var inserted = this.getInserted();
        this.inserted = false;

        return inserted;
    },

    // insert
    insertContent: function(params) {
        this._insert(params, 'insert');

        var inserted = this.getInserted();
        this.inserted = false;

        return inserted;
    },
    insertEmptyBlock: function(params) {
        if (!params) {
            params = {};
        }

        params.html = this.app.block.createHtml();
        this._insert(params, 'insert');

        var inserted = this.getInserted();
        this.inserted = false;

        // broadcast
        this.app.broadcast('block.add', { instance: inserted.instances[0], type: 'input' });

        return inserted;
    },
    insertNewline: function(caret, doublenode) {
        var str = (doublenode) ? '\n\n' : '\n';

        return this._insertFragment({ node: document.createTextNode(str) }, (caret) ? caret : 'after');
    },
    insertPoint: function(e) {
        var range;
        var marker = this.app.utils.createInvisibleChar();
        var doc = this.app.editor.getDocNode();
        var x = e.clientX, y = e.clientY;

        if (doc.caretPositionFromPoint) {
            var pos = doc.caretPositionFromPoint(x, y);
            var sel = doc.getSelection();
            range = sel.getRangeAt(0);
            range.setStart(pos.offsetNode, pos.offset);
            range.collapse(true);
            range.insertNode(marker);
        }
        else if (doc.caretRangeFromPoint) {
            range = doc.caretRangeFromPoint(x, y);
            range.insertNode(marker);
        }

        this.app.caret.set(marker, 'after');
    },
    insertBreakline: function(caret) {
        // split inline
        var inlines = this.app.selection.getNodes({ type: 'inline' });
        if (this.app.selection.isCollapsed() && inlines.length !== 0) {
            return this._splitInline(inlines, document.createElement('br'));
        }

        return this._insertFragment({ node: document.createElement('br') }, (caret) ? caret : 'after');
    },
    insertNode: function(node, caret, splitinline) {
        if (splitinline) {
            var inlines = this.app.selection.getNodes({ type: 'inline' });
            if (inlines.length !== 0) {
                return this._splitInline(inlines, node);
            }
        }

        return this._insertFragment({ node: this.dom(node).get() }, caret);
    },
    insertHtml: function(html, caret) {
        return this._insertFragment({ html: html }, caret);
    },
    insertText: function(text, caret) {
        var instance = this.app.block.get();
        if ((instance && !instance.isEditable()) || this.app.blocks.is()) {
            this.insertContent({ html: text, caret: caret });
            return;
        }

        var sel = this.win.getSelection();
        var node;
        if (sel.getRangeAt && sel.rangeCount) {
            text = this.app.content.getTextFromHtml(text, { nl: true });
            node = document.createTextNode(text);
            var range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(node);

            caret = caret || 'end';
            this.app.caret.set(node, caret);
        }

        return node;
    },
    insertListToList: function($list, $target, caret) {
        // add paste marker
        var $items = $list.find('li');
        var $last = $items.last();
        $items.addClass(this.prefix + '-pasteitems');
        $last.addClass(this.prefix + '-pastemarker');

        // build nodes
        var $nodes = $list.children();

        // current li item
        var $item = this.dom(this.app.selection.getBlock());

        // caret position
        var isStart = this.app.caret.is($target, 'start');
        var isEnd = this.app.caret.is($target, 'end');
        var isStartItem = this.app.caret.is($item, 'start');
        var isEndItem = this.app.caret.is($item, 'end', ['ul', 'ol']);
        var isEmptyItem = this.app.content.isEmptyHtml($item.html());

        // start
        if (isStart) {
            if (isEmptyItem) {
                $item.remove();
            }
            $target.prepend($nodes);
        }
        // end
        else if (isEnd) {
            if (isEmptyItem) {
                $item.remove();
            }
            $target.append($nodes);
        }
        // middle
        else {
            // item empty
            if (isEmptyItem) {
                $item.after($nodes);
                $item.remove();
            }
            // item before
            else if (isStartItem) {
                $item.before($nodes);
            }
            // item after
            else if (isEndItem) {
                var $childList = $item.find('ul, ol');
                if ($childList.length !== 0) {
                    $childList.prepend($nodes);
                }
                else {
                    $item.after($nodes);
                }
            }
            // item middle
            else {
                this.app.element.split($item).before($nodes);
            }
        }

        // set caret
        var pastemarker = this.prefix + '-pastemarker';
        var pasteitems = this.prefix + '-pasteitems';
        if (caret) {
            $last = this.app.editor.getLayout().find('.' + pastemarker).removeClass(pastemarker);
            this.app.caret.set($last, 'end');
        }

        return this.app.editor.getLayout().find('.' + pasteitems).removeClass(pasteitems);

    },

    // detect
    detectPosition: function($target, position) {
        if (position) return position;

        // caret position
        var isStart = this.app.caret.is($target, 'start');
        var isEnd = this.app.caret.is($target, 'end');

        // end
        if (isEnd) {
            position = 'after';
        }
        // start
        else if (isStart) {
            position = 'before';
        }
        // middle
        else {
            position = 'split';
        }

        return position;
    },

    // private

    // insert
    _insert: function(params, type) {

        this.html = params.html;

        // broadcast before
        this.html = this.app.broadcastHtml('editor.before.insert', this.html);

        // params
        this.isParse = (typeof params.parse === 'undefined') ? true : params.parse;
        this.isClean = (typeof params.clean === 'undefined') ? false : params.clean;
        this.isCaret = (typeof params.caret === 'undefined') ? true : params.caret;
        this.isPosition = (typeof params.position === 'undefined') ? false : params.position;

        // type
        if (type === 'set' || this.app.editor.isAllSelected()) {
            // set
            this._setContent();
        }
        else {
            // insert
            this._insertContent();
        }

        // broadcast
        this.app.broadcast('editor.insert', this.inserted);
    },
    _insertContent: function() {

        var current = this.app.block.get();
        var position = false;
        var remove = false;
        var nodes, $block;

        // check
        this._checkEmpty();
        this._checkLine();

        // blocks
        if (this.app.blocks.is()) {
            // insert to blocks
            if (this.isEmpty) {
                return;
            }
            else if (this.isLine) {
                this.html = this.app.block.createHtml(this.html);
            }

            // parse & clean
            this._clean();
            this._parse();
            this._parseBuild();

            // nodes
            nodes = this._buildParsedNodes();

            // insert
            var last = this.app.blocks.getLastSelected();
            var $last = last.getBlock();
            $last.after(nodes);

            // remove
            this.app.blocks.removeSelected(false);
        }
        // not selected
        else if (!current || this.isPosition) {
            // insert to blocks
            if (this.isEmpty) {
                return;
            }
            else if (this.isLine) {
                this.html = this.app.block.createHtml(this.html);
            }

            // parse & clean
            this._clean();
            this._parse();
            this._parseBuild();

            // nodes
            nodes = this._buildParsedNodes();
            var positions = ['after', 'before', 'append'];
            var emptyLayer = false;

            if (this.isPosition === 'top' || (!this.isPosition && this.opts.editor.add === 'top')) {
                current = this.app.blocks.getFirst();
                position = 'before';
            }
            else if (current && positions.indexOf(this.isPosition) !== -1) {
                position = this.isPosition;
                emptyLayer = (current.getType('layer') && current.isEmpty());
            }
            else {
                current = this.app.blocks.getLast();
                position = 'after';
            }

            $block = current.getBlock();
            if (emptyLayer) {
                $block.removeClass(this.prefix + '-empty-layer');
                $block.html('');
            }

            $block[position](nodes);
        }
        // list to list
        else if (this._isListToList(current)) {
            // delete selection
            this.app.selection.deleteContents();

            // parse & clean
            this._clean();
            this._parse();
            this._parseBuild();

            // insert
            $block = current.getBlock();
            var $list = this.$parsed.children().first();
            this.$nodes = this.insertListToList($list, $block, 'end');
            this.isCaret = false;
        }
        else if (current) {

            // like variable
            if (current.isInlineBlock()) {
                var parent = current.getParent();
                this.app.caret.set(current.getBlock(), 'after');
                current.remove();

                this.app.block.set(parent);
                current = parent;
            }

            // editable
            if (current.isEditable()) {

                if (this.isEmpty) {
                    return;
                }

                // parse & clean
                this._clean();
                this._cleanSpecial();

                if (this.isLine) this._parseLine();
                else this._parse();

                this._parseBuild();

                if (current.isEmpty()) {
                    remove = true;
                    position = 'after';
                }
                else {
                    // delete selection
                    this.app.selection.deleteContents();
                }

                // nodes
                nodes = this._buildParsedNodes();
                $block = current.getBlock();

                // insert
                this._insertToEditable(current, $block, nodes, position, remove);
            }
            // non editable
            else {

                // set position
                position = 'after';

                // check
                if (this.isEmpty) {
                    return;
                }
                else if (this.isLine) {
                    this.html = this.app.block.createHtml(this.html);
                }

                // parse & clean
                this._clean();

                if (this.isLine) this._parseLine();
                else this._parse();

                this._parseBuild();

                // nodes
                nodes = this._buildParsedNodes();
                $block = current.getBlock();

                // emptiable empty
                if (current.isEmptiable() && current.isEmpty()) {
                    $block.removeClass(this.prefix + '-empty-layer');
                    $block.html('');
                    position = 'append';
                }

                // insert
                $block[position](nodes);
            }
        }
        else {
            return;
        }

        // inserted
        this._buildInserted();
        this._buildEditor();
        this._buildCaret();
    },
    _insertToEditable: function(current, $block, nodes, position, remove) {
        if (this.isLine) {
            this.$nodes = this._insertFragment({ fragment: this.$parsed.get() }, 'end');
            this.isCaret = false;
        }
        else {
            // detect position
            if (this.app.content.isEmptyHtml($block.html())) {
                position = 'after';
                remove = true;
            }
            else {
                position = this.detectPosition($block, position);
            }

            // insert
            if (position === 'split') {
                this.app.element.split($block).before(nodes);
            }
            else {
                $block[position](nodes);
            }

            // remove
            if (remove) current.remove();
        }
    },
    _insertFragment: function(obj, caret) {
        var fragment;
        if (obj.html || obj.fragment) {
            fragment = this.app.fragment.build(obj.html || obj.fragment);
            this.app.fragment.insert(fragment);
        }
        else {
            this.app.fragment.insert(obj.node);
        }

        if (caret) {
            var target = (obj.node) ? obj.node : ((caret === 'start') ? fragment.first : fragment.last);
            this.app.caret.set(target, caret);
        }

        if (obj.node) {
            return this.dom(obj.node);
        }
        else {
            return this.dom(fragment.nodes);
        }
    },

    // set
    _setContent: function() {

        // check
        this._checkEmpty();
        this._checkLine();

        // set to editor
        if (this.isEmpty) {
            this.html = this.app.block.createHtml();
        }
        else if (this.isLine) {
            this.html = this.app.block.createHtml(this.html);
        }

        // parse & clean
        this._clean();
        this._parse();
        this._parseBuild();

        // nodes
        var nodes = this._buildParsedNodes();

        // set
        this.app.editor.unsetSelectAllClass();
        this.app.editor.getLayout().html('').append(nodes);

        // broadcast empty
        if (this.isEmpty) {
            this.app.broadcast('editor.empty');
        }

        // inserted
        this._buildInserted();
        this._buildEditor();
        this._buildCaret();
    },

    // split
    _splitInline: function(inlines, node) {
        var $part = this.app.element.split(inlines[0]);
        $part.before(node);
        if ($part.html() === '') {
            $part.remove();
        }

        return this.dom(node);
    },

    // build
    _buildEditor: function() {
        this.app.placeholder.trigger();
        this.app.editor.build();
        this.app.editor.setFocus();
    },
    _buildCaret: function() {
        if (!this.isCaret) return;

        var instance, caret = 'end';
        if (this.isCaret === 'start') {
            instance = this.getFirstInserted();
            caret = 'start';
        }
        else {
            instance = this.getLastInserted();
        }

        // set
        setTimeout(function() {
            if (instance) {
                this.app.block.set(instance, caret);
            }
            // ui
            this.app.toolbar.observe();
        }.bind(this), 0);
    },
    _buildInserted: function() {

        this.inserted = {
            $nodes: this.$nodes,
            instances: []
        };

        this.inserted.$nodes.each(this._buildInstance.bind(this));
    },
    _buildInstance: function($node) {
        var instance = $node.dataget('instance');
        if (instance) {
            this.inserted.instances.push(instance);
        }

        var $nodes = $node.find('[data-' + this.prefix + '-type]');
        if ($nodes.length !== 0) {
            $nodes.each(this._buildInstance.bind(this));
        }
    },
    _buildParsedNodes: function() {
        return this.$parsed.get().childNodes;
    },

    // clear
    _clear: function() {
        this.html = false;
        this.isLine = false;
        this.isEmpty = false;
        this.isSplit = false;
        this.isClean = false;
        this.isParse = true;
        this.isCaret = true;
        this.isPosition = false;
    },

    // clean
    _clean: function() {
        if (this.isClean) {
            this.html = this.app.cleaner.cleanHtml(this.html);
        }
    },
    _cleanSpecial: function(type) {
        var clean, extend, except;
        if (['cell', 'address', 'figcaption', 'quoteitem'].indexOf(type) !== -1) {
            clean = true;
        }
        else if (type === 'dlist') {
            clean = true;
            except = ['dt', 'dd'];
        }
        else if (type === 'list') {
            clean = true;
            except = ['ul', 'ol', 'li'];
        }

        if (clean) {
            this.isLine = true;

            this.html = this.app.content.addBrToBlocks(this.html);
            this.html = this.app.content.removeBlockTags(this.html, extend, except);
            this.html = this.html.replace(/<br\s?\/?>\n?$/gi, '');
        }

    },

    // parse
    _parse: function() {
        if (this.isParse) {
            this.html = this.app.parser.parse(this.html, false);
        }
    },
    _parseLine: function() {
        if (this.isParse) {
            this.html = this.app.parser.parseLine(this.html, false);
        }
    },
    _parseBuild: function() {
        this.$parsed = this.app.parser.build(this.html);
        this.$nodes = this.$parsed.children();
    },

    // check
    _checkEmpty: function() {
        this.isEmpty = this.app.content.isEmptyHtml(this.html);
    },
    _checkLine: function() {
        this.isLine = this.app.content.isLine(this.html);
    },

    // is
    _isListToList: function(instance) {
        var $target = instance.getBlock();
        var type = $target.attr('data-' + this.prefix + '-type');
        var $list = this.dom('<div>').html(this.html);
        $list.find('meta').remove();
        // unwrap b fixes google docs
        $list.find('b').unwrap();
        $list = $list.children().first();

        return (type === 'list' && $list.length !== 0 && ['ul', 'ol'].indexOf($list.get().tagName.toLowerCase()) !== -1);
    }
});
ArticleEditor.add('module', 'addbar', {
    init: function() {
        this.customButtons = {};
    },
    popup: function(params, button) {

        // create
        this.app.popup.create('addbar', {
            width: '476px',
            items: this.buildItems()
        });

        // show the popup at the top always
        if (this.opts.editor.addbar === 'top') {
            button = false;
        }

        // open
        this.app.popup.open({ button: button });
    },
    buildItems: function() {
        var items = {};
        var obj = $ARX.extend(true, this.opts.buttonsObj);
        var arr = this.opts.addbar.concat(this.opts.addbarAdd);
        if (this.opts.addbarAdd.length !== 0 && this.opts.addbarAdd.indexOf('text') !== -1) {
            var tin = arr.indexOf('text');
            var pin = arr.indexOf('paragraph');
            var to = (pin !== -1) ? pin+1 : 0;

            // move text block button
            arr.splice(to, 0, arr.splice(tin, 1)[0]);
        }

        for (var i = 0; i < arr.length; i++) {
            var name = arr[i];
            if (this.opts.addbarHide.indexOf(name) !== -1) continue;

            items[name] = obj[name];
        }

        var customItems = $ARX.extend(true, this.customButtons);
        var instance = this.app.block.get();

        // build custom
        Object.keys(customItems).forEach(function(key) {
            items[key] = customItems[key];
        });

        // build all
        Object.keys(items).forEach(function(key) {
            this._buildItem(instance, items, items[key], key);
        }.bind(this));

        return items;
    },
    add: function(name, obj) {
        this.customButtons[name] = obj;
    },

    // private
    _buildItem: function(instance, items, item, key) {

        // allowed buttons
        if ((item.blocks && !instance) ||
            (instance && item.blocks && !instance.isAllowedButton(key, item))) {

            items[key] = false;
            return;
        }

        items[key] = {
            container: true,
            addbar: true,
            title: item.title,
            icon: item.icon || key,
            command: item.command,
            observer: item.observer || false,
            params: { name: key }
        };
    }
});
ArticleEditor.add('module', 'format', {
    popup: function(params, button) {
        var instance = this.app.block.get();
        var $block = (instance) ? instance.getBlock() : false;
        var tag = instance.getTag();
        var tags = this.opts.format;

        // build items
        var items = {};
        for (var i = 0; i < tags.length; i++) {
            var key = tags[i];
            items[key] = {
                title: this.opts.formatObj[key].title,
                params: { tag: key },
                command: 'block.format',
                shortcut: this.opts.formatObj[key].shortcut
            };
        }

        // build format add
        if (this.opts.formatAdd) {
            var obj = this.opts.formatAdd;
            Object.keys(obj).forEach(function(name) {
                items[name] = {
                    title: obj[name].title,
                    params: obj[name].params,
                    command: 'block.format'
                };
            });
        }

        // active item
        var active = this._isActiveFormat($block, tag, items);
        if (active) {
            items[active].active = true;
        }

        this.app.popup.create('format', {
            width: '300px',
            items: items
        });

        this.app.popup.open({ button: button });
    },
    set: function(params) {
        // popup
        if (this.app.popup.isOpen()) {
            this.app.popup.close();
        }

        // blocks
        if (this.app.blocks.is()) {
            return;
        }

        var $items, $block;
        var instance = this.app.block.get();
        var isEmpty = instance.isEmpty();
        var caret = (isEmpty) ? 'start' : false;
        var format = {
            type: this.opts.formatObj[params.tag].type,
            tag: params.tag,
            classname: params.classname || false
        };

        // current params
        this.tag = instance.getTag();
        this.type = instance.getType();
        this.$block = instance.getBlock();

        // selection
        if (!isEmpty) {
            this.app.selection.saveMarker();
        }

        // check same
        if (this._isSameTag(format)) {
            format = this._checkSameFormat(this.$block, format);
        }

        // format
        if (format) {
            if (this._isListToText(format, 'list')) {
                $block = this._formatListToText(format);
            }
            else if (this._isListToText(format, 'dlist')) {
                $items = this._formatListToText(format, true);
            }
            else if (this._isTextToList(format, 'list')) {
                this._formatTextToList(format, false, caret);
            }
            else if (this._isTextToList(format, 'dlist')) {
                this._formatTextToList(format, true, caret);
            }
            else {
                this._replaceTo(instance, format, caret);
            }
        }

        // restore
        if (!isEmpty) {
            this.app.selection.restoreMarker();
        }

        if ($items) {
            this.app.editor.build();
            this.app.block.set($items.last(), caret);
        }
        if ($block) {
            this.app.editor.build();
            this.app.block.set($block, caret);
        }

        // broadcast
        instance = this.app.block.get();
        this.app.broadcast('block.format', { instance: instance });
    },

    // private
    _isSameTag: function(format) {
        return (this.tag === format.tag && this.type === format.type);
    },
    _checkSameFormat: function($el, format) {
        var hasClass = this.app.element.hasClass($el, format.classname);

        return (!format.classname || hasClass) ? this._buildDefaultFormat() : format;
    },
    _buildDefaultFormat: function() {
        var type = this.opts.editor.markup;
        var tag = (type === 'paragraph') ? 'p' : 'div';

        return { type: type, tag: tag };
    },
    _formatListToText: function(format, dlist) {
        var $items = (dlist) ? this._getDlistItems() : this._getListItems();

        $items = this._createItems($items, format);
        this.$block.remove();

        return $items;
    },
    _formatTextToList: function(format, dlist, caret) {
        var newInstance = this.app.create('block.' + format.type, '<' + format.tag + '>');
        var $newBlock = newInstance.getBlock();

        if (dlist && this.type === 'list') {
            var z = 0;
            this._getListItems().each(function($node) {
                var tag = (z === 0) ? 'dt' : 'dd';
                var $item = this.dom('<' + tag + '>').html($node.html());
                z = (tag === 'dt') ? 1 : 0;

                $newBlock.append($item);
            }.bind(this));

        }
        else if (!dlist && this.type === 'dlist') {
            this._getDlistItems().each(function($node) {
                var $item = this.dom('<li>').html($node.html());
                $newBlock.append($item);
            }.bind(this));
        }
        else {
            var tag = (dlist) ? '<dt>' : '<li>';
            var $item = this.dom(tag).html(this.$block.html());
            $newBlock.append($item);
        }

        // parse instance
        this.app.create('block.' + format.type, $newBlock);

        this.$block.after($newBlock);
        this.$block.remove();

        // style & class
        this._setStyleAndClass($newBlock, format);

        // set
        this.app.editor.build();
        this.app.block.set($newBlock, caret);
    },
    _replaceTo: function(instance, format, caret) {
        var $block = instance.getBlock();
        var $newBlock = this._replaceToBlock($block, format);

        // set
        this.app.editor.build();
        this.app.block.set($newBlock, caret);
    },
    _replaceToBlock: function($block, format) {
        var $newBlock = this.app.element.replaceToTag($block, format.tag);

        // style & class
        this._setStyleAndClass($newBlock, format);

        // new instance
        return this.app.create('block.' + format.type, $newBlock);
    },
    _createItems: function($items, format) {
        var $block;
        $items.each(function($node) {
            var $item = this.dom('<' + format.tag + '>');
            $item.html($node.html());
            $node.remove();

            $block = this.app.create('block.' + format.type, $item);
            this.$block.before($item);

            // style & class
            this._setStyleAndClass($item, format);

        }.bind(this));

        return $block;
    },
    _isListToText: function(format, type) {
        return (this.type === type && ['heading', 'address', 'paragraph', 'text'].indexOf(format.type) !== -1);
    },
    _isTextToList: function(format, type) {
        var checkType = (type === 'list') ? 'dlist' : 'list';
        return (format.type === type && ['heading', 'address', 'paragraph', 'text', checkType].indexOf(this.type) !== -1);
    },
    _isActiveFormat: function($el, tag, items) {
        if (!$el) return;

        var name;
        for (var key in items) {
            if (items.hasOwnProperty(key)) {
                var classname = items[key].params.classname || false;
                var paramstag = items[key].params.tag;
                if (tag === paramstag) {
                    if (!classname) {
                        name = key;
                    }
                    else if (classname && this.app.element.hasClass($el, classname)) {
                        name = key;
                    }
                }
            }
        }

        return name;
    },
    _setStyleAndClass: function($el, format) {
        // add classname
        if (format.classname) {
            // clean classes & styles
            $el.removeAttr('style class data-' + this.prefix + '-style-cache');

            $el.addClass(format.classname);
        }
    },
    _getListItems: function() {
        var $items = this.$block.find('li');

        $items.find('ul, ol').each(function($node) { $node.parent().after($node); });
        $items.find('ul, ol').unwrap();

        return $items;
    },
    _getDlistItems: function() {
        return this.$block.find('dt, dd');
    }
});
ArticleEditor.add('module', 'link', {
    popups: {
        format: {
            items: {
                format: { title: '## link.link ##', command: 'link.format', shortcut: 'Ctrl+k' },
                unlink: { title: '## link.unlink ##', command: 'link.unlink' }
            }
        },
        change: {
            items: {
                edit: { title: '## link.edit-link ##', command: 'link.edit', shortcut: 'Ctrl+k' },
                unlink: { title: '## link.unlink ##', command: 'link.unlink' }
            }
        },
        create: {
            title: '## popup.link ##',
            width: '600px',
            form:  {
                text: { type: 'input', label: '## link.text ##' },
                url: { type: 'input', label: '## link.url ##' },
                target: { type: 'checkbox', text: '## link.link-in-new-tab ##' }
            },
            footer: {
                insert: { title: '## link.insert ##', command: 'link.insert', type: 'primary' },
                cancel: { title: '## link.cancel ##', command: 'popup.close' }
            }
        },
        edit: {
            title: '## popup.link ##',
            width: '600px',
            form: {
                text: { type: 'input', label: '## link.text ##' },
                url: { type: 'input', label: '## link.url ##' },
                target: { type: 'checkbox', text: '## link.link-in-new-tab ##' }
            },
            footer: {
                save: { title: '## link.save ##', command: 'link.save', type: 'primary' },
                cancel: { title: '## link.cancel ##', command: 'popup.close' }
            }
        }
    },
    popup: function(params, button) {
        // get link
        var $link = this.getLink();
        var popup = ($link.length === 0) ? 'format' : 'change';

        this.app.popup.create('link', this.popups[popup]);
        this.app.popup.open({ button: button });
    },
    format: function(params) {
        // selection
        var text = this.app.selection.getText();

        // popup
        var stack = this.app.popup.create('link-create', this.popups.create);
        var data = {
            text: text,
            target: this.opts.link.target
        };

        // set data
        stack.setData(data);

        // open
        this.app.popup.open({ focus: (text) ? 'url' : 'text' });
    },
    edit: function() {
        // get link
        var $link = this.getLink();
        var stack = this.app.popup.create('link-edit', this.popups.edit);

        // set
        var data = {
            text: $link.text(),
            url: $link.attr('href'),
            target: $link.attr('target') || this.opts.link.target
        };

        // clean
        data = this._encodeUrl(data);

        // set data
        stack.setData(data);

        // open
        this.app.popup.open({ focus: 'url' });

    },
    insert: function(stack) {
        this.app.popup.close();

        var nodes = this.app.inline.set({ tag: 'a', caret: 'after' });
        var $link = this.dom(nodes);

        // data
        this._save(stack, $link, 'add');
    },
    save: function(stack) {
        this.app.popup.close();

        var $link = this.getLink();

        // data
        this._save(stack, $link, 'change');
    },
    unlink: function() {
        this.app.popup.close();

        var links = this.app.selection.getNodes({ tags: ['a'] });
        if (links.length === 0) return;

        // unlink
        for (var i = 0; i < links.length; i++) {
            var $link = this.dom(links[i]);

            this.app.broadcast('link.remove', { url: $link.attr('href'), text: $link.text() });
            $link.unwrap();
        }

        // ui
        this.app.toolbar.observe();
    },
    getLink: function() {
        var links = this.app.selection.getNodes({ tags: ['a'] });
        var $link = (links.length !== 0) ? this.dom(links[0]) : this.dom([]);

        return $link;
    },

    // private
    _save: function(stack, $link, type) {
        var data = stack.getData();
        data = this._cleanUrl(data);
        data = this._encodeUrl(data);

        if (data.url === '') return;

        data = this._setUrl($link, data);

        if ($link.length === 1) {
            data = this._setText($link, data);
        }

        data = this._setTarget($link, data);
        data.element = $link;

        this.app.broadcast('link.' + type, data);
    },
    _cleanUrl: function(data) {
        data.url = this.app.content.escapeHtml(data.url);
        data.url = (data.url.search(/^javascript:/i) !== -1) ? '' : data.url;

        return data;
    },
    _encodeUrl: function(data) {
        data.url = (data.url) ? data.url.replace(/&amp;/g, '&') : '';

        return data;
    },
    _setUrl: function($link, data) {
        $link.attr('href', data.url);

        return data;
    },
    _setText: function($link, data) {
        data.text = (data.text === '') ? data.url : data.text;
        $link.text(data.text);

        return data;
    },
    _setTarget: function($link, data) {
        if (data.target) $link.attr('target', '_blank');
        else $link.removeAttr('target');

        return data;
    }
});
ArticleEditor.add('module', 'embed', {
    popups: {
        add: {
            title: '## embed.embed ##',
            width: '100%',
            form: {
                embed: { type: 'textarea', label: '## embed.description ##', rows: 6 },
                caption: { type: 'input', label: '## embed.caption ##' },
                responsive: { type: 'checkbox', text: '## embed.responsive-video ##' }
            },
            footer: {
                insert: { title: '## buttons.insert ##', command: 'embed.insert', type: 'primary' },
                cancel: { title: '## buttons.cancel ##', command: 'popup.close' }
            }
        },
        edit: {
            title: '## embed.embed ##',
            width: '100%',
            form: {
                embed: { type: 'textarea', label: '## embed.description ##', rows: 6 },
                caption: { type: 'input', label: '## embed.caption ##' },
                responsive: { type: 'checkbox', text: '## embed.responsive-video ##' }
            },
            footer: {
                save: { title: '## buttons.save ##', command: 'embed.save', type: 'primary' },
                cancel: { title: '## buttons.cancel ##', command: 'popup.close' }
            }
        }
    },
    build: function(scripts) {
        if (scripts) {
            this._callScripts(scripts);
        }
        else {
            this._findScripts();
        }
    },
    observe: function(obj, name, stack) {
        if (!this.opts.embed) {
            return false;
        }

        var instance = this.app.block.get();
        if (stack && stack.getName() === 'addbar') {
            obj.command = 'embed.popup';
        }
        else if (instance && instance.getType() === 'embed') {
            obj.command = 'embed.edit';
        }

        return obj;
    },
    popup: function() {
        var stack = this.app.popup.add('embed', this.popups.add);
        stack.open({ focus: 'embed' });

        // checkbox
        if (this.opts.embed.checkbox) {
            stack.getInput('responsive').attr('checked', true);
        }

        // codemirror
        this._buildCodemirror(stack);
    },
    edit: function(params, button) {
        var instance = this.app.block.get();
        var data = {
            embed: instance.getEmbedCode(),
            caption: instance.getCaption(),
            responsive: instance.isResponsive()
        };

        // popup & data
        var stack = this.app.popup.create('embed', this.popups.edit);
        stack.setData(data);

        // open
        this.app.popup.open({ button: button, focus: 'embed' });

        // codemirror
        this._buildCodemirror(stack);
    },
    insert: function(stack) {
        this.app.popup.close();

        // data
        var data = stack.getData();
        var code = this._getEmbedCode(data);
        if (code === '') {
            return;
        }

        // create
        var instance = this._createInstance(data, code);
        this.app.block.add({ instance: instance });
    },
    save: function(stack) {
        this.app.popup.close();

        // data
        var current = this.app.block.get();
        var data = stack.getData();
        var code = this._getEmbedCode(data);
        if (code === '') {
            this.app.block.remove();
            return;
        }

        // create
        var instance = this._createInstance(data, code, current);

        // change
        if (this._isNeedToChange(data, instance, current)) {
            this.app.block.change(instance);
        }
    },

    // private
    _buildCodemirror: function(stack) {
        var $input = stack.getInput('embed');

        this.app.codemirror.create({ el: $input, height: '200px', focus: true });
        this.app.popup.updatePosition();
    },
    _findScripts: function() {
        var scripts = this.app.editor.getLayout().find('[data-' + this.prefix + '-type=embed]').find('script').getAll();
        this.build.call(this, scripts);
    },
    _callScripts: function(scripts) {
        for (var i = 0; i < scripts.length; i++) {
            if (scripts[i].src !== '') {
                var src = scripts[i].src;

                this.app.editor.getDoc().find('head script[src="' + src + '"]').remove();
                var $script = this.dom('<script>').attr({ 'src': src, 'async': true, 'defer': 'true' });
                $script.on('load', function() {
                    if (src.search('instagram') !== -1) {
                        var win = this.app.editor.getWinNode();
                        if (win.instgrm) {
                            win.instgrm.Embeds.process();
                        }
                    }
                    this.build(scripts.slice(i + 1));
                }.bind(this));


                var head = this.app.editor.getDocNode().getElementsByTagName('head')[0];
                if (head) head.appendChild($script.get());
            }
        }
    },
    _getEmbedCode: function(data) {
        var code = data.embed.trim();
        code = this.app.codemirror.val(code);
        code = this._removeScript(code);
        code = this.app.content.sanitize(code);
        code = (!this._isHtmlString(code) && code !== '') ? this._parseUrl(code) : code;

        return code;
    },
    _removeScript: function(code) {
        if (!this.opts.embed.script) {
            code = this.app.content.removeTagsWithContent(code, ['script']);
        }
        return code;
    },
    _createInstance: function(data, code, current) {
        var $figure;
        if (current) {
            var figure = current.duplicateEmpty();
            $figure = figure.getBlock();
            $figure.html(code);
        }
        else {
            $figure = (this._isFigure(code)) ? code : '<figure>' + code + '</figure>';
        }

        var instance = this.app.create('block.embed', $figure);

        // caption
        instance.setCaption(data.caption);

        // responsive
        if (data.responsive) {
            instance.addResponsive();
        }

        return instance;
    },
    _parseUrl: function(str) {
        var iframeStart = '<iframe width="560" height="315" src="';
        var iframeEnd = '" frameborder="0" allowfullscreen></iframe>';

        var parsed;
        if (str.match(this.opts.regex.youtube)) {
            var yturl = '//www.youtube.com';
            if (str.search('youtube-nocookie.com') !== -1) {
                yturl = '//www.youtube-nocookie.com';
            }

            parsed = str.replace(this.opts.regex.youtube, yturl + '/embed/$1');
            return iframeStart + parsed + iframeEnd;
        }
        else if (str.match(this.opts.regex.vimeo)) {
            parsed = str.replace(this.opts.regex.vimeo, '//player.vimeo.com/video/$2');
            return iframeStart + parsed + iframeEnd;
        }

        return str;

    },
    _isNeedToChange: function(data, instance, current) {
        if (current.getEmbedCode() !== instance.getEmbedCode()) return true;
        if (data.responsive !== current.isResponsive()) return true;
        if (data.caption !== current.getCaption()) return true;
    },
    _isHtmlString: function(str) {
        return /^\s*<(\w+|!)[^>]*>/.test(str);
    },
    _isFigure: function(str) {
        return /^<figure/.test(str);
    }
});
ArticleEditor.add('module', 'grid', {
    popup: function() {

        // create
        var stack = this.app.popup.add('grid', {
            title: '## popup.grid ##',
            width: '320px',
            items: this.buildItems()
        });

        stack.open();
    },
    observe: function() {
        if (!this.opts.grid) return false;
    },
    buildItems: function() {
        var items = {};

        var z = 0;
        for (var pattern in this.opts.grid.patterns) {
            if (this.opts.grid.patterns.hasOwnProperty(pattern)) {
                z++;
                var $item = this._createPattern(pattern);

                items['column' + z] = {
                    html: $item,
                    command: 'grid.add',
                    params: { pattern: pattern, columns: this.opts.grid.patterns[pattern] }
                };
            }
        }

        return items;
    },
    add: function(params) {

        this.app.popup.close();

        var pattern = (params.columns === '');
        var columns = (pattern) ? params.pattern.split('|') : params.columns.split('|');
        var $grid =  this.dom('<div>').addClass(this.opts.grid.classname);
        if (this.opts.grid.classes !== '') {
            $grid.addClass(this.opts.grid.classes);
        }

        for (var i = 0; i < columns.length; i++) {
            var column = this.app.create('block.column');
            var $column = column.getBlock();

            if (!pattern) {
                $column.addClass(columns[i]);
            }

            $grid.append($column);
        }

        // add
        var instance = this.app.block.add({
            name: 'grid',
            source: $grid,
            caret: false
        });

        // set
        this.app.block.set(instance);
    },

    // private
    _createPattern: function(pattern) {
        var $item = this.dom('<div>').addClass(this.prefix + '-popup-grid-box');
        var columns = pattern.split('|');
        var sum = this.app.utils.sumOfArray(columns);
        var unit = 100/sum;

        for (var i = 0; i < columns.length; i++) {
            var $column = this.dom('<span>');
            $column.addClass(this.prefix + '-popup-grid-column');
            $column.css('width', (columns[i] * unit) + '%');

            $item.append($column);
        }


        return $item;
    }
});
ArticleEditor.add('module', 'image', {
    popups: {
        add: {
            title: '## popup.add-image ##',
            width: '100%'
        },
        edit: {
            title: '## popup.image ##',
            width: '100%',
            getter: 'block.getData',
            form: {
                width: { type: 'input', width: '100px', label: '## image.width ##', observer: 'image.observeImageWidth' },
                alt: { type: 'input', label: '## image.alt-text ##' },
                caption: { type: 'input', label: '## image.caption ##', observer: 'image.observeImageCaption' },
                link: { type: 'input', label: '## image.link ##', observer: 'image.observeImageLink' },
                target: { type: 'checkbox', text: '## image.link-in-new-tab ##', observer: 'image.observeImageLink' }
            },
            footer:  {
                'save': { title: '## image.save ##', command: 'image.save', type: 'primary' },
                'cancel': { title: '## image.cancel ##', command: 'popup.close' }
            }
        },
        editcard: {
            title: '## popup.image ##',
            width: '100%',
            getter: 'block.getData',
            setter: 'block.setData',
            form: {
                alt: { type: 'input', label: '## image.alt-text ##' }
            },
            footer:  {
                'save': { title: '## image.save ##', command: 'image.save', type: 'primary' },
                'cancel': { title: '## image.cancel ##', command: 'popup.close' }
            }
        }
    },
    init: function() {
        this.dataStates = [];
    },
    popup: function() {

        var stack = this.app.popup.add('image', this.popups.add);
        var $body = stack.getBody();

        this._createImageByUrl($body);
        this._createOrSection($body);
        this._createUploadBox($body);
        this._createSelectBox($body);

        // open
        stack.open();
    },
    edit: function(params, button) {
        this._edit('edit', button);
    },
    editCard: function(params, button) {
        this._edit('editcard', button);
    },
    observe: function(obj, name, stack) {
        if (!this.opts.image) {
            return false;
        }

        var instance = this.app.block.get();
        if (stack && stack.getName() === 'addbar') {
            obj.command = 'image.popup';
        }
        else if (instance && instance.getType() === 'image') {
            obj.command = 'image.edit';
        }

        return obj;
    },
    observeStates: function() {
        this._findImages().each(this._addImageState.bind(this));
    },
    observeImageLink: function(obj) {
        return (this.opts.image.link) ? obj : false;
    },
    observeImageCaption: function(obj) {
        var instance = this.app.block.get();
        if (instance && instance.getTag() === 'figure') {
            return obj;
        }
        else {
            return false;
        }
    },
    observeImageWidth: function(obj) {
        return (this.opts.image.width) ? obj : false;
    },
    parseInserted: function(inserted) {
        var files = [];
        var params = {
            url: this.opts.image.upload,
            name: this.opts.image.name,
            data: this.opts.image.data,
            multiple: true,
            success: 'image.insertFromInserted',
            error: 'image.error'
        };
        this.pasteInsertedImages = [];
        this.resolved = [];
        var fetchImages = 0;
        for (var i = 0; i < inserted.instances.length; i++) {
            var instance = inserted.instances[i];
            var type = instance.getType();
            if (type === 'image') {
                var src = instance.getSrc();

                if (src.search(/^data:/i) !== -1) {
                    var blob = this._dataURLtoFile(src, 'image' + i);
                    files.push(blob);
                    this.pasteInsertedImages.push(instance);
                }
                else if (src.search(/^blob:/i) !== -1) {
                    fetchImages++;
                    this.pasteInsertedImages.push(instance);
                    var self = this;
                    function sendFile(src, i) {
                        var xhr = new XMLHttpRequest();
                        xhr.open('GET', src, true);
                        xhr.responseType = 'blob';
                        xhr.onload = function(e) {
                          if (xhr.status == 200) {
                            var blob = xhr.response;
                            var file = new File([blob], 'image' + i, { type: "image/png" });
                            self.resolved.push(file);
                          }
                        };
                        xhr.send();
                    }
                    sendFile(src, i);
                }
            }
        }

        if (fetchImages !== 0) {
            var interval = setInterval(function() {
                if (this.resolved.length === fetchImages) {
                    clearInterval(interval);
                    var upload = this.app.create('upload');
                    upload.send(false, this.resolved, params);
                }
            }.bind(this), 100);
        }


        if (files.length !== 0) {
            var upload = this.app.create('upload');
            upload.send(false, files, params);
        }
    },
    paste: function(blob, e) {
        var params = {
            url: this.opts.image.upload,
            name: this.opts.image.name,
            data: this.opts.image.data,
            multiple: false,
            success: 'image.insertFromBlob',
            error: 'image.error'
        };

        // upload
        var upload = this.app.create('upload');
        upload.send(e, [blob], params);
    },
    drop: function(e, dt) {
        var files = [];
        for (var i = 0; i < dt.files.length; i++) {
            var file = dt.files[i] || dt.items[i].getAsFile();
            if (file) {
                files.push(file);
            }
        }

        var params = {
            url: this.opts.image.upload,
            name: this.opts.image.name,
            data: this.opts.image.data,
            multiple: this.opts.image.multiple,
            success: 'image.insertByDrop',
            error: 'image.error'
        };

        if (files.length > 0) {

            var $block = this.dom(e.target).closest('[data-' + this.prefix + '-type]');
            if ($block.length !== 0) {
                this.app.block.set($block);
            }

            // upload
            var upload = this.app.create('upload');
            upload.send(e, files, params);
        }
    },
    insertFromClipboard: function(clipboard) {
        var text = clipboard.getData("text/plain") || clipboard.getData("text/html");
        text = text.trim();

        if (text !== '') {
            return;
        }

        var items = clipboard.items;
        var blob = null;
        for (var i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") === 0) {
                blob = items[i].getAsFile();
            }
        }

        if (blob !== null) {
            this.paste(blob);
            return true;
        }
    },
    insertFromBlob: function(response) {
        this.insert(response);
    },
    insertByDrop: function(response, e) {
        if (this.app.block.is()) {
            var instance = this.app.block.get();
            var target = e.target;
            var type = instance.getType();
            var isChange = ((type === 'card' && target && target.tagName === 'IMG' && instance.hasImage()) || type === 'image');
            if (isChange) {
                this.change(response);
                return;
            }
            else if (e && type !== 'card' && instance.isEditable()) {
                this.app.insertion.insertPoint(e);
            }
        }

        this.insert(response);
    },
    insertByUpload: function(response) {
        this.insert(response);
    },
    insertByUrl: function(e) {
        e.preventDefault();

        var str = this.$urlinput.val();
        if (str.trim() === '') {
            return;
        }

        var response = {
            file: { url: str, id: this.app.utils.getRandomId() }
        };

        // insert
        this.insert(response);
    },
    insertFromSelect: function(e) {
        e.preventDefault();

        var $target = this.dom(e.target);
        var obj = { url: $target.attr('data-url') };
        var attrs = ['id', 'alt', 'caption', 'link', 'width', 'height'];
        for (var i = 0; i < attrs.length; i++) {
            var val = $target.attr('data-' + attrs[i]);
            if (val !== null) { obj[attrs[i]] = val; }
        }

        // insert
        this.insert({ file: obj }, true);
    },
    insertFromInserted: function(response) {
        var z = 0;
        for (var key in response) {
            if (response.hasOwnProperty(key)) {
                this.pasteInsertedImages[z].setImage(response[key]);
                z++;
            }
        }
    },
    changeClone: function(response) {
        for (var key in response) {
            if (response.hasOwnProperty(key)) {
                this.$imageclone.attr('src', response[key].url);
                break;
            }
        }

        this.change(response, false);
    },
    change: function(response, closepopup) {
        if (closepopup !== false) {
            this.app.popup.close();
        }

        var instance = this.app.block.get();
        for (var key in response) {
            if (response.hasOwnProperty(key)) {
                instance.setImage(response[key]);

                // broadcast
                this.app.broadcast('image.change', response[key]);
                this.app.broadcast('image.upload', { instance: instance, data: response[key] });
                return;
            }
        }
    },
    save: function(stack) {
        this.app.popup.close();
        this.app.block.setData(stack);
    },
    insert: function(response, select) {
        // popup close
        this.app.popup.close();

        // insert
        this.imageslen = 0;
        this.imagescount = 0;

        // tag
        var tag = this.opts.image.tag;

        // loop
        for (var key in response) {
            if (response.hasOwnProperty(key)) {
                var $source = this.dom('<' + tag + '>');
                var $image = this._createImageFromResponseItem(response[key]);

                $source.append($image);

                var instance = this.app.create('block.image', $source);
                this.app.block.add({ instance: instance, type: 'image' });

                // caption
                if (Object.prototype.hasOwnProperty.call(response[key], 'caption')) {
                    var $caption = this.dom('<figcaption>').html(response[key].caption);
                    instance.$block.append($caption);
                    this.app.create('block.figcaption', $caption);
                }

                // broadcast
                var eventType = (select) ? 'select' : 'upload';
                this.app.broadcast('image.' + eventType, { instance: instance, data: response[key] });

                this.$last = instance.getBlock();
                this.imageslen++;
            }
        }
    },
    error: function(response) {
        this.app.broadcast('image.upload.error', { response: response });
    },
    getStates: function() {
        var $images = this._findImages();

        // check status
        for (var key in this.dataStates) {
            if (this.dataStates.hasOwnProperty(key)) {
                var data = this.dataStates[key];
                var status = $images.is('[data-image="' + data.id + '"]');
                this._setImageState(data.id, status);
            }
        }

        return this.dataStates;
    },
    createUploadBox: function(upload, $body) {
        if (!upload) return;

        var $upload = this.dom('<div>');
        $body.append($upload);

        return $upload;
    },
    createSelectBox: function(select, $body, callback) {
        if (!select) return;

        // images box
        this.$selectbox = this._createImagesBox($body);

        if (typeof select === 'object') {
            this._parseList(select, callback);
        }
        else {
            var getdata = (this.opts.editor.reloadmarker) ? { d: new Date().getTime() } : {};

            this.ajax.request(this.opts.image.selectMethod, {
                url: select,
                data: getdata,
                success: function(data) {
                    this._parseList(data, callback);
                }.bind(this)
            });
        }
    },

    // private
    _edit: function(type, button) {
        this.app.popup.create('image-edit', this.popups[type]);
        this._buildEditUpload();
        this.app.popup.open({ button: button });
    },
    _findImages: function() {
        return this.app.editor.getLayout().find('[data-image]');
    },
    _addImageState: function($node) {
        var id = $node.attr('data-image');
        this.dataStates[id] = { type: 'image', status: true, url: $node.attr('src'), $img: $node, $el: $node, id: id };
    },
    _setImageState: function(url, status) {
        this.dataStates[url].status = status;
    },
    _checkImageLoad: function() {
        this.imagescount++;
        if (this.imagescount === this.imageslen) {
            this.app.block.unset();
            this.app.block.set(this.$last);
            this.app.editor.adjustHeight();
        }
    },
    _buildEditUpload: function() {
        if (!this.opts.image.upload) return;

        var instance = this.app.block.get();

        // stack
        var stack = this.app.popup.getStack();
        var $body = stack.getBody();

        // form item
        var $item = this._createFormItem();
        $item.addClass(this.prefix + '-form-item-edit-image-box');

        // image
        this.$imageclone = instance.getImage().clone();
        this.$imageclone.removeAttr('width height style');

        var $imageitem = this.dom('<div>').addClass(this.prefix + '-form-item-image');

        $imageitem.append(this.$imageclone);
        $item.append($imageitem);

        // upload item
        this.$upload = this.dom('<div>');
        $item.append(this.$upload);

        // append to popup
        $body.prepend($item);

        // build upload
        this._buildUpload(this.$upload, 'image.changeClone');
    },
    _buildUpload: function($item, callback) {
        if (!this.opts.image.upload) return;

        var params = {
            box: true,
            placeholder: this.lang.get('image.upload-new-placeholder'),
            url: this.opts.image.upload,
            name: this.opts.image.name,
            data: this.opts.image.data,
            multiple: this.opts.image.multiple,
            success: callback,
            error: 'image.error'
        };

        this.app.create('upload', $item, params);
    },
    _createSelectBox: function($body) {
        this.createSelectBox(this.opts.image.select, $body, 'image.insertFromSelect');
    },
    _createUploadBox: function($body) {
        this.$upload = this.createUploadBox(this.opts.image.upload, $body);
        this._buildUpload(this.$upload, 'image.insertByUpload');
    },
    _createImageFromResponseItem: function(item) {
        var $image = this.dom('<img>').attr('src', item.url).one('load', this._checkImageLoad.bind(this));
        var $item = $image;

        var attrs = ['id', 'alt', 'width', 'height'];
        for (var i = 0; i < attrs.length; i++) {
            if (Object.prototype.hasOwnProperty.call(item, attrs[i])) {
                $item.attr(attrs[i], item[attrs[i]]);
            }
        }

        // srcset & data-image
        if (Object.prototype.hasOwnProperty.call(item, 'id')) $item.attr('data-image', item.id);
        if (Object.prototype.hasOwnProperty.call(item, '2x')) $item.attr('srcset', item['2x'] + ' 2x');

        // link
        if (Object.prototype.hasOwnProperty.call(item, 'link')) {
            var $link = this.dom('<a>');
            $link.attr('href', item.link);
            $image.wrap($link);
            $item = $link;
        }

        return $item;
    },
    _createImagesBox: function($body) {
        var $box = this.dom('<div>').addClass(this.prefix + '-popup-images-box');
        $body.append($box);

        return $box;
    },
    _createOrSection: function($body) {
        if (this.opts.image.url && (this.opts.image.upload || this.opts.image.select)) {
            var $section = this.dom('<div>').addClass(this.prefix + '-popup-image-section-or');
            $section.html(this.lang.get('image.or'));
            $body.append($section);
        }
    },
    _createImageByUrl: function($body) {
        if (!this.opts.image.url) return;

        var $item = this._createFormItem();

        this.$urlinput = this._createUrlInput();
        this.$urlbutton = this._createUrlButton();

        $item.append(this.$urlinput);
        $item.append(this.$urlbutton);

        $body.append($item);
    },
    _createFormItem: function() {
        return this.dom('<div>').addClass(this.prefix + '-form-container-flex');
    },
    _createUrlInput: function() {
        var $input = this.dom('<input>').addClass(this.prefix + '-form-input');
        $input.attr('placeholder', this.lang.get('image.url-placeholder'));

        return $input;
    },
    _createUrlButton: function() {
        var $button = this.dom('<button>').addClass(this.prefix + '-form-button ' + this.prefix + '-form-button-primary');
        $button.html(this.lang.get('image.insert'));
        $button.one('click', this.insertByUrl.bind(this));

        return $button;
    },
    _parseList: function(data, callback) {
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var obj = data[key];
                if (typeof obj !== 'object') continue;

                var $img = this.dom('<img>');
                var url = (obj.thumb) ? obj.thumb : obj.url;

                $img.addClass(this.prefix + '-popup-event');
                $img.attr('src', url);
                $img.attr('data-url', obj.url);
                $img.attr('data-callback', callback);

                var attrs = ['id', 'alt', 'caption', 'link', 'width', 'height'];
                for (var i = 0; i < attrs.length; i++) {
                    if (Object.prototype.hasOwnProperty.call(obj, attrs[i])) {
                        $img.attr('data-' + attrs[i], obj[attrs[i]]);
                    }
                }

                $img.on('click.' + this.prefix + '-popup-event-' + this.uuid, function(e) {
                    var $target = this.dom(e.target);
                    var callback = $target.attr('data-callback');

                    this.app.api(callback, e);

                }.bind(this));

                this.$selectbox.append($img);
            }
        }
    },
    _dataURLtoFile: function(dataurl, filename) {
        var arr = dataurl.split(','),
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]),
            n = bstr.length,
            u8arr = new Uint8Array(n);

        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new File([u8arr], filename, {type:mime});
    }
});
ArticleEditor.add('module', 'table', {
    popups: {
        cell: {
            title: '## table.table-cell ##',
            width: '300px',
            form: {
                width: { type: 'input', label: '## table.width ##' },
                nowrap: { type: 'checkbox', text: '## table.nowrap ##' }
            },
            footer: {
                insert: { title: '## table.save ##', command: 'table.save', type: 'primary' },
                cancel: { title: '## table.cancel ##', command: 'popup.close' }
            }
        }
    },
    items: {
        table: {
            addhead: { title: '## table.add-head ##', command: 'table.addHead' },
            removehead: { title: '## table.remove-head ##', command: 'table.removeHead' }
        },
        row: {
            addrowbelow: { title: '## table.add-row-below ##', command: 'table.addRowBelow' },
            addrowabove: { title: '## table.add-row-above ##', command: 'table.addRowAbove' },
            removerow: { title: '## table.remove-row ##', command: 'table.removeRow' }
        },
        cell: {
            addcolumnafter: { title: '## table.add-column-after ##', command: 'table.addColumnAfter' },
            addcolumnbefore: { title: '## table.add-column-before ##', command: 'table.addColumnBefore' },
            addrowbelow: { title: '## table.add-row-below ##', command: 'table.addRowBelow' },
            addrowabove: { title: '## table.add-row-above ##', command: 'table.addRowAbove' },
            removecolumn: { title: '## table.remove-column ##', command: 'table.removeColumn' },
            removerow: { title: '## table.remove-row ##', command: 'table.removeRow' }
        }
    },
    add: function() {
        // add
        var instance = this.app.block.add({
            name: 'table',
            source: this.opts.table.template,
            caret: false
        });

        // focus
        var cell = instance.getFirstCell();
        if (cell) {
            this.app.block.set(cell, 'start');
        }
    },
    observe: function(obj, name, stack) {
        if (!this.opts.table) {
            return false;
        }

        var instance = this.app.block.get();
        if (stack && stack.getName() === 'addbar') {
            obj.command = 'table.add';
        }
        else if (instance && instance.isType(['table', 'row', 'cell'])) {
            obj.command = 'table.popup';
        }

        return obj;
    },
    popup: function(params, button) {
        var instance = this.app.block.get();
        var type = instance.getType();

        this.app.popup.create('table', {
            items: this.items[type]
        });

        // open
        this.app.popup.open({ button: button });
    },
    addHead: function() {
        this.removeHead();

        var instance = this.app.block.get();
        var $block = instance.getBlock();

            var columns = $block.find('tr').first().children('td, th').length;
            var $head = this.dom('<thead>');
        var $row = this._buildRow(columns, '<th>');

        $head.append($row);
        $block.prepend($head);

        // set
        this.app.block.set($row.children('td, th').first(), 'start');
    },
    addRowBelow: function() {
        this._addRow('below');
    },
    addRowAbove: function() {
        this._addRow('above');
    },
    addColumnBefore: function() {
        this._addColumn('before');
    },
    addColumnAfter: function() {
        this._addColumn('after');
    },
    removeHead: function() {
        this.app.popup.close();

        var instance = this.app.block.get();
        var $block = instance.getBlock();

        var $head = $block.find('thead');
        if ($head.length !== 0) {
            $head.remove();
        }
    },
    removeRow: function() {
        this.app.popup.close();
        this.app.control.close();

        var instance = this.app.block.get();
        if (instance.getType() === 'cell') {
            instance = instance.getParent(['row']);
        }
        instance.remove(true);
    },
    removeColumn: function() {
        this.app.popup.close();
        this.app.control.close();

        var instance = this.app.block.get();
        var $block = instance.getBlock();

        var $table = $block.closest('table');
        var $row = $block.closest('tr');

        var index = 0;
        $row.find('td, th').each(function($node, i) {
            if ($node.get() === $block.get()) index = i;
        });

        $table.find('tr').each(function($node) {
            var cell = $node.find('td, th').get(index);
            var $cell = this.dom(cell);
            $cell.remove();
        }.bind(this));
    },
    cellSetting: function(params, button) {
        var instance = this.app.block.get();
        var popup = this.app.popup.create('cell', this.popups.cell);

        // data
        popup.setData({
            width: instance.getWidth(),
            nowrap: instance.getNowrap()
        });

        // open
        this.app.popup.open({ button: button, focus: 'width' });
    },
    save: function(stack) {
        // popup close
        this.app.popup.close();

        // data
        var data = stack.getData();
        var instance = this.app.block.get();

        if (data.width !== '') {
            instance.setWidth(data.width);
        }

        instance.setNowrap(data.nowrap);
    },


    // private
    _addColumn: function(name) {
        this.app.popup.close();

        var instance = this.app.block.get();
        var $block = instance.getBlock();

        var $table = $block.closest('table');
        var $row = $block.closest('tr');

        var index = 0;
        $row.find('td, th').each(function($node, i) {
            if ($node.get() === $block.get()) index = i;
        });

        var rowIndex = 0;
        $table.find('tr').each(function($node, i) {
            if ($node.get() === $row.get()) rowIndex = i;
        });

        var $newCell;
        $table.find('tr').each(function($node, i) {
            var cell = $node.find('td, th').get(index);
            var $cell = this.dom(cell);


            var $td = $cell.clone();
            $td.html('');

      // create instance
            this.app.create('block.cell', $td);

            if (rowIndex === i) {
                $newCell = $td;
            }

            // after / before
              $cell[name]($td);

        }.bind(this));

        // set focus
        if ($newCell) {
            this.app.block.set($newCell, 'start');
        }
    },
    _addRow: function(name) {
        this.app.popup.close();

        var position = (name === 'below') ? 'after' : 'before';
        var instance = this.app.block.get();
        var $block = instance.getBlock();

        var $row = $block.closest('tr');
        var $head = $block.closest('thead');

        var columns = $row.children('td, th').length;
        var $newRow = this._buildRow(columns, '<td>');
        if ($head.length !== 0) {
            $head.after($newRow);
        }
        else {
            $row[position]($newRow);
        }

        // set focus
        this.app.block.set($newRow.find('td, th').first(), 'start');
    },
    _buildRow: function(columns, tag) {
        var $row = this.dom('<tr>');

        // create instance
        this.app.create('block.row', $row);

        for (var i = 0; i < columns; i++) {
            var $cell = this.dom(tag);

            // create instance
            this.app.create('block.cell', $cell);

            // append
            $row.append($cell);
        }

        return $row;
    }
});
ArticleEditor.add('module', 'snippet', {
    popups: {
        base: {
            title: '## popup.snippets ##',
            width: '100%'
        }
    },
    init: function() {
        this.json = {};
    },
    observe: function() {
        if (!this.opts.snippets) return false;
    },
    popup: function() {
        var stack = this.app.popup.add('snippets', this.popups.base);

        // data
        var $body = stack.getBody();

        // json url
        if (typeof this.opts.snippets === 'string') {
            var getdata = (this.opts.editor.reloadmarker) ? { d: new Date().getTime() } : {};

            this.ajax.get({
                url: this.opts.snippets,
                data: getdata,
                success: function(data) {
                    this._buildPopup(data, $body);
                }.bind(this)
            });
        }
        // json object
        else {
            this._buildPopup(this.opts.snippets, $body);
        }

        // open
        stack.open();
    },
    insert: function(e) {
        var $trigger = this.dom(e.target).closest('.' + this.prefix + '-snippet-container');
        var key = $trigger.attr('data-snippet-key');

        if (Object.prototype.hasOwnProperty.call(this.json, key)) {
            this.app.popup.close();

            var html = this.json[key].html;

            this.app.editor.insertContent({ html: html, caret: 'start' });
        }
    },

    // private
    _buildPopup: function(data, $body) {
        this.json = data;
        if (typeof data === 'string') {
            this.json = JSON.parse(data);
        }

        Object.keys(this.json).forEach(function(key) {
            var $container = this._buildPreviewContainer($body, key);

            // preview
            this._buildPreview($container, key);
            this._buildPreviewName($container, key);
        }.bind(this));
    },
    _buildPreviewContainer: function($body, key) {
        var $div = this.dom('<div>').addClass(this.prefix + '-snippet-container');
        $div.attr('data-snippet-key', key);
        $div.one('click', this.insert.bind(this));

        // append
        $body.append($div);

        return $div;
    },
    _buildPreview: function($container, key) {
        var $div = this.dom('<div>');
        if (Object.prototype.hasOwnProperty.call(this.json[key], 'image')) {
            $div.addClass(this.prefix + '-snippet-image');
            var $img = this.dom('<img>').attr('src', this.json[key].image);
            $div.html($img);
        }
        else {
            $div.addClass(this.prefix + '-snippet-preview');
            $div.html(this.json[key].html);
        }

        $container.append($div);
    },
    _buildPreviewName: function($container, key) {
        if (!Object.prototype.hasOwnProperty.call(this.json[key], 'name')) return;

        var $span = this.dom('<div>').addClass(this.prefix + '-snippet-name');
        $span.text(this.json[key].name);

        $container.append($span);
    }
});
ArticleEditor.add('module', 'template', {
    popups: {
        base: {
            title: '## templates.templates ##',
            width: '100%'
        }
    },
    init: function() {
        this.json = {};
    },
    observe: function() {
        if (!this.opts.templates) return false;
    },
    popup: function(params, button) {
        // json url
        if (typeof this.opts.templates === 'string') {
            var getdata = (this.opts.editor.reloadmarker) ? { d: new Date().getTime() } : {};

            this.ajax.get({
                url: this.opts.templates,
                data: getdata,
                success: function(data) {
                    this._buildPopup(button, data);
                }.bind(this)
            });
        }
        // json object
        else {
            this._buildPopup(button, this.opts.templates);
        }
    },
    insert: function(e) {
        var $trigger = this.dom(e.target).closest('.' + this.prefix + '-template-container');
        var key = $trigger.attr('data-template-key');

        if (Object.prototype.hasOwnProperty.call(this.json, key)) {
            this.app.popup.close();

            var html = this.json[key].html;
            this.app.editor.setContent({ html: html, caret: false });
        }
    },

    // private
    _buildPopup: function(button, data) {

        // popup
        var popup = this.app.popup.create('templates', this.popups.base);
        var $body = popup.getBody();

        // json
        this.json = (typeof data === 'string') ? JSON.parse(data) : data;

        // items
        Object.keys(this.json).forEach(function(key) {
            var $container = this._buildPreviewContainer($body, key);

            // preview
            this._buildPreview($container, key);
            this._buildPreviewName($container, key);
        }.bind(this));

        // open
        this.app.popup.open({ button: button });

    },
    _buildPreviewContainer: function($body, key) {
        var $div = this.dom('<div>').addClass(this.prefix + '-template-container');
        $div.attr('data-template-key', key);
        $div.one('click', this.insert.bind(this));

        // append
        $body.append($div);

        return $div;
    },
    _buildPreview: function($container, key) {
        var $div = this.dom('<div>');
        if (Object.prototype.hasOwnProperty.call(this.json[key], 'image')) {
            $div.addClass(this.prefix + '-template-image');
            var $img = this.dom('<img>').attr('src', this.json[key].image);
            $div.html($img);
        }
        else {
            $div.addClass(this.prefix + '-template-preview');
            $div.html(this.json[key].html);
        }

        $container.append($div);
    },
    _buildPreviewName: function($container, key) {
        if (!Object.prototype.hasOwnProperty.call(this.json[key], 'name')) return;

        var $span = this.dom('<div>').addClass(this.prefix + '-template-name');
        $span.text(this.json[key].name);

        $container.append($span);
    }
});
ArticleEditor.add('class', 'tool.checkbox', {
    mixins: ['tool'],
    type: 'checkbox',
    input: {
        tag: 'input',
        type: 'checkbox',
        classname: '-form-checkbox'
    },
    getValue: function() {
        return this.$input.val();
    },

    // private
    _buildInput: function() {
        this.$box = this.dom('<label>').addClass(this.prefix + '-form-checkbox-item');
        this.$box.append(this.$input);

        // checkbox text
        if (this._has('text')) {
            var $span = this.dom('<span>').html(this.lang.parse(this.obj.text));
            this.$box.append($span);
        }

        this.$tool.append(this.$box);
    }
});
ArticleEditor.add('class', 'tool.input', {
    mixins: ['tool'],
    type: 'input',
    input: {
        tag: 'input',
        type: 'text',
        classname: '-form-input'
    },

    // private
    _buildInput: function() {
        this.$tool.append(this.$input);
    }
});
ArticleEditor.add('class', 'tool.number', {
    mixins: ['tool'],
    type: 'number',
    input: {
        tag: 'input',
        type: 'number',
        classname: '-form-input'
    },

    // private
    _buildInput: function() {
        this.$input.attr('min', 0).css('max-width', '65px');
        this.$tool.append(this.$input);
    }
});
ArticleEditor.add('class', 'tool.segment', {
    mixins: ['tool'],
    type: 'segment',
    input: {
        tag: 'input',
        type: 'hidden',
        classname: '-form-input'
    },
    setValue: function(value) {
        this.$segment.find('.' + this.prefix + '-form-segment-item').removeClass('active');
        this.$segment.find('[data-segment=' + value + ']').addClass('active');
        this.$input.val(value);
    },

    // private
    _buildInput: function() {
        this.$segment = this.dom('<div>').addClass(this.prefix + '-form-segment');

        var segments = this.obj.segments;
        for (var name in segments) {
            if (segments.hasOwnProperty(name)) {
                var $segment = this.dom('<span>').addClass(this.prefix + '-form-segment-item');
                $segment.attr('data-segment', name).on('click', this._catchSegment.bind(this));

                if (Object.prototype.hasOwnProperty.call(segments[name], 'icon')) {
                    $segment.html(segments[name].icon);
                }
                else {
                    $segment.addClass(this.prefix + '-icon-' + segments[name].prefix + '-' + name);
                }

                this.$segment.append($segment);
            }
        }

        this.$segment.append(this.$input);
        this.$tool.append(this.$segment);
    },
    _catchSegment: function(e) {
        e.preventDefault();
        e.stopPropagation();

        var $item = this.dom(e.target).closest('.' + this.prefix + '-form-segment-item');
        var value = $item.attr('data-segment');

        this.$segment.find('.' + this.prefix + '-form-segment-item').removeClass('active');
        $item.addClass('active');
        this.$input.val(value);

        // call setter
        this.app.api(this.setter, this.popup);
    }
});
ArticleEditor.add('class', 'tool.select', {
    mixins: ['tool'],
    type: 'select',
    input: {
        tag: 'select',
        classname: '-form-select'
    },

    // private
    _buildInput: function() {
        for (var value in this.obj.options) {
            if (this.obj.options.hasOwnProperty(value)) {
                var $option = this.dom('<option>');
                $option.val(value);
                $option.html(this.lang.parse(this.obj.options[value]));

                this.$input.append($option);
            }
        }

        this.$tool.append(this.$input);
    }
});
ArticleEditor.add('class', 'tool.textarea', {
    mixins: ['tool'],
    type: 'textarea',
    input: {
        tag: 'textarea',
        classname: '-form-textarea'
    },
    setFocus: function() {
        this.$input.focus();
        this.$input.get().setSelectionRange(0, 0);
        this.$input.scrollTop(0);
    },

    // private
    _buildInput: function() {
        if (this._has('rows')) {
            this.$input.attr('rows', this._get('rows'));
        }

        this.$input.attr('data-gramm_editor', false);
        this.$tool.append(this.$input);
    }
});
ArticleEditor.add('class', 'tool.upload', {
    mixins: ['tool'],
    type: 'upload',
    input: {
        tag: 'input',
        type: 'hidden',
        classname: '-form-input'
    },
    setValue: function(value) {
        value = (value) ? value : '';

        if (this.upload) {
            this.upload.setImage(value);
        }

        this.$input.val(value);
    },

    // private
    _buildInput: function() {
        // input
        this.$tool.append(this.$input);
        this._buildUpload();
    },
    _buildUpload: function() {
        this.$upload = this.dom('<input>').attr('type', 'file');
        this.$tool.append(this.$upload);

        // tool trigger method
        var trigger = {};
        if (this._has('trigger') && this._get('trigger')) {
            trigger = {
                instance: this,
                method: 'trigger'
            };
        }

        // create upload
        this.upload = this.app.create('upload', this.$upload, this.obj.upload, trigger);
    }
});
ArticleEditor.add('block', 'block.paragraph', {
    mixins: ['block'],
    type: 'paragraph',
    editable: true,
    toolbar: {
        'add': { title: '## buttons.add ##', command: 'addbar.popup' },
        'format': { title: '## buttons.format ##', command: 'format.popup' },
        'alignment': { title: '## buttons.align ##', command: 'block.popup', observer: 'block.observe' },
        'bold': { title: '## buttons.bold ##', command: 'inline.set', params: { tag: 'b' } },
        'italic': { title: '## buttons.italic ##', command: 'inline.set', params: { tag: 'i' } },
        'deleted': { title: '## buttons.deleted ##', command: 'inline.set', params: { tag: 'del' } },
        'link': { title: '## buttons.link ##', command: 'link.popup' }
    },
    control: {
        'trash': { title: '## buttons.delete ##', command: 'block.remove' },
        'duplicate': { title: '## buttons.duplicate ##', command: 'block.duplicate' }
    },
    create: function() {
        return this.dom('<p>');
    },

    // handle
    handleEnter: function(e, key, event) {
        e.preventDefault();

        // empty or end
        if (this.isEmpty() || this.isCaretEnd()) {
            var clone = this.app.block.create();

            // clone paragraph styles
            if (!this.opts.clean.enter) {
                clone = this.duplicateEmpty();

                // remove id attr
                clone.getBlock().removeAttr('id');
            }

            if (!this.opts.clean.enterinline) {
                // clone inline
                var inline = this.app.selection.getInline();
                if (inline) {
                    var cloned;
                    var inlines = this.app.element.getAllInlines(inline);
                    for (var i = 0; i < inlines.length; i++) {
                        if (inlines[i].tagName === 'A') {
                            continue;
                        }
                        if (i === 0) {
                            cloned = inlines[i].cloneNode();
                            cloned.removeAttribute('id');
                            cloned.innerHTML = '';
                        }
                        else {
                            var clonedInline = inlines[i].cloneNode();
                            clonedInline.removeAttribute('id');
                            clonedInline.innerHTML = '';
                            cloned.appendChild(clonedInline);
                        }

                    }

                    if (cloned) {
                        clone = this.app.block.create(cloned.outerHTML);
                    }
                }
            }

            // fix editor body height (paragraph margin)
            if (clone.isEmpty()) {
                clone.getBlock().html(this.app.utils.createInvisibleChar());
            }

            this.insert({ instance: clone, position: 'after', caret: 'start', remove: false });
        }
        // start
        else if (this.isCaretStart()) {
            this.insert({ instance: this.duplicateEmpty(), position: 'before' });
        }
        // middle
        else {
            var $block = this.getBlock();
            var $part = this.app.element.split($block);
            this.app.block.set($part, 'start');
        }

        return true;
    }
});
ArticleEditor.add('block', 'block.text', {
    mixins: ['block'],
    type: 'text',
    editable: true,
    toolbar: {
        'add': { title: '## buttons.add ##', command: 'addbar.popup' },
        'format': { title: '## buttons.format ##', command: 'format.popup' },
        'alignment': { title: '## buttons.align ##', command: 'block.popup', observer: 'block.observe' },
        'bold': { title: '## buttons.bold ##', command: 'inline.set', params: { tag: 'b' } },
        'italic': { title: '## buttons.italic ##', command: 'inline.set', params: { tag: 'i' } },
        'deleted': { title: '## buttons.deleted ##', command: 'inline.set', params: { tag: 'del' } },
        'link': { title: '## buttons.link ##', command: 'link.popup' }
    },
    control: {
        'trash': { title: '## buttons.delete ##', command: 'block.remove' },
        'duplicate': { title: '## buttons.duplicate ##', command: 'block.duplicate' }
    },
    create: function() {
        return this.dom('<div>').addClass(this.opts.text.classname);
    },

    // handle
    handleEnter: function(e, key, event) {
        e.preventDefault();
        this.app.insertion.insertBreakline();
        return true;
    }
});
ArticleEditor.add('block', 'block.address', {
    mixins: ['block'],
    type: 'address',
    editable: true,
    toolbar: {
        'add': { title: '## buttons.add ##', command: 'addbar.popup' },
        'format': { title: '## buttons.format ##', command: 'format.popup' },
        'alignment': { title: '## buttons.align ##', command: 'block.popup', observer: 'block.observe' },
        'bold': { title: '## buttons.bold ##', command: 'inline.set', params: { tag: 'b' } },
        'italic': { title: '## buttons.italic ##', command: 'inline.set', params: { tag: 'i' } },
        'deleted': { title: '## buttons.deleted ##', command: 'inline.set', params: { tag: 'del' } },
        'link': { title: '## buttons.link ##', command: 'link.popup' }
    },
    control: {
        'trash': { title: '## buttons.delete ##', command: 'block.remove' },
        'duplicate': { title: '## buttons.duplicate ##', command: 'block.duplicate' }
    },
    create: function() {
        return this.dom('<address>');
    },

    // handle
    handleEnter: function(e, key, event) {
        e.preventDefault();

        // empty or end  check address exit
        if (this.isEmpty() || this.isCaretEnd()) {
            var $block = this.getBlock();
            var $nodes = $block.children();
            var len = $nodes.length;
            var $last = $nodes.eq(len-1);
            var $lastPrev = $nodes.eq(len-2);
            var html = $block.html().trim();
            html = this.app.utils.removeInvisibleChars(html);

            if (html.search(/<br\s?\/?>$/) !== -1) {

                // remove empty
                $lastPrev.remove();
                $last.remove();

                // insert
                this.insertEmpty({ position: 'after', caret: 'start' });
                return;
            }
        }

        // insert br
        this.app.insertion.insertBreakline();
        return true;
    }
});
ArticleEditor.add('block', 'block.cell', {
    mixins: ['block'],
    type: 'cell',
    editable: true,
    toolbar: {
        'table': { title: '## blocks.table ##', command: 'table.add', observer: 'table.observe' },
        'alignment': { title: '## buttons.align ##', command: 'block.popup', observer: 'block.observe' },
        'bold': { title: '## buttons.bold ##', command: 'inline.set', params: { tag: 'b' } },
        'italic': { title: '## buttons.italic ##', command: 'inline.set', params: { tag: 'i' } },
        'deleted': { title: '## buttons.deleted ##', command: 'inline.set', params: { tag: 'del' } },
        'link': { title: '## buttons.link ##', command: 'link.popup' },
        'tune': { command: 'table.cellSetting', title: '## buttons.settings ##' }
    },
    create: function() {
        return this.dom('<td>');
    },
    getNextCell: function() {
        var cell = this.getNext();
        if (!cell) {
            var row = this.getParent('row');
            if (row) {
                var nextRow = row.getNextRow();
                if (nextRow) {
                    cell = nextRow.getChildFirst('cell');
                }
            }
        }

        return cell;
    },
    getPrevCell: function() {
        var cell = this.getPrev();
        if (!cell) {
            var row = this.getParent('row');
            if (row) {
                var prevRow = row.getPrevRow();
                if (prevRow) {
                    cell = prevRow.getChildLast('cell');
                }
            }
        }

        return cell;
    },
    getWidth: function() {
        var value = this.$block.attr('width');

        return (value) ? value : '';
    },
    getNowrap: function() {
        var value = this.$block.css('white-space');

        return (value === 'nowrap');
    },
    setWidth: function(value) {
        this._eachCell(function($cell) {
            if (value === '') {
                $cell.removeAttr('width');
            }
            else {
                value = (value.search('%') !== -1) ? value : value.replace('px', '');
                $cell.attr('width', value);
            }
        });
    },
    setNowrap: function(value) {
        this._eachCell(function($cell) {
            value = (value) ? 'nowrap' : '';
            $cell.css('white-space', value);
        });
    },

    // handle
    handleArrow: function(e, key, event) {
        var parentInstance;
        if (event.is('up-left') && this.isCaretStart()) {
            e.preventDefault();
            var prev = this.getPrevCell();
            if (prev) {
                this.app.block.set(prev, 'end');
            }
            else {
                parentInstance = this.getParent('table');
                this.app.block.set(parentInstance);
            }

            return true;
        }
        else if (event.is('down-right') && this.isCaretEnd()) {
            e.preventDefault();
            var next = this.getNextCell();
            if (next) {
                this.app.block.set(next, 'start');
            }
            else {
                parentInstance = this.getParent('table');
                this.app.block.set(parentInstance);
            }

            return true;
        }
    },
    handleTab: function(e, key, event) {
        e.preventDefault();

        var next = this.getNextCell();
        if (next) {
            this.app.block.set(next, 'start');
        }
        else {
            var parentInstance = this.getParent('table');
            this.app.block.set(parentInstance);
        }

        return true;
    },
    handleEnter: function(e, key, event) {
        e.preventDefault();
        this.app.insertion.insertBreakline();
        return true;
    },

    // private
    _eachCell: function(func) {
        var index = 0;
        var $table = this.$block.closest('table');

        // index
        this.$block.closest('tr').find('td, th').each(function($node, i) {
            if ($node.get() === this.$block.get()) index = i;
        }.bind(this));

        $table.find('tr').each(function($node) {
            var cell = $node.find('td, th').get(index);
            var $cell = this.dom(cell);

            func($cell);
            //content.cacheBlocksStyle($cell);

        }.bind(this));
    }
});
ArticleEditor.add('block', 'block.code', {
    mixins: ['block'],
    type: 'code',
    editable: true,
    toolbar: {
        'add': { title: '## buttons.add ##', command: 'addbar.popup' }
    },
    control: {
        'trash': { title: '## buttons.delete ##', command: 'block.remove' },
        'duplicate': { title: '## buttons.duplicate ##', command: 'block.duplicate' }
    },
    create: function() {
        return this.dom(this.opts.code.template);
    },
    build: function() {
        this._buildCaption();
        this._buildItems('figcaption', 'figcaption');
    },

    // handle
    handleArrow: function(e, key, event) {
        if (event.is('down-right') && this.isCaretEnd()) {
            var next = this.getNext();
            if (next) {
                this.app.block.set(next, 'start');
                return true;
            }
            else {
                this.app.insertion.insertEmptyBlock({ position: 'after', caret: 'start' });
                return true;
            }
        }
    },
    handleTab: function(e, key, event) {
        e.preventDefault();
        var num = this.opts.code.spaces;
        var node = document.createTextNode(Array(num + 1).join(' '));
        this.app.insertion.insertNode(node, 'end');
        return true;
    },
    handleEnter: function(e, key, event) {
        e.preventDefault();

        var last = this.$block.html().search(/\n$/);


        if (this.isCaretEnd() && last === -1) {
            this.app.insertion.insertNewline('after', true);
        }
        else {
            this.app.insertion.insertNewline();
        }
        return true;
    }
});
ArticleEditor.add('block', 'block.column', {
    mixins: ['block'],
    type: 'column',
    nested: true,
    emptiable: true,
    toolbar: {
        'alignment': { title: '## buttons.align ##', command: 'block.popup', observer: 'block.observe' }
    },
    create: function() {
        return this.dom('<div>');
    }
});
ArticleEditor.add('block', 'block.dlist', {
    mixins: ['block'],
    type: 'dlist',
    editable: true,
    toolbar: {
        'add': { title: '## buttons.add ##', command: 'addbar.popup' },
        'format': { title: '## buttons.format ##', command: 'format.popup' },
        'alignment': { title: '## buttons.align ##', command: 'block.popup', observer: 'block.observe' },
        'bold': { title: '## buttons.bold ##', command: 'inline.set', params: { tag: 'b' } },
        'italic': { title: '## buttons.italic ##', command: 'inline.set', params: { tag: 'i' } },
        'deleted': { title: '## buttons.deleted ##', command: 'inline.set', params: { tag: 'del' } },
        'link': { title: '## buttons.link ##', command: 'link.popup' }
    },
    control: {
        'trash': { title: '## buttons.delete ##', command: 'block.remove' },
        'duplicate': { title: '## buttons.duplicate ##', command: 'block.duplicate' }
    },
    create: function() {
        return this.dom('<dl>');
    },
    getPlainText: function(keepbr) {
        var html = '';
        var $items = this.$block.find('dt, dd');
        var len = $items.length;

        $items.each(function($node, i) {
            var br = (keepbr) ? '<br>' : '';
            if (i === len) br = '';

            html += $node.html() + br;
        });

        return html;
    },
    setEmpty: function() {
        this.$block.html('');

        var $item = this.dom('<dt>');
        this.$block.append($item);
        this.app.caret.set($item, 'start');
    },
    isEmpty: function() {
        var html = this.$block.html();
        html = this._cleanEmpty(html);

        var $items = this.$block.find('dt, dd');
        if ($items.length === 0) {
            html = html.trim();

            return (html === '');
        }
        else if ($items.length === 1) {
            html = $items.eq(0).html();
            html = this._cleanEmpty(html);

            return (html === '');
        }

        return false;

    },

    // handle
    handleEnter: function(e, key, event) {
        e.preventDefault();

        // empty or end
        if (this.isEmpty() || this.isCaretEnd()) {
            var currentItem = this.app.selection.getBlock();
            var $currentItem = this.dom(currentItem);
            var tag = currentItem.tagName.toLowerCase();
            var isItemEmpty = this.app.content.isEmptyHtml(currentItem.innerHTML);

            if (tag === 'dt' && isItemEmpty) {
                // remove empty
                $currentItem.remove();

                // insert
                this.insertEmpty({ position: 'after', caret: 'start' });
                return true;
            }

            // insert dt or dd
            var $newItem;
            if (tag === 'dt') {
                $newItem = this.dom('<dd>');
            }
            else {
                $newItem = this.dom('<dt>');
            }

            this.dom(currentItem).after($newItem);
            this.app.caret.set($newItem, 'start');
        }
        // start
        else if (this.isCaretStart()) {
            return true;
        }
        // middle
        else {
            this.app.insertion.insertBreakline();
        }

        return true;
    }
});
ArticleEditor.add('block', 'block.embed', {
    mixins: ['block'],
    type: 'embed',
    parser: {
        unparse: function($node) {
            var code = decodeURI($node.attr('data-embed-code'));
            var classes = this.opts.embed.responsive.split(' ').join('.');
            var $responsive = $node.find('.' + classes);
            var $el = $node.find('figcaption');
            var $figcaption;
            if ($el.length !== 0) {
                $figcaption = $el.clone();
                $el.remove();
            }

            if ($responsive.length === 0) {
                $node.html(code);
            }
            else {
                $responsive.html(code);
            }

            if ($figcaption) {
                $node.append($figcaption);
            }

            $node.removeAttr('data-embed-code');
        }
    },
    toolbar: {
        'add': { title: '## buttons.add ##', command: 'addbar.popup' },
        'outset': { title: '## buttons.outset ##', command: 'block.popup', observer: 'block.observe' },
        'embed': { title: '## blocks.embed ##', command: 'embed.popup', observer: 'embed.observe' }
    },
    control: {
        'trash': { title: '## buttons.delete ##', command: 'block.remove' },
        'duplicate': { title: '## buttons.duplicate ##', command: 'block.duplicate' }
    },
    create: function() {
        return this.dom('<figure>');
    },
    build: function() {
        this._buildCaption();
        this._buildItems('figcaption', 'figcaption');
        this._buildEmbedCode();
    },
    addResponsive: function() {
        var $responsive = this.dom('<div>').addClass(this.opts.embed.responsive);
        var $figcaption = this.$block.find('figcaption');

        var $cloneFigcaption = $figcaption.clone();
        var html = this.getEmbedCode();
        $figcaption.remove();

        $responsive.html(html);
        this.$block.html('').append($responsive);

        if ($cloneFigcaption.length !== 0) {
            this.app.create('block.figcaption', $cloneFigcaption);
            this.$block.append($cloneFigcaption);
        }

        this._buildEmbedCode();
    },
    removeResponsive: function() {
        this.$block.find(this._getEmbedClass()).unwrap();
    },
    getEmbedCode: function() {
        return decodeURI(this.$block.attr('data-embed-code'));
    },
    isResponsive: function() {
        return (this.$block.find(this._getEmbedClass()).length !== 0);
    },

    // private
    _buildEmbedCode: function() {
        var $clone = this.$block.clone();
        $clone.find(this._getEmbedClass()).unwrap();
        $clone.find('figcaption').remove();

        var code = $clone.html().trim();
        this.$block.attr('data-embed-code', encodeURI(code));
    },
    _getEmbedClass: function() {
        return '.' + this.opts.embed.responsive.replace(/ +/g, '.');
    }
});
ArticleEditor.add('block', 'block.figcaption', {
    mixins: ['block'],
    type: 'figcaption',
    editable: true,
    toolbar: {
        'alignment': { title: '## buttons.align ##', command: 'block.popup', observer: 'block.observe' },
        'bold': { title: '## buttons.bold ##', command: 'inline.set', params: { tag: 'b' } },
        'italic': { title: '## buttons.italic ##', command: 'inline.set', params: { tag: 'i' } },
        'deleted': { title: '## buttons.deleted ##', command: 'inline.set', params: { tag: 'del' } },
        'link': { title: '## buttons.link ##', command: 'link.popup' }
    },
    create: function() {
        return this.dom('<figcaption>');
    },
    getFigure: function() {
        return this.$block.closest('figure').dataget('instance');
    },

    // handle
    handleArrow: function(e, key, event) {
        if ((event.is('up-left') && this.isCaretStart()) || (event.is('down-right') && this.isCaretEnd())) {
            e.preventDefault();
            var parentInstance = this.getFigure();
            this.app.block.set(parentInstance);
            return true;
        }
    },
    handleTab: function(e, key, event) {
        e.preventDefault();
        var parentInstance = this.getFigure();
        this.app.block.set(parentInstance);
        return true;
    },
    handleEnter: function(e, key, event) {
        e.preventDefault();

        // empty or end
        if (this.isEmpty() || this.isCaretEnd() || this.isCaretStart()) {
            return true;
        }
        // middle
        else {
            this.app.insertion.insertBreakline();
        }

        return true;
    }
});
ArticleEditor.add('block', 'block.grid', {
    mixins: ['block'],
    type: 'grid',
    nested: true,
    parser: {
        unparse: function($node) {
            $node.removeClass(this.prefix + '-grid-overlay');
        }
    },
    toolbar: {
        'add': { title: '## buttons.add ##', command: 'addbar.popup' },
        'valign': { title: '## buttons.valign ##', command: 'block.popup', observer: 'block.observe' }
    },
    control: {
        'trash': { title: '## buttons.delete ##', command: 'block.remove' },
        'duplicate': { title: '## buttons.duplicate ##', command: 'block.duplicate' }
    },
    create: function() {
        var $block = this.dom('<div>').addClass(this.opts.grid.classname);
        if (this.opts.grid.classes !== '') {
            $block.addClass(this.opts.grid.classes);
        }

        return $block;
    },
    build: function() {
        this._buildOverlay();
    },

    // privae
    _buildOverlay: function() {
        if (this.opts.grid && this.opts.grid.overlay) {
            this.$block.addClass(this.prefix + '-grid-overlay');
        }
    }
});
ArticleEditor.add('block', 'block.heading', {
    mixins: ['block'],
    type: 'heading',
    editable: true,
    toolbar: {
        'add': { title: '## buttons.add ##', command: 'addbar.popup' },
        'format': { title: '## buttons.format ##', command: 'format.popup' },
        'alignment': { title: '## buttons.align ##', command: 'block.popup', observer: 'block.observe' },
        'bold': { title: '## buttons.bold ##', command: 'inline.set', params: { tag: 'b' } },
        'italic': { title: '## buttons.italic ##', command: 'inline.set', params: { tag: 'i' } },
        'deleted': { title: '## buttons.deleted ##', command: 'inline.set', params: { tag: 'del' } },
        'link': { title: '## buttons.link ##', command: 'link.popup' }
    },
    control: {
        'trash': { title: '## buttons.delete ##', command: 'block.remove' },
        'duplicate': { title: '## buttons.duplicate ##', command: 'block.duplicate' }
    },
    create: function() {
        return this.dom('<h2>');
    },
    getTitle: function() {
        var titles = this.lang.get('headings');
        var tag = this.getTag();
        var title = this.$block.attr('data-title');

        return (typeof titles[tag] !== 'undefined') ? titles[tag] : title;
    },

    // handle
    handleEnter: function(e, key, event) {
        e.preventDefault();

        // empty or end
        if (this.isEmpty() || this.isCaretEnd()) {
            this.insertEmpty({ position: 'after', caret: 'start', remove: false });
        }
        // start
        else if (this.isCaretStart()) {
            this.insert({ instance: this.duplicateEmpty(), position: 'before' });
        }
        // middle
        else {
            var $block = this.getBlock();
            var $part = this.app.element.split($block);
            this.app.block.set($part, 'start');
        }

        return true;
    }
});
ArticleEditor.add('block', 'block.image', {
    mixins: ['block'],
    type: 'image',
    toolbar: {
        'add': { title: '## buttons.add ##', command: 'addbar.popup' },
        'outset': { title: '## buttons.outset ##', command: 'block.popup', observer: 'block.observe' },
        'image': { title: '## blocks.image ##', command: 'image.popup', observer: 'image.observe' }
    },
    control: {
        'trash': { title: '## buttons.delete ##', command: 'block.remove' },
        'duplicate': { title: '## buttons.duplicate ##', command: 'block.duplicate' }
    },
    create: function() {
        return this.dom('<' + this.opts.image.tag + '>');
    },
    build: function() {
        this._buildCaption();
        this._buildItems('figcaption', 'figcaption');

        this.data = {
            'alt': { getter: 'getAlt', setter: 'setAlt' },
            'width': { getter: 'getWidth', setter: 'setWidth' },
            'link': { getter: 'getLinkUrl', setter: 'setLinkUrl' },
            'target': { getter: 'getTarget', setter: 'setTarget' },
            'caption': { getter: 'getCaption', setter: 'setCaption' },
        };
    },
    getImage: function() {
        return this.$block.find('img').eq(0);
    },
    getSrc: function() {
        var $img = this.getImage();

        return $img.attr('src');
    },
    getId: function() {
        var $img = this.getImage();

        return $img.attr('data-image');
    },
    getLink: function() {
        var $link = this.getImage().parent();
        $link = ($link.get().tagName !== 'A') ? false : $link;

        return $link;
    },
    getWidth: function() {
        var $img = this.getImage();
        var width = $img.css('width');
        var value = $img.attr('width');
        if (value && value.search(/%/) !== -1) {
            width = value;
        }
        return width;
    },
    getAlt: function() {
        var $img = this.getImage();
        var alt = $img.attr('alt');

        return (alt) ? alt : '';
    },
    getLinkUrl: function() {
        var $link = this.getLink();
        return ($link) ? $link.attr('href') : '';
    },
    getTarget: function() {
        var $link = this.getLink();
        return ($link) ? $link.attr('target') : this.opts.image.newtab;
    },
    setWidth: function(value) {
        var $img = this.getImage();
        value = value.trim();

        if (value === '') {
            $img.removeAttr('width');
        }
        else {
            var percent = (value.search(/%/) !== -1);
            var width = (percent) ? value : parseInt(value);
            var ratio = $img.width() / $img.height();

            if (percent) {
                $img.removeAttr('height');
                $img.attr({ 'width': width });
            }
            else {
                var height = Math.round(width / ratio);
                $img.attr({ 'width': width, 'height': height });
            }
        }

        $img.css({ 'width': value, 'max-width': value });

        // broadcast
        this.app.broadcast('image.width', { image: $img, width: value });
    },
    setAlt: function(value) {
        var $img = this.getImage();

        value = value.replace(/"/g, "'");
        $img.attr('alt', value);
    },
    setTarget: function(value) {
        var $link = this.getLink();
        if (!$link) return;

        if (value) $link.attr('target', '_blank');
        else $link.removeAttr('target');
    },
    setLinkUrl: function(value) {
        var $link = this.getLink();

        if ($link) {
            if (value !== '') {
                $link.attr('href', value);
            }
            else {
                this.removeLink();

                // broadcast
                this.app.broadcast('image.unlink', { instance: this });
                return;
            }
        }
        else if (!$link) {
            if (value !== '') {
                var $img = this.getImage();
                $link = this.dom('<a>');
                $img.wrap($link);
                $link.attr('href', value);
            }
            else {
                return;
            }
        }

        // broadcast
        this.app.broadcast('image.link', { instance: this, link: $link });
    },
    setImage: function(data) {
        var $img = this.getImage();
        $img.attr('src', data.url);

        if (Object.prototype.hasOwnProperty.call(data, 'id')) $img.attr('data-image', data.id);
        if (Object.prototype.hasOwnProperty.call(data, '2x')) $img.attr('srcset', data['2x'] + ' 2x');

        $img.one('load', this.app.editor.adjustHeight.bind(this.app.editor));
    },
    removeLink: function() {
        var $link = this.getLink();
        if ($link) {
            $link.unwrap();
        }
    }
});
ArticleEditor.add('block', 'block.layer', {
    mixins: ['block'],
    type: 'layer',
    nested: true,
    emptiable: true,
    toolbar: {
        'add': { title: '## buttons.add ##', command: 'addbar.popup' }
    },
    control: {
        'trash': { title: '## buttons.delete ##', command: 'block.remove' },
        'duplicate': { title: '## buttons.duplicate ##', command: 'block.duplicate' }
    },
    create: function() {
        return this.dom(this.opts.layer.template);
    },
    getTitle: function() {
        var title = this.$block.attr('data-title');
        return title || this._getNameByTag();
    }
});
ArticleEditor.add('block', 'block.line', {
    mixins: ['block'],
    type: 'line',
    toolbar: {
        'add': { title: '## buttons.add ##', command: 'addbar.popup' }
    },
    control: {
        'trash': { title: '## buttons.delete ##', command: 'block.remove' },
        'duplicate': { title: '## buttons.duplicate ##', command: 'block.duplicate' }
    },
    create: function() {
        return this.dom('<hr>');
    }
});
ArticleEditor.add('block', 'block.list', {
    mixins: ['block'],
    type: 'list',
    editable: true,
    toolbar: {
        'add': { title: '## buttons.add ##', command: 'addbar.popup' },
        'format': { title: '## buttons.format ##', command: 'format.popup' },
        'alignment': { title: '## buttons.align ##', command: 'block.popup', observer: 'block.observe' },
        'bold': { title: '## buttons.bold ##', command: 'inline.set', params: { tag: 'b' } },
        'italic': { title: '## buttons.italic ##', command: 'inline.set', params: { tag: 'i' } },
        'deleted': { title: '## buttons.deleted ##', command: 'inline.set', params: { tag: 'del' } },
        'outdent': { title: '## buttons.outdent ##', command: 'list.outdent' },
        'indent': { title: '## buttons.indent ##', command: 'list.indent' },
        'link': { title: '## buttons.link ##', command: 'link.popup' }
    },
    control: {
        'trash': { title: '## buttons.delete ##', command: 'block.remove' },
        'duplicate': { title: '## buttons.duplicate ##', command: 'block.duplicate' }
    },
    create: function() {
        return this.dom('<ul>');
    },
    unparse: function($el) {
        this.app.content.unfixListMargin($el);
    },
    setEmpty: function() {
        this.$block.html('');

        var $item = this.dom('<li>');
        this.$block.append($item);
        this.app.caret.set($item, 'start');
    },
    isEmpty: function() {
        var html = this.$block.html();
        html = this._cleanEmpty(html);

        var $items = this.$block.find('li');
        if ($items.length === 0) {
            html = html.trim();

            return (html === '');
        }
        else if ($items.length === 1) {
            html = $items.eq(0).html();
            html = this._cleanEmpty(html);

            return (html === '');
        }

        return false;

    },

    // handle
    handleTab: function(e, key, event) {
        var currentItem = this.app.selection.getBlock();
        var isItemStart = this.app.caret.is(currentItem, 'start');

        if (this.isCaretStart() || this.isCaretEnd()) {
            var next = this.getNext();
            if (next) {
                e.preventDefault();
                this.app.block.set(next, 'start');
                return true;
            }
        }
        else {

            if (this.opts.tab.spaces && !isItemStart) {
                return;
            }

            e.preventDefault();
            this.app.list.indent();
            return true;
        }
    },
    handleEnter: function(e, key, event) {
        e.preventDefault();
        var $newItem, $currentItem, currentItem, isItemEmpty;

        // empty or end
        if (this.isEmpty() || this.isCaretEnd()) {

            currentItem = this.app.selection.getBlock();
            $currentItem = this.dom(currentItem);
            isItemEmpty = this.app.content.isEmptyHtml(currentItem.innerHTML);

            // list exit
            if (isItemEmpty) {
                // remove empty
                $currentItem.remove();

                // insert
                this.insertEmpty({ position: 'after', caret: 'start' });
                return true;
            }

            // insert li
            $newItem = this.dom('<li>');

            this.app.element.cloneAttrs(currentItem, $newItem);
            this.dom(currentItem).after($newItem);
            this.app.caret.set($newItem, 'start');
        }
        // start
        else if (this.isCaretStart()) {
            $newItem = this.dom('<li>');
            currentItem = this.app.selection.getBlock();

            this.app.element.cloneAttrs(currentItem, $newItem);
            this.dom(currentItem).before($newItem);
        }
        // middle
        else {
            currentItem = this.app.selection.getBlock();
            $currentItem = this.dom(currentItem);
            isItemEmpty = this.app.content.isEmptyHtml(currentItem.innerHTML);

            var isItemStart = this.app.caret.is(currentItem, 'start');
            var isItemEnd = this.app.caret.is(currentItem, 'end', ['ul', 'ol']);

            $newItem = this.dom('<li>');
            this.app.element.cloneAttrs(currentItem, $newItem);

            // empty
            if (isItemEmpty) {
                $currentItem.after($newItem);
                this.app.caret.set($newItem, 'start');
            }
            // start
            else if (isItemStart) {
                $currentItem.before($newItem);
            }
            // end
            else if (isItemEnd) {
                var $listInside = $currentItem.find('ul, ol').first();
                if ($listInside.length !== 0) {
                    $newItem.append(this.app.utils.createInvisibleChar());
                    $newItem.append($listInside);
                    $currentItem.after($newItem);
                }
                else {
                    $currentItem.after($newItem);
                }

                this.app.caret.set($newItem, 'start');
            }
            // middle
            else {
                var $part = this.app.element.split(currentItem);
                $newItem = $part;
                this.app.caret.set($part, 'start');
            }
        }

        // event
        this.app.broadcast('list.item', { element: $newItem });

        return true;
    }
});
ArticleEditor.add('block', 'block.noneditable', {
    mixins: ['block'],
    type: 'noneditable',
    toolbar: {
        'add': { title: '## buttons.add ##', command: 'addbar.popup' }
    },
    control: {
        'trash': { title: '## buttons.delete ##', command: 'block.remove' },
        'duplicate': { title: '## buttons.duplicate ##', command: 'block.duplicate' }
    },
    create: function() {
        return this.dom('<div>').addClass(this.opts.noneditable.classname);
    }
});
ArticleEditor.add('block', 'block.quote', {
    mixins: ['block'],
    type: 'quote',
    toolbar: {
        'add': { title: '## buttons.add ##', command: 'addbar.popup' }
    },
    control: {
        'trash': { title: '## buttons.delete ##', command: 'block.remove' },
        'duplicate': { title: '## buttons.duplicate ##', command: 'block.duplicate' }
    },
    create: function() {
        return this.dom(this.opts.quote.template);
    },
    build: function() {
        this._buildCaption();
        this._buildItems('p', 'quoteitem');
        this._buildItems('figcaption', 'figcaption');
    }
});
ArticleEditor.add('block', 'block.quoteitem', {
    mixins: ['block'],
    type: 'quoteitem',
    editable: true,
    toolbar: {
        'alignment': { title: '## buttons.align ##', command: 'block.popup', observer: 'block.observe' },
        'bold': { title: '## buttons.bold ##', command: 'inline.set', params: { tag: 'b' } },
        'italic': { title: '## buttons.italic ##', command: 'inline.set', params: { tag: 'i' } },
        'deleted': { title: '## buttons.deleted ##', command: 'inline.set', params: { tag: 'del' } },
        'link': { title: '## buttons.link ##', command: 'link.popup' }
    },
    create: function() {
        return this.dom('<p>');
    },
    getBlockquote: function() {
        return this.$block.closest('blockquote');
    },

    // handle
    handleArrow: function(e, key, event) {
        var $blockquote = this.getBlockquote();
        if ($blockquote.length === 0) return;

        var isStart = this.app.caret.is($blockquote, 'start');
        var isEnd = this.app.caret.is($blockquote, 'end');

        if ((event.is('up-left') && isStart) || (event.is('down-right') && isEnd)) {
            e.preventDefault();
            var parentInstance = this.getParent('quote');
            this.app.block.set(parentInstance);
            return true;
        }
    },
    handleTab: function(e, key, event) {
        e.preventDefault();
        var next = this.getNext();
        if (next) {
            this.app.block.set(next, 'start');
            return true;
        }
        else {
            var quote = this.getParent('quote');
            this.app.block.set(quote);
            return true;
        }
    },
    handleEnter: function(e, key, event) {
        e.preventDefault();

        // prepare new instance
        var newInstance = this.app.create('block.quoteitem');

        // empty or end
        if (this.isEmpty() || this.isCaretEnd()) {
            this.insert({ instance: newInstance, position: 'after', caret: 'start' });
        }
        // start
        else if (this.isCaretStart()) {
            this.insert({ instance: newInstance, position: 'before' });
        }
        // middle
        else {
            var $block = this.getBlock();
            var $part = this.app.element.split($block);
            this.app.block.set($part, 'start');
        }

        return true;
    }
});
ArticleEditor.add('block', 'block.row', {
    mixins: ['block'],
    type: 'row',
    toolbar: {
        'table': { title: '## blocks.table ##', command: 'table.add', observer: 'table.observe' }
    },
    create: function() {
        return this.dom('<tr>');
    },
    getNextRow: function() {
        var row = this.getNext();
        var $parent = this.$block.parent();
        if (!row && $parent.get().tagName !== 'TABLE') {
            row = $parent.nextElement().find('tr').first().dataget('instance');
        }

        return row;
    },
    getPrevRow: function() {
        var row = this.getPrev();
        var $parent = this.$block.parent();
        if (!row && $parent.get().tagName !== 'TABLE') {
            row = $parent.prevElement().find('tr').last().dataget('instance');
        }

        return row;
    },

    // handle
    handleDelete: function(e, key, event) {
        e.preventDefault();
        return true;
    },
    handleArrow: function(e, key, event) {
        e.preventDefault();

        if (event.is('up-left')) {
            var parentInstance = this.getParent('table');
            this.app.block.set(parentInstance);
        }
        else {
            var cellInstance = this.getChildFirst('cell');
            this.app.block.set(cellInstance, 'start');
        }

        return true;
    },
    handleTab: function(e, key, event) {
        e.preventDefault();

        var next = this.getNextRow();
        if (next) {
            this.app.block.set(next);
        }
        else {
            var parentInstance = this.getParent('table');
            this.app.block.set(parentInstance);
        }

        return true;
    },
    handleEnter: function(e, key, event) {
        e.preventDefault();
        return true;
    }
});
ArticleEditor.add('block', 'block.table', {
    mixins: ['block'],
    type: 'table',
    toolbar: {
        'add': { title: '## buttons.add ##', command: 'addbar.popup' },
        'table': { title: '## blocks.table ##', command: 'table.add', observer: 'table.observe' }
    },
    control: {
        'trash': { title: '## buttons.delete ##', command: 'block.remove' },
        'duplicate': { title: '## buttons.duplicate ##', command: 'block.duplicate' }
    },
    create: function() {
        return this.dom(this.opts.table.template);
    },
    build: function() {
        this._buildItems('tr', 'row');
        this._buildItems('td, th', 'cell');
    },
    getFirstCell: function() {
        var $cell = this.$block.find('th, td').first();
        if ($cell.length !== 0) {
            return $cell.dataget('instance');
        }
    }
});
ArticleEditor.add('block', 'block.variable', {
    mixins: ['block'],
    type: 'variable',
    editable: false,
    inline: true,
    toolbar: {
        'add': { title: '## buttons.add ##', command: 'addbar.popup' }
    },
    create: function() {
        return this.dom('<span>').addClass(this.opts.variable.classname);
    },
    build: function() {
        this.$block.addClass(this.opts.variable.classname);
    }
});
ArticleEditor.add('block', 'block.form', {
    mixins: ['block'],
    type: 'form',
    create: function() {
        return this.dom('<form>');
    },
    toolbar: {
        'add': { title: '## buttons.add ##', command: 'addbar.popup' }
    },
    control: {
        trash: { command: 'block.remove', title: '## buttons.delete ##' },
        duplicate: { command: 'block.duplicate', title: '## buttons.duplicate ##'  }
    }
});
ArticleEditor.add('block', 'block.card', {
    mixins: ['block'],
    type: 'card',
    editable: true,
    toolbar: {
        'add': { title: '## buttons.add ##', command: 'addbar.popup' },
        'bold': { title: '## buttons.bold ##', command: 'inline.set', params: { tag: 'b' } },
        'italic': { title: '## buttons.italic ##', command: 'inline.set', params: { tag: 'i' } },
        'deleted': { title: '## buttons.deleted ##', command: 'inline.set', params: { tag: 'del' } },
        'link': { title: '## buttons.link ##', command: 'link.popup' },
        'image': { title: '## buttons.settings ##', command: 'image.editCard', observer: 'block.observeCard' }
    },
    control: {
        'trash': { title: '## buttons.delete ##', command: 'block.remove' },
        'duplicate': { title: '## buttons.duplicate ##', command: 'block.duplicate' }
    },
    create: function() {
        return this.dom(this.opts.card.template);
    },
    build: function() {
        this.data = {
            'alt': { getter: 'getAlt', setter: 'setAlt' }
        };
    },
    hasImage: function() {
        return (this.$block.find('img').length !== 0);
    },
    getImage: function() {
        return this.$block.find('img').eq(0);
    },
    getAlt: function() {
        var $img = this.getImage();
        var alt = $img.attr('alt');

        return (alt) ? alt : '';
    },
    setAlt: function(value) {
        var $img = this.getImage();
        $img.attr('alt', value);
    },
    setImage: function(data) {
        var $img = this.getImage();
        $img.attr('src', data.url);
        if (Object.prototype.hasOwnProperty.call(data, 'id')) {
            $img.attr('data-image', data.id);
        }

        $img.one('load', this.app.editor.adjustHeight.bind(this.app.editor));
    },

    // handle
    handleEnter: function(e, key, event) {
        e.preventDefault();
        this.app.insertion.insertBreakline();
        return true;
    }
});

    window.ArticleEditor = ArticleEditor;

    // Data attribute load
    window.addEventListener('load', function() {
        ArticleEditor('[data-article-editor]');
    });

    // Export for webpack
    if (typeof module === 'object' && module.exports) {
        module.exports = ArticleEditor;
        module.exports.ArticleEditor = ArticleEditor;
    }
}());