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

            var alertbox = {
                options: {},
                error: error,
                success: success,
                warning: warning,
                info: info
            };

            return alertbox;

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

                var id = uuid("mower-alert"),html = [];

                html.push('<div id="' + id + '" class="_mower-alerts alert alert-' + type + (options.iconable === true ? ' alert-icon ' : '') + options.classes +  (options.closable === true ? ' alert-dismissable ' : '') + ' fade in">');
                if (options.iconable === true && options.closable === true) {
                    html.push('<i class="fa-fw fa-lg fa ' + getDefaultIconByType(type) + '"></i>');
                    html.push( '<div class="content">' + map.message + '</div>');
                    html.push('<button type="button" class="close" data-dismiss="alert" aria-hidden="true"><span aria-hidden="true">×</span><span class="sr-only">Close</span></button>');
                    html.push('</div>');
                } else {
                    html.push(options.closable === true ?  '<button type="button" class="close" data-dismiss="alert" aria-hidden="true"><span aria-hidden="true">×</span><span class="sr-only">Close</span></button>': '');
                    html.push(options.iconable === true ? '<i class="fa-fw fa-lg fa ' + getDefaultIconByType(type) + '"></i>  ' : '');
                    html.push( '<div class="content">' + map.message + '</div>');
                    html.push('</div>');
                }

                var container = options.defaultContainer;
                if (options.container) container =  options.container;

                $(container).find('._mower-alerts').remove();
                if (options.place === "append") {
                    $(container).append(html.join(''));
                } else {
                    $(container).prepend(html.join(''));
                }

                return id;
            }

            function getDefaultIconByType(type) {
                var result;
                switch (type) {
                    case alertType.error:
                        result = 'fa-times-circle';
                        break;
                    case alertType.info:
                        result = 'fa-info-circle';
                        break;
                    case alertType.warning:
                        result = 'fa-warning';
                        break;
                    case alertType.success:
                        result = 'fa-check-circle';
                        break;
                    default:
                        result = 'fa-check';
                        break;
                }
                return result;
            }

            function getDefaults() {
                return {
                    defaultContainer: ".mu-content-body", // default container
                    container: "", // alerts parent container(by default placed after the page breadcrumbs)
                    place: "prepend", // append or prepend in container 
                    type: 'success', // alert's type
                    iconable: true, // put icon before the message
                    reset: true, // close all previouse alerts first
                    closable: true // make alert closable
                };
            }

            function getOptions() {
                return $.extend({}, getDefaults(), alertbox.options);
            }

            //#endregion
        })();
    });

}(typeof define === 'function' && define.amd ? define : function(deps, factory) {
    if (typeof module !== 'undefined' && module.exports) { //Node
        module.exports = factory(require('jquery'), require('uniqueId'));
    } else {
        window['alertbox'] = factory(window['jQuery'], window['UniqueId']);
    }
}));