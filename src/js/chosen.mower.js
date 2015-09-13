/** ========================================================================
 * Mower: chosen.mower.js - v1.0.0
 *
 * apply chosen on document ready.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function($, base, window, document, undefined) {

    'use strict';

    // private functions & variables

    // Apply chosen to all elements with the rel="chosen" attribute
    // ===================================
    
    $(document).on('ready update', function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[rel=chosen]').each(function(index, el) {
            var $this = $(this);

            if (!$this.data('chosen')) {
                $(this).chosen($this.data());
            }
        });
    });

}(jQuery, Base || {}, window, document));