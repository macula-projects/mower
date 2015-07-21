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
        FORM_SUBMIT_SVENT = 'submit.bv';

    $.fn.ajaxValidForm = function(options) {
        if (!options || !options.form) return;

        var dfd = new $.Deferred();

        var $form = $(options.form);
        $form
            .on(FORM_SUCCESS_EVENT, function() {
                $form.ajaxSubmit({
                    sucess: function(data) {
                        if (data.success) {
                            MessageBox.success('保存成功');

                            utils.executeFunction(options.success);

                            dfd.resolve();
                        } else {
                            data.exceptionMessage && AlertBox.error(data.exceptionMessage);
                            var $formValidator = $form.data('bootstrapValidator');
                            if($formValidator.length){
                                $(data.validateErrors).each(function() {
                                    $formValidator
                                        .updateMessage(this.element, 'blank', this.message)
                                        .updateStatus(this.element, 'INVALID', 'blank');
                                });
                            }

                            utils.executeFunction(options.error);
                        }
                    }
                });
            })
            .on(FORM_ERROR_EVENT, function() {
                AlertBox.error('<strong>注意: </strong>请仔细检查下面表单中错误提示信息.');
            });

        $form.triggerHandler(FORM_SUBMIT_SVENT);

        return dfd;
    };

  
    // private functions & variables
    var SELECTOR = '[rel="validate-form"]';

    // Apply tooltip to all elements with the rel="validate-form" attribute
    // ===================================
    $(document)
        .on('ready update', function(event, updatedFragment) {
            /* Act on the event */
            var $root = $(updatedFragment || 'html');

            $root.find(SELECTOR).each(function(index, el) {
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

}(jQuery, Utils|| {}, Base || {}, window, document));
