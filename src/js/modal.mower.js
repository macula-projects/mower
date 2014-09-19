/** ========================================================================
 * Mower: modal.mower.js - v1.0.0
 *
 *  bootstrap-tab support ajax capabilities
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

    var AModal = function(element, options) {
        this.$element = $(element);
        this.options = options;
        this.options.param = json.decode(this.options.param || '{}');

        this.init();
    };

    AModal.VERSION = '3.2.0'

    AModal.DEFAULTS = {
        prefix: 'amodal-id-', // prefix of target modal id
        selector: '', // target modal
        title: 'AModal',
        param: '{}',
        width: null,
        height: null,
        maxHeight: null,
        modalOverflow: false,
        spinner: '<div class="loading-spinner" style="width: 200px; margin-left: -100px;"><div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div></div>',
        backdropTemplate: '<div class="modal-backdrop" />',
        template: [
            // tabindex is required for focus
            '<div  class="modal fade" tabindex="-1">',
            '<div class="modal-header">',
            '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>',
            '<h4 class="modal-title">AModal</h4>',
            '</div>',
            '<div class="modal-body">',
            '<p>Test</p>',
            '</div>',
            '<div class="modal-footer">',
            '<a href="#" data-dismiss="modal" class="btn btn-default">Close</a>',
            '<a href="#" class="btn btn-primary">Save changes</a>',
            '</div>',
            '</div>'
        ].join(''),
        show: true,
        container: 'body', //default container of ajax modal append
        manager: 'body' //ModalManager
    }

    AModal.prototype.init = function() {
        var href = this.$element.attr('href'),
            href = (href && href.replace(/.*(?=#[^\s]+$)/, '')), //strip for ie7
            purl = href + (href.indexOf('?') > -1 ? '&' : '?') + '_=' + (new Date()).valueOf();

        if (this.$element.is('a')) e.preventDefault();

        var that = this;
        var ajaxOpt = {
            url: purl,
            data: this.options.param,
            dataType: 'html',
            success: function(data, status, xhr) {
                $(that.options.manager).modalmanager('loading');

                var ct = xhr.getResponseHeader('content-type') || '';
                if (ct.indexOf('json') > -1) {
                    that.$element.trigger('ajaxError', [xhr, ajaxOpt]); //global event
                    return;
                }

                if (data != null && data.error != null) {
                    //Nothing to do
                } else {

                    var $dialog = $(that.options.template),
                        dialogId = that.options.selector ? (that.options.prefix + that.options.selector) : uuid(that.options.prefix);

                    $dialog.attr("id", dialogId);
                    $dialog.find(".modal-header > h3 ").html(that.options.title);
                    $dialog.find(".modal-body").html(data);

                    that.$element.attr("data-target", '#' + dialogId);

                    $(that.container).append($dialog);
                }
            },
            error: function(data) {
                $(that.options.manager).modalmanager('loading');
            }
        };

        $.ajax(ajaxOpt);
    };

    AModal.prototype.show = function() {
        var dialog = this.$element.attr("data-target");

        $(dialog)
            .modal(this.options)
            .one('hide', function() {
                this.$element.is(':visible') && this.$element.trigger('focus')
            })
    };


    // AJAXMODAL PLUGIN DEFINITION
    // =====================

    function Plugin(option, _relatedTarget) {
        return this.each(function() {
            var $this = $(this)
            var data = $this.data('mu.amodal')
            var options = $.extend({}, AModal.DEFAULTS, $this.data(), typeof option == 'object' && option)

            if (!data) $this.data('mu.amodal', (data = new AModal(this, options)))
            if (typeof option == 'string') data[option]()
            else if (options.show) data.show() //show first tab default
        })
    }

    var old = $.fn.amodal

    $.fn.amodal = Plugin
    $.fn.amodal.Constructor = AModal


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

