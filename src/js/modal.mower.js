/** ========================================================================
 * Mower: modal.mower.js - v1.0.0
 *
 *  bootstrap-modal support ajax capabilities
 *
 * Dependencies :
 *                bootstrap-modal
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function(json, uuid, $, window, document, undefined) {

    'use strict';

    // AJAXMODAL CLASS DEFINITION
    // ====================
    var _defaultHref = 'javascript:;';

    var AModal = function(element, options) {
        this.$element = $(element);
        this.options = options;
        this.options.param = json.decode(this.options.param || '{}');

        this.init();
    };

    AModal.VERSION = '3.2.0';

    AModal.DEFAULTS = {
        prefix: 'amodal-id-', // prefix of target modal id
        url: '',
        selector: '', // target modal
        animate: true,
        backdrop: 'static',
        header: 'AModal',
        keyboard: false,
        classes: '', //modal body class
        btnClasses: {}, //modal footer button classes
        handlers: [], //modal footer button handler
        icons: {},
        param: '{}',
        width: null,
        height: null,
        maxHeight: null,
        modalOverflow: false,
        spinner: '<div class="loading-spinner" style="width: 200px; margin-left: -100px;"><div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div></div>',
        backdropTemplate: '<div class="modal-backdrop" />',
        show: true,
        container: 'body', //default container of ajax modal append
        manager: 'body' //ModalManager
    };

    AModal.prototype._dialog = function(str, options) {
        var buttons = "",
            callbacks = [];

        if (!options) {
            options = {};
        }

        var handlers = options.handlers;
        // check for single object and convert to array if necessary
        if (typeof handlers === 'undefined') {
            handlers = [];
        } else if (typeof handlers.length == 'undefined') {
            handlers = [handlers];
        }

        var i = handlers.length;
        while (i--) {
            var label = null,
                href = null,
                _class = null,
                icon = '',
                callback = null;

            if (typeof handlers[i]['label'] == 'undefined' &&
                typeof handlers[i]['class'] == 'undefined' &&
                typeof handlers[i]['callback'] == 'undefined') {
                // if we've got nothing we expect, check for condensed format

                var propCount = 0, // condensed will only match if this == 1
                    property = null; // save the last property we found

                // be nicer to count the properties without this, but don't think it's possible...
                for (var j in handlers[i]) {
                    property = j;
                    if (++propCount > 1) {
                        // forget it, too many properties
                        break;
                    }
                }

                if (propCount == 1 && typeof handlers[i][j] == 'function') {
                    // matches condensed format of label -> function
                    handlers[i]['label'] = property;
                    handlers[i]['callback'] = handlers[i][j];
                }
            }

            if (typeof handlers[i]['callback'] == 'function') {
                callback = handlers[i]['callback'];
            }

            if (handlers[i]['class']) {
                _class = handlers[i]['class'];
            } else if (i == handlers.length - 1 && handlers.length <= 2) {
                // always add a primary to the main option in a two-button dialog
                _class = 'btn-primary';
            }

            if (handlers[i]['link'] !== true) {
                _class = 'btn ' + _class;
            }

            if (handlers[i]['label']) {
                label = handlers[i]['label'];
            } else {
                label = "Option " + (i + 1);
            }

            if (handlers[i]['icon']) {
                icon = "<i class='" + handlers[i]['icon'] + "'></i> ";
            }

            if (handlers[i]['href']) {
                href = handlers[i]['href'];
            } else {
                href = _defaultHref;
            }

            buttons = "<a data-handler='" + i + "' class='" + _class + "' href='" + href + "'>" + icon + "" + label + "</a>" + buttons;

            callbacks[i] = callback;
        }

        var parts = ["<div id=" + options.dialogId + " class='modal' tabindex='-1'>"];

        if (options['header']) {
            var closeButton = '';
            if (typeof options['headerCloseButton'] == 'undefined' || options['headerCloseButton']) {
                closeButton = "<a href='" + _defaultHref + "' class='close'>&times;</a>";
            }

            parts.push("<div class='modal-header'>" + closeButton + "<h3>" + options['header'] + "</h3></div>");
        }

        // push an empty body into which we'll inject the proper content later
        parts.push("<div class='modal-body'></div>");

        if (buttons) {
            parts.push("<div class='modal-footer'>" + buttons + "</div>");
        }

        parts.push("</div>");

        var div = $(parts.join("\n"));

        // check whether we should fade in/out
        var shouldFade = options.animate;

        if (shouldFade) {
            div.addClass("fade");
        }

        var optionalClasses = options.classes;
        if (optionalClasses) {
            div.addClass(optionalClasses);
        }

        // now we've built up the div properly we can inject the content whether it was a string or a jQuery object
        div.find(".modal-body").html(str);

        function onCancel(source) {
            // for now source is unused, but it will be in future
            var hideModal = null;
            if (typeof options.onEscape === 'function') {
                // @see https://github.com/makeusabrew/bootbox/issues/91
                hideModal = options.onEscape();
            }

            if (hideModal !== false) {
                div.modal('hide');
            }
        }

        // handle close buttons too
        div.on('click', 'a.close', function(e) {
            e.preventDefault();
            onCancel('close');
        });

        // well, *if* we have a primary - give the first dom element focus
        div.on('shown', function() {
            div.find("a.btn-primary:first").focus();
        });


        var that = this;
        // wire up button handlers
        div.on('click', '.modal-footer a', function(e) {

            var handler = $(this).data("handler"),
                cb = callbacks[handler],
                hideModal = null;

            // sort of @see https://github.com/makeusabrew/bootbox/pull/68 - heavily adapted
            // if we've got a custom href attribute, all bets are off
            if (typeof handler !== 'undefined' &&
                typeof handlers[handler]['href'] !== 'undefined') {

                return;
            }

            e.preventDefault();

            if (typeof cb === 'function') {
                hideModal = cb(e);
            }

            that.$element.trigger('amodal:selected', [hideModal]);

            // the only way hideModal *will* be false is if a callback exists and
            // returns it as a value. in those situations, don't hide the dialog
            // @see https://github.com/makeusabrew/bootbox/pull/25
            if (hideModal !== false) {
                div.modal("hide");
            }
        });

        // stick the modal right at the bottom of the main body out of the way
        $(options.container).append(div);

        div.on("show", function(e) {
            $(document).off("focusin.modal");
        });

        return div;
    };

    AModal.prototype.init = function() {
        var href = this.options.url,
            href = (href && href.replace(/.*(?=#[^\s]+$)/, '')); //strip for ie7

        if (href) {
            var purl = href + (href.indexOf('?') > -1 ? '&' : '?') + '_=' + (new Date()).valueOf();

            var that = this;
            var ajaxOpt = {
                url: purl,
                data: this.options.param,
                dataType: 'html',
                success: function(data, status, xhr) {
                    var ct = xhr.getResponseHeader('content-type') || '';
                    if (ct.indexOf('json') > -1) {
                        that.$element.trigger('ajaxError', [xhr, ajaxOpt]); //global event
                        return;
                    }

                    if (data) {
                        var dialogId = that.options.selector ? (that.options.prefix + that.options.selector) : uuid(that.options.prefix);
                        that.options.dialogId = dialogId;
                        that.$element.attr("data-target", '#' + dialogId);


                        that._dialog(data, that.options);

                    }
                }
            };

            $.ajax(ajaxOpt);
        }
    };

    AModal.prototype.show = function() {
        var that = this,
            dialog = this.$element.attr("data-target");

        $(dialog)
            .modal(this.options);
    };


    // AJAXMODAL PLUGIN DEFINITION
    // =====================

    function Plugin(option) {
        return this.each(function() {
            var $this = $(this),
                data = $this.data('mu.amodal'),
                options = $.extend({}, AModal.DEFAULTS, $this.data(), typeof option == 'object' && option);

            if (!data) $this.data('mu.amodal', (data = new AModal(this, options)));
            if (typeof option === 'string') data[option]();
        });
    }

    var old = $.fn.amodal;

    $.fn.amodal = Plugin;
    $.fn.amodal.Constructor = AModal;


    // AJAXMODAL NO CONFLICT
    // ===============

    $.fn.amodal.noConflict = function() {
        $.fn.amodal = old;
        return this;
    };


    // AJAXMODAL DATA-API
    // ============
    $(document).on('click.mu.amodal.data-api', '[data-toggle^="amodal"]', function(e) {
        var $this = $(this);
        if ($this.is('a')) e.preventDefault();

        Plugin.call($this, 'show');
    });

})(JSON || {}, UniqueId || {}, jQuery, window, document);
