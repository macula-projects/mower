/** ========================================================================
 * Mower: validator.mower.js - v1.0.0
 *
 * apply validate on document ready.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

(function($, utils, base, window, document, undefined) {

    'use strict';

    // Prepare the events
    var FORM_ERROR_EVENT = 'error.form.bv',
        FORM_SUCCESS_EVENT = 'success.form.bv',
        FORM_SUBMIT_SVENT = 'submit.bv',
        POP_BREADCRUMB_EVENT = 'pop.mu.breadcrumb';


    $.fn.ajaxValidSubmit = function(options) {
        var $form = $(this);

        $form
            .off(FORM_SUCCESS_EVENT)
            .off(FORM_ERROR_EVENT)
            .on(FORM_SUCCESS_EVENT, options, doFormSuccess)
            .on(FORM_ERROR_EVENT, options, doFormError);

        $form.triggerHandler(FORM_SUBMIT_SVENT);

        return this;
    };

    function doFormSuccess(e) {
        var $form = $(e.target),
            options = e.data;

        $form.ajaxSubmit({
            success: function(data) {
                if (data.success) {
                    utils.executeFunction(options.success, data);
                } else {

                    if(options.errorContainer && typeof window.AlertBox != 'undefined' && data.exceptionMessage)
                        AlertBox.error(data.exceptionMessage,{'container':data.errorContainer});

                    var $formValidator = $form.data('bootstrapValidator');
                    if ($formValidator.length) {
                        $(data.validateErrors).each(function() {
                            $formValidator
                                .updateMessage(this.element, 'blank', this.message)
                                .updateStatus(this.element, 'INVALID', 'blank');
                        });
                    }

                    utils.executeFunction(options.error, data);
                }
            }
        });
    }

    function doFormError(data) {
       if(!data) return;
        
        if(!data.success){
            var table = $('<table class="table table-bordered table-striped"><thead><tr><th>名称</th><th>错误信息</th></tr></thead></table>'),
                tbody = $('<tbody></tbody>').appendTo(table);
            $.each(data.validateErrors, function(idx,value)
            {
                var tr = $('<tr/>');
                var element = $('<td/>').text(value.element)
                    .appendTo(tr),
                    message = $('<td/>').text(value.message)
                    .appendTo(tr);
                
                tr.appendTo(tbody);
            });
            
            ModalBox.dialog({
                    title: data.errorMessage,
                    message: table
                });
        }
    }



    // private functions & variables
    var SELECTOR = '[rel="validate-form"]';

    // Apply tooltip to all elements with the rel="validate-form" attribute
    // ===================================
    $(document)
        .on('ready update', function(event, updatedFragment) {
            /* Act on the event */
            var $root = $(updatedFragment || 'html');

            $root.find(SELECTOR).addBack(SELECTOR).each(function(index, el) {
                var $this = $(this);
                if (!$this.data('bootstrapValidator')) {
                    $this.bootstrapValidator({
                        excluded: [':disabled',':hidden', ':not(:visible)'],
                        message: '请输入合法的数值',
                        feedbackIcons: {
                            valid: 'fa fa-check',
                            invalid: 'fa fa-times',
                            validating: 'fa fa-refresh',
                            required: 'required'
                        }
                    }); 
                }

                $this.on('updateValidate',function(event){
                    $this.find('[name], [data-bv-field]')
                        .each(function() {
                            $this.bootstrapValidator('addField',$(this).attr('data-bv-field') || $(this).attr('name'));
                        });
                });
            });
        });

}(jQuery, Utils || {}, Base || {}, window, document));
