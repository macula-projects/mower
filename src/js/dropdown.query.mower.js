/** ========================================================================
 * Mower: dropdown.query.mower.js - v1.0.0
 *
 *  append input value to select items and dropdown it.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function($, utils) {
    'use strict';

    // DROPDOWN CLASS DEFINITION
    // =========================

    var backdrop = '.dropdownquery-backdrop';
    var toggle = '[data-toggle="dropdownquery"]';
    var ddqKey = 'dropdownquery';

    var specialKeyCodeMap;
    specialKeyCodeMap = {
        9: "tab",
        27: "esc",
        37: "left",
        39: "right",
        13: "enter",
        38: "up",
        40: "down"
    };

    var DropDownQuery = function(element, options) {
        this.options = options;
        this.element = element;
        this.$element = $(element);
        this.$parent = this.$element.parent('.mu-tagsselect');

        this.construct();

        var onInput = utils.bind(this.toggle, this);
        var that = this;
        // ie7 and ie8 don't support the input event
        // ie9 doesn't fire the input event when characters are removed
        // not sure if ie10 is compatible
        if (!utils.isMsie()) {
            this.$element.on('input.mu.dropdownquery', onInput);
        } else {
            this.$element.on('keydown.mu.dropdownquery keypress.mu.dropdownquery cut.mu.dropdownquery paste.mu.dropdownquery', function($e) {
                // if a special key triggered this, ignore it
                if (specialKeyCodeMap[$e.which || $e.keyCode]) {
                    return;
                }

                // give the browser a chance to update the value of the input
                // before checking to see if the query changed
                utils.defer(utils.bind(that.toggle, that, $e));
            });
        }
    };

    DropDownQuery.prototype.construct = function() {
        var $ul = $('<ul class="dropdown-menu" role="menu"></ul>');
        var data = this.options.source;

        if ($.isArray(data) && data.length > 0) {
            for (var i = 0; i < data.length; i++) {
                var $li;
                if ($.isPlainObject(data[i])) {
                    var key = this.options.displayKey;
                    if (key) {
                        $li = $('<li role="presentation"><a role="menuitem" tabindex="-1" href="#">' + data[i][key] + '</a></li>');
                    }
                } else if (typeof data[i] === 'string') {
                    $li = $('<li role="presentation"><a role="menuitem" tabindex="-1" href="#">' + data[i] + '</a></li>');
                }

                $li.find('a[role="menuitem"]').data(ddqKey, data[i]);
                $ul.append($li);
            }
        }

        var that = this;
        $ul.on('click','li > a',function(e){
            e.preventDefault();
            e.stopPropagation();
            
            that.$element.trigger('dropdownquery:selected', [$(this).data(ddqKey),$.trim(that.$element.val())]);

            that.$element.focus();

            clearMenus();
        });

        this.$parent.after($ul);
    };


    DropDownQuery.prototype.toggle = function(e) {
        clearMenus();

        var $element = this.$element;

        if ($element.is('.disabled, :disabled')) return;

        var inputValue = $.trim($element.val());
        if (inputValue.length <= 0) return;

        var $parent = getParent($element);

        var desc = ' li:not(.divider) a';
        var $items = $parent.find('[role="menu"]' + desc + ', [role="listbox"]' + desc);
        $items.removeClass('current');

        if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
            // if mobile we use a backdrop because click events don't delegate
            $('<div class="dropdownquery-backdrop"/>').insertAfter($element).on('click', clearMenus);
        }

        var relatedTarget = {
            relatedTarget: $element
        };

        $parent.trigger(e = $.Event('show.mu.dropdownquery', relatedTarget));

        if (e.isDefaultPrevented()) return;

        $element.trigger('focus');

        var that = this;
        $.each($items, function(index, val) {
            var newtext;
            if ($.isPlainObject($(this).data(ddqKey))) {
                var key = that.options.displayKey;
                if (key) {
                    newtext = $(this).data(ddqKey)[key] + " : " + inputValue;
                }
            } else {
                newtext = $(this).data(ddqKey) + " : " + inputValue;
            }

            $(this).text(newtext);
        });

        $parent
            .toggleClass('open')
            .trigger('shown.mu.dropdownquery', relatedTarget);

        return false;
    };

    DropDownQuery.prototype.keydown = function(e) {
        if (!/(38|40|27|13)/.test(e.keyCode)) return;

        var $this = $(this);

        e.preventDefault();
        e.stopPropagation();

        if ($this.is('.disabled, :disabled')) return;

        var $parent = getParent($this);
        var desc = ' li:not(.divider):visible a';
        var $items = $parent.find('[role="menu"]' + desc + ', [role="listbox"]' + desc);

        if (!$items.length) return;

        var index = $items.index($items.filter('.current'));
        if (e.keyCode === 13) {
            var $input = $parent.find(toggle);
            $input.trigger('dropdownquery:selected', [$items.eq(index).data(ddqKey),$.trim($input.val())]);

            clearMenus();

            $input.trigger('focus');
        } else {
            if (e.keyCode === 38 && index > 0) index--; // up
            if (e.keyCode === 40 && index < $items.length - 1) index++; // down
            if (!~index) index = 0;

            $items.removeClass('current').eq(index).addClass('current').trigger('focus');
        }
    };

    DropDownQuery.prototype.val = function(value) {
        this.$element.val(value);
    };

    function clearMenus(e) {
        if (e && e.which === 3) return;
        $(backdrop).remove();
        $(toggle).each(function() {
            var $parent = getParent($(this));
            var relatedTarget = {
                relatedTarget: this
            };
            if (!$parent.hasClass('open')) return;
            $parent.trigger(e = $.Event('hide.mu.dropdownquery', relatedTarget));
            if (e.isDefaultPrevented()) return;
            $parent.removeClass('open').trigger('hidden.mu.dropdownquery', relatedTarget);
        });
    }

    function getParent($this) {
        var selector = $this.attr('data-target');

        if (!selector) {
            selector = $this.attr('href');
            selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, ''); // strip for ie7
        }

        var $parent = selector && $(selector);

        return $parent && $parent.length ? $parent : $this.parent();
    }


    // DROPDOWN PLUGIN DEFINITION
    // ==========================

    function Plugin(option) {
        var arg = arguments;
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('mu.dropdownquery');
            var options = typeof option == 'object' && option;

            if (!data && option == 'destroy') return;
            if (!data) $this.data('mu.dropdownquery', (data = new DropDownQuery(this, options)));
            if (typeof option == 'string') {
                if (arg.length > 1) {
                    data[option].apply(data, Array.prototype.slice.call(arg, 1));
                } else {
                    data[option]();
                }
            }
        });
    }

    var old = $.fn.dropdownquery;

    $.fn.dropdownquery = Plugin;
    $.fn.dropdownquery.Constructor = DropDownQuery;


    // DROPDOWN NO CONFLICT
    // ====================

    $.fn.dropdownquery.noConflict = function() {
        $.fn.dropdownquery = old;
        return this;
    };


    // APPLY TO STANDARD DROPDOWN ELEMENTS
    // ===================================

    $(document)
        .on('click.mu.dropdownquery.data-api', clearMenus)
        .on('click.mu.dropdownquery.data-api', '.dropdownquery form', function(e) {
            e.stopPropagation();
        })
        .on('keydown.mu.dropdownquery.data-api', toggle + ', [role="menu"], [role="listbox"]', DropDownQuery.prototype.keydown);

}(jQuery, Utils));
