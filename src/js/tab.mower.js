/** ========================================================================
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

