/** ========================================================================
 * Mower: ko.datatables.mower.js - v1.0.0
 *
 * extend knockout data bind to handle inline datatables compatibility with validator.
 *
 * Dependencies:
 *                  datatables
 *                  knockout.js
 *                  bootstrapValidator
 *
 *  $('#fieldContainerForm').bootstrapValidator({
 *      container: 'tooltip',
 *      feedbackIcons: {
 *          valid: 'glyphicon glyphicon-ok',
 *          invalid: 'glyphicon glyphicon-remove',
 *          validating: 'glyphicon glyphicon-refresh'
 *      },
 *      fields: {
 *          firstName: {
 *              container: '#firstNameMessage',
 *              validators: {
 *                  notEmpty: {
 *                      enabled: true   // or false
 *                  },
 *                  between: {
 *                      min: -90,
 *                      max: 90,
 *                      message: 'The latitude must be between -90.0 and 90.0'
 *                  }
 *              }
 *          },
 *          lastName: {
 *              container: '.lastNameMessage',
 *              validators: {
 *                  ...
 *              }
 *          },
 *          username: {
 *              validators: {
 *                  ...
 *              }
 *          }
 *      }
 *   });
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function(adapter, knockout, $, window, document, undefined) {
    'use strict';

    var operationColumn = "_OPERATE_";

    var _operationRender = function(data, type, row, meta) {
        var operation = row[operationColumn];
        var column = [];

        if (operation === 'ADD') {
            column.push('<a class="edit" data-inline-table-action="edit" data-toggle="tooltip" data-original-title="编辑" href="#"><i class="fa fa-check"></i></a>');
            column.push('<a class="cancel" data-inline-table-action="cancel" data-toggle="tooltip" data-mode="new" data-original-title="取消" href="#"><i class="fa fa-reply"></i></a></div>');
        } else if (operation === 'SAVE') {
            column.push('<a class="edit" data-inline-table-action="edit" data-toggle="tooltip" data-original-title="编辑" href="javascript:;"><i class="fa fa-pencil "></i></a>');
            column.push('<a class="delete" data-inline-table-action="delete" data-toggle="tooltip" data-original-title="删除" href="javascript:;"><i class="fa fa-trash-o"></i></a></div>');
        } else {
            column.push('<a class="edit" data-action-type="edit" data-toggle="tooltip" data-original-title="编辑" href="javascript:;"><i class="fa fa-pencil "></i></a>');
            column.push('<a class="delete" data-action-type="delete" data-toggle="tooltip" data-original-title="删除" href="javascript:;"><i class="fa fa-trash-o"></i></a>');
        }

        return '<div class="mu-table-action">' + column.join(" ") + '</div>';
    };

    var _rowCallback = function(row, data, displayIndex, displayIndexFull) {
        var settings = this.fnSettings();
        var columns = settings.oInit.columns;
        var $row = $(row);

        var rowName = '';
        if ($.isPlainObject(settings.oInit.row) && typeof settings.oInit.row.name !== 'undefined') {
            rowName = settings.oInit.row.name.replace(/_INDEX_/g, displayIndex);
        }

        //may be array,depend on passing array/object to table data
        if ($.isPlainObject(data)) {
            for (var name in data) {

                if (name === operationColumn) continue;

                var isDrawed = false;
                var colName = '';
                for (var i = 0, iLen = columns.length; i < iLen; i++) {
                    if (columns[i].name && name === columns[i].name) {
                        colName = rowName ? (rowName + '.' + settings.oInit.columns[i].name) : settings.oInit.columns[i].name;
                        !$('td:eq(' + i + ')', row).find('input[name="' + colName + '"]').size() && $('td:eq(' + i + ')', row).append('<input type="hidden" name="' + colName + '" value="' + data[name] + '" />');
                        isDrawed = true;
                        break;
                    }
                }


                if (isDrawed !== true) {
                    colName = rowName ? (rowName + '.' + name) : name;
                    !$row.find('input[name="' + colName + '"]').size() && $row.append('<input type="hidden" name="' + colName + '" value="' + data[name] + '" />');
                }
            }
        }
    };

    knockout.bindingHandlers.inlineEditTable = {
        init: function(element, valueAccessor) {
            var binding = ko.utils.unwrapObservable(valueAccessor());

            var tableOptions = {},
                rowDataSelector = '> thead > tr:last-child, > thead > tr:last-child',
                rowOptions = {},
                columnDataSelector = '> thead > tr:last-child > th, > thead > tr:last-child > td',
                columnArray = new Array();

            //parse table option
            var tableOptions = $.extend({}, adapter.getTableOption(element),
                typeof binding.options === 'object' && binding.options);

            tableOptions = $.extend({}, {
                "sDom": "<'dt-top-row'>r<'dt-wrapper table-responsive't>" +
                    "<'dt-row dt-bottom-row'<'row'<'col-xs-12  col-sm-1'l><'col-xs-12 col-sm-11'p>>" +
                    "<'row'<'col-xs-12 col-sm-6 _EDIT_'><'col-xs-12 col-sm-6'i>>>"
            }, tableOptions);


            //parse row data option
            $.extend(true, rowOptions, adapter.getRowOption($(element).find(rowDataSelector)));
            !$.isEmptyObject(rowOptions) && (tableOptions["row"] = rowOptions);

            // Get the column data once for the life time of the plugin
            $(element).find(columnDataSelector).each(function() {
                columnArray.push(adapter.getColumnsOption(this));
            });

            $(rowDataSelector, element).append('<th></th>'); //auto append operation column
            var operationOpt = {};
            operationOpt["data"] = null;
            operationOpt["render"] = _operationRender;

            columnArray.push(operationOpt);

            //merge columns options
            tableOptions["columns"] = columnArray;
            tableOptions["rowCallback"] = _rowCallback;
            if (tableOptions.hasOwnProperty('columns')) {
                var columns = tableOptions.columns;
                if (columns && $.isArray(columns)) {
                    for (var i = 0; i < columns.length; i++) {
                        var column = columns[i];
                        if (column.data === undefined && column.name) //may be (column.data === null)
                            column.data = column.name;
                    }
                }
            }

            //apply table
            var table = $(element).dataTable(tableOptions);

            var api = table.api();
            var id = tableOptions.id || $(api.table().node()).attr("id");

            if (typeof tableOptions.validated !== 'undefined' && tableOptions.validated === true) {

                var formId;

                var attributes = $(element).prop("attributes");
                var prefix = 'data-bv-';

                if (!tableOptions.validateForm) {
                    formId = '#' + id + '_form';

                    var $form = $('<form id="' + formId + '"></form>');
                    // loop through <select> attributes and apply them on form
                    $.each(attributes, function() {
                        if (this.name.indexOf(prefix) === 0) {
                            $form.attr(this.name, this.value);
                        }
                    });

                    $(api.table().node()).wrap($form[0]);
                    //apply bootstrap validator
                    $(api.table().node()).closest('form').bootstrapValidator();

                } else {

                    formId = tableOptions.validateForm;
                    
                    // loop through <select> attributes and apply them on form
                    $.each(attributes, function() {
                        if (this.name.indexOf(prefix) === 0) {
                            $(formId).attr(this.name, this.value);
                        }
                    });

                    $(formId).bootstrapValidator();
                }

                var settings = table.fnSettings();
                $.extend(settings.oInit, {
                    'validateForm': formId
                });
                //others init self
            }

            // inline table append _EDIT_
            $(document).find('._EDIT_').html('<a class="btn btn-primary" href="javascript:void(0);" data-inline-table-action="add" data-target="#' + id + '"><i class="fa fa-plus-circle"></i>&nbsp;新增</a>');
        },
        update: function(element, valueAccessor) {
            var binding = ko.utils.unwrapObservable(valueAccessor());

            // If the binding isn't an object, turn it into one.
            if (!binding.data) {
                binding = {
                    data: valueAccessor()
                };
            }

            // Clear table
            $(element).DataTable().clear().draw();

            // Rebuild table from data source specified in binding
            $(element).DataTable().rows.add((binding.data())).draw();
        }
    };
}(DTAdapter || {}, ko || {}, jQuery, window, document));
