/** ========================================================================
 * Mower: smenu.bootstrap.js - v1.0.0
 *
 * simple menu to display menu as two level lay.
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

    var SimpMenu = function(element, options) {
        this.element = element;
        this.$element = $(element);
        this.options = options;
        this.nodes = [];
    };

    //you can put your plugin defaults in here.
    SimpMenu.DEFAULTS = {
        url: '', //ajax url
        param: '{}', //data to be sent to the server.
        method: 'GET', // data sending method
        dataType: 'json', // type of data loaded
        defaultTemplate: function() {
            if (typeof $.template === "function") {
                return $.template(null, '{{each(index2, menu2) children}} <li> {{if menu2.children.length}} <h3 class="title">${menu2.name}</h3> <ul class="list-unstyled list-inline"> {{each(index3, menu3) menu2.children}} <li> <a mcode="${menu3.code}" href="javascript:void(0);" data-href="${menu3.uri}" data-toggle="menu">${menu3.name}</a> </li>{{/each}} </ul> {{else}} <a mcode="${menu2.code}" href="javascript:void(0);" data-href="${menu2.uri}" data-toggle="menu">${menu2.name}</a> {{/if}} </li> <li class="divider"> </li> {{/each}}');
            } else {
                return "";
            }
        },
        twoTemplate: function() {
            if (typeof $.template === "function") {
                return $.template(null, '{{each(index2, menu2) children}} <li>   <a mcode="${menu2.code}" href="javascript:void(0);" data-href="${menu2.uri}" data-toggle="menu">${menu2.name}</a> </li> {{/each}}');
            } else {
                return "";
            }
        },
        events: {
            clickMenu: "clickMenu.mu.simpMenu",
            complete: "complete.mu.simpMenu",
            populateError: "error.populate.mu.simpMenu",
            populateSuccess: "success.populate.mu.simpMenu"
        }
    };

    SimpMenu.prototype = {

        constructor: SimpMenu,

        _init: function(element, options) {
            var $element = $(element);
            this.options = $.extend({}, SimpMenu.DEFAULTS, $element.data(), typeof options === 'object' && options);
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

            var e = $.Event(SimpMenu.DEFAULTS.events.complete);
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
                          $.tmpl(that.options.twoTemplate(), menuObj).appendTo($menuContent);
                          $menuContent.appendTo($parent);
                        } else {
                            $menuContent = $('<ul class="dropdown-menu" role="menu"> <li> <div class="yamm-content"> <ul class="list-unstyled"> </ul> </div> </li> </ul>');
                            $.tmpl(that.options.defaultTemplate(), menuObj).appendTo($menuContent.find('.yamm-content').children('ul'));
                            $menuContent.appendTo($parent);
                            $menuContent.find('li.divider').filter(':last').remove();
                        }

                        $menu.attr("data-toggle", "dropdown").attr('data-hover', 'dropdown').addClass('dropdown-toggle');
                        $parent.addClass('dropdown');

                        $(document).triggerHandler('update', $parent);
                    }
                }
            });

            var that = this;
            this.$element.on('click.module.mu.menu', '[data-toggle="menu"]', function(e) {
                var $this = $(this);
                var mid = $this.attr('_mid') || $this.attr('mid');
                var href = $this.attr('data-href');
                var instance = that.findMenuByCode(mid); //origin

                if ($this.is('a')) e.preventDefault();

                var module = this;
                var event = $.Event(SimpMenu.DEFAULTS.events.clickMenu, {
                    relatedTarget: that.element,
                    target: module,
                    mid: mid,
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
                        e = $.Event(SimpMenu.DEFAULTS.events.populateError, {
                            "data": data
                        });
                        that.$element.trigger(e);
                    } else {
                        that.constructTree(data);

                        e = $.Event(SimpMenu.DEFAULTS.events.populateSuccess, {
                            "data": data
                        });
                        that.$element.trigger(e);
                    }
                },
                error: function(data) {
                    var e = $.Event(SimpMenu.DEFAULTS.events.populateError, {
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

    var old = $.fn.simpMenu;

    $.fn.simpMenu = function(options) {

        // slice arguments to leave only arguments after function name.
        var args = Array.prototype.slice.call(arguments, 1);

        // Cache any plugin method call, to make it possible to return a value
        var results;

        this.each(function() {
            var element = this,
                $element = $(element),
                pluginKey = 'mu.simpMenu',
                instance = $.data(element, pluginKey)


            // if there's no plugin instance for this element, create a new one, calling its "init" method, if it exists.
            if (!instance) {
                instance = $.data(element, pluginKey, new SimpMenu(element, options));
                if (instance && typeof SimpMenu.prototype['_init'] === 'function')
                    SimpMenu.prototype['_init'].apply(instance, [element, options]);
            }

            // if we have an instance, and as long as the first argument (options) is a valid string value, tries to call a method from this instance.
            if (instance && typeof options === 'string' && options[0] !== '_' && options !== 'init') {

                var methodName = (options == 'destroy' ? '_destroy' : options);
                if (typeof SimpMenu.prototype[methodName] === 'function')
                    results = SimpMenu.prototype[methodName].apply(instance, args);

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy')
                    $.data(element, pluginKey, null);
            }
        });

        // If the earlier cached method gives a value back, return the resulting value, otherwise return this to preserve chainability.
        return results !== undefined ? results : this;
    };

    $.fn.simpMenu.Constructor = SimpMenu;


    /* MAINMENU NO CONFLICT
     * ================= */

    $.fn.simpMenu.noConflict = function() {
        $.fn.simpMenu = old;
        return this;
    };


    /* MAINMENU DATA-API
     * ============== */
    $(document).on('ready update', function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[rel=simpMenu]').each(function(index, el) {
            var $this = $(this);
            if (!$this.data('mu.simpMenu')) {
                $(this).simpMenu();
            }
        });
    });

})(JSON || {}, Utils || {}, jQuery, window, document);
