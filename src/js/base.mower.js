/** ========================================================================
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

    var _enterToTab = function() {
        $(document).on("keypress", "input", function(e) {
            /* ENTER PRESSED*/
            var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
            if (key == 13) {
                var inputs = $(this).parents("form").eq(0).find(":input:visible:not(disabled):not([readonly])");
                var idx = inputs.index(this);
                if (idx == inputs.length - 1) {
                    idx = -1;
                } else {
                    inputs[idx + 1].focus(); // handles submit buttons
                }
                try {
                    inputs[idx + 1].select();
                } catch (err) {
                    // handle objects not offering select
                }
                return false;
            }
        });
    };


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

    // public functions
    base.init = function() {
        _resettimezone();
        _attachDomRemoveEvent();
        _resetIconContent();
        _enterToTab();
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
                } else if($.isPlainObject(pp)) { //json对象'{}'
                    for (var pkey in pp) {
                        var pvalue = pp[pkey];

                        if (typeof pvalue === 'string') { //字符串型
                            //解析字符串或布尔型或者数字型或者数组
                            $.extend(opts, _parseComposite(pkey, pvalue, t, prefix));
                        } else if($.isPlainObject(pvalue)){ //对象'{}'
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
