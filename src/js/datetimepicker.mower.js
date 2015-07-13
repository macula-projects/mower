/** ========================================================================
 * Mower: datetimepicker.mower.js - v1.0.0
 *
 * apply datetimepicker on document ready.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function($, window, document, undefined) {

    'use strict';

    // private functions & variables

    // Apply datetimepicker to all elements with the rel="datetimepicker" attribute
    // ===================================

    $(document).on('ready update', function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[rel="datetimepicker"]').each(function(index, el) {
                var $this = $(this),
                    options = $this.data();
                
                $this.datetimepicker(options);
        });
    });
}(jQuery, window, document));