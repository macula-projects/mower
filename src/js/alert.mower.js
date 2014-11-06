/** ========================================================================
 * Mower: alert.mower.js - v1.0.0
 *
 *  add supporting stateful base on bootstrap alert.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */
(function(define) {

    'use strict';

    define(['jquery', 'uniqueId'], function($, uuid) {
        return (function() {

            var alertType = {
                error: 'danger',
                info: 'info',
                success: 'success',
                warning: 'warning'
            };

            var alertmore = {
                options: {},
                error: error,
                success: success,
                warning: warning,
                info: info
            };

            return alertmore;

            //#region Accessible Methods
            function error(message, optionsOverride) {
                return alert({
                    type: alertType.error,
                    message: message,
                    optionsOverride: optionsOverride
                });
            }

            function info(message, optionsOverride) {
                return alert({
                    type: alertType.info,
                    message: message,
                    optionsOverride: optionsOverride
                });
            }

            function success(message, optionsOverride) {
                return alert({
                    type: alertType.success,
                    message: message,
                    optionsOverride: optionsOverride
                });
            }

            function warning(message, optionsOverride) {
                return alert({
                    type: alertType.warning,
                    message: message,
                    optionsOverride: optionsOverride
                });
            }

            //#endregion

            //#region Internal Methods

            function alert(map) {
                var options = getOptions(),
                    type = map.type || options.type;

                if (typeof(map.optionsOverride) !== 'undefined') {
                    options = $.extend(options, map.optionsOverride);
                    type = map.optionsOverride.type || type;
                }

                var id = uuid("mower-alert");

                var html = '<div id="' + id + '" class="_mower-alerts alert alert-' + type + ' alert-dismissible fade in">' + (options.close === true ? '<button type="button" class="close" data-dismiss="alert" aria-hidden="true"><span aria-hidden="true">×</span><span class="sr-only">Close</span></button>' : '') + (options.iconable === true ? '<i class="fa-fw fa-lg fa ' + getDefaultIconByType(type) + '"></i>  ' : '') + map.message + '</div>';

                if (!options.container) {
                    $(options.defaultContainer).next('._mower-alerts').remove();
                    $(options.defaultContainer).after(html);
                } else {
                    $(options.container).find('._mower-alerts').remove();

                    if (options.place == "append") {
                        $(options.container).append(html);
                    } else {
                        $(options.container).prepend(html);
                    }
                }

                return id;
            }

            function getDefaultIconByType(type) {
                var result;
                switch (type) {
                    case alertType.error:
                        result = 'fa-times';
                        break;
                    case alertType.info:
                        result = 'fa-info';
                        break;
                    case alertType.warning:
                        result = 'fa-warning';
                        break;
                    case alertType.success:
                        result = 'fa-check';
                        break;
                    default:
                        result = 'fa-check';
                        break;
                }
                return result;
            }

            function getDefaults() {
                return {
                    defaultContainer: ".mu-breadcrumb", // default container
                    container: "", // alerts parent container(by default placed after the page breadcrumbs)
                    place: "append", // append or prepent in container 
                    type: 'success', // alert's type
                    iconable: true, // put icon before the message
                    reset: true, // close all previouse alerts first
                    close: true // make alert closable
                };
            }

            function getOptions() {
                return $.extend({}, getDefaults(), alertmore.options);
            }

            //#endregion
        })();
    });

}(typeof define === 'function' && define.amd ? define : function(deps, factory) {
    if (typeof module !== 'undefined' && module.exports) { //Node
        module.exports = factory(require('jquery'), require('uniqueId'));
    } else {
        window['alertmore'] = factory(window['jQuery'], window['UniqueId']);
    }
}));