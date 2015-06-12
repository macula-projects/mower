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

;
(function(base, adapter, $, window, document, undefined) {

    'use strict';

    // datatables inline editing
    // ===================================
    function attachActionToolTip() {
        //bootstrap tooltip active
        $('.mu-table-action a').tooltip({
            placement: "top",
            container: "body"
        });
    }

    function detachActionToolTip() {
        //bootstrap tooltip destory
        $('.mu-table-action a').tooltip('destroy');
    }

    var editors = {
        text: {
            init: function(container, options) {
                var text = $("<input type=\"text\" class=\"form-control\" name=\"" + options.name + "\"/>").data("options", options).appendTo(container);
                this.setValidated(text, options);
                return text;
            },
            getValue: function(element) {
                return $(element).find('input:first').val();
            },
            setValue: function(element, value) {
                $(element).find('input:first').val(value);
            },
            setValidated: function(element, options) {
                if (options.validated === true && options.form) {
                    for (var name in options.validate) {
                        $(element).attr(name, options.validate[name]);
                        $(options.form).bootstrapValidator('addField', options.name);
                    }
                }
            },
            isValid: function(element) {
                var text = $(element).find('input:first');
                var options = text.data("options");
                if (options.validated === true && options.form) {
                    $(options.form).data('bootstrapValidator').validateField(text);
                    return $(options.form).data('bootstrapValidator').isValidField(text);
                }
                return true;
            },
            resize: function(element, width) {
                $(element)._outerWidth(width)._outerHeight(22);
            }
        },
        textarea: {
            init: function(container, options) {
                var textarea = $("<textarea class=\"form-control\" rows=\"5\" name=\"" + options.name + "\"></textarea>").appendTo(container);
                return textarea;
            },
            getValue: function(element) {
                return $(element).val();
            },
            setValue: function(element, value) {
                $(element).val(value);
            },
            resize: function(element, width) {
                $(element)._outerWidth(width);
            }
        },
        checkbox: {
            init: function(container, options) {
                var checkbox = $("<input type=\"checkbox\" name=\"" + options.name + "\"/>").appendTo(
                    ("<label></label>").appendTo(
                        ("<div class=\"checkbox\"></div>").appendTo(container.empty())));

                checkbox.val(options.on);
                checkbox.attr("offval", options.off);
                return checkbox;
            },
            getValue: function(element) {
                if ($(element).is(":checked")) {
                    return $(element).val();
                } else {
                    return $(element).attr("offval");
                }
            },
            setValue: function(element, value) {
                var checked = false;
                if ($(element).val() == value) {
                    checked = true;
                }
                $(element)._propAttr("checked", checked);
            }
        },
        numberbox: {
            init: function(container, options) {
                var numberbox = $("<input type=\"text\" class=\"form-control\" name=\"" + options.name + "\" />").appendTo(container);
                numberbox.inputmask("decimal", options || {});
                return numberbox;
            },
            destroy: function(element) {
                $(element).inputmask("remove");
            },
            getValue: function(element) {
                $(element).blur();
                return $(element).inputmask("unmaskedvalue");
            },
            setValue: function(element, value) {
                $(element).val(value);
            },
            resize: function(element, width) {
                $(element)._outerWidth(width)._outerHeight(22);
            }
        },
        datebox: {
            init: function(container, options) {
                var datebox = $("<div class=\"input-group date form_datetime\"><input type=\"text\" size=\"16\" readonly=\"\" class=\"form-control\" name=\"" + options.name + "\"> <span class=\"input-group-btn\"> <button class=\"btn default\" type=\"button\"><i class=\"fa fa-calendar\"></i></button></span></div>").appendTo(container);
                datebox.datetimepicker(options || {});
                return datebox;
            },
            destroy: function(element) {
                $(element).datetimepicker("remove");
            },
            getValue: function(element) {
                return $(element).find('input.form-control').val();
            },
            setValue: function(element, value) {
                $(element).find('input.form-control').val(value);
                $(element).datetimepicker('update');
            },
            resize: function() {
                //NoOPS
            }
        },
        combobox: {
            init: function(container, options) {
                var combobox = $("<select " + options.multiple ? "multiple " : "" + " class=\"form-control selectpicker\" name=\"" + options.name + "\"></select>").appendTo(container);
                combobox.selectpicker(options || {});

                if (options.url) {
                    var select = combobox.find('select');
                    var purl = options.url + (this.options.url.indexOf('?') > -1 ? '&' : '?') + '_=' + (new Date()).valueOf();

                    $.ajax({
                        url: purl,
                        dataType: 'json',
                        type: 'GET',
                        success: function(data) {
                            select.empty();
                            $.each(data.values, function(i, item) {
                                select.append('<option value="' + item.id + '">' + item.name + '</option>');
                            });
                        },
                        error: function(data) {
                            //NoOPS
                        }
                    });

                    select.data('options', options);
                }

                combobox.selectpicker('refresh');
                return combobox;
            },
            destroy: function(element) {
                $(element).selectpicker("destroy");
            },
            getValue: function(element) {
                var opts = $(element).data("options") || {};
                if (opts.multiple) {
                    return $(element).val().join((opts.separator || ','));
                } else {
                    return $(element).val();
                }
            },
            setValue: function(element, value) {
                var opts = $(element).data("options") || {};
                if (opts.multiple) {
                    if (value) {
                        $(element).selectpicker("val", value.split(opts.separator));
                    } else {
                        $(element).empty();
                    }
                } else {
                    $(element).selectpicker("val", value);
                }
            },
            resize: function(element, width) {
                //NoOPS
            }
        }
    };


    var deletedColumn = "deleted";

    var operationColumn = "_OPERATE_";

    function restoreRow(oTable, nRow) {
        var aData = oTable.fnGetData(nRow);

        oTable.api().row(nRow).data(aData).draw();
    }

    function editRow(oTable, nRow) {
        var settings = oTable.fnSettings();
        var aData = oTable.api().row(nRow).data(); //object
        var rowName = '';
        if ($.isPlainObject(settings.oInit.row) && typeof settings.oInit.row.name !== 'undefined') {
            rowName = settings.oInit.row.name.replace(/_INDEX_/g, oTable.api().row(nRow).index());
        }

        $(nRow).find('td:not(:last)').each(function(index, el) {
            $(el).empty();

            var column = settings.oInit.columns[index];
            var editor = column.editor;
            if (editor) {
                var editorOption = column[editor] || {};

                editorOption["name"] = rowName ? (rowName + '.' + column.name) : column.name;

                //validate information
                if (settings.oInit.validated === true) {
                    editorOption["validated"] = settings.oInit.validated;
                    editorOption["form"] = settings.oInit.validateForm;

                    var thead = oTable.api().table().header();
                    var th = $(thead).find('th:eq(' + index + ')');
                    var attributes = th.prop("attributes");
                    var prefix = 'data-bv-';

                    // loop through <select> attributes and apply them on form
                    var validate = {};
                    $.each(attributes, function() {
                        if (this.name.indexOf(prefix) === 0) {
                            validate[this.name] = this.value;
                        }
                    });

                    if ($.isPlainObject(validate)) {
                        editorOption["validate"] = validate;
                    }
                }

                editors[editor].init(el, editorOption);
                editors[editor].setValue(el, column.real ? aData[column.real] : aData[column.name]);
            }
        });

        $('<div class="mu-table-action"><a class="edit" data-inline-table-action="save" href="#"><i class="fa fa-check-circle"></i> 保存</a>  <a class="cancel" data-inline-table-action="cancel" href="#"><i class="fa fa-reply"></i> 取消</a></div>').appendTo($(nRow).find('td:last').removeClass('mu-table-action-cont').addClass('mu-table-action-cont').empty());
    }

    function saveRow(oTable, nRow) {
        var result = true,
            settings = oTable.fnSettings(),
            isValidate = settings.oInit.validated,
            $form = $(settings.oInit.validateForm);

        var rowData = {};
        $('>td:not(:last)', nRow).each(function(index, el) {
            var column = settings.oInit.columns[index];
            var editor = column.editor;
            if (editor) {
                var isValid = editors[editor].isValid(el);
                if (isValid === true) {
                    var value = editors[editor].getValue(el);
                    if ($.isPlainObject(value)) {
                        for (var name in value) {
                            rowData[name] = value[name];
                        }
                    } else {
                        rowData[column.name] = value;
                    }
                }
            }
        });

        rowData[deletedColumn] = 0;
        rowData[operationColumn] = 'SAVE';

        if (isValidate === true && $form.size() > 0) {
            result = $form.data('bootstrapValidator').isValidContainer($(nRow));
            if (result !== true) return result;
        }

        $('>td:not(:last)', nRow).each(function(index, el) {
            var editor = settings.oInit.columns[index].editor;
            if (editor) {
                if (editors[editor].destroy) {
                    editors[editor].destroy(el);
                }
            }
        });

        oTable.api().row(nRow).data(rowData).draw();
        return result;
    }

    function getTable($this) {
        var selector = $this.attr('data-target');

        if (!selector) {
            selector = $this.attr('href');
            selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, ''); //strip for ie7
        }

        var $table = selector && $(selector);
        return $table.length ? $table : $this.closest("table");
    }

    // APPLY TO DTATABLES ELEMENTS CLICK EVENT
    // ===================================
    $(document)
        .on('click.add.inline.datatables.data-api', '[data-inline-table-action="add"]', function(e) {
            e.preventDefault();
            try {
                var $table = getTable($(this));
                //get datatables object
                var $datatables = $table.dataTable();
                if ($datatables.length) {
                    var settings = $datatables.fnSettings();

                    var cols = settings.oInit.columns;
                    var colDatas = {};
                    for (var i = 0; i < cols.length; i++) {
                        if (cols[i].name) {
                            colDatas[cols[i].name] = '';
                        }
                    }

                    colDatas[operationColumn] = 'ADD';
                    colDatas[deletedColumn] = 0;
                    var aiNew = $datatables.api().row.add(colDatas).draw(false).node();
                    editRow($datatables, aiNew);
                }
            } catch (e) {
                //NoOPS
            }
        })
        .on('click.delete.inline.datatables.data-api', '[data-inline-table-action="delete"]', function(e) {
            e.preventDefault();
            try {
                if (confirm("Are you sure to delete this row ?") == false) {
                    return;
                }

                //get closed tables
                var $table = getTable($(this));
                //get datatables object
                var $datatables = $table.dataTable();

                if ($datatables) {
                    var nRow = $(this).parents('tr')[0];
                    var rowData = $datatables.api().row(nRow).data();

                    var e = $.Event('delete.inline.datatables');
                    $table.trigger(e, {
                        "data": rowData
                    });

                    if (e.isDefaultPrevented()) return;

                    var settings = $datatables.fnSettings();
                    if ($.isPlainObject(settings.oInit.row) &&
                        typeof settings.oInit.row.id !== 'undefined') {

                        var $form = $(settings.oInit.validateForm);
                        var id = rowData[settings.oInit.row.id]; //if row id exists,must append row html.

                        var rowName = '';
                        if (typeof settings.oInit.row.name !== 'undefined') {
                            rowName = settings.oInit.row.name.replace(/_INDEX_/g, $datatables.api().row(nRow).index());
                        }

                        var columnName = rowName ? (rowName + '.' + deletedColumn) : deletedColumn;

                        if (id && $form.size() > 0) {
                            var $cont = $('<div></div');
                            $.each($datatables.api().row(nRow).nodes().to$().find('input:hidden'), function(index, el) {
                                if (columnName === $(el).attr('name')) {
                                    $(el).val(1);
                                }
                                $cont.append(el);
                            });
                            $form.prepend($cont);
                        }
                    }
                    $datatables.fnDeleteRow(nRow);
                }
            } catch (e) {

            }
        })
        .on('click.save.inline.datatables.data-api', '[data-inline-table-action="save"]', function(e) {
            e.preventDefault();
            try {

                //get closed tables
                var $table = getTable($(this));
                //get datatables object
                var $datatables = $table.dataTable();

                if ($datatables.length) {

                    var nRow = $(this).parents('tr')[0];

                    if (nRow !== null) {
                        /* Editing this row and want to save it */
                        var result = saveRow($datatables, nRow);

                        if (result === true) {
                            var e = $.Event('save.inline.datatables');
                            $table.trigger(e, {
                                "data": $table.api().row(nRow).data()
                            });
                        }
                    }

                } else {
                    //TO DO
                }

            } catch (e) {

            }
        })
        .on('click.cancel.inline.datatables.data-api', '[data-inline-table-action="cancel"]', function(e) {
            e.preventDefault();
            try {
                //get closed tables
                var $table = getTable($(this));
                //get datatables object
                var $datatables = $table.dataTable();

                if ($datatables) {

                    var nRow = $(this).parents('tr')[0];

                    if ($(this).attr("data-mode") == "new") {
                        $datatables.fnDeleteRow(nRow);
                    } else {
                        restoreRow($datatables, nRow);
                    }

                } else {
                    //TO DO
                }

            } catch (e) {

            }
        })
        .on('click.edit.inline.datatables.data-api', '[data-inline-table-action="edit"]', function(e) {
            e.preventDefault();
            try {
                //get closed tables
                var $table = getTable($(this));
                //get datatables object
                var $datatables = $table.dataTable();

                if ($datatables) {
                    /* Get the row as a parent of the link that was clicked on */
                    var nRow = $(this).parents('tr')[0];

                    /* No edit in progress - let's start one */
                    editRow($datatables, nRow);
                } else {
                    //TO DO
                }

            } catch (e) {

            }
        });

})(Base || {}, DTAdapter || {}, jQuery, window, document);