/** ========================================================================
 * Mower: cmenu.bootstrap.js - v1.0.0
 *
 * complex menu for the main layout.display menu as three level lay.
 *
 * Dependencies:
 *              jquery.tmpl.js
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function(json, utils, $, window, document, undefined) {

    "use strict"; // jshint

    /* MAINMENU CLASS DEFINITION
     * ====================== */

    var CompMenu = function(element, options) {
        this.element = element;
        this.$element = $(element);
        this.options = options;
        this.nodes = [];
    };

    //you can put your plugin defaults in here.
    CompMenu.DEFAULTS = {
        url: '', //ajax url
        isAlwaysShown: 'false',
        param: '{}', //data to be sent to the server.
        method: 'GET', // data sending method
        dataType: 'json', // type of data loaded
        template: function() {
            if (typeof $.template === "function") {
                return $.template(null, '<li  class="mu-menu-item"><h3><a mcode="${code}" data-toggle="menu"><span>${name}</span></a><i class="fa fa-caret-right pull-right"></i></h3><div class="mu-menu-item-main" ><div class="mu-menu-subitem-main">{{each(index2, menu2) children}}<dl><dt><a href="javascript:void(0)"><span>${menu2.name}</span></a></dt><dd>{{each(index3, menu3) menu2.children}}<em><a mcode="${menu3.code}" href="javascript:void(0);" data-href="${menu3.uri}" data-toggle="menu">${menu3.name}</a></em>{{/each}}</dd></dl>{{/each}}</div></div></li>');
            } else {
                return "";
            }
        },
        events: {
            clickMenu: "clickMenu.mu.compMenu",
            complete: "complete.mu.compMenu",
            populateError: "error.populate.mu.compMenu",
            populateSuccess: "success.populate.mu.compMenu"
        }
    };

    CompMenu.prototype = {

        constructor: CompMenu,

        _init: function(element, options) {
            var $element = $(element);
            this.options = $.extend({}, CompMenu.DEFAULTS, $element.data(), typeof options === 'object' && options);
            this.options.url && (this.options.url = utils.getAbsoluteUrl(this.options.url, $element.getContextPath()));

            this.options.param = json.decode(this.options.param || '{}');

            if (this.options.isAlwaysShown === 'true') {
                this.populate();
                $element.closest('li.dropdown').addClass('open');
            } else {
                var that = this;
                $element.closest('.dropdown').one("mouseover", function() {
                    that.populate();
                });
            }
        },
        constructTree: function(treeFlatData) {
            var datasource = treeFlatData.makeLevelTree({
                pid: 'parentId',
                order: function(m) {
                    return m['attributes']['ordered'];
                }
            });

            this.renderMenu(datasource.tree);

            var that = this;
            this.$element.on("mouseenter", "li.mu-menu-item", function(e) {
                //stuff to do on mouse enter
                var $menuItem = $(this),
                    $subMenu = $menuItem.find('.mu-menu-item-main'),
                    width = that.$element.outerWidth();

                $menuItem.addClass('hover');

                var p = that.$element.offset().top; //Main Menu top
                var o = $menuItem.offset().top - p; //menu item top

                var t = document.documentElement.scrollTop || document.body.scrollTop;
                var r = o + $subMenu.height() + p - t;

                var q = $(window).height() - 30;
                var s = r - q;
                if (r > q) {
                    if ($menuItem.offset().top - t + $menuItem.height() - q > -10) {
                        o = $menuItem.position().top - $subMenu.height() + $menuItem.height() - 2;
                    } else {
                        o = o - s - 10;
                    }
                }

                if ($subMenu.height() > q) {
                    o = t - p;
                }

                //because of main menu z-index lt top main menu.
                //so .mu-menu-subitem-main top substract top menu height 
                if (o < (0 - (p - 26))) {
                    o = (0 - (p - 26)); //26 top menu height
                }

                // Show the submenu
                $subMenu.css({
                    display: "block",
                    top: o,
                    left: width - 2 // main should overlay submenu
                });
            }).on("mouseleave", "li.mu-menu-item", function(e) {
                //stuff to do on mouse leave
                var $menuItem = $(this),
                    $subMenu = $menuItem.find('.mu-menu-item-main');

                $menuItem.removeClass('hover');
                // Hide the submenu and remove the row's highlighted look
                $subMenu.css("display", "none");
            });

            this.nodes = datasource.nodes;

            var e = $.Event(CompMenu.DEFAULTS.events.complete);
            this.$element.trigger(e);

            return datasource.tree;
        },
        renderMenu: function(tree) {
            this.$element.empty();

            for (var i = 0; i < tree.length; i++) {
                $.tmpl(this.options.template(), tree[i].children).appendTo(this.element);
            }

            //set first occur href of a for top parent.
            this.$element.find('li').each(function() {
                var selfArch = $(this).find('a:first'),
                    firstArch = $(this).find('a[data-href]:first');
                if (firstArch.length) {
                    selfArch.attr('_mcode', firstArch.attr('mcode')).attr('data-href', firstArch.attr('data-href'));
                }
            });

            var that = this;
            this.$element.on('click.module.mu.menu', '[data-toggle="menu"]', function(e) {
                var $this = $(this);
                var mcode = $this.attr('_mcode') || $this.attr('mcode');
                var href = $this.attr('data-href');
                var instance = that.findMenuByCode(mcode); //origin

                if ($this.is('a')) e.preventDefault();

                var module = this;
                var event = $.Event(CompMenu.DEFAULTS.events.clickMenu, {
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
                        e = $.Event(CompMenu.DEFAULTS.events.populateError, {
                            "data": data
                        });
                        that.$element.trigger(e);
                    } else {
                        that.constructTree(data);

                        e = $.Event(CompMenu.DEFAULTS.events.populateSuccess, {
                            "data": data
                        });
                        that.$element.trigger(e);
                    }
                },
                error: function(data) {
                    var e = $.Event(CompMenu.DEFAULTS.events.populateError, {
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

    var old = $.fn.compMenu;

    $.fn.compMenu = function(options) {

        // slice arguments to leave only arguments after function name.
        var args = Array.prototype.slice.call(arguments, 1);

        // Cache any plugin method call, to make it possible to return a value
        var results;

        this.each(function() {
            var element = this,
                $element = $(element),
                pluginKey = 'mu.compMenu',
                instance = $.data(element, pluginKey)


            // if there's no plugin instance for this element, create a new one, calling its "init" method, if it exists.
            if (!instance) {
                instance = $.data(element, pluginKey, new CompMenu(element, options));
                if (instance && typeof CompMenu.prototype['_init'] === 'function')
                    CompMenu.prototype['_init'].apply(instance, [element, options]);
            }

            // if we have an instance, and as long as the first argument (options) is a valid string value, tries to call a method from this instance.
            if (instance && typeof options === 'string' && options[0] !== '_' && options !== 'init') {

                var methodName = (options == 'destroy' ? '_destroy' : options);
                if (typeof CompMenu.prototype[methodName] === 'function')
                    results = CompMenu.prototype[methodName].apply(instance, args);

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy')
                    $.data(element, pluginKey, null);
            }
        });

        // If the earlier cached method gives a value back, return the resulting value, otherwise return this to preserve chainability.
        return results !== undefined ? results : this;
    };

    $.fn.compMenu.Constructor = CompMenu;


    /* MAINMENU NO CONFLICT
     * ================= */

    $.fn.compMenu.noConflict = function() {
        $.fn.compMenu = old
        return this
    };


    /* MAINMENU DATA-API
     * ============== */
    $(document).on('ready update', function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[rel=compMenu]').each(function(index, el) {
            var $this = $(this);
            if (!$this.data('mu.compMenu')) {
                $(this).compMenu();
            }
        });
    });

})(JSON || {}, Utils || {}, jQuery, window, document);
