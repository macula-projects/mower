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
                    'rowId',
                    'rowParentId',
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
                        ajax: {
                            url: 'string',
                            type: 'string'
                        }
                    }, {
                        enableSelected: 'boolean',
                        singleSelect: 'boolean',
                        initSelect: 'array'
                    }, {
                        validated: 'boolean',
                        validateForm: 'string'
                    }, {
                        select: 'boolean',
                        select: {
                            style: 'string',
                            info: 'boolean'
                        }
                    }, {
                        xhrComplete: 'function',
                        createdRow: 'function',
                        drawCallback: 'function'
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
                    ajax.type = ajax.type || 'post';
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

            option.rowId = option.rowId || 'id';

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

            var pageData = {},
                orderData = {},
                filterData = settings.oInit.oAjaxParams || {};
            try {
                //because of macula only support current page,not support current index
                //so convert it and handle infoCallback in order to make it corret
                if (settings.oFeatures.bPaginate === true) {
                    var pageNumber = ((data.start % data.length) === 0 ? (parseInt(data.start / data.length) + 1) : Math.ceil(data.start / data.length));
                    pageData = {
                        rows: data.length,
                        page: pageNumber
                    };

                    settings.iDisplayStart = (pageNumber - 1) * data.length;
                }

                //process only one column
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
            } catch (e) {
                //NoOPS
                if (window.console && console.log) {
                    console.log(e);
                }
            }

            //no must backend
            $.each(['columns', 'draw', 'order', 'search', 'length'], function(index, value) {
                delete data[value];
            });

            $.extend(data, pageData, orderData, filterData);
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
                if (window.console && console.log) {
                    console.log(e);
                }
            }
        },
        //parse table options and apply table
        applyDataTable: function(tableSelector, dtOptions) {
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
                option["row"] = this.getRowOption($table.find(rowDataSelector));

                // Get the column data once for the life time of the plugin
                $table.find(columnDataSelector).each(function() {
                    var data = that.getColumnsOption(this);
                    columnArray.push(data);
                });
                option["columns"] = columnArray;

                //predo option
                this.processOption(this, option);

                option = $.extend(true, option, dtOptions || {});

                //apply datatables
                var instance = $table
                    .on('init.dt', function(e, settings, json) {
                        //afterdo option
                    })
                    .on('preXhr.dt', function(e, settings, data) {
                        that.processReqData(settings, data);
                    })
                    .on('xhr.dt', function(e, settings, json) {

                        utils.executeFunction(settings.oInit.xhrComplete, json);

                        if (json.success) {
                            that.processResData(settings, json);
                        } else {
                            //data.exceptionMessage && MessageBox.error(data.exceptionMessage, true);
                        }
                    }).DataTable(option);
            }
        },
        //parse table options and apply table
        applyTreeDataTable: function(tableSelector, dtOptions) {
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
                option["row"] = this.getRowOption($table.find(rowDataSelector));

                // Get the column data once for the life time of the plugin
                $table.find(columnDataSelector).each(function() {
                    var data = that.getColumnsOption(this);
                    columnArray.push(data);
                });
                option["columns"] = columnArray;

                //predo option
                this.processOption(this, option);

                option = $.extend(true, option, dtOptions || {}, {
                    "createdRow": function(row, data, index) {

                        var idAttrName = "data-tt-id",
                            pIdAttrName = "data-tt-parent-id",
                            rowId = option.rowId || "id",
                            rowParentId = option.rowParentId || "parentId";

                        var $row = $(row).attr(idAttrName, data[rowId]);

                        if (data[rowParentId]) $row.attr(pIdAttrName, data[rowParentId]);

                    },
                    "drawCallback": function(settings) {
                        $(table).treetable({
                            expandable: true
                        }, true);
                    }
                });


                //apply datatables
                var instance = $table
                    .on('init.dt', function(e, settings, json) {
                        //afterdo option
                    })
                    .on('preXhr.dt', function(e, settings, data) {
                        that.processReqData(settings, data);
                    })
                    .on('xhr.dt', function(e, settings, json) {

                        utils.executeFunction(settings.oInit.xhrComplete, json);

                        if (json.success) {
                            that.processResData(settings, json);
                        } else {
                            //data.exceptionMessage && MessageBox.error(data.exceptionMessage, true);
                        }
                    }).DataTable(option);
            }
        }
    };
}(Base || {}, Utils || {}, jQuery, window, document));

;
(function(adapter, $, window, document, undefined) {

    'use strict';

    $.fn.dataTable.Api.register('selectedRowIds()', function() {
        var ids = [];
        this.rows({
            selected: true
        }).ids().each(function(value, index) {
            ids.push(value);
        });
        return ids;
    });

    $.fn.dataTable.Api.register('selectedRows()', function() {
        var data = [];
        this.rows({
            selected: true
        }).data().each(function(value, index) {
            data.push(value);
        });
        return data;
    });

    $.fn.dataTable.Api.register('selectRowById()', function(id) {
        var that = this,
            idName = this.settings()[0].rowId,
            result;

        if ($.isArray(id)) {
            result = [];
            this.rows().indexes().each(function(idx) {
                var data = that.row(idx).data();

                if (data[idName] && $.inArray(data[idName], id) >= 0) {
                    that.rows(that.row(idx).node()).select();
                    result.push(data);
                }
            });
        } else if (id) {
            this.rows().indexes().each(function(idx) {
                var data = that.row(idx).data();

                if (data[idName] && data[idName] == id) {
                    that.rows(that.row(idx).node()).select();
                    result = data;
                    return false;
                }
            });
        } else {
            //this.fnSelectRow();
        }

        return result;

    });

    $.fn.dataTable.Api.register('selectRow()', function(rowSelector) {
        this.rows(rowSelector).select();
    });


    $.fn.dataTable.Api.register('unSelectRow()', function(rowSelector) {
        this.rows(rowSelector).deselect();
    });


    $.fn.dataTable.Api.register('ajax.setParams()', function(parameters) {
        return this.iterator('table', function(settings) {
            if (typeof parameters === 'string') {
                var obj = {};
                parameters.replace(/([^=&]+)=([^&]*)/g, function(m, key, value) {
                    obj[decodeURIComponent(key)] = decodeURIComponent(value);
                });

                parameters = obj;
            }

            if ($.isPlainObject(parameters)) {
                settings.oInit.oAjaxParams = parameters;
            }
        });
    });


    $.fn.dataTable.Api.register('adjustColumn()', function() {
        this.columns.adjust().draw();
    });

    $.fn.dataTable.Api.register('searchColumn()', function(columnSelector, value) {
        this.column(columnSelector)
            .search(value)
            .draw();
    });

    // Apply datatables to all elements with the rel="datatables" attribute
    // ====================================================================

    $(document).on('ready update', function(event, updatedFragment) {
        var $root = $(updatedFragment || 'html');

        $root.find('[rel="datatables"]').each(function(index, el) {
            adapter.applyDataTable(this);
        });

        $root.find('[rel="tree-datatables"]').each(function(index, el) {
            adapter.applyTreeDataTable(this);
        });
    });

})(DTAdapter || {}, jQuery, window, document);
