/** ========================================================================
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
                return $.template(null, '{{each(index2, menu2) children}} <li> {{if menu2.children.length}} <h3 class="title">${menu2.name}</h3> <ul class="list-unstyled list-inline"> {{each(index3, menu3) menu2.children}} <li> <a mcode="${menu3.code}" href="javascript:void(0);" data-href="${menu3.uri}" data-mode="{{if menu3.attributes.openMode}}${menu3.attributes.openMode}{{else}}normal{{/if}}" data-toggle="menu">${menu3.name}</a> </li>{{/each}} </ul> {{else}} <a mcode="${menu2.code}" href="javascript:void(0);" data-href="${menu2.uri}" data-toggle="menu">${menu2.name}</a> {{/if}} </li> <li class="divider"> </li> {{/each}}');
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

            this.renderMenu();

            var e = $.Event(NBMenu.DEFAULTS.events.complete);
            this.$element.trigger(e);

            return datasource.tree;
        },
        renderMenu: function() {

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
                var rcode = $this.attr('_rcode') || $this.attr('rcode');
                var mcode = $this.attr('_mcode') || $this.attr('mcode');
                var href = $this.attr('data-href');
                var openMode = $this.attr('data-mode') || 'normal';
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

                if ($.cookie) {
                    $.cookie('rcode', rcode);
                    $.cookie('mcode', mcode);
                } else {
                    url = url + (url.indexOf('?') > -1 ? '&' : '?') + 'rcode=' + this.rootcode + '&mcode=' + mcode;
                }

                url = url + (url.indexOf('?') > -1 ? '&' : '?') + '_=' + (new Date()).valueOf();

                switch(openMode){
                    case '_blank':
                    case 'blank':
                    case 'open':
                        window.open(url, "_blank");
                    break;
                    case 'normal':
                    default:
                    window.location.href = url;
                }
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
                    } else if (data.length) {
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
