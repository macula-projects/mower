/** ========================================================================
 * Mower: datatables.mower.js - v1.0.0
 *
 * datatables.bootstrap script to handle bootstrap compatible with datatables.
 *
 * Component:       `bootstrap style`
 *                  `inline edit`
 * Dependencies:
 *                  datatables
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

//Datatables html5 data-* attribute adapter
;
var DTAdapter = (function(base, utils, $, window, document, undefined) {

    function _fnUpdateInfo(settings) {
        var
            lang = settings.oLanguage,
            start = settings._iDisplayStart + 1,
            end = settings.fnDisplayEnd(),
            max = settings.fnRecordsTotal(),
            total = settings.fnRecordsDisplay(),
            out = total ?
            lang.sInfo :
            lang.sInfoEmpty;

        if (total !== max) {
            /* Record set after filtering */
            out += ' ' + lang.sInfoFiltered;
        }

        // Convert the macros
        out += lang.sInfoPostFix;
        out = _fnInfoMacros(settings, out);

        return out;
    }


    function _fnInfoMacros(settings, str) {
        // When infinite scrolling, we are always starting at 1. _iDisplayStart is used only
        // internally
        var
            formatter = settings.fnFormatNumber,
            start = settings._iDisplayStart + 1,
            len = settings._iDisplayLength,
            vis = settings.fnRecordsDisplay(),
            all = len === -1,
            page = all ? 0 : Math.floor(start / len),
            start = (page * len) + 1;

        return str.
        replace(/_START_/g, formatter.call(settings, start)).
        replace(/_END_/g, formatter.call(settings, settings.fnDisplayEnd())).
        replace(/_MAX_/g, formatter.call(settings, settings.fnRecordsTotal())).
        replace(/_TOTAL_/g, formatter.call(settings, vis)).
        replace(/_PAGE_/g, formatter.call(settings, all ? 1 : Math.ceil(start / len))).
        replace(/_PAGES_/g, formatter.call(settings, all ? 1 : Math.ceil(vis / len)));
    }


    return {
        getTableOption: function(target) {
            var obj = $.extend({},
                base.parseOptions(target, [
                    'id',
                    'dom', {
                        autoWidth: 'boolean',
                        deferRender: 'boolean',
                        info: 'boolean'
                    }, {
                        ordering: 'boolean'
                    }, {
                        paging: 'boolean',
                        pagingType: 'string',
                        pageLength: 'number',
                        lengthMenu: 'array',
                        lengthChange: 'boolean'
                    }, {
                        processing: 'boolean',
                        scrollX: 'string',
                        scrollCollapse: 'boolean',
                        scrollY: 'string'
                    }, {
                        serverSide: 'boolean',
                        ajax: 'string'
                    }, {
                        enableSelected: 'boolean',
                        singleSelect: 'boolean',
                        initSelect: 'array'
                    }, {
                        validated: 'boolean',
                        validateForm: 'string'
                    }
                ])
            );

            return obj;
        },
        getRowOption: function(target) {
            var obj = $.extend({},
                base.parseOptions(target, [
                    'id',
                    'name', {
                        columns: 'array'
                    }
                ])
            );

            return obj;
        },
        getColumnsOption: function(target) {
            return $.extend({},
                base.parseOptions(target, [
                    'name',
                    'real',
                    'data', {
                        render: 'function'
                    },
                    'class',
                    'width',
                    'title', {
                        orderable: 'boolean',
                        orderData: 'array',
                        orderSequence: 'array',
                        visible: 'boolean'
                    }, {
                        editor: 'string'
                    }, {
                        checkbox: {
                            on: 'string',
                            off: 'string'
                        }
                    }, {
                        numberbox: {
                            radixPoint: 'string'
                        }
                    }, {
                        datebox: {
                            format: 'string',
                            autoclose: 'boolean',
                            fontAwesome: 'boolean'
                        }
                    }, {
                        combobox: {
                            valueField: 'string',
                            textField: 'string',
                            url: 'string',
                            multiple: 'boolean',
                            separator: 'string'
                        }
                    }
                ])
            );
        },
        processOption: function(dataTable, option) {
            if (!option) return;

            if (option.hasOwnProperty('ajax')) {
                var ajax = option.ajax;

                if ($.isPlainObject(ajax)) {
                    ajax.url = utils.getAbsoluteUrl(ajax.url, $(dataTable).getContextPath());
                } else if (typeof ajax === 'string') {
                    option.ajax = utils.getAbsoluteUrl(ajax, $(dataTable).getContextPath());
                }
            }

            if (option.hasOwnProperty('columns')) {
                var columns = option.columns;
                if (columns && $.isArray(columns)) {
                    for (var i = 0; i < columns.length; i++) {
                        var column = columns[i];
                        column.data = column.data || column.name;
                    }
                }
            }
            // var infoCallback = {
            //     "infoCallback": function(settings, start, end, max, total, pre) {
            //         return _fnUpdateInfo(settings);
            //     }
            // };
            // $.extend(option, infoCallback);
        },
        processReqData: function(settings, data) {
            if ($.fn.dataTableExt.oApi._fnDataSource(settings) !== 'ssp')
                return;

            try {
                //because of macula only support current page,not support current index
                //so convert it and handle infoCallback in order to make it corret
                var pageData = {};

                if (settings.oFeatures.bPaginate === true) {
                    var pageNumber = (data.start === 0 ? 1 : Math.ceil(data.start / data.length));
                    pageData = {
                        rows: data.length,
                        page: pageNumber
                    };

                    settings.iDisplayStart = (pageNumber - 1) * data.length;
                }

                //process only one column
                var orderData = {};
                for (var i = 0; i < data.order.length; i++) {
                    var item = data.order[i];

                    if (data.columns[item.column]) {
                        orderData = {
                            sort: data.columns[item.column].data,
                            order: item.dir
                        };
                    }
                    break;
                }

                var filterData = settings.oInit.oAjaxParams || {};

                //clear all data
                for (var name in data)
                    delete data[name];

                $.extend(data, pageData, orderData,filterData);
            } catch (e) {
                //NoOPS
            }
        },
        processResData: function(settings, json) {
            if ($.fn.dataTableExt.oApi._fnDataSource(settings) !== 'ssp')
                return;

            try {
                var dataSource = {
                    "recordsTotal": json.totalElements,
                    "recordsFiltered": json.totalElements,
                    "data": json.content
                };

                //clear all data
                for (var name in json)
                    delete json[name];

                $.extend(json, dataSource);
            } catch (e) {
                //NoOPS
            }
        },
        //parse table options and apply table
        applyDataTable: function(tableSelector) {
            var table = tableSelector,
                $table = $(tableSelector),
                rowDataSelector = '> thead > tr:last-child, > thead > tr:last-child',
                rowOptions = {},
                columnDataSelector = '> thead > tr:last-child > th, > thead > tr:last-child > td',
                columnArray = new Array();

            if (!$.fn.DataTable.isDataTable(table)) {
                //parse option
                var that = this,
                    option = $.extend({}, this.getTableOption(table));

                //parse row data option
                $.extend(true, rowOptions, this.getRowOption($table.find(rowDataSelector)));
                option["row"] = rowOptions;

                // Get the column data once for the life time of the plugin
                $table.find(columnDataSelector).each(function() {
                    var data = that.getColumnsOption(this);
                    columnArray.push(data);
                });
                option = $.extend({}, {
                    "columns": columnArray
                }, option);

                //predo option
                this.processOption(this, option);

                //apply datatables
                var instance = $table
                    .on('init.dt', function(e, settings, json) {
                        //afterdo option
                    })
                    .on('preXhr.dt', function(e, settings, data) {
                        that.processReqData(settings, data);
                    })
                    .on('xhr.dt', function(e, settings, json) {
                        if (json.success) {
                            that.processResData(settings, json);
                        } else {
                            //data.exceptionMessage && MessageBox.error(data.exceptionMessage, true);
                        }
                    }).DataTable(option);

                new $.fn.dataTable.SelectRows(instance, {
                    "selectedClass": "selected",
                    "idColumn": option.row.id ? option.row.id : 'id',
                    "initValue": option.initSelect,
                    "enableSelected": option.enableSelected === false ? false : true,
                    "singleSelect": option.singleSelect === false ? false : true
                });
            }
        }
    };
}(Base || {}, Utils || {}, jQuery, window, document));


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

    // Apply datatables to all elements with the rel="datatables" attribute
    // ====================================================================

    $(document).on('ready update', function(event, updatedFragment) {
        var $root = $(updatedFragment || 'html');

        $root.find('[rel="datatables"]').each(function(index, el) {
            adapter.applyDataTable(this);
        });
    });

})(Base || {}, DTAdapter || {}, jQuery, window, document);

;
(function(define) {

    'use strict';

    define(['jquery'], function($) {
        return (function() {
            return {
                //return datatables api instance
                getInstance: function(tableSelector) {
                    return $(tableSelector).DataTable();
                },
                //return datatables jQuery object
                getObject: function(tableSelector) {
                    return $(tableSelector).dataTable();
                },
                getSelectedRowIds: function(tableSelector) {
                    var instance = this.getInstance(tableSelector);
                    var sr = instance.settings()[0]._oSelectRows;
                    return sr.fnGetSelectedRowIds();
                },
                getSelectedRows: function(tableSelector) {
                    var instance = this.getInstance(tableSelector);
                    var sr = instance.settings()[0]._oSelectRows;
                    return sr.fnGetSelectedRows();
                },
                setAjaxParams:function(tableSelector,parameters){
                    //save data in oinit object temporary
                    if(typeof parameters === 'string')
                    {
                        var obj = {}; 
                        parameters.replace(/([^=&]+)=([^&]*)/g, function(m, key, value) {
                            obj[decodeURIComponent(key)] = decodeURIComponent(value);
                        });

                        parameters = obj; 
                    } 

                    if ($.isPlainObject(parameters)){
                        this.getInstance(tableSelector).settings()[0].oInit.oAjaxParams = parameters;
                    }
                    return this;
                },
                getAjaxParams:function(tableSelector){
                    return this.getInstance(tableSelector).ajax.params();
                },
                reload: function(tableSelector, resetPaging) {
                    var that = this;
                    this.getInstance(tableSelector).ajax.reload((resetPaging === true));
                    $(tableSelector).on('draw.dt', function() {
                        that.selectRow(tableSelector);
                    });
                },
                selectRow: function(tableSelector, rowSelector) {
                    var instance = this.getInstance(tableSelector);
                    var sr = instance.settings()[0]._oSelectRows;
                    return sr.fnSelectRow(rowSelector);
                },
                selectRowById: function(tableSelector, id) {
                    var instance = this.getInstance(tableSelector);
                    var sr = instance.settings()[0]._oSelectRows;
                    return sr.fnSelectRowsById(id);
                },
                adjustColumn: function(tableSelector) {
                    var instance = this.getInstance(tableSelector);
                    instance.columns.adjust().draw();
                },
                searchColumn: function(tableSelector, columnSelector, value) {
                    var instance = this.getInstance(tableSelector);
                    instance
                        .column(columnSelector)
                        .search(value)
                        .draw();
                },
                unSelectRow: function(tableSelector, rowSelector) {
                    var instance = this.getInstance(tableSelector);
                    var sr = instance.settings()[0]._oSelectRows;
                    sr.fnUnSelectRow(rowSelector);
                }
            };

        })();
    });

}(typeof define === 'function' && define.amd ? define : function(deps, factory) {
    if (typeof module !== 'undefined' && module.exports) { //Node
        module.exports = factory(require('jquery'));
    } else {
        window['TableUtils'] = factory(window['jQuery']);
    }
}));
