/** ========================================================================
 * Mower: validator.mower.js - v1.0.0
 *
 * apply validate on document ready.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

(function($, base, window, document, undefined) {

    'use strict';

    // private functions & variables

    // Apply tooltip to all elements with the rel="validate-form" attribute
    // ===================================
    $(document).on('ready update',function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[rel=validate-form]').each(function(index, el) {
            var $this = $(this);

            if (!$this.data('bootstrapValidator')) {

                $this.bootstrapValidator({
                    excluded: [':disabled'],
                    message: '请输入合法的数值',
                    feedbackIcons: {
                        valid: 'fa fa-check',
                        invalid: 'fa fa-times',
                        validating: 'fa fa-refresh'
                    }
                });
                
            }
        });
    });

}(jQuery, Base || {}, window, document));
