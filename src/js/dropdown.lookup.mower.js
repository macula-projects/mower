/** ========================================================================
 * Mower: dropdown.lookup.mower.js - v1.0.0
 *
 *  dropdown custom container.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function($, window, document, undefined) {
    'use strict';

    // DROPDOWN CLASS DEFINITION
    // =========================

    var backdrop = '.dropdown-backdrop';
    var toggle = '[data-toggle="lookup"]';
    var DropdownLookup = function(element) {
        $(element).on('click.bs.dropdown', this.toggle);
    };

    DropdownLookup.prototype.toggle = function(e) {
        var $this = $(this);

        if ($this.is('.disabled, :disabled')) return;

        var $parent = getParent($this);
        var isActive = $parent.hasClass('open');

        clearMenus();

        if (!isActive) {
            if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
                // if mobile we use a backdrop because click events don't delegate
                $('<div class="dropdown-backdrop"/>').insertAfter($(this)).on('click', clearMenus);
            }

            var relatedTarget = {
                relatedTarget: this
            };
            $parent.trigger(e = $.Event('show.bs.dropdown', relatedTarget));

            if (e.isDefaultPrevented()) return;

            $this.trigger('focus');

            $parent
                .toggleClass('open')
                .trigger('shown.bs.dropdown', relatedTarget);
        }

        return false;
    };


    function clearMenus(e) {
        if (e && e.which === 3) return;
        $(backdrop).remove();
        $(toggle).each(function() {
            var $parent = getParent($(this))
            if (e && $.contains($parent[0], e.target)) {
                e.preventDefault();
            } else {
                var relatedTarget = {
                    relatedTarget: this
                };
                if (!$parent.hasClass('open')) return;
                $parent.trigger(e = $.Event('hide.bs.dropdown', relatedTarget));
                if (e.isDefaultPrevented()) return;
                $parent.removeClass('open').trigger('hidden.bs.dropdown', relatedTarget);
            }
        });
    };

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
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('bs.dropdown');

            if (!data) $this.data('bs.dropdown', (data = new DropdownLookup(this)));
            if (typeof option == 'string') data[option].call($this);
        });
    }

    var old = $.fn.dropdownLookup;

    $.fn.dropdownLookup = Plugin;
    $.fn.dropdownLookup.Constructor = DropdownLookup;


    // DROPDOWN NO CONFLICT
    // ====================

    $.fn.dropdownLookup.noConflict = function() {
        $.fn.dropdownLookup = old;
        return this;
    };


    // APPLY TO STANDARD DROPDOWN ELEMENTS
    // ===================================

    $(document)
        .on('click.bs.dropdown.data-api', clearMenus)
        .on('click.bs.dropdown.data-api', '.dropdown form', function(e) {
            e.stopPropagation();
        })
        .on('click.bs.dropdown.data-api', toggle, DropdownLookup.prototype.toggle);

})(jQuery, window, document);
