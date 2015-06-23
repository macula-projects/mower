/** ========================================================================
 * Mower: utils.mower.js - v1.0.0
 *
 * utility
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
            var scripts = [];
            $html.filter('script').each(function() {
                if (this.src) {
                    scripts.push($(this));
                } else {
                    scripts.unshift($(this));
                }
            });

            for (var i = 0; i < scripts.length; i++) {
                var id = scripts[i].attr('id');
                if (id) {
                    self.find('#' + id).remove();
                }!scripts[i].attr('data-ref-target') && scripts[i].attr('data-ref-target', ajaxId);
                self.append(scripts[i]);
            }

            //process call back
            if (callback && $.isFunction(callback)) {
                callback.apply(self, [data]);
            }

            return self; //keep chain
        },
        _privateProcessContents: function(url, ajaxOptions, action, callback, isScrollTop) {
            var self = $(this),
                s = {};

            s = $.extend({
                url: url,
                dataType: 'html',
                beforeSend: function() {
                    self.children().addClass('hidden');
                    self.append('<h3 class="_loadmask"><i class="fa fa-cog fa-spin"></i> Loading...</h3>');
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
                        self.html('<h4 style="margin-top:10px; display:block; text-align:left"><i class="fa fa-warning txt-color-orangeDark"></i> Error! Content type not match.</h4>');
                        self.trigger('ajaxError', [xhr, s]);
                        return;
                    }

                    self.find('h3._loadmask').remove();
                    self.children().removeClass('hidden');
                    self.css({
                        opacity: '0.0'
                    }).updateHtml(data, action, callback).delay(50).animate({
                        opacity: '1.0'
                    }, 300);

                    $(window).trigger('resize');
                },
                error: function(xhr, ajaxOptions, thrownError) {
                    self.html('<h4 style="margin-top:10px; display:block; text-align:left"><i class="fa fa-warning txt-color-orangeDark"></i> Error 404! Page not found.</h4>');
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
        executeFunctionByName: function(functionName, context /*, args */ ) {
            var args = Array.prototype.slice.call(arguments, 2);
            var namespaces = functionName.split(".");
            var func = namespaces.pop();
            for (var i = 0; i < namespaces.length; i++) {
                context = context[namespaces[i]];
            }
            return context[func].apply(context, args);
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
        getUniqueId: function() {
            var counter = 0;
            return function() {
                return counter++;
            };
        }(),
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
