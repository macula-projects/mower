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

//Datatables html5 data-* attribute parser
;
var DTParser = (function(base, $, window, document, undefined) {

    return {
        getTableData: function(target) {
            var t = $(target);

            var obj = $.extend(
                //新空对象
                {},
                //公用的属性转换器
                base.parseOptions(target, "tb", [
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
                        scrollX: 'boolean',
                        scrollCollapse: 'boolean',
                        scrollY: 'string'
                    }, {
                        serverSide: 'boolean',
                        ajax: 'string'
                    }
                ])
            );

            return obj;
        },
        getColumnsData: function(target) {
            var t = $(target);
            return $.extend(
                //新空对象
                {},
                //公用的属性转换器
                base.parseOptions(target, "th", [
                    'name',
                    'width',
                    'title', {
                        orderable: 'boolean',
                        orderData: 'array',
                        orderSequence: 'array',
                        visible: 'boolean'
                    }
                ])
            );
        }
    }
}(Base || {}, jQuery, window, document));

;
(function(base, parser, $, window, document, undefined) {

    'use strict';

    $.extend(true, $.fn.dataTable.defaults, {
        "sDom": "<'dt-top-row'>r<'dt-wrapper table-responsive't>" +
            "<'dt-row dt-bottom-row'<'row'<'col-xs-12  col-sm-1'l><'col-xs-12 col-sm-8'p><'col-xs-12 col-sm-3'i>>>",
        "oLanguage": {
            "sLengthMenu": "_MENU_",
            "oPaginate": {
                "sFirst": "首页",
                "sPrevious": "上一页",
                "sNext": "下一页",
                "sLast": "最后一页"
            },
            "sInfo": "显示记录从_START_到_END_，总数 _TOTAL_ 条"
        },
        "pagingType": "full_numbers"
    });


    /* Default class modification */
    $.extend($.fn.dataTableExt.oStdClasses, {
        "sWrapper": "dataTables_wrapper form-inline",
        "sFilterInput": "form-control input-sm",
        "sLengthSelect": "form-control input-sm"
    });

    // In 1.10 we use the pagination renderers to draw the Bootstrap paging,
    // rather than  custom plug-in
    if ($.fn.dataTable.Api) {
        $.fn.dataTable.defaults.renderer = 'bootstrap';
        $.fn.dataTable.ext.renderer.pageButton.bootstrap = function(settings, host, idx, buttons, page, pages) {
            var api = new $.fn.dataTable.Api(settings);
            var classes = settings.oClasses;
            var lang = settings.oLanguage.oPaginate;
            var btnDisplay, btnClass;

            var attach = function(container, buttons) {
                var i, ien, node, button;
                var clickHandler = function(e) {
                    e.preventDefault();

                    //hide tooltip before redraw
                    var $target = $(e.currentTarget);
                    $target.find('a').tooltip('hide');

                    if (e.data.action !== 'ellipsis') {
                        api.page(e.data.action).draw(false);
                    }
                };

                for (i = 0, ien = buttons.length; i < ien; i++) {
                    button = buttons[i];

                    if ($.isArray(button)) {
                        attach(container, button);
                    } else {
                        btnDisplay = '';
                        btnClass = '';

                        switch (button) {
                            case 'ellipsis':
                                btnDisplay = '&hellip;';
                                btnClass = 'disabled';
                                break;

                            case 'first':
                                btnDisplay = '<a href="#" data-toggle="tooltip" ref="tooltip" data-original-title="' + lang.sFirst + '"><i class="fa fa-step-backward"></i></a>';
                                btnClass = button + (page > 0 ?
                                    '' : ' disabled');

                                break;

                            case 'previous':
                                btnDisplay = '<a href="#" data-toggle="tooltip" ref="tooltip" data-original-title="' + lang.sPrevious + '"><i class="fa fa-backward"></i></a>';
                                btnClass = button + (page > 0 ?
                                    '' : ' disabled');
                                break;

                            case 'next':
                                btnDisplay = '<a href="#" data-toggle="tooltip" ref="tooltip" data-original-title="' + lang.sNext + '"><i class="fa fa-forward"></i></a>';
                                btnClass = button + (page < pages - 1 ?
                                    '' : ' disabled');
                                break;

                            case 'last':
                                btnDisplay = '<a href="#" id="toolsss" data-toggle="tooltip" ref="tooltip" data-original-title="' + lang.sLast + '"><i class="fa fa-step-forward"></i></a>';
                                btnClass = button + (page < pages - 1 ?
                                    '' : ' disabled');
                                break;

                            default:
                                btnDisplay = '<a href="#">' + (button + 1) + '</a>';
                                btnClass = page === button ?
                                    'active' : '';
                                break;
                        }

                        if (btnDisplay) {
                            node = $('<li>', {
                                'class': classes.sPageButton + ' ' + btnClass,
                                'aria-controls': settings.sTableId,
                                'tabindex': settings.iTabIndex,
                                'id': idx === 0 && typeof button === 'string' ?
                                    settings.sTableId + '_' + button : null
                            })
                                .append(btnDisplay)
                                .appendTo(container);

                            //show tooltip depend on boostrap tooltip
                            node.find('a').tooltip({
                                placement: "bottom",
                                container: "body",
                                delay: {
                                    show: 500,
                                    hide: 100
                                }
                            });

                            settings.oApi._fnBindAction(
                                node, {
                                    action: button
                                }, clickHandler
                            );
                        }
                    }
                }
            };

            attach(
                $(host).empty().html('<ul class="pagination"/>').children('ul'),
                buttons
            );
        }
    } else {
        // Integration for 1.9-
        $.fn.dataTable.defaults.sPaginationType = 'bootstrap';

        /* API method to get paging information */
        $.fn.dataTableExt.oApi.fnPagingInfo = function(oSettings) {
            return {
                "iStart": oSettings._iDisplayStart,
                "iEnd": oSettings.fnDisplayEnd(),
                "iLength": oSettings._iDisplayLength,
                "iTotal": oSettings.fnRecordsTotal(),
                "iFilteredTotal": oSettings.fnRecordsDisplay(),
                "iPage": oSettings._iDisplayLength === -1 ?
                    0 : Math.ceil(oSettings._iDisplayStart / oSettings._iDisplayLength),
                "iTotalPages": oSettings._iDisplayLength === -1 ?
                    0 : Math.ceil(oSettings.fnRecordsDisplay() / oSettings._iDisplayLength)
            };
        };

        /* Bootstrap style pagination control */
        $.extend($.fn.dataTableExt.oPagination, {
            "bootstrap": {
                "fnInit": function(oSettings, nPaging, fnDraw) {
                    var oLang = oSettings.oLanguage.oPaginate;
                    var fnClickHandler = function(e) {
                        e.preventDefault();
                        if (oSettings.oApi._fnPageChange(oSettings, e.data.action)) {
                            fnDraw(oSettings);
                        }
                    };

                    $(nPaging).append(
                        '<ul class="pagination">' +
                        '<li class="prev disabled"><a href="#">&larr; ' + oLang.sPrevious + '</a></li>' +
                        '<li class="next disabled"><a href="#">' + oLang.sNext + ' &rarr; </a></li>' +
                        '</ul>'
                    );
                    var els = $('a', nPaging);
                    $(els[0]).bind('click.DT', {
                        action: "previous"
                    }, fnClickHandler);
                    $(els[1]).bind('click.DT', {
                        action: "next"
                    }, fnClickHandler);
                },

                "fnUpdate": function(oSettings, fnDraw) {
                    var iListLength = 5;
                    var oPaging = oSettings.oInstance.fnPagingInfo();
                    var an = oSettings.aanFeatures.p;
                    var i, ien, j, sClass, iStart, iEnd, iHalf = Math.floor(iListLength / 2);

                    if (oPaging.iTotalPages < iListLength) {
                        iStart = 1;
                        iEnd = oPaging.iTotalPages;
                    } else if (oPaging.iPage <= iHalf) {
                        iStart = 1;
                        iEnd = iListLength;
                    } else if (oPaging.iPage >= (oPaging.iTotalPages - iHalf)) {
                        iStart = oPaging.iTotalPages - iListLength + 1;
                        iEnd = oPaging.iTotalPages;
                    } else {
                        iStart = oPaging.iPage - iHalf + 1;
                        iEnd = iStart + iListLength - 1;
                    }

                    for (i = 0, ien = an.length; i < ien; i++) {
                        // Remove the middle elements
                        $('li:gt(0)', an[i]).filter(':not(:last)').remove();

                        // Add the new list items and their event handlers
                        for (j = iStart; j <= iEnd; j++) {
                            sClass = (j == oPaging.iPage + 1) ? 'class="active"' : '';
                            $('<li ' + sClass + '><a href="#">' + j + '</a></li>')
                                .insertBefore($('li:last', an[i])[0])
                                .bind('click', function(e) {
                                    e.preventDefault();
                                    oSettings._iDisplayStart = (parseInt($('a', this).text(), 10) - 1) * oPaging.iLength;
                                    fnDraw(oSettings);
                                });
                        }

                        // Add / remove disabled classes from the static elements
                        if (oPaging.iPage === 0) {
                            $('li:first', an[i]).addClass('disabled');
                        } else {
                            $('li:first', an[i]).removeClass('disabled');
                        }

                        if (oPaging.iPage === oPaging.iTotalPages - 1 || oPaging.iTotalPages === 0) {
                            $('li:last', an[i]).addClass('disabled');
                        } else {
                            $('li:last', an[i]).removeClass('disabled');
                        }
                    }
                }
            }
        });
    }


    /*
     * TableTools Bootstrap compatibility
     * Required TableTools 2.1+
     */
    if ($.fn.DataTable.TableTools) {
        // Set the classes that TableTools uses to something suitable for Bootstrap
        $.extend(true, $.fn.DataTable.TableTools.classes, {
            "container": "DTTT btn-group",
            "buttons": {
                "normal": "btn btn-default",
                "disabled": "disabled"
            },
            "collection": {
                "container": "DTTT_dropdown dropdown-menu",
                "buttons": {
                    "normal": "",
                    "disabled": "disabled"
                }
            },
            "print": {
                "info": "DTTT_print_info modal"
            },
            "select": {
                "row": "active"
            }
        });

        // Have the collection use a bootstrap compatible dropdown
        $.extend(true, $.fn.DataTable.TableTools.DEFAULTS.oTags, {
            "collection": {
                "container": "ul",
                "button": "li",
                "liner": "a"
            }
        });
    }

    /*
     * datatables inline editing
     */
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

    function restoreRow(oTable, nRow) {
        var aData = oTable.fnGetData(nRow);
        var jqTds = $('>td', nRow);

        for (var i = 0, iLen = jqTds.length; i < iLen; i++) {
            oTable.fnUpdate(aData[i], nRow, i, false);
        }

        oTable.fnDraw();
    }

    function editRow(oTable, nRow) {
        var aData = oTable.fnGetData(nRow);
        var jqTds = $('>td', nRow);
        jqTds[0].innerHTML = '<input type="text" class="form-control input-small" value="' + aData[0] + '">';
        jqTds[1].innerHTML = '<input type="text" class="form-control input-small" value="' + aData[1] + '">';
        jqTds[2].innerHTML = '<input type="text" class="form-control input-small" value="' + aData[2] + '">';
        jqTds[3].innerHTML = '<input type="text" class="form-control input-small" value="' + aData[3] + '">';
        jqTds[4].innerHTML = '<input type="text" class="form-control input-small" value="' + aData[4] + '">';
        jqTds[5].innerHTML = '<input type="text" class="form-control input-small" value="' + aData[5] + '">';
        jqTds[6].innerHTML = '<input type="text" class="form-control input-small" value="' + aData[6] + '">';
        jqTds[7].innerHTML = '<div class="mu-table-action"><a class="edit" data-table-action="save" data-toggle="tooltip" ref="tooltip" data-original-title="保存" href="#"><i class="fa fa-check"></i></a>  <a class="cancel" data-table-action="cancel" data-toggle="tooltip" ref="tooltip" data-original-title="取消" href="#"><i class="fa fa-reply"></i></a></div>';
    }

    function saveRow(oTable, nRow) {
        var jqInputs = $('input', nRow);
        oTable.fnUpdate(jqInputs[0].value, nRow, 0, false);
        oTable.fnUpdate(jqInputs[1].value, nRow, 1, false);
        oTable.fnUpdate(jqInputs[2].value, nRow, 2, false);
        oTable.fnUpdate(jqInputs[3].value, nRow, 3, false);
        oTable.fnUpdate(jqInputs[4].value, nRow, 4, false);
        oTable.fnUpdate(jqInputs[5].value, nRow, 5, false);
        oTable.fnUpdate(jqInputs[6].value, nRow, 6, false);
        oTable.fnUpdate('<div class="mu-table-action"><a class="edit" data-table-action="edit" data-toggle="tooltip" ref="tooltip" data-original-title="编辑" href="javascript:;"><i class="fa fa-pencil "></i></a>  <a class="delete" data-table-action="delete" data-toggle="tooltip" ref="tooltip" data-original-title="删除" href="javascript:;"><i class="fa fa-trash-o"></i></a></div>', nRow, 7, false);
        oTable.fnDraw();
    }

    function getTable($this) {

        var selector = $this.attr('data-target');

        if (!selector) {
            selector = $this.attr('href');
            selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, ''); //strip for ie7
        }

        var $table = selector && $(selector);

        return $table && $table.length ? $table : $this.closest("table");

    }


    // APPLY TO DTATABLES ELEMENTS CLICK EVENT
    // ===================================
    $(document)
        .on('click.add.inline.datatables.data-api', '[data-table-action="add"]', function(e) {

            e.preventDefault();
            detachActionToolTip();

            try {

                //get closed tables
                var $table = getTable($(this));
                //get datatables object
                var $datatables = $table.dataTable();

                if ($datatables) {

                    var aiNew = $datatables.fnAddData(['', '', '', '', '', '', '',
                        '<div class="mu-table-action"><a class="edit" data-table-action="edit" data-toggle="tooltip" ref="tooltip" data-original-title="编辑" href="#"><i class="fa fa-check"></i></a>  <a class="cancel" data-table-action="cancel" data-mode="new" data-toggle="tooltip" ref="tooltip" data-original-title="取消" href="#"><i class="fa fa-reply"></i></a></div>'
                    ]);

                    var nRow = $datatables.fnGetNodes(aiNew[0]);

                    editRow($datatables, nRow);

                } else {
                    //TO DO
                }

            } catch (e) {

            }

            attachActionToolTip();
        })
        .on('click.delete.inline.datatables.data-api', '[data-table-action="delete"]', function(e) {

            e.preventDefault();
            detachActionToolTip();

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

                    $datatables.fnDeleteRow(nRow);

                } else {
                    //TO DO
                }

                /*alert("Deleted! Do not forget to do some ajax to sync with backend :)");*/

            } catch (e) {

            }

            attachActionToolTip();
        })
        .on('click.save.inline.datatables.data-api', '[data-table-action="save"]', function(e) {

            e.preventDefault();
            detachActionToolTip();

            try {

                //get closed tables
                var $table = getTable($(this));
                //get datatables object
                var $datatables = $table.dataTable();

                if ($datatables) {

                    var nRow = $(this).parents('tr')[0];

                    if (nRow !== null) {
                        /* Editing this row and want to save it */
                        saveRow($datatables, nRow);

                        /*alert("Updated! Do not forget to do some ajax to sync with backend :)");*/
                    }

                } else {
                    //TO DO
                }

            } catch (e) {

            }

            attachActionToolTip();
        })
        .on('click.cancel.inline.datatables.data-api', '[data-table-action="cancel"]', function(e) {

            e.preventDefault();
            detachActionToolTip();

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

            attachActionToolTip();
        })
        .on('click.edit.inline.datatables.data-api', '[data-table-action="edit"]', function(e) {

            e.preventDefault();
            detachActionToolTip();

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

            attachActionToolTip();
        });

    // Apply datatables to all elements with the rel="datatables" attribute
    // ===================================
    $(document).on('ready update', function(event, updatedFragment) {
        var $root = $(updatedFragment || 'html');

        $root.find('[rel="datatables"]').each(function(index, el) {
            var table = this,
                $table = $(this),
                columnDataSelector = '> thead > tr:last-child > th, > thead > tr:last-child > td',
                columnArray = new Array();

            if (!$.fn.DataTable.isDataTable(table)) {

                var option = $.extend({}, parser.getTableData(table));

                // Get the column data once for the life time of the plugin
                $table.find(columnDataSelector).each(function() {
                    var data = parser.getColumnsData(this);
                    columnArray.push(data);
                });

                option = $.extend({}, {
                    "columns": columnArray
                }, option);

                $table.dataTable(option);
            }
        });
    });

})(Base || {}, DTParser || {}, jQuery, window, document);
