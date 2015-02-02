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
(function(factory) {
    if (typeof ko === 'object') {
        factory(DTAdapter , ko , jQuery, window, document);
    }
}(function(adapter, knockout, $, window, document, undefined) {
    'use strict';

    var operationColumn = "_OPERATE_";

    var _operationRender = function(data, type, row, meta) {
        var operation = row[operationColumn];
        var column = [];

        if (operation === 'ADD') {
            column.push('<a class="edit" data-inline-table-action="edit" href="#"><i class="fa fa-check"></i> 编辑</a>');
            column.push('<a class="cancel" data-inline-table-action="cancel"  data-mode="new" href="#"><i class="fa fa-reply"></i> 取消</a></div>');
        } else if (operation === 'SAVE') {
            column.push('<a class="edit" data-inline-table-action="edit"  href="javascript:;"><i class="fa fa-pencil "></i> 编辑</a>');
            column.push('<a class="delete" data-inline-table-action="delete"  href="javascript:;"><i class="fa fa-trash-o"></i> 删除</a></div>');
        } else {
            column.push('<a class="edit" data-inline-table-action="edit" href="javascript:;"><i class="fa fa-pencil "></i> 编辑</a>');
            column.push('<a class="delete" data-inline-table-action="delete" href="javascript:;"><i class="fa fa-trash-o"></i> 删除</a>');
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

        var columnNames = [];
        if ($.isArray(settings.oInit.row.columns) && settings.oInit.row.columns.length > 0) {
            columnNames = settings.oInit.row.columns;
        } else {
            if ($.isPlainObject(data)) {
                //if data-columns not configed in table row,will  get all columns from table data default.
                for (var name in data) {
                    columnNames.push(name);
                }
            }
        }

        //may be array,depend on passing array/object to table data
        for (var j = 0, len = columnNames.length; j < len; j++) {

            var name = columnNames[j];

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
    };

    knockout.bindingHandlers.inlineEditTable = {
        init: function(element, valueAccessor) {
            var binding = knockout.utils.unwrapObservable(valueAccessor());

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
                    formId = id + '_form';

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

                }

                var settings = table.fnSettings();
                $.extend(settings.oInit, {
                    'validateForm': '#' + formId
                });
                //others init self
            }

            // inline table append _EDIT_
            $(api.table().container()).find('._EDIT_').html('<a class="btn btn-primary" href="javascript:void(0);" data-inline-table-action="add" data-target="#' + id + '"><i class="fa fa-plus-circle"></i>&nbsp;新增</a>');
        },
        update: function(element, valueAccessor) {
            var binding = knockout.utils.unwrapObservable(valueAccessor());

            // If the binding isn't an object, turn it into one.
            if (!binding.data) {
                binding = {
                    data: valueAccessor()
                };
            }

            // Clear table
            $(element).DataTable().clear().draw();

            // Rebuild table from data source specified in binding
            // get plain object,others edit row will fail
            $(element).DataTable().rows.add(knockout.toJS(binding.data())).draw();
        }
    };
}));