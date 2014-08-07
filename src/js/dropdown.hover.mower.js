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
 */

(function($, window, undefined) {
    // outside the scope of the jQuery plugin to
    // keep track of all dropdowns
    var $allDropdowns = $();

    // if instantlyCloseOthers is true, then it will instantly
    // shut other nav items when a new one is hovered over
    $.fn.dropdownHover = function(options) {
        // don't do anything if touch is supported
        // (plugin causes some issues on mobile)
        if ('ontouchstart' in document) return this; // don't want to affect chaining

        // the element we really care about
        // is the dropdown-toggle's parent
        $allDropdowns = $allDropdowns.add(this.parent());

        return this.each(function() {
            var $this = $(this),
                $parent = $this.parent(),
                defaults = {
                    delay: 500,
                    instantlyCloseOthers: true
                },
                data = {
                    delay: $(this).data('delay'),
                    instantlyCloseOthers: $(this).data('close-others')
                },
                showEvent = 'show.bs.dropdown',
                hideEvent = 'hide.bs.dropdown',
                // shownEvent  = 'shown.bs.dropdown',
                // hiddenEvent = 'hidden.bs.dropdown',
                settings = $.extend(true, {}, defaults, options, data),
                timeout;

            $parent.hover(function(event) {
                // so a neighbor can't open the dropdown
                if (!$parent.hasClass('open') && !$this.is(event.target)) {
                    // stop this event, stop executing any code
                    // in this callback but continue to propagate
                    return true;
                }

                $allDropdowns.find(':focus').blur();

                if (settings.instantlyCloseOthers === true)
                    $allDropdowns.removeClass('open');

                window.clearTimeout(timeout);
                $parent.addClass('open');
                $this.trigger(showEvent);

            }, function() {
                timeout = window.setTimeout(function() {
                    $parent.removeClass('open');
                    $this.trigger(hideEvent);
                }, settings.delay);
            });

            // this helps with button groups!
            $this.hover(function() {
                $allDropdowns.find(':focus').blur();

                if (settings.instantlyCloseOthers === true)
                    $allDropdowns.removeClass('open');

                window.clearTimeout(timeout);
                $parent.addClass('open');
                $this.trigger(showEvent);
            });

            //handle submenu
            $parent.on("mouseenter", ".dropdown-menu li", function(e) {
                //stuff to do on mouse enter
                var $row = $(this);

                $row.addClass('hover');

                var itemId = $row.data("menuItemId"),
                    $item = $("#" + itemId),
                    width = $row.parent().outerWidth(),
                    height = $row.parent().outerHeight();

                // Show the submenu
                $item.css({
                    display: "block",
                    top: -1,
                    left: width - 2, // main should overlay submenu
                    "min-height":height
                });
            }).on("mouseleave", ".dropdown-menu li", function(e) {
                //stuff to do on mouse leave
                var $row = $(this);
                $row.removeClass('hover');

                var itemId = $row.data("menuItemId"),
                    $item = $("#" + itemId);

                    
                // Hide the submenu and remove the row's highlighted look
                $item.css("display", "none");
            });
        });
    };

    // Apply dropdownHover to all elements with the data-hover="dropdown" attribute
    // ===================================
    $(document).ready(function() {
        //
        $('[data-hover="dropdown"]').dropdownHover();
    });

})(jQuery, window);
