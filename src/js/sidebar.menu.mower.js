/** ========================================================================
 * Mower: sidebar.menu.mower.js - v1.0.0
 *
 * sidebar menu to display menu stay on main content left.
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

    var SidebarMenu = function(element, options) {
        this.element = element;
        this.$element = $(element);
        this.options = options;
        this.nodes = [];

        this.rootcode = '_root'; //default
    };

    //you can put your plugin defaults in here.
    SidebarMenu.DEFAULTS = {
        url: '', //ajax url
        param: '{}', //data to be sent to the server.
        method: 'GET', // data sending method
        dataType: 'json', // type of data loaded
        populate: true,
        selectFirst:true,
        menuItemTemplate: function() {
            if (typeof $.template === "function") {
                return $.template(null, '<li><a href="javascript:void(0);" mcode="${code}"  data-mode="{{if attributes.openMode}}${attributes.openMode}{{else}}normal{{/if}}" data-href="${uri}" data-toggle="menu" >{{if attributes.iconUri}}<i class="menu-icon ${attributes.iconUri}"></i>{{/if}}<span class="menu-text">${name}</span></a></li>');
            } else {
                return "";
            }
        },
        subMenuItemTemplate: function() {
            if (typeof $.template === "function") {
                return $.template(null, '<li><a href="javascript:void(0);" mcode="${code}" data-href="${uri}" data-mode="{{if attributes.openMode}}${attributes.openMode}{{else}}normal{{/if}}" class="menu-dropdown" >{{if attributes.iconUri}}<i class="${attributes.iconUri}"></i>{{/if}}<span class="menu-text">${name}</span><i class="menu-expand"></i></a><ul class="submenu"></ul></li>');
            } else {
                return "";
            }
        },
        icons: ['glyphicon glyphicon-tasks', 'fa fa-th', 'fa fa-desktop'],
        events: {
            clickMenu: "clickMenu.mu.sidebarMenu",
            complete: "complete.mu.sidebarMenu",
            populateError: "error.populate.mu.sidebarMenu",
            populateSuccess: "success.populate.mu.sidebarMenu"
        }
    };

    SidebarMenu.prototype = {

        constructor: SidebarMenu,

        _init: function(element, options) {
            var $element = $(element);
            this.options = $.extend({}, SidebarMenu.DEFAULTS, $element.data(), typeof options === 'object' && options);
            this.options.url && (this.options.url = utils.getAbsoluteUrl(this.options.url, $element.getContextPath()));

            this.options.param = json.decode(this.options.param || '{}');

            //handle menu collapse action
            var that = this;
            var b = this.$element.parent().hasClass("menu-compact");
            this.$element.on('click.toggle.mu.menu', function(e) {
                var menuLink = $(e.target).closest("a");
                if (!menuLink || menuLink.length == 0)
                    return;

                //exclude data-toggle="menu"
                if (!menuLink.hasClass("menu-dropdown")) {
                    if (b && menuLink.get(0).parentNode.parentNode == that) {
                        var menuText = menuLink.find(".menu-text").get(0);
                        if (e.target != menuText && !$.contains(menuText, e.target)) {
                            return false;
                        }
                    }
                    return;
                }
                var submenu = menuLink.next().get(0);
                if (!$(submenu).is(":visible")) {
                    var c = $(submenu.parentNode).closest("ul");
                    if (b && c.hasClass("sidebar-menu"))
                        return;

                    //close other open menu
                    c.find("> .open > .submenu")
                        .each(function() {
                            if (this != submenu && !$(this.parentNode).hasClass("active"))
                                $(this).slideUp(200).parent().removeClass("open");
                        });
                }
                if (b && $(submenu.parentNode.parentNode).hasClass("sidebar-menu"))
                    return false;

                var slideOffeset = -200;
                var slideSpeed = 200;

                if ($(submenu).is(":visible")) {
                    $(submenu).slideUp(slideSpeed, function() {
                        if ($('body').hasClass('page-sidebar-compact') === false) {
                            utils.scrollTo($(menuLink), slideOffeset);
                        }
                    }).parent().removeClass("open");
                } else {
                    $(submenu).slideDown(slideSpeed, function() {
                        if ($('body').hasClass('page-sidebar-compact') === false) {
                            utils.scrollTo($(menuLink), slideOffeset);
                        }
                    }).parent().addClass("open");
                }

                return false;
            });

            //handle a element menu  click event
            this.$element.on('click.forward.mu.menu', '[data-toggle="menu"]', function(e) {
                e.stopPropagation();

                var $this = $(this);
                if ($this.is('a')) e.preventDefault();

                var mcode = $this.attr('_mcode') || $this.attr('mcode');
                var href = $this.attr('data-href');
                var openMode = $this.attr('data-mode') || 'normal';
                var instance = that.findMenuByCode(mcode); //origin

                var module = this;
                var event = $.Event(SidebarMenu.DEFAULTS.events.clickMenu, {
                    relatedTarget: that.element,
                    target: module,
                    rcode: that.rootcode,
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
                    $.cookie('rcode', this.rootcode);
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

            if (this.options.populate === true) this.populate();
        },
        constructTree: function(treeFlatData, rootcode, selectedNode) {
            var datasource = treeFlatData.makeLevelTree({
                pid: 'parentId',
                order: function(m) {
                    return m['attributes']['ordered'];
                }
            });

            this.nodes = datasource.nodes;

            if (rootcode) {
                this.renderMenu(this.nodes[rootcode], selectedNode);

                this.rootcode = rootcode;
            } else {
                datasource.tree.length && this.renderMenu(datasource.tree[0], selectedNode);
                this.rootcode = datasource.tree[0].code;
            }

            var e = $.Event(SidebarMenu.DEFAULTS.events.complete);
            this.$element.trigger(e);

            return datasource.tree;
        },
        _renderMenuItem: function(item, parent) {
            if (!item.children.length) {
                $.tmpl(SidebarMenu.DEFAULTS.menuItemTemplate(), item).appendTo($(parent));
                return;
            }

            parent = $.tmpl(SidebarMenu.DEFAULTS.subMenuItemTemplate(), item).appendTo($(parent)).find('ul:first');

            for (var i = 0; i < item.children.length; i++) {
                this._renderMenuItem(item.children[i], parent);
            }
        },
        renderMenu: function(tree, selectedNode) {
            if (typeof tree == 'undefined') return;

            this.$element.empty();

            if (tree.children) {
                for (var j = 0; j < tree.children.length; j++) { //special tree
                    this._renderMenuItem(tree.children[j], this.element);
                }
            }

            //set icon for first level children of element mandatory 
            var notIcons = this.$element.find('> li > a:not(:has(.menu-icon))');

            $.each(notIcons, function(index, item) {
                /* iterate through array or object */
                $(this).prepend('<i class="menu-icon ' + SidebarMenu.DEFAULTS.icons[index % SidebarMenu.DEFAULTS.icons.length] + '"></i>');
            });


            selectedNode = selectedNode || (this.options.selectFirst ? this.$element.find('a[data-toggle="menu"][data-mode="normal"]:first').attr('mcode'):'');

            this.setMenuActiveLink(selectedNode);
        },
        populate: function(rootcode, selectedNode) {
            var that = this;
            var purl = this.options.url;

            $.ajax({
                url: purl,
                cache: true,
                data: this.options.param,
                dataType: this.options.dataType,
                type: this.options.method,
                success: function(data) {
                    var e;

                    if (data != null && data.error != null) {
                        e = $.Event(SidebarMenu.DEFAULTS.events.populateError, {
                            "data": data
                        });
                        that.$element.trigger(e);
                    } else if (data.length) {
                        that.constructTree(data, rootcode, selectedNode);

                        e = $.Event(SidebarMenu.DEFAULTS.events.populateSuccess, {
                            "data": data
                        });
                        that.$element.trigger(e);
                    }
                },
                error: function(data) {
                    var e = $.Event(SidebarMenu.DEFAULTS.events.populateError, {
                        "data": data
                    });
                    that.$element.trigger(e);
                }
            });
        },
        findMenuByCode: function(code) {
            return code && this.nodes[code];
        },
        setMenuActiveLink: function(code) {
            if (code) {
                var $activeMenu = this.$element.find('a[data-toggle="menu"][mcode="' + code + '"]');

                $activeMenu.closest('li').addClass('active');

                var parents = $activeMenu.parentsUntil(this.$element, 'li:not(.active)');

                $(parents).addClass('open');
            }
        },
        _destroy: function() {

        }
    };

    /* MAINMENU PLUGIN DEFINITION
     * ======================= */

    var old = $.fn.sidebarMenu;

    $.fn.sidebarMenu = function(options) {

        // slice arguments to leave only arguments after function name.
        var args = Array.prototype.slice.call(arguments, 1);

        // Cache any plugin method call, to make it possible to return a value
        var results;

        this.each(function() {
            var element = this,
                $element = $(element),
                pluginKey = 'mu.sidebarMenu',
                instance = $.data(element, pluginKey);


            // if there's no plugin instance for this element, create a new one, calling its "init" method, if it exists.
            if (!instance) {
                instance = $.data(element, pluginKey, new SidebarMenu(element, options));
                if (instance && typeof SidebarMenu.prototype['_init'] === 'function')
                    SidebarMenu.prototype['_init'].apply(instance, [element, options]);
            }

            // if we have an instance, and as long as the first argument (options) is a valid string value, tries to call a method from this instance.
            if (instance && typeof options === 'string' && options[0] !== '_' && options !== 'init') {

                var methodName = (options == 'destroy' ? '_destroy' : options);
                if (typeof SidebarMenu.prototype[methodName] === 'function')
                    results = SidebarMenu.prototype[methodName].apply(instance, args);

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy')
                    $.data(element, pluginKey, null);
            }
        });

        // If the earlier cached method gives a value back, return the resulting value, otherwise return this to preserve chainability.
        return results !== undefined ? results : this;
    };

    $.fn.sidebarMenu.Constructor = SidebarMenu;


    /* MAINMENU NO CONFLICT
     * ================= */

    $.fn.sidebarMenu.noConflict = function() {
        $.fn.sidebarMenu = old;
        return this;
    };


    /* MAINMENU DATA-API
     * ============== */
    $(document).on('ready update', function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[rel=sidebarMenu]').each(function(index, el) {
            var $this = $(this);
            if (!$this.data('mu.sidebarMenu')) {
                $(this).sidebarMenu();
            }
        });
    });

})(JSON || {}, Utils || {}, jQuery, window, document);
