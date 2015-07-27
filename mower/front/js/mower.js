/*!
 * mower - v1.1.1 - 2015-07-24
 * Copyright (c) 2015 Infinitus, Inc.
 * Licensed under Apache License 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 */

if (typeof jQuery === 'undefined') { throw new Error('mower\'s JavaScript requires jQuery') }

/** ========================================================================
 * Mower: string.mower.js
 *
 * string uitility
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

var UniqueId = (function() {
    return function(prefix) {
        do prefix += ~~(Math.random() * 1000000)
        while (document.getElementById(prefix))
        return prefix;
    };
})();

//返回一个树形的根集合，对原有的数组顺序不改变，但会增加parent和children两个属性
Array.prototype.makeLevelTree = function(option) {
    var o = option || {},
        id = o.id || 'id',
        pid = o.pid || 'pid',
        order = o.order || 'ordered';

    function node(origin) {
        var self = this;
        self.origin = origin;
        self.getKey = function() {
            if (self.key) {
                return self.key;
            }
            self.key = [];
            self.key.push(getOrder(self.origin));
            self.key.push(getId(self.origin));
            if (self.parent) {
                var pkey = self.parent.getKey();
                for (var i = pkey.length - 1; i >= 0; i--) {
                    self.key.unshift(pkey[i]);
                }
            }
            return self.key;
        };
        self.compare2 = function(other) {
            var lk = self.getKey(),
                rk = other.getKey(),
                loop = Math.min(lk.length, rk.length);
            for (var i = 0; i < loop; i++) {
                if (typeof(lk[i]) == 'undefined' || typeof(rk[i]) == 'undefined') {
                    break;
                }
                if (lk[i] != rk[i]) {
                    var diff = (lk[i] + '').length - (rk[i] + '').length;
                    return diff == 0 ? (lk[i] > rk[i] ? 1 : -1) : (diff > 0 ? 1 : -1);
                }
            }
            return lk.length > rk.length ? 1 : -1;
        };
    }

    function getId(m) {
        if (typeof(id) == 'function') {
            return id(m) || 0;
        }
        return m[id] || 0;
    }

    function getPid(m) {
        if (typeof(pid) == 'function') {
            return pid(m) || 0;
        }
        return m[pid] || 0;
    }

    function getOrder(m) {
        if (typeof(order) == 'function') {
            return order(m) || 0;
        }
        return m[order] || 0;
    }

    var tmpNodes = [],
        sorted = [],
        root = [];
    // add children attribute 
    for (var i = 0; i < this.length; i++) {
        var cur = this[i];
        if (cur != null) {
            cur.children = [];
            tmpNodes['$' + getId(cur)] = new node(cur);
        }
    }
    for (var i = 0; i < this.length; i++) {
        var cur = this[i];
        if (cur != null) {
            var parent = tmpNodes['$' + getPid(cur)];
            if (parent) {
                tmpNodes['$' + getId(cur)].parent = parent;
                cur.parent = parent.origin;
            }
            sorted.push(cur);
        }
    }

    sorted.sort(function(l, r) {
        return tmpNodes['$' + getId(l)].compare2(tmpNodes['$' + getId(r)]);
    });

    tmpNodes = [];
    for (var i = 0; i < sorted.length; i++) {
        var cur = sorted[i];
        if (cur.parent) {
            cur.parent.children.push(cur);
        } else {
            root.push(cur);
        }

        tmpNodes[cur.code] = cur;
    }

    sorted = [];
    return {
        "tree": root,
        "nodes": tmpNodes
    };
};

Date.prototype.setISO8601 = function(string) {
    if (!string) {
        return;
    }
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" + "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" + "(Z|(([-+])([0-9]{2}):?([0-9]{2})))?)?)?)?";
    var d = string.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) {
        date.setMonth(d[3] - 1);
    }
    if (d[5]) {
        date.setDate(d[5]);
    }
    if (d[7]) {
        date.setHours(d[7]);
    }
    if (d[8]) {
        date.setMinutes(d[8]);
    }
    if (d[10]) {
        date.setSeconds(d[10]);
    }
    if (d[12]) {
        date.setMilliseconds(Number("0." + d[12]) * 1000);
    }
    if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
    }
    offset -= date.getTimezoneOffset();
    time = (Number(date) + (offset * 60 * 1000));
    this.setTime(Number(time));
};

/** 获取介于之间的数值 */
Number.prototype.limit = function(min, max) {
    return (this < min) ? min : (this > max ? max : this);
};

/** 匹配与字符串相同的split方法 */
Number.prototype.split = function() {
    return [this];
};


(function(uuid, $, window, document, undefined) {

    var _update = function(html, container) {
        var $this = $(html),
            $container = $(container),
            id = $this.attr('id'),
            ajaxId = $this.attr('data-uuid');

        if (id) {
            var existed = $container.find('#' + id);
            if (existed.exists()) {
                $container.find('#' + id).html($this.html())
                    .attr('base', $this.attr('base'))
                    .attr('data-uuid', ajaxId);
                $this = existed;
            } else {
                $container.html($this.html())
                    .attr('base', $this.attr('base'))
                    .attr('data-uuid', ajaxId);
                $this = $container;
            }

            ajaxId && $this.on("remove", function() {
                $('html').find('[data-ref-target="' + this.attr('data-uuid') + '"]').remove();
            });
        }
    };

    var _replace = function(html, container) {
        var $this = $(html),
            $container = $(container),
            id = $this.attr('id'),
            ajaxId = $this.attr('data-uuid');

        if (id) {
            $this.attr('data-uuid', ajaxId);

            var existed = $container.find('#' + id);
            if (existed.exists()) {
                $container.find('#' + id).replaceWith($this);
            } else {
                $container.replaceWith($this);
            }

            ajaxId && $this.on("remove", function() {
                $('html').find('[data-ref-target="' + this.attr('data-uuid') + '"]').remove();
            });
        }
    };

    var _append = function(html, container) {
        var $this = $(html),
            $container = $(container),
            id = $this.attr('id'),
            ajaxId = $this.attr('data-uuid');

        $this.attr('data-uuid', ajaxId);

        if (id && $container.find('#' + id).length > 0) {
            $container.find('#' + id).append($this);
        } else {
            $container.append($this);
        }

        ajaxId && $this.on("remove", function() {
            $('html').find('[data-ref-target="' + $this.attr('data-uuid') + '"]').remove();
        });
    };

    $.fn.extend({
        /** 获取该元素所隶属的应用上下文信息 */
        getContextPath: function() {
            if (typeof base == "undefined") {
                var base = '/';
            }

            try {
                var closest = $(this).closest('[data-base]');
                if (closest != null && closest.size()) {
                    return closest.attr('data-base') || base;
                }
                return base;
            } catch (e) {
                return base;
            }
        },
        /** 检测是否存在 */
        exists: function() {
            return $(this) && $(this).size() > 0;
        },
        /** 获取(padding+border+margin)高度 */
        patchHeight: function() {
            return $(this).outerHeight(true) - $(this).height();
        },
        /** 获取(padding+border+margin)宽度 */
        patchWidth: function() {
            return $(this).outerWidth(true) - $(this).width();
        },
        /** 获取元素的scrollHeight */
        scrollHeight: function() {
            return $(this)[0].scrollHeight;
        },
        center: function(parent) {
            var $parent = $(parent || window);
            var winHeight = $parent.height(),
                itemHeight = $(this).height(),
                calHeight = (winHeight - itemHeight) / 2;
            var winWidth = $parent.width(),
                itemWidth = $(this).width(),
                calWidth = (winWidth - itemWidth) / 2;
            return $(this).css({
                'top': (calHeight > 20 ? calHeight / 3 : 0),
                'left': (calWidth > 20 ? calWidth : 0)
            });
        },
        /** 显示元素 */
        showme: function() {
            return $(this).css({
                'display': 'block',
                'visibility': 'visible'
            });
        },
        /** 隐藏元素 */
        hideme: function() {
            return $(this).css({
                'display': 'none',
                'visibility': 'hidden'
            });
        },
        /** 设置元素为相同高度，高度按指定或元素中最大高度为准 */
        sameHeight: function(height) {
            var max = height || -1;
            if (max < 0) {
                $(this).each(function() {
                    max = Math.max($(this).height(), max);
                });
            }
            return $(this).css('min-height', max);
        },
        /** 设置元素为相同宽度，宽度按指定或元素中最大宽度为准 */
        sameWidth: function(width) {
            var max = width || -1;
            if (max < 0) {
                $(this).each(function() {
                    max = Math.max($(this).width(), max);
                });
            }
            return $(this).css('min-width', max);
        },
        alignFollow: function($el) {
            var $wrapper = $(this);
            var p = $el.position();
            var $parent = $el.offsetParent();
            var scrollTop = $parent.scrollTop();
            var scrollLeft = $parent.scrollLeft();
            var mainWidth = $parent.width();
            var mainHeight = $parent.height();

            var elTop = p.top + scrollTop;
            var elLeft = p.left + scrollLeft;
            var elBottom = elTop + $el.outerHeight(true);
            var elRight = elLeft + $el.outerWidth(true);

            var wrapperTop = elBottom;
            var wrapperLeft = elLeft;

            var wrapperHeight = $wrapper.outerHeight(true);
            var wrapperWidth = $wrapper.outerWidth(true);

            var wrapperTop1 = elTop - wrapperHeight;
            var wrapperLeft1 = elRight - wrapperWidth;

            $wrapper.css({
                top: wrapperTop + wrapperHeight - scrollTop < mainHeight ? wrapperTop + 'px' : wrapperTop1 + 'px',
                left: wrapperLeft + wrapperWidth - scrollLeft < mainWidth ? wrapperLeft + 'px' : wrapperLeft1 + 'px'
            });
        },
        cloneAttr: function(source) {
            var self = this,
                cloneAttrs = ['style', 'class'];
            $.each(cloneAttrs, function(index, value) {
                self.attr(value, $(source).attr(value) || '');
            });
            return this;
        },
        setChecked: function(bool) {
            if ($.isFunction($.prop)) {
                $(this).prop('checked', bool);
            } else {
                $(this).attr('checked', bool);
            }
            return this;
        },
        getChecked: function() {
            if ($.isFunction($.prop)) {
                return $(this).prop('checked');
            }
            return $(this).attr('checked');
        },
        callEvent: function(func, event, proxy)
        {
            if ($.isFunction(func))
            {
                if (typeof proxy != 'undefined')
                {
                    func = $.proxy(func, proxy);
                }
                var result = func(event);
                if(event) event.result = result;
                return !(result !== undefined && (!result));
            }
            return 1;
        },
        updateRegions: function(url, ajaxOptions, updates, callback) {
            var self = $(this),
                s = {};
            s = $.extend({
                url: url,
                dataType: 'html',
                success: function(data, status, xhr) {
                    var ct = xhr.getResponseHeader('content-type') || '';
                    if (ct.indexOf('json') > -1) {
                        self.trigger('ajaxError', [xhr, s]);
                        return;
                    }
                    var $html = $(data),
                        $region = self;
                    if (updates && updates.length) {
                        for (var i = updates.length - 1; i >= 0; i--) {
                            var selector = updates[i],
                                $region2;
                            if ($.type(selector) == 'string') {
                                $region2 = self.find(selector);
                            } else {
                                $region2 = $(selector);
                                selector = $region2.selector;
                            }
                            var htmlpart = $html.filter(selector);
                            if (htmlpart.exists()) {
                                $region2.html(htmlpart.html());
                            }
                        }
                        var titlepart = $html.filter('title');
                        if (titlepart.exists()) {
                            document.title = titlepart.text();
                        }
                        $region.append($html.filter('script'));
                    } else {
                        self.html(data);
                    }
                    if (callback && $.isFunction(callback)) {
                        callback.apply(self);
                    }
                    $(window).trigger('resize');
                }
            }, ajaxOptions || {});
            $.ajax(s);
        },
        updateAjaxContents: function(url, ajaxOptions, callback, isScrollTop) {
            $(this)._privateProcessContents(url, ajaxOptions, _update, callback, isScrollTop);
        },
        replaceAjaxContents: function(url, ajaxOptions, callback, isScrollTop) {
            $(this)._privateProcessContents(url, ajaxOptions, _replace, callback, isScrollTop);
        },
        appendAjaxContents: function(url, ajaxOptions, callback, isScrollTop) {
            $(this)._privateProcessContents(url, ajaxOptions, _append, callback, isScrollTop);
        },
        updateHtml: function(data, action, callback) {
            var self = $(this),
                $html = $(data),
                ajaxId = uuid('ajax-uid-');

            //update title
            var titlepart = $html.filter('title');
            if (titlepart.exists()) {
                document.title = titlepart.text();
            }

            //update version
            var version = $html.filter('meta');
            if (version.exists()) {
                $('meta[name=version]', document).attr('content', version.attr('content'));
            }

            var exclude = ':not(meta,title)';
            //update content
            $($.parseHTML(data)).filter(exclude).each(function() {
                !$(this).attr('data-uuid') && $(this).attr('data-uuid', ajaxId);
                action && $.isFunction(action) && action(this, self);
            });

            //reinit document ready function in the new fragment 
            $(document).triggerHandler('update', self);

            //update javascript 
            $html.filter('script').each(function() {
                var $script = $(this);
                var id = $script.attr('id');
                if (id) {
                    self.find('#' + id).remove();
                }
                if(!$script.attr('data-ref-target')) $script.attr('data-ref-target', ajaxId);
                self.append($script);
            });

            //process call back
            if ($.isFunction(callback)) {
                callback.apply(self, [true,data]);
            }

            return self; //keep chain
        },
        _privateProcessContents: function(url, ajaxOptions, action, callback, isScrollTop) {
            var self = $(this),
                s = {},
                handleError = function(){
                    if (callback && $.isFunction(callback)) {
                        callback.apply(self, [false]);
                    }
                };

            s = $.extend({
                url: url,
                dataType: 'html',
                beforeSend: function() {
                    self.children().addClass('hidden');
                    self.append('<h2 class="_loadmask"><i class="fa fa-spinner fa-pulse"></i></h2>');
                    if (isScrollTop === true) {
                        // scroll up
                        $("html").animate({
                            scrollTop: 0
                        }, "fast");
                    }
                },
                success: function(data, status, xhr) {
                    var ct = xhr.getResponseHeader('content-type') || '';
                    if (ct.indexOf('json') > -1) {
                        handleError();
                        self.trigger('ajaxError', [xhr, s]);
                        return;
                    }
                    try{
                        self.css({
                            opacity: '0.0'
                        }).updateHtml(data, action, callback).delay(50).animate({
                            opacity: '1.0'
                        }, 300);

                        $(window).trigger('resize');
                    }catch(e){
                        handleError();
                    }
                },
                error: function(xhr, ajaxOptions, thrownError) {
                    handleError();
                },
                complete:function( xhr, status){
                    self.find('h2._loadmask').remove();
                    self.children().removeClass('hidden');
                }
            }, ajaxOptions || {});
            $.ajax(s);
        }
    });

}(UniqueId || {}, jQuery, window, document));

var JSON = (function(json) {

    json.useHasOwn = ({}.hasOwnProperty ? true : false);

    json.pad = function(n) {
        return n < 10 ? "0" + n : n;
    };

    json.m = {
        "\b": '\\b',
        "\t": '\\t',
        "\n": '\\n',
        "\f": '\\f',
        "\r": '\\r',
        '"': '\\"',
        "\\": '\\\\'
    };

    json.encodeString = function(s) {
        if (/["\\\x00-\x1f]/.test(s)) {
            return '"' + s.replace(/([\x00-\x1f\\"])/g, function(a, b) {
                var c = m[b];
                if (c) {
                    return c;
                }
                c = b.charCodeAt();
                return "\\u00" + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
            }) + '"';
        }
        return '"' + s + '"';
    };

    json.encodeArray = function(o) {
        var a = ["["],
            b = false,
            i, l = o.length,
            v;
        for (i = 0; i < l; i += 1) {
            v = o[i];
            switch (typeof v) {
                case "undefined":
                case "function":
                case "unknown":
                    break;
                default:
                    if (b) {
                        a.push(',');
                    }
                    a.push(v === null ? "null" : this.encode(v));
                    b = true;
            }
        }
        a.push("]");
        return a.join("");
    };

    json.ncodeDate = function(o) {
        return '"' + o.getFullYear() + "-" + pad(o.getMonth() + 1) + "-" + pad(o.getDate()) + "T" + pad(o.getHours()) + ":" + pad(o.getMinutes()) + ":" + pad(o.getSeconds()) + '"';
    };

    json.encode = function(o) {
        if (typeof o == "undefined" || o === null) {
            return "null";
        } else if (o instanceof Array) {
            return this.encodeArray(o);
        } else if (o instanceof Date) {
            return this.encodeDate(o);
        } else if (typeof o == "string") {
            return this.encodeString(o);
        } else if (typeof o == "number") {
            return isFinite(o) ? String(o) : "null";
        } else if (typeof o == "boolean") {
            return String(o);
        } else {
            var self = this;
            var a = ["{"],
                b, i, v;
            for (i in o) {
                if (!this.useHasOwn || o.hasOwnProperty(i)) {
                    v = o[i];
                    switch (typeof v) {
                        case "undefined":
                        case "function":
                        case "unknown":
                            break;
                        default:
                            if (b) {
                                a.push(',');
                            }
                            a.push(self.encode(i), ":", v === null ? "null" : self.encode(v));
                            b = true;
                    }
                }
            }
            a.push("}");
            return a.join("");
        }
    };

    json.decode = function(json) {
        return (new Function('return ' + json))();
    }

    return json;

}(JSON || {}));

var Utils = (function($, window, document, undefined) {

    // private functions & variables

    // IE mode
    var isIE8 = false;
    var isIE9 = false;
    var isIE10 = false;

    var resizeHandlers = [];

    // initializes main settings
    var handleInit = function() {

        isIE8 = !!navigator.userAgent.match(/MSIE 8.0/);
        isIE9 = !!navigator.userAgent.match(/MSIE 9.0/);
        isIE10 = !!navigator.userAgent.match(/MSIE 10.0/);

        if (isIE10) {
            $('html').addClass('ie10'); // detect IE10 version
        }

        if (isIE10 || isIE9 || isIE8) {
            $('html').addClass('ie'); // detect IE10 version
        }
    };

    // runs callback functions set by Utils.addResizeHandler().
    var _runResizeHandlers = function() {
        // reinitialize other subscribed elements
        for (var i = 0; i < resizeHandlers.length; i++) {
            var each = resizeHandlers[i];
            each.call();
        }
    };

    // handle the layout reinitialization on window resize
    var handleOnResize = function() {
        var resize;
        if (isIE8) {
            var currheight;
            $(window).resize(function() {
                if (currheight == document.documentElement.clientHeight) {
                    return; //quite event since only body resized not window.
                }
                if (resize) {
                    clearTimeout(resize);
                }
                resize = setTimeout(function() {
                    _runResizeHandlers();
                }, 50); // wait 50ms until window resize finishes.                
                currheight = document.documentElement.clientHeight; // store last body client height
            });
        } else {
            $(window).resize(function() {
                if (resize) {
                    clearTimeout(resize);
                }
                resize = setTimeout(function() {
                    _runResizeHandlers();
                }, 50); // wait 50ms until window resize finishes.
            });
        }
    };


    // public functions
    return {

        //main function to initiate the theme
        init: function() {
            //IMPORTANT!!!: Do not modify the core handlers call order.

            handleInit(); // initialize core variables
            handleOnResize(); // set and handle responsive    
        },
        executeFunction: function(functionName /*, args */ ) {
            var args = Array.prototype.slice.call(arguments, 1);
            if ('function' === typeof functionName) {
                return functionName.apply(this, args);
            } else if ('string' === typeof functionName) {
                if ('()' === functionName.substring(functionName.length - 2)) {
                    functionName = functionName.substring(0, functionName.length - 2);
                }
                var ns      = functionName.split('.'),
                    func    = ns.pop(),
                    context = window;
                for (var i = 0; i < ns.length; i++) {
                    context = context[ns[i]];
                }

                return (typeof context[func] === 'undefined') ? null : context[func].apply(this, args);
            }
        },
        getAbsoluteUrl: function(url, contextPath) {
            if (url.indexOf('://') >= 0) {
                return url;
            }
            if (url.charAt(0) != '/') {
                url = '/' + url;
            }

            var root = (contextPath || base);
            return url.startWith(root) ? url : root + url;
        },
        //public function to get a paremeter by name from URL
        getURLParameter: function(paramName) {
            var searchString = window.location.search.substring(1),
                i, val, params = searchString.split("&");

            for (i = 0; i < params.length; i++) {
                val = params[i].split("=");
                if (val[0] == paramName) {
                    return unescape(val[1]);
                }
            }
            return null;
        },
        // To get the correct viewport width based on  http://andylangton.co.uk/articles/javascript/get-viewport-size-javascript/
        getViewPort: function() {
            var e = window,
                a = 'inner';
            if (!('innerWidth' in window)) {
                a = 'client';
                e = document.documentElement || document.body;
            }

            return {
                width: e[a + 'Width'],
                height: e[a + 'Height']
            };
        },
        //public function to add callback a function which will be called on window resize
        addResizeHandler: function(func) {
            resizeHandlers.push(func);
        },
        //public functon to call _runresizeHandlers
        runResizeHandlers: function() {
            _runResizeHandlers();
        },
        getResponsiveBreakpoint: function(size) {
            // bootstrap responsive breakpoints
            var sizes = {
                'xs': 480, // extra small
                'sm': 768, // small
                'md': 992, // medium
                'lg': 1200 // large
            };

            return sizes[size] ? sizes[size] : 0;
        },
        strToJson: function(str) {
            var json = (new Function("return " + str))();
            return json;
        },
        // check IE8 mode
        isIE8: function() {
            return isIE8;
        },
        // check IE9 mode
        isIE9: function() {
            return isIE9;
        },
        isMsie: function() {
            return /(msie|trident)/i.test(navigator.userAgent) ? navigator.userAgent.match(/(msie |rv:)(\d+(.\d+)?)/i)[2] : false;
        },
        isBlankString: function(str) {
            return !str || /^\s*$/.test(str);
        },
        escapeRegExChars: function(str) {
            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        },
        isString: function(obj) {
            return typeof obj === "string";
        },
        isNumber: function(obj) {
            return typeof obj === "number";
        },
        isArray: $.isArray,
        isFunction: $.isFunction,
        isObject: $.isPlainObject,
        isUndefined: function(obj) {
            return typeof obj === "undefined";
        },
        toStr: function toStr(s) {
            return _.isUndefined(s) || s === null ? "" : s + "";
        },
        bind: $.proxy,
        each: function(collection, cb) {
            $.each(collection, reverseArgs);

            function reverseArgs(index, value) {
                return cb(value, index);
            }
        },
        map: $.map,
        filter: $.grep,
        every: function(obj, test) {
            var result = true;
            if (!obj) {
                return result;
            }
            $.each(obj, function(key, val) {
                if (!(result = test.call(null, val, key, obj))) {
                    return false;
                }
            });
            return !!result;
        },
        some: function(obj, test) {
            var result = false;
            if (!obj) {
                return result;
            }
            $.each(obj, function(key, val) {
                if (result = test.call(null, val, key, obj)) {
                    return false;
                }
            });
            return !!result;
        },
        mixin: $.extend,
        templatify: function templatify(obj) {
            return $.isFunction(obj) ? obj : template;

            function template() {
                return String(obj);
            }
        },
        defer: function(fn) {
            setTimeout(fn, 0);
        },
        debounce: function(func, wait, immediate) {
            var timeout, result;
            return function() {
                var context = this,
                    args = arguments,
                    later, callNow;
                later = function() {
                    timeout = null;
                    if (!immediate) {
                        result = func.apply(context, args);
                    }
                };
                callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) {
                    result = func.apply(context, args);
                }
                return result;
            };
        },
        throttle: function(func, wait) {
            var context, args, timeout, result, previous, later;
            previous = 0;
            later = function() {
                previous = new Date();
                timeout = null;
                result = func.apply(context, args);
            };
            return function() {
                var now = new Date(),
                    remaining = wait - (now - previous);
                context = this;
                args = arguments;
                if (remaining <= 0) {
                    clearTimeout(timeout);
                    timeout = null;
                    previous = now;
                    result = func.apply(context, args);
                } else if (!timeout) {
                    timeout = setTimeout(later, remaining);
                }
                return result;
            };
        },
        noop: function() {},
        scrollTo: function(el, offeset) {
            var pos = (el && el.size() > 0) ? el.offset().top : 0;

            if (el) {
                //caution: if use boostrap navbar-fixed-top,substract it's height.

                pos = pos + (offeset ? offeset : -1 * el.height());
            }

            $('html,body').animate({
                scrollTop: pos
            }, 'slow');
        }
    };

}(jQuery, window, document));

$(function() {
    Utils.init();
});

;/** ========================================================================
 * Mower: utils.mower.js - v1.0.0
 *
 * utility
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */


(function()
{
    'use strict';

    String.prototype.format = function(args)
    {
        var result = this;
        if (arguments.length > 0)
        {
            var reg;
            if (arguments.length == 1 && typeof(args) == "object")
            {
                for (var key in args)
                {
                    if (args[key] !== undefined)
                    {
                        reg = new RegExp("({" + key + "})", "g");
                        result = result.replace(reg, args[key]);
                    }
                }
            }
            else
            {
                for (var i = 0; i < arguments.length; i++)
                {
                    if (arguments[i] !== undefined)
                    {
                        reg = new RegExp("({[" + i + "]})", "g");
                        result = result.replace(reg, arguments[i]);
                    }
                }
            }
        }
        return result;
    };


    /**
     * Judge the string is a integer number
     *
     * @access public
     * @return bool
     */
    String.prototype.isNum = function(s)
    {
        if (s !== null)
        {
            var r, re;
            re = /\d*/i;
            r = s.match(re);
            return (r == s) ? true : false;
        }
        return false;
    };


    String.prototype.endWith = function(str) {
        if (str == null || str == "" || this.length == 0 || str.length > this.length)
            return false;
        if (this.substring(this.length - str.length) == str)
            return true;
        else
            return false;
        return true;
    };

    String.prototype.startWith = function(str) {
        if (str == null || str == "" || this.length == 0 || str.length > this.length)
            return false;
        if (this.substr(0, str.length) == str)
            return true;
        else
            return false;
        return true;
    };

    String.prototype.length2 = function() {
        var cArr = this.match(/[^\x00-\xff]/ig);
        return this.length + (cArr == null ? 0 : cArr.length);
    };

    String.prototype.trim=function(){
        "use strict";
        return this.replace(/(^\s*)|(\s*$)/g, "");
    };

})();
;/** ========================================================================
 * Mower: base.mower.js - v1.0.0
 *
 *  base script to handle utility methodes
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
var Base = (function($, utils, window, document, undefined) {

    'use strict';

    var base = {};

    // private functions & variables
    var _parseComposite = function(key, value, t, prefix, parentkey) {
        var opts = {};
        var attrName = 'data-' + prefix + (parentkey ? (parentkey.toLowerCase() + '-') : '') + key.toLowerCase();

        if (!t.attr(attrName)) return opts;

        if (value === 'function') {
            opts[key] = (new Function("return " + t.attr(attrName)))(); //设置页面全局函数
        } else if (value === 'string') { //字符串直接从宿主对象对应属性中取值
            opts[key] = t.attr(attrName);
        } else if (value === 'boolean') { //布尔型从宿主对象对应属性中取值，同时将属性值转为布尔型
            opts[key] = t.attr(attrName) ? (t.attr(attrName) === 'true') : undefined;
        } else if (value === 'number') { //数字型也从宿主对象对应属性中取值，同时将属性值转为浮数
            opts[key] = t.attr(attrName) == '0' ? 0 : parseFloat(t.attr(attrName)) || undefined;
        } else if (value === 'array') { //数组型也从宿主对象对应属性中取值，同时将属性值转为数组
            var value = t.attr(attrName);
            if (value) {
                //嵌套数组 数值形式:'1,2,3;4,5,6'
                if (value.indexOf(';') >= 0) {
                    var nestedArray = new Array();
                    $.each(value.split(';'), function(index, value) {
                        if (value !== undefined && value.length > 0) {
                            nestedArray.push(value.split(','));
                        }
                    });
                    opts[key] = nestedArray;
                } else {
                    opts[key] = value.split(',');
                }
            } else {
                opts[key] = undefined;
            }
        }

        return opts;
    };

    var _attachDomRemoveEvent = function() {
        var _cleanData = $.cleanData;
        $.cleanData = function(elems) {
            for (var i = 0, elem;
                (elem = elems[i]) != null; i++) {
                try {
                    $(elem).triggerHandler("remove");
                } catch (e) {}
            }
            _cleanData(elems);
        };
    };

    //
    var _resetIconContent = function() {
        if (utils.isIE8()) {

            var head = document.getElementsByTagName('head')[0];
            var style = document.createElement('style');

            style.type = 'text/css';
            style.styleSheet.cssText = ':before,:after{content:none !important}';

            head.appendChild(style);
            setTimeout(function() {
                head.removeChild(style);
            }, 0);
        }
    };

    var _resettimezone = function() {
        var timeZoneOffset = new Date().getTimezoneOffset();

        var expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 365);

        document.cookie = "timezoneOffset=" + escape(timeZoneOffset * (-1)) + ";expires=" + expireDate.toGMTString();
    };

    // public functions
    base.init = function() {
        _resettimezone();
        _attachDomRemoveEvent();
        _resetIconContent();
        
    };

    /**
     * parse options, including standard 'data-options' attribute.
     *
     * @param target [DOM对象] 组件的宿主对象
     * @param properties [数组] 需要优先从宿主对象属性(不包含data-options属性)中取的opts列表
     * @param tPrefix [DOM对象] 组件的宿主对象前缀
     *
     * calling examples:
     * Base.parseOptions(target);
     * Base.parseOptions(target, ['id','title','width',{fit:'boolean',border:'boolean'},{min:'number'},{orderSeq:'array'}]);
     * Base.parseOptions(target, [{ajax:{url:'string',method:'string'}}]);
     */
    base.parseOptions = function(target, properties, tPrefix) {
        var t = $(target);
        var prefix = (tPrefix ? (tPrefix.toLowerCase() + '-') : '');

        var options = {};
        //第一步：首先从data-options属性中取opts
        var s = $.trim(t.attr('data-options'));
        if (s) {
            //兼容写大括号和不写大括号的写法
            if (s.substring(0, 1) != '{') {
                s = '{' + s + '}';
            }
            //利用Function函数将字符串转为化对象
            options = (new Function('return ' + s))();
        }
        //第二步：如果properties不为空的话，则将properties中定义的属性增加或者覆盖到“第一步”中取到的属性列表中
        if (properties) {
            var opts = {};
            for (var i = 0; i < properties.length; i++) {
                var pp = properties[i];
                //如果是字符串型
                if (typeof pp === 'string') {
                    //width height left top四个属性从宿主对象的style属性中取值
                    if (pp === 'width' || pp === 'height' || pp === 'left' || pp === 'top') {
                        opts[pp] = parseInt(target.style[pp]) || undefined;
                    } else { //其它情况直接从宿主对象的对应属性中取值
                        opts[pp] = t.attr('data-' + prefix + pp.toLowerCase());
                    }
                } else { //json对象'{}'
                    for (var pkey in pp) {
                        var pvalue = pp[pkey];

                        if (typeof pvalue === 'string') { //字符串型
                            //解析字符串或布尔型或者数字型或者数组
                            $.extend(opts, _parseComposite(pkey, pvalue, t, prefix));
                        } else { //对象'{}'
                            var nestedOpts = {};
                            for (var ckey in pvalue) {
                                var cvalue = pvalue[ckey];
                                //data attribute name ie: data-parent=""; children : data-parent-children.
                                var cOpts = _parseComposite(ckey, cvalue, t, prefix, pkey);
                                if (!$.isEmptyObject(cOpts)) $.extend(nestedOpts, cOpts); //maybe empty object
                            }
                            //maybe empty object
                            if (!$.isEmptyObject(nestedOpts) || (typeof pvalue.empty !== 'undefined' && pvalue.empty === true)) {
                                opts[pkey] = nestedOpts;
                            }
                        }
                    }
                }
            }
            //第二步取得的结果覆盖到第一步取得的结果中
            $.extend(options, opts);
        }
        return options;
    };

    return base;

}(jQuery, Utils, window, document));

$(function() {
    Base.init();
});
;/** ========================================================================
 * Mower: chosen.mower.js - v1.0.0
 *
 * apply chosen on document ready.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function($, base, window, document, undefined) {

    'use strict';

    // private functions & variables

    // Apply chosen to all elements with the rel="chosen" attribute
    // ===================================
    
    $(document).on('ready update', function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[rel=chosen]').each(function(index, el) {
            var $this = $(this);

            if (!$this.data('chosen')) {

                 var options = $.extend({},
                    base.parseOptions($this, [{
                            disable_search_threshold: 'number',
                            no_results_text: 'string',
                            max_selected_options: 'number',
                            allow_single_deselect:'boolean'
                        }])
                );

                $(this).chosen(options);
            }
        });
    });

}(jQuery, Base || {}, window, document));;/** ========================================================================
 * Mower: chosen.remote.mower.js - v0.1.0
 *
 * add ajax load remote data base on chosen.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

 ;(function ( $, window, document, undefined ) {

  "use strict";


 /* RemoteChosen CLASS DEFINITION
  * ====================== */

  var RemoteChosen = function (element, options) {
    this.options = options;
    this.element = element;
    this.$element = $(element);
  };

  var RemoteChosen_Name = 'mu.remoteChosen';
  var Chosen_Name = 'chosen'; //sync with chosen.jquery.js

  if (!$.fn.chosen) throw new Error('RemoteChosen requires chosen.jquery.js');

  //you can put your plugin defaults in here.
  RemoteChosen.DEFAULTS = {
    url        :'',
    datasource :false,
    callback   :null,
    nameField  :'text',
    valueField :'value'
  };

  RemoteChosen.prototype = {

    constructor: RemoteChosen ,  

    _init: function(element, options){
      var $element = $(element);
      this.options = $.extend({}, RemoteChosen.DEFAULTS, $element.data(), typeof options === 'object' && options);

      this._initChosen();
      this._loadData();
    },

    _initChosen: function(){
      //instance chosen plugin
      return this.$element.chosen(this.options || {});
    },

    _construct : function(data) {
      if(!data) return;

      var items, nbItems, selected_values,selected_values = [],
          that = this,$select = this.$element;

      $select.find('option').each(function() {
        if (!$(this).is(":selected")) {
          return $(this).remove();
        } else {
          return selected_values.push($(this).val() + "-" + $(this).text());
        }
      });

      $select.find('optgroup:empty').each(function() {
        return $(this).remove();
      });

      items = this.options.callback != null ? this.options.callback(data, that.element) : data;
      nbItems = 0;
      $.each(items, function(i, element) {
        var group, text, value;
        nbItems++;
        if (element.group) {
          group = $select.find("optgroup[label='" + element.text + "']");
          if (!group.size()) {
            group = $("<optgroup />");
          }
          group.attr('label', element.text).appendTo($select);
          return $.each(element.items, function(i, element) {
            var text, value;
            if (typeof element === "string") {
              value = i;
              text = element;
            } else {
              value = element[that.options.valueField];
              text = element[that.options.nameField];
            }
            if ($.inArray(value + "-" + text, selected_values) === -1) {
              return $("<option />").attr('value', value).html(text).appendTo(group);
            }
          });
        } else {
          if (typeof element === "string") {
            value = i;
            text = element;
          } else {
            value = element[that.options.valueField];
            text = element[that.options.nameField];
          }
          if ($.inArray(value + "-" + text, selected_values) === -1) {
            return $("<option />").attr('value', value).html(text).appendTo($select);
          }
        }
      });
      if (nbItems) {
        $select.trigger("chosen:updated");//notify chosen update field.
      } else {
        $select.data().chosen.no_results_clear();
        $select.data().chosen.no_results($select.val());
      }
    },
    _loadData: function(){
      var that = this,
          ajaxurl = this.options.url,
          ajaxurl = (ajaxurl && ajaxurl.replace(/.*(?=#[^\s]+$)/, '')),
          ajaxOption;

      if (ajaxurl) {
          ajaxOption = $.extend({}, {
              'url': ajaxurl,
              dataType: 'json',
              type: 'GET'
          });
          ajaxOption.success = function(data) {
              that._construct(data);
          };
          
          $.ajax(ajaxOption); 
      } else {
          var data = this.options.datasource;
          if ($.isFunction(window[data])){
               data = data(that);
           }
           
           this._construct(data);
      }
    },
    reload: function(options) {

      this.options = $.extend({}, this.options, typeof options === 'object' && options);

      this._loadData();
          
    },
    getChosenIntance: function(){
      return this.$element.data('chosen') || this._initChosen();
    },

    _destroy: function() {
      //clear chosen instance
      $.data(this.$element,Chosen_Name,null);
    }
  };

 /* RemoteChosen PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.remoteChosen;

  $.fn.remoteChosen = function (options) {
      var args = Array.prototype.slice.call(arguments, 1);

      var results;
      this.each(function() {
          var element = this
              ,$element = $(element)
              ,pluginKey = RemoteChosen_Name
              ,instance = $.data(element, pluginKey);

          // if there's no plugin instance for this element, create a new one, calling its "init" method, if it exists.
          if (!instance) {
              instance = $.data(element, pluginKey, new RemoteChosen(element,options));
              if (instance && typeof RemoteChosen.prototype['_init'] === 'function')
                  RemoteChosen.prototype['_init'].apply(instance, [element, options]);
          }

          // if we have an instance, and as long as the first argument (options) is a valid string value, tries to call a method from this instance.
          if (instance && typeof options === 'string' && options[0] !== '_' && options !== 'init') {

              var methodName = (options == 'destroy' ? '_destroy' : options);
              if (typeof RemoteChosen.prototype[methodName] === 'function')
                  results = RemoteChosen.prototype[methodName].apply(instance, args);

              // Allow instances to be destroyed via the 'destroy' method
              if (options === 'destroy')
                  $.data(element, pluginKey, null);
          }
      });

      // If the earlier cached method gives a value back, return the resulting value, otherwise return this to preserve chainability.
      return results !== undefined ? results : this;
  };

  $.fn.remoteChosen.Constructor = RemoteChosen;


 /* RemoteChosen NO CONFLICT
  * ================= */

  $.fn.remoteChosen.noConflict = function () {
    $.fn.remoteChosen = old;
    return this;
  };


 /* RemoteChosen DATA-API
  * ============== */

  $(document).on('ready update', function(event, updatedFragment) {
      /* Act on the event */
      var $root = $(updatedFragment || 'html');

      $root.find('[rel=remoteChosen]').each(function(index, el) {
          var $this = $(this);

          if (!$this.data(RemoteChosen_Name)) {
              $(this).remoteChosen();
          }
      });
  });
})( jQuery, window, document );;/**
 * Project: Bootstrap Hover Dropdown
 * Author: Cameron Spear
 * Contributors: Mattia Larentis
 *
 * Dependencies: Bootstrap's Dropdown plugin, jQuery
 *
 * A simple plugin to enable Bootstrap dropdowns to active on hover and provide a nice user experience.
 *
 * License: MIT
 *
 * http://cameronspear.com/blog/bootstrap-dropdown-on-hover-plugin/
 *
 * updated By Eric.Ou:
 *     1.Organize code as like bootstrap javascript
 *     2.Add plugin data to keep instance
 *     3.Add support reinit plugin after load dynamicly
 */

(function($, window, undefined) {

    // outside the scope of the jQuery plugin to
    // keep track of all dropdowns
    var $allDropdowns = $();

    var DropdownHover = function(element,options) {
        this.element = element;
        this.$element = $(element);
        this.options = options;

        this.init();
    }

    DropdownHover.prototype.init = function() {
        var $parent = this.$element.parent(),
            defaults = {
                delay: 500,
                instantlyCloseOthers: true
            },
            data = {
                delay: this.$element.data('delay'),
                instantlyCloseOthers: this.$element.data('close-others')
            },
            showEvent = 'show.bs.dropdown',
            hideEvent = 'hide.bs.dropdown',
            // shownEvent  = 'shown.bs.dropdown',
            // hiddenEvent = 'hidden.bs.dropdown',
            settings = $.extend(true, {}, defaults, this.options, data),
            timeout;

        var that = this;
        $parent.hover(function(event) {
            // so a neighbor can't open the dropdown
            if (!$parent.hasClass('open') && !that.$element.is(event.target)) {
                // stop this event, stop executing any code
                // in this callback but continue to propagate
                return true;
            }

            $allDropdowns.find(':focus').blur();

            if (settings.instantlyCloseOthers === true)
                $allDropdowns.removeClass('open');

            window.clearTimeout(timeout);
            $parent.addClass('open');
            that.$element.trigger(showEvent);

        }, function() {
            timeout = window.setTimeout(function() {
                $parent.removeClass('open');
                that.$element.trigger(hideEvent);
            }, settings.delay);
        });

        // this helps with button groups!
        this.$element.hover(function() {
            $allDropdowns.find(':focus').blur();

            if (settings.instantlyCloseOthers === true)
                $allDropdowns.removeClass('open');

            window.clearTimeout(timeout);
            $parent.addClass('open');
            that.$element.trigger(showEvent);
        });

        // handle submenus
        $parent.find('.dropdown-submenu').each(function (){
            var $this = $(this);
            var subTimeout;
            $this.hover(function () {
                window.clearTimeout(subTimeout);
                $this.children('.dropdown-menu').show();
                // always close submenu siblings instantly
                $this.siblings().children('.dropdown-menu').hide();
            }, function () {
                var $submenu = $this.children('.dropdown-menu');
                subTimeout = window.setTimeout(function () {
                    $submenu.hide();
                }, settings.delay);
            });
        });
    }


    // DROPDOWNHOVER PLUGIN DEFINITION
    // ==========================

    // if instantlyCloseOthers is true, then it will instantly
    // shut other nav items when a new one is hovered over
    function Plugin(options) {
        // don't do anything if touch is supported
        // (plugin causes some issues on mobile)
        if ('ontouchstart' in document) return this; // don't want to affect chaining

        // the element we really care about
        // is the dropdown-toggle's parent
        $allDropdowns = $allDropdowns.add(this.parent());

        return this.each(function() {
            var $this = $(this)
            var data = $this.data('bs.dropdownhover')

            if (!data) $this.data('bs.dropdownhover', (data = new DropdownHover(this,options)))
            if (typeof options == 'string') data[options].call($this)
        })
    }

    var old = $.fn.dropdownHover

    $.fn.dropdownHover = Plugin
    $.fn.dropdownHover.Constructor = DropdownHover


    // DROPDOWNHOVER NO CONFLICT
    // ====================

    $.fn.dropdownHover.noConflict = function() {
        $.fn.dropdownHover = old;
        return this;
    };


    // Apply dropdownHover to all elements with the data-hover="dropdown" attribute
    // ===================================
    $(document).on('ready update', function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[data-hover="dropdown"]').each(function(index, el) {
            var $this = $(this);

            if (!$this.data('bs.dropdownhover')) {

                $this.dropdownHover();
            }
        });
    });
    
})(jQuery, window);
;/** ========================================================================
 * Mower: dropdown.bootstrap.js - v0.1.0
 *
 * close or not when clicking on  bootstrap dropdown container.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

(function($, base, window, document, undefined) {

    'use strict';

    var isClosedOnDMBodyClick = function(event) {

        var options = base.parseOptions(this) || {};

        var isClosed = options.closeOnBodyClick;

        if (isClosed === false) {

            event.stopPropagation();

        }
    };

    // Apply to  all elements with the rel="dropdown-menu" attribute
    // ===================================
    $(document)
        .on('click.bs.dropdown.data-api', '[rel=dropdown-menu]', isClosedOnDMBodyClick);

}(jQuery, Base || {}, window, document));

;/** ========================================================================
 * Mower: nvabar.menu.mower.js - v1.0.0
 *
 * navbar mega menu to display menu as two level lay.
 *
 * <ul class="dropdown-menu">
 *      <li>
 *          <div class="yamm-content">
 *              <ul class="list-unstyled">
 *                  {{each(index2, menu2) children}}
 *                  <li>
 *                      <h4 class="title">${menu2.name}</h4>
 *                      <ul class="list-unstyled list-inline">{{each(index3, menu3) menu2.children}}
 *                          <li><a mid="${menu3.id}" href="javascript:void(0);" data-href="${menu3.uri}" data-toggle="menu">${menu3.name}</a>
 *                          </li>{{/each}}</ul>
 *                  </li>
 *                  {{if (($index2 + 1) < children.length)}}
 *                      <li class="divider"></li>
 *                  {{/if}} {{/each}}
 *              </ul>
 *          </div>
 *      </li>
 *  </ul>
 *
 * Dependencies:
 *              jquery.tmpl.js
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function(json, utils, $, window, document, undefined) {

    "use strict"; // jshint ;_;

    /* MAINMENU CLASS DEFINITION
     * ====================== */

    var menuItemSelector = '[data-toggle=menu]';

    var NBMenu = function(element, options) {
        this.element = element;
        this.$element = $(element);
        this.options = options;
        this.nodes = [];
    };

    //you can put your plugin defaults in here.
    NBMenu.DEFAULTS = {
        url: '', //ajax url
        param: '{}', //data to be sent to the server.
        method: 'GET', // data sending method
        dataType: 'json', // type of data loaded
        groupTemplate: function() {
            if (typeof $.template === "function") {
                return $.template(null, '{{each(index2, menu2) children}} <li> {{if menu2.children.length}} <h3 class="title">${menu2.name}</h3> <ul class="list-unstyled list-inline"> {{each(index3, menu3) menu2.children}} <li> <a mcode="${menu3.code}" href="javascript:void(0);" data-href="${menu3.uri}" data-toggle="menu">${menu3.name}</a> </li>{{/each}} </ul> {{else}} <a mcode="${menu2.code}" href="javascript:void(0);" data-href="${menu2.uri}" data-toggle="menu">${menu2.name}</a> {{/if}} </li> <li class="divider"> </li> {{/each}}');
            } else {
                return "";
            }
        },
        defaultTemplate: function() {
            if (typeof $.template === "function") {
                return $.template(null, '{{each(index2, menu2) children}} <li>   <a mcode="${menu2.code}" href="javascript:void(0);" data-href="${menu2.uri}" data-toggle="menu">${menu2.name}</a> </li> {{/each}}');
            } else {
                return "";
            }
        },
        events: {
            clickMenu: "clickMenu.mu.nbMenu",
            complete: "complete.mu.nbMenu",
            populateError: "error.populate.mu.nbMenu",
            populateSuccess: "success.populate.mu.nbMenu"
        }
    };

    NBMenu.prototype = {

        constructor: NBMenu,

        _init: function(element, options) {
            var $element = $(element);
            this.options = $.extend({}, NBMenu.DEFAULTS, $element.data(), typeof options === 'object' && options);
            this.options.url && (this.options.url = utils.getAbsoluteUrl(this.options.url, $element.getContextPath()));

            this.options.param = json.decode(this.options.param || '{}');

            var that = this;
            $element.one("mouseover", function(event) {
                var target = event.relatedTarget;
                that.populate();
            });
        },
        constructTree: function(treeFlatData) {
            var datasource = treeFlatData.makeLevelTree({
                pid: 'parentId',
                order: function(m) {
                    return m['attributes']['ordered'];
                }
            });

            this.nodes = datasource.nodes;

            this.renderMenu(datasource.tree);

            var e = $.Event(NBMenu.DEFAULTS.events.complete);
            this.$element.trigger(e);

            return datasource.tree;
        },
        renderMenu: function(tree) {

            var that = this;
            $(menuItemSelector, this.$element).each(function(index, el) {
                /* iterate through array or object */
                var $parent = $(el).closest('li');
                var menuCode = $(el).attr("data-code");
                var $menu = $(el);

                if (menuCode) {
                    $parent.children('.dropdown-menu').remove();
                    var menuObj = that.findMenuByCode(menuCode);

                    if ($.isPlainObject(menuObj)) {
                        var dataLevel = $(el).attr("data-level");
                        var $menuContent;
                        if (dataLevel === 'two') {
                          $menuContent = $('<ul class="dropdown-menu" role="menu"></ul>');
                          $.tmpl(that.options.defaultTemplate(), menuObj).appendTo($menuContent);
                          $menuContent.appendTo($parent);
                        } else {
                            $menuContent = $('<ul class="dropdown-menu" role="menu"> <li> <div class="yamm-content"> <ul class="list-unstyled"> </ul> </div> </li> </ul>');
                            $.tmpl(that.options.groupTemplate(), menuObj).appendTo($menuContent.find('.yamm-content').children('ul'));
                            $menuContent.appendTo($parent);
                            $menuContent.find('li.divider').filter(':last').remove();
                        }

                        $menu.attr("data-toggle", "dropdown").attr('data-hover', 'dropdown').addClass('dropdown-toggle');
                        $parent.addClass('dropdown');

                        $(document).triggerHandler('update', $parent);
                    }
                }
            });

            this.$element.on('click.module.mu.menu', '[data-toggle="menu"]', function(e) {
                var $this = $(this);
                var mcode = $this.attr('_mcode') || $this.attr('mcode');
                var href = $this.attr('data-href');
                var instance = that.findMenuByCode(mcode); //origin

                if ($this.is('a')) e.preventDefault();

                var module = this;
                var event = $.Event(NBMenu.DEFAULTS.events.clickMenu, {
                    relatedTarget: that.element,
                    target: module,
                    mcode: mcode,
                    href: href,
                    instance: instance
                });
                that.$element.trigger(event);

                if (event.isDefaultPrevented()) return;

                href = $this.attr('data-href');
                if ($.isFunction(decodeURIComponent)) {
                    href = decodeURIComponent(href);
                }

                var url = utils.getAbsoluteUrl(href, that.$element.getContextPath());
                url = url + (url.indexOf('?') > -1 ? '&' : '?') + '_=' + (new Date()).valueOf();
                window.location.href = url;
            });
        },
        populate: function() {
            var that = this;
            var purl = this.options.url ;

            $.ajax({
                url: purl,
                cache:true,
                data: this.options.param,
                dataType: this.options.dataType,
                type: this.options.method,
                success: function(data) {
                    var e;

                    if (data != null && data.error != null) {
                        e = $.Event(NBMenu.DEFAULTS.events.populateError, {
                            "data": data
                        });
                        that.$element.trigger(e);
                    } else {
                        that.constructTree(data);

                        e = $.Event(NBMenu.DEFAULTS.events.populateSuccess, {
                            "data": data
                        });
                        that.$element.trigger(e);
                    }
                },
                error: function(data) {
                    var e = $.Event(NBMenu.DEFAULTS.events.populateError, {
                        "data": data
                    });
                    that.$element.trigger(e);
                }
            });
        },
        findMenuByCode: function(code) {
            return code && this.nodes[code];
        },
        _destroy: function() {

        }
    };

    /* MAINMENU PLUGIN DEFINITION
     * ======================= */

    var old = $.fn.nbMenu;

    $.fn.nbMenu = function(options) {

        // slice arguments to leave only arguments after function name.
        var args = Array.prototype.slice.call(arguments, 1);

        // Cache any plugin method call, to make it possible to return a value
        var results;

        this.each(function() {
            var element = this,
                $element = $(element),
                pluginKey = 'mu.nbMenu',
                instance = $.data(element, pluginKey)


            // if there's no plugin instance for this element, create a new one, calling its "init" method, if it exists.
            if (!instance) {
                instance = $.data(element, pluginKey, new NBMenu(element, options));
                if (instance && typeof NBMenu.prototype['_init'] === 'function')
                    NBMenu.prototype['_init'].apply(instance, [element, options]);
            }

            // if we have an instance, and as long as the first argument (options) is a valid string value, tries to call a method from this instance.
            if (instance && typeof options === 'string' && options[0] !== '_' && options !== 'init') {

                var methodName = (options == 'destroy' ? '_destroy' : options);
                if (typeof NBMenu.prototype[methodName] === 'function')
                    results = NBMenu.prototype[methodName].apply(instance, args);

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy')
                    $.data(element, pluginKey, null);
            }
        });

        // If the earlier cached method gives a value back, return the resulting value, otherwise return this to preserve chainability.
        return results !== undefined ? results : this;
    };

    $.fn.nbMenu.Constructor = NBMenu;


    /* MAINMENU NO CONFLICT
     * ================= */

    $.fn.nbMenu.noConflict = function() {
        $.fn.nbMenu = old;
        return this;
    };


    /* MAINMENU DATA-API
     * ============== */
    $(document).on('ready update', function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[rel=nbMenu]').each(function(index, el) {
            var $this = $(this);
            if (!$this.data('mu.nbMenu')) {
                $(this).nbMenu();
            }
        });
    });

})(JSON || {}, Utils || {}, jQuery, window, document);
;/** ========================================================================
 * Mower: popover.mower.js - v1.0.0
 *
 * Apply popover on document ready.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function($, base, window, document, undefined) {

    'use strict';

    // private functions & variables

    // Apply popover to all elements with the rel="popover" attribute
    // ===================================
    $(document).on('ready update',function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[rel=popover]').each(function(index, el) {
            var $this = $(this);

            if (!$this.data('bs.popover')) {

                var container = $this.data('container') || 'body';
                var placement = $this.data('placement') || 'top';

                $this.popover({
                    'container': container,
                    'placement': placement
                });
            }
        });
    });
}(jQuery, Base || {}, window, document));
;/** ========================================================================
 * Mower: tab.mower.js - v1.0.0
 *
 *  bootstrap-tab support ajax capabilities
 *
 * Dependencies :
 *                bootstrap tab
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function($, window, document, undefined) {

    'use strict';

    // AJAXTAB CLASS DEFINITION
    // ====================

    var ATab = function(element, options) {
        this.$element = $(element);
        this.options = options;
    };

    ATab.VERSION = '3.2.0'

    ATab.DEFAULTS = {
        prefix : 'atab', //prefix of tab content id
        cache  : true
    };

    ATab.prototype._init = function(element, options) {
        var $element = $(element);
        this.options = $.extend({}, ATab.DEFAULTS, $element.data(), typeof options == 'object' && options);

        this.ConstructTabContent();
    }

    ATab.prototype.ConstructTabContent = function() {
        var tabCont = this.$element.next("div.tab-content");
        if (tabCont.length === 0) {
            var tabContent = [
                '<div class="tab-content">',
                '</div>'
            ].join('');

            this.$element.parent().append(tabContent);
            tabCont = this.$element.next("div.tab-content");
        }

        var that = this;
        this.$element.find(" li > a ").filter('[data-toggle="atab"]').each(function(idx, el) {
            var $el = $(el);
            var $target = tabCont.children().filter($el.attr("data-target"));

            if ($target.length === 0) {
                var target = that.options.prefix + "-content" + '-' + idx;
                var tabPane = [
                    '<div class="tab-pane" id="',
                    target,
                    '">',
                    '</div>'
                ].join("");

                tabCont.append(tabPane);

                //set data-target
                target = "#" + target;
                $el.attr("data-target", target);
            }
        });
    };

    /**
     * [dynamic add tab and show]
     * @param  {[string]} title :name show in tab
     * @param  {[string]} href  :remote url
     * @return {[type]}
     */
    ATab.prototype.add = function(title, href) {
        // tab panel,convert to jQuery object in order to next 
        // called will get the new appending context,as following show function call. 
        var $tab = $([
            '<li><a href="',
            href,
            '" role="tab" data-toggle="atab" >',
            title,
            '</a></li>'
        ].join(""));

        this.$element.append($tab);

        this.ConstructTabContent();

        this.show($tab.children('a')); //default show
    };

    ATab.prototype.show = function(_relatedTarget) {
        var $tab = $(_relatedTarget),
            href = $tab.attr('data-href') || $tab.attr("href"),
            $target = this.$element.next("div.tab-content").children($tab.attr("data-target")),
            showTab = function() {
                $tab.tab('show');
            },
            loading = function(callback) {
                $.get(href, function(data, statusText, jqXHR) {
                    $target.html(data);
                    callback && callback();
                });
            };

        if (!$tab.data('bs.tab') || !this.options.cache) {

            $target.empty();

            loading(showTab);
        } else {
            showTab();
        }
    };


    // AJAXTAB PLUGIN DEFINITION
    // =====================

    function Plugin(options) {
        // slice arguments to leave only arguments after function name.
        var args = Array.prototype.slice.call(arguments, 1);

        // Cache any plugin method call, to make it possible to return a value
        var results;

        this.each(function() {
            var element = this,
                $element  = $(element),
                pluginKey = 'mu.atab',
                instance  = $.data(element, pluginKey)


            // if there's no plugin instance for this element, create a new one, calling its "init" method, if it exists.
            if (!instance) {
                instance = $.data(element, pluginKey, new ATab(element, options));
                if (instance && typeof ATab.prototype['_init'] === 'function')
                    ATab.prototype['_init'].apply(instance, [element, options]);
            }

            // if we have an instance, and as long as the first argument (options) is a valid string value, tries to call a method from this instance.
            if (instance && typeof options === 'string' && options[0] !== '_' && options !== 'init') {

                var methodName = (options == 'destroy' ? '_destroy' : options);
                if (typeof ATab.prototype[methodName] === 'function')
                    results = ATab.prototype[methodName].apply(instance, args);

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy') {
                    $.data(element, pluginKey, null);
                }
            }
        });

        // If the earlier cached method gives a value back, return the resulting value, otherwise return this to preserve chainability.
        return results !== undefined ? results : this;
    }

    var old = $.fn.atab

    $.fn.atab = Plugin
    $.fn.atab.Constructor = ATab


    // AJAXTAB NO CONFLICT
    // ===============

    $.fn.atab.noConflict = function() {
        $.fn.atab = old
        return this
    }


    // AJAXTAB DATA-API
    // ============


    $(document)
    // trigger exsited a element loading page via jquery ajax
    .on('click.mu.atab.data-api', '[data-toggle^="atab"]', function(e) {
        var $this = $(this);

        if ($this.is('a')) e.preventDefault()

        Plugin.call($(this).closest('ul'), 'show', this);
    })
    // add a element tab dynamic and loading page via jquery ajax
    .on('click.mu.atab.data-api', '[data-toggle^="ntab"]', function(e) {
        var $this = $(this);
        var title = $this.attr('data-title');
        var href  =  $this.attr('data-href') || $this.attr('href');
        href      = (href && href.replace(/.*(?=#[^\s]+$)/, '')); // strip for ie7
        var $target = $($this.attr('data-target'));
        var option = $.extend({}, $target.data(), $this.data());

        if ($this.is('a')) e.preventDefault()

        Plugin
            .call($target, option)
            .call("add", title, href)
            .one('hide', function() {
                $this.is(':visible') && $this.focus()
            })
    }).on('ready', function(event) {
        var $li = $('[data-toggle^="atab"]').parent('li.active').eq(0);

        var activate = function(li) {
            $(li).removeClass('active'); // bootstrap tab will set active after showing auto
            Plugin.call($(li).closest('ul'), 'show', $(li).find('[data-toggle^="atab"]'));
        };

        $li.length && activate($li[0]);
    });

})(jQuery, window, document);

;/** ========================================================================
 * Mower: tooltip.mower.js - v1.0.0
 *
 * apply tooltip on document ready.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function($, base, window, document, undefined) {

    'use strict';

    // private functions & variables

    // Apply tooltip to all elements with the rel="tooltip" attribute
    // ===================================

    $(document).on('ready update', function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[rel=tooltip]').each(function(index, el) {
            var $this = $(this);

            if (!$this.data('bs.tooltip')) {

                var container = $this.data('container') || 'body';

                $(this).tooltip({
                    'container': container
                });
            }
        });
    });
}(jQuery, Base || {}, window, document));
;/** ========================================================================
 * Mower: validator.mower.js - v1.0.0
 *
 * apply validate on document ready.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

(function($, utils, base, window, document, undefined) {

    'use strict';

    // Prepare the events
    var FORM_ERROR_EVENT = 'error.form.bv',
        FORM_SUCCESS_EVENT = 'success.form.bv',
        FORM_SUBMIT_SVENT = 'submit.bv',
        POP_BREADCRUMB_EVENT = 'pop.mu.breadcrumb';


    $.fn.ajaxValidForm = function(options) {
        var $form = $(this);

        $form
            .off(FORM_SUCCESS_EVENT)
            .off(FORM_ERROR_EVENT)
            .on(FORM_SUCCESS_EVENT, this.selector, options, doFormSuccess)
            .on(FORM_ERROR_EVENT, this.selector, options, doFormError);

        $form.triggerHandler(FORM_SUBMIT_SVENT);

        return this;
    };

    function doFormSuccess(e) {
        var $form = $(e.target),
            options = e.data.options;

        $form.ajaxSubmit({
            success: function(data) {
                if (data.success) {
                    utils.executeFunction(options.success,data);
                } else {
                    data.exceptionMessage && AlertBox.error(data.exceptionMessage);
                    var $formValidator = $form.data('bootstrapValidator');
                    if ($formValidator.length) {
                        $(data.validateErrors).each(function() {
                            $formValidator
                                .updateMessage(this.element, 'blank', this.message)
                                .updateStatus(this.element, 'INVALID', 'blank');
                        });
                    }

                    utils.executeFunction(options.error,data);
                }
            }
        });
    }

    function doFormError(e) {
        
    }

    // private functions & variables
    var SELECTOR = '[rel="validate-form"]';

    // Apply tooltip to all elements with the rel="validate-form" attribute
    // ===================================
    $(document)
        .on('ready update', function(event, updatedFragment) {
            /* Act on the event */
            var $root = $(updatedFragment || 'html');

            $root.find(SELECTOR).each(function(index, el) {
                var $this = $(this);

                if (!$this.data('bootstrapValidator')) {

                    $this.bootstrapValidator({
                        excluded: [':disabled'],
                        message: '请输入合法的数值',
                        feedbackIcons: {
                            valid: 'fa fa-check',
                            invalid: 'fa fa-times',
                            validating: 'fa fa-refresh'
                        }
                    });
                }
            });
        });

}(jQuery, Utils || {}, Base || {}, window, document));
