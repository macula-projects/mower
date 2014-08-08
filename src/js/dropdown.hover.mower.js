/**
 * Project: Bootstrap Hover Dropdown
 * Author: Cameron Spear
 * Contributors: Mattia Larentis
 *
 * Dependencies: Bootstrap's Dropdown plugin, jQuery
 *
 * A simple plugin to enable Bootstrap dropdowns to active on hover and provide a nice user experience.
 *
 * License: MIT
 *
 * http://cameronspear.com/blog/bootstrap-dropdown-on-hover-plugin/
 *
 * updated By Eric.Ou:
 *     1.Organize code as like bootstrap javascript
 *     2.Add plugin data to keep instance
 *     3.Add support reinit plugin after load dynamicly
 */

(function($, window, undefined) {

    // outside the scope of the jQuery plugin to
    // keep track of all dropdowns
    var $allDropdowns = $();

    var DropdownHover = function(element,options) {
        this.element = element;
        this.$element = $(element);
        this.options = options;

        this.init();
    }

    DropdownHover.prototype.init = function() {
        var $parent = this.$element.parent(),
            defaults = {
                delay: 500,
                instantlyCloseOthers: true
            },
            data = {
                delay: this.$element.data('delay'),
                instantlyCloseOthers: this.$element.data('close-others')
            },
            showEvent = 'show.bs.dropdown',
            hideEvent = 'hide.bs.dropdown',
            // shownEvent  = 'shown.bs.dropdown',
            // hiddenEvent = 'hidden.bs.dropdown',
            settings = $.extend(true, {}, defaults, this.options, data),
            timeout;

        var that = this;
        $parent.hover(function(event) {
            // so a neighbor can't open the dropdown
            if (!$parent.hasClass('open') && !this.$element.is(event.target)) {
                // stop this event, stop executing any code
                // in this callback but continue to propagate
                return true;
            }

            $allDropdowns.find(':focus').blur();

            if (settings.instantlyCloseOthers === true)
                $allDropdowns.removeClass('open');

            window.clearTimeout(timeout);
            $parent.addClass('open');
            that.$element.trigger(showEvent);

        }, function() {
            timeout = window.setTimeout(function() {
                $parent.removeClass('open');
                that.$element.trigger(hideEvent);
            }, settings.delay);
        });

        // this helps with button groups!
        this.$element.hover(function() {
            $allDropdowns.find(':focus').blur();

            if (settings.instantlyCloseOthers === true)
                $allDropdowns.removeClass('open');

            window.clearTimeout(timeout);
            $parent.addClass('open');
            that.$element.trigger(showEvent);
        });

        // handle submenus
        $parent.find('.dropdown-submenu').each(function (){
            var $this = $(this);
            var subTimeout;
            $this.hover(function () {
                window.clearTimeout(subTimeout);
                $this.children('.dropdown-menu').show();
                // always close submenu siblings instantly
                $this.siblings().children('.dropdown-menu').hide();
            }, function () {
                var $submenu = $this.children('.dropdown-menu');
                subTimeout = window.setTimeout(function () {
                    $submenu.hide();
                }, settings.delay);
            });
        });
    }


    // DROPDOWNHOVER PLUGIN DEFINITION
    // ==========================

    // if instantlyCloseOthers is true, then it will instantly
    // shut other nav items when a new one is hovered over
    function Plugin(options) {
        // don't do anything if touch is supported
        // (plugin causes some issues on mobile)
        if ('ontouchstart' in document) return this; // don't want to affect chaining

        // the element we really care about
        // is the dropdown-toggle's parent
        $allDropdowns = $allDropdowns.add(this.parent());

        return this.each(function() {
            var $this = $(this)
            var data = $this.data('bs.dropdownhover')

            if (!data) $this.data('bs.dropdownhover', (data = new DropdownHover(this,options)))
            if (typeof options == 'string') data[options].call($this)
        })
    }

    var old = $.fn.dropdownHover

    $.fn.dropdownHover = Plugin
    $.fn.dropdownHover.Constructor = DropdownHover


    // DROPDOWNHOVER NO CONFLICT
    // ====================

    $.fn.dropdownHover.noConflict = function() {
        $.fn.dropdownHover = old
        return this
    }


    // Apply dropdownHover to all elements with the data-hover="dropdown" attribute
    // ===================================
    $(document).on('ready update', function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[data-hover="dropdown"]').each(function(index, el) {
            var $this = $(this);

            if (!$this.data('bs.dropdownhover')) {

                $this.dropdownHover();
            }
        });
    });
    
})(jQuery, window);
