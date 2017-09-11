/** ========================================================================
 * Mower: messagebox.mower.js - v1.0.0
 *
 *  messagebox show message alter window alert with status,ie:success,warning and so on.
 *
 * Dependencies :
 *                toastr plugin
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

var MessageBox = (function($, toastr) {

    var DEFAULTS = {
        "closeButton": true,
        "debug": false,
        "positionClass": "toast-top-center",
        "onclick": null,
        "showDuration": "1000",
        "hideDuration": "1000",
        "timeOut": "2000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };

    return {
        init: function() {
            toastr.options = $.extend({}, toastr.options, DEFAULTS);
        },
        success: function(message, title, options) {
            toastr.success(message, title, options);
        },
        warning: function(message, title, options) {
            toastr.warning(message, title, options);
        },
        info: function(message, title, options) {
            toastr.info(message, title, options);
        },
        error: function(message, title, options) {
            toastr.error(message, title, options);
        }
    };

}(jQuery, toastr || {}));

jQuery(function() {
    MessageBox.init();
});
