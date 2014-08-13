/** ========================================================================
 * Mower: dropdown.bootstrap.js - v0.1.0
 *
 * close or not when clicking on  bootstrap dropdown container.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

(function($, base, window, document, undefined) {

    'use strict';

    var isClosedOnDMBodyClick = function(event) {

        var options = base.parseOptions(this) || {};

        var isClosed = options.closeOnBodyClick;

        if (isClosed === false) {

            event.stopPropagation();

        }
    };

    // Apply to  all elements with the rel="dropdown-menu" attribute
    // ===================================
    $(document)
        .on('click.bs.dropdown.data-api', '[rel=dropdown-menu]', isClosedOnDMBodyClick);

}(jQuery, Base || {}, window, document));

