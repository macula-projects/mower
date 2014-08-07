/** ========================================================================
 * Mower: tooltip.mower.js - v1.0.0
 *
 * apply tooltip on document ready.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function($, base, window, document, undefined) {

    'use strict';

    // private functions & variables

    // Apply tooltip to all elements with the data-toggle="tooltip" attribute
    // ===================================

    $(document).on('ready update', function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[data-toggle=tooltip]').each(function(index, el) {
            var $this = $(this);

            if (!$this.data('bs.tooltip')) {

                var container = $this.data('container') || 'body';

                $(this).tooltip({
                    'container': container
                });
            }
        });
    });
}(jQuery, Base || {}, window, document));