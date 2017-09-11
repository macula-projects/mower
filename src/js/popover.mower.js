/** ========================================================================
 * Mower: popover.mower.js - v1.0.0
 *
 * Apply popover on document ready.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function($, base, window, document, undefined) {

    'use strict';

    // private functions & variables

    // Apply popover to all elements with the rel="popover" attribute
    // ===================================
    $(document).on('ready update',function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[rel=popover]').each(function(index, el) {
            var $this = $(this);

            if (!$this.data('bs.popover')) {

                var container = $this.data('container') || 'body';
                var placement = $this.data('placement') || 'top';

                $this.popover({
                    'container': container,
                    'placement': placement
                });
            }
        });
    });
}(jQuery, Base || {}, window, document));
