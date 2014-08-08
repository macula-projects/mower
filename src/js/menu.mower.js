/** ========================================================================
 * Mower: menu.bootstrap.js - v1.0.0
 *
 * main menu for the main layout
 *
 * Dependencies:
 *              jquery.tmpl.js
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function(json, $, window, document, undefined) {

    "use strict"; // jshint ;_;

    /* MAINMENU CLASS DEFINITION
     * ====================== */

    var MainMenu = function(element, options) {
        this.element = element
        this.$element = $(element)
        this.options = options
        this.nodes = []
    }

    //you can put your plugin defaults in here.
    MainMenu.DEFAULTS = {
        url: '', //ajax url
        param: '{}', //data to be sent to the server.
        method: 'GET', // data sending method
        dataType: 'json', // type of data loaded
        template: function() {
            if (typeof $.template === "function") {
                return $.template(null, '<li  class="mu-menu-item"><h3><a mid="${id}" data-toggle="menu"><span>${name}</span></a><i class="fa fa-caret-right pull-right"></i></h3><div class="mu-menu-item-main" ><div class="mu-menu-subitem-main">{{each(index2, menu2) children}}<dl><dt><a href="javascript:void(0)"><span>${menu2.name}</span></a></dt><dd>{{each(index3, menu3) menu2.children}}<em><a mid="${menu3.id}" href="javascript:void(0);" data-href="${menu3.uri}" data-toggle="menu">${menu3.name}</a></em>{{/each}}</dd></dl>{{/each}}</div></div></li>');
            } else {
                return "";
            }
        },
        events: {
            clickMenu: "clickMenu.mu.mainMenu",
            complete: "complete.mu.mainMenu",
            populateError: "error.populate.mu.mainMenu",
            populateSuccess: "success.populate.mu.mainMenu"
        }
    }

    MainMenu.prototype = {

        constructor: MainMenu,

        _init: function(element, options) {
            var $element = $(element);
            this.options = $.extend({}, MainMenu.DEFAULTS, $element.data(), typeof options == 'object' && options);
            this.options.param = json.decode(this.options.param || '{}');

            this.populate();
        },
        constructTree: function(treeFlatData) {
            var datasource = treeFlatData.makeLevelTree({
                pid: 'parentId',
                order: function(m) {
                    return m['attributes']['ordered'];
                }
            });

            this.renderMainMenu(datasource.tree);

            var that = this;
            this.$element.on("mouseenter", "li.mu-menu-item", function(e) {
                //stuff to do on mouse enter
                var $menuItem = $(this),
                    $subMenu = $menuItem.find('.mu-menu-item-main'),
                    width = that.$element.outerWidth(),
                    height = that.$element.outerHeight();

                $menuItem.addClass('hover');
                // Show the submenu
                $subMenu.css({
                    display: "block",
                    top: -1,
                    left: width - 2, // main should overlay submenu
                    "min-height": height
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

            var e = $.Event(MainMenu.DEFAULTS.events.complete);
            this.$element.trigger(e);

            return datasource.tree;
        },
        renderMainMenu: function(tree) {
            this.$element.empty();

            for (var i = 0; i < tree.length; i++) {
                $.tmpl(this.options.template(), tree[i].children).appendTo(this.element);
            }

            //set first occur href of a for top parent.
            this.$element.find('li').each(function() {
                var selfArch = $(this).find('a:first'),
                    firstArch = $(this).find('a[data-href]:first');
                if (firstArch.length) {
                    selfArch.attr('_mid', firstArch.attr('mid')).attr('data-href', firstArch.attr('data-href'));
                }
            });

            var that = this;
            this.$element.on('click.module.mu.menu', '[data-toggle="menu"]', function(e) {
                var mid = $(this).attr('_mid') || $(this).attr('mid');
                var href = $(this).attr('data-href');
                var instance = that.findMenuById(mid);

                e = $.Event(MainMenu.DEFAULTS.events.clickMenu, {
                    relatedTarget: that.element,
                    target: this,
                    mid: mid,
                    href: href,
                    instance: instance
                });

                that.$element.trigger(e);
            });

        },
        populate: function() {
            var that = this;
            var purl = this.options.url + (this.options.url.indexOf('?') > -1 ? '&' : '?') + '_=' + (new Date()).valueOf();

            $.ajax({
                url: purl,
                data: this.options.param,
                dataType: this.options.dataType,
                type: this.options.method,
                success: function(data) {
                    var e;

                    if (data != null && data.error != null) {
                        e = $.Event(MainMenu.DEFAULTS.events.populateError, {
                            "data": data
                        });
                        that.$element.trigger(e);
                    } else {
                        that.constructTree(data);

                        e = $.Event(MainMenu.DEFAULTS.events.populateSuccess, {
                            "data": data
                        });
                        that.$element.trigger(e);
                    }
                },
                error: function(data) {
                    e = $.Event(MainMenu.DEFAULTS.events.populateError, {
                        "data": data
                    });
                    that.$element.trigger(e);
                }
            });
        },
        findMenuById: function(mid) {
            return mid && this.nodes['$' + mid] && this.nodes['$' + mid].origin;
        },
        _destroy: function() {

        }
    }

    /* MAINMENU PLUGIN DEFINITION
     * ======================= */

    var old = $.fn.mainMenu

    $.fn.mainMenu = function(options) {

        // slice arguments to leave only arguments after function name.
        var args = Array.prototype.slice.call(arguments, 1);

        // Cache any plugin method call, to make it possible to return a value
        var results;

        this.each(function() {
            var element = this,
                $element = $(element),
                pluginKey = 'mu.mainMenu',
                instance = $.data(element, pluginKey)


            // if there's no plugin instance for this element, create a new one, calling its "init" method, if it exists.
            if (!instance) {
                instance = $.data(element, pluginKey, new MainMenu(element, options));
                if (instance && typeof MainMenu.prototype['_init'] === 'function')
                    MainMenu.prototype['_init'].apply(instance, [element, options]);
            }

            // if we have an instance, and as long as the first argument (options) is a valid string value, tries to call a method from this instance.
            if (instance && typeof options === 'string' && options[0] !== '_' && options !== 'init') {

                var methodName = (options == 'destroy' ? '_destroy' : options);
                if (typeof MainMenu.prototype[methodName] === 'function')
                    results = MainMenu.prototype[methodName].apply(instance, args);

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy')
                    $.data(element, pluginKey, null);
            }
        });

        // If the earlier cached method gives a value back, return the resulting value, otherwise return this to preserve chainability.
        return results !== undefined ? results : this;
    }

    $.fn.mainMenu.Constructor = MainMenu


    /* MAINMENU NO CONFLICT
     * ================= */

    $.fn.mainMenu.noConflict = function() {
        $.fn.mainMenu = old
        return this
    }


    /* MAINMENU DATA-API
     * ============== */
    $(document).on('ready update', function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[rel=mainMenu]').each(function(index, el) {
            var $this = $(this);
            if (!$this.data('mu.mainMenu')) {
                $(this).mainMenu();
            }
        });
    });


    /* HELP METHOD
     *=================*/
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

        for (var i = 0; i < sorted.length; i++) {
            var cur = sorted[i];
            if (cur.parent) {
                cur.parent.children.push(cur);
            } else {
                root.push(cur);
            }
        }

        sorted = [];
        return {
            "tree": root,
            "nodes": tmpNodes
        };
    };

})(JSON || {}, jQuery, window, document);
