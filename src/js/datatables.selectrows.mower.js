/** ========================================================================
 * Mower: datatables.selectrows.mower.js - v1.0.0
 *
 * datatables.selector script to handle datatables selected row functionally.
 *
 * Component:       `selected style`
 *
 * Dependencies:
 *                  datatables
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

(function(window, document, undefined) {

    var factory = function($, DataTable) {
        "use strict";

        /**
         *
         *  @example
         *      var table = $('#example').dataTable( {
         *        "scrollX": "100%"
         *      } );
         *      new $.fn.dataTable.selectRows( table );
         */
        var SelectRows = function(dt, init) {
            var that = this;

            /* Sanity check - you just know it will happen */
            if (!this instanceof SelectRows) {
                alert("SelectRows warning: SelectRows must be initialised with the 'new' keyword.");
                return;
            }

            if (typeof init == 'undefined') {
                init = {};
            }

            // Use the DataTables Hungarian notation mapping method, if it exists to
            // provide forwards compatibility for camel case variables
            if ($.fn.dataTable.camelToHungarian) {
                $.fn.dataTable.camelToHungarian(SelectRows.defaults, init);
            }

            // v1.10 allows the settings object to be got form a number of sources
            var dtSettings = $.fn.dataTable.Api ?
                new $.fn.dataTable.Api(dt).settings()[0] :
                dt.fnSettings();

            /**
             * Settings object which contains customisable information for SelectRows instance
             * @namespace
             * @extends SelectRows.defaults
             * @private
             */
            this.s = {
                /**
                 * DataTables settings objects
                 *  @type     object
                 *  @default  Obtained from DataTables instance
                 */
                "dt": dtSettings
            };

            /* Attach the instance to the DataTables instance so it can be accessed easily */
            dtSettings._oSelectRows = this;

            /* Let's do it */
            if (!dtSettings._bInitComplete) {
                dtSettings.oApi._fnCallbackReg(dtSettings, 'aoInitComplete', function() {
                    that._fnConstruct(init);
                }, 'SelectRows');
            } else {
                this._fnConstruct(init);
            }

        };

        SelectRows.prototype = /** @lends SelectRows.prototype */ {
            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
             * Public methods
             * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

            /**
             *  get the table row id column data with selected class.
             *  @returns {string[]}
             *  @example
             *      var table = $('#example').dataTable( {
             *          "scrollX": "100%"
             *      } );
             *      var fc = new $.fn.dataTable.SelectRows( table );
             *
             *      // at some later point when the table has been manipulated....
             *      fc.fnGetSelectedRowIds();
             */
            "fnGetSelectedRowIds": function() {
                var ids = [],
                    that = this;
                var data = this.s.dt.oInstance.api().rows('tr.selected').data();
                data.each(function(item, index) {
                    var idName = that.s.sIdColumn;
                    if (item[idName])
                        ids.push(item[idName]);
                });
                return ids;
            },
            "fnGetSelectedRows": function() {
                return this.s.dt.oInstance.api().rows('tr.selected').data();
            },
            "fnSelectRow": function(selector) {
                var api = this.s.dt.oInstance.api();
                selector = selector || 'tr:first';

                api.$(selector).addClass('selected');

                var container = $(this.s.dt.nTable).closest('.dataTables_scrollBody');
                var scrollTo = $(this.s.dt.nTable).find(selector);
                if (scrollTo.length) {
                    container.scrollTop(0);
                    container.scrollTop(scrollTo.offset().top - container.offset().top);
                }
            },
            "fnSelectRowsById": function(id) {
                var that = this,
                    api = this.s.dt.oInstance.api(),
                    result;

                if ($.isArray(id)) {
                    result = [];
                    api.rows().indexes().each(function(idx) {
                        var data = api.row(idx).data();

                        if (data[that.s.sIdColumn] && $.inArray(data[that.s.sIdColumn], id) >= 0) {
                            that.fnSelectRow(api.row(idx).node());
                            result.push(data);
                        }
                    });
                } else if (id) {
                    api.rows().indexes().each(function(idx) {
                        var data = api.row(idx).data();

                        if (data[that.s.sIdColumn] && data[that.s.sIdColumn] == id) {
                            that.fnSelectRow(api.row(idx).node());
                            result = data;
                            return false;
                        }
                    });
                } else {
                    //this.fnSelectRow();
                }

                return result;
            },
            "fnUnSelectRow": function(rowSelector) {
                var api = this.s.dt.oInstance.api();
                if (rowSelector) {
                    api.rows(rowSelector)
                        .nodes()
                        .to$()
                        .removeClass('ready');
                } else {
                    api.rows('tr.selected')
                        .nodes()
                        .to$()
                        .removeClass('selected');
                }
            },


            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
             * Private methods (they are of course public in JS, but recommended as private)
             * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

            /**
             * Initialisation for SelectRows
             *  @param   {Object} oInit User settings for initialisation
             *  @returns {void}
             *  @private
             */
            "_fnConstruct": function(oInit) {
                /* Apply the settings from the user / defaults */
                this.s = $.extend(true, this.s, SelectRows.defaults, oInit);

                if (this.s.bEnableSelected === false) return;

                this.fnSelectRowsById(this.s.sInitSelect);

                var that = this,
                    api = this.s.dt.oInstance.api();

                var e = $.Event(SelectRows.defaults.events.select);

                if (this.s.bSingleSelect === true) {
                    $(this.s.dt.nTable).find('tbody').on('click', 'tr', function(event) {
                        event.stopPropagation();

                        if ($(this).hasClass(that.s.sSelectedClass)) {
                            $(this).removeClass(that.s.sSelectedClass);
                        } else {
                            api.$('tr.' + that.s.sSelectedClass).removeClass(that.s.sSelectedClass);
                            $(this).addClass(that.s.sSelectedClass);
                        }

                        $(that.s.dt.nTable).trigger(e, [api.row(this).data()]);
                    });
                } else if (this.s.bSingleSelect === false) {
                    $(this.s.dt.nTable).find('tbody').on('click', 'tr', function(event) {
                        event.stopPropagation();

                        $(this).toggleClass(that.s.sSelectedClass);

                        $(that.s.dt.nTable).trigger(e, [api.row(this).data()]);
                    });
                }
            }
        };



        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         * Statics
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

        /**
         * SelectRows default settings for initialisation
         *  @name SelectRows.defaults
         *  @namespace
         *  @static
         */
        SelectRows.defaults = /** @lends SelectRows.defaults */ {

            /**
             * Height matching algorthim to use. This can be "none" which will result in no height
             * matching being applied by FixedColumns (height matching could be forced by CSS in this
             * case), "semiauto" whereby the height calculation will be performed once, and the result
             * cached to be used again (fnRecalculateHeight can be used to force recalculation), or
             * "auto" when height matching is performed on every draw (slowest but must accurate)
             *  @type     string
             *  @default  semiauto
             *  @static
             *  @example
             *      var table = $('#example').dataTable( {
             *          "scrollX": "100%"
             *      } );
             *      new $.fn.dataTable.SelectRows( table, {
             *          "selectedClass": "selected"
             *      } );
             */
            "sSelectedClass": "selected",

            "bEnableSelected": true,

            "bSingleSelect": false,

            "sIdColumn": "id",

            "sInitSelect": '',

            "events": {
                select: "selected.mu.datatables"
            }

        };




        /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
         * Constants
         * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

        SelectRows.version = "1.0.0";

        // Make SelectRows accessible from the DataTables instance
        $.fn.dataTable.SelectRows = SelectRows;
        $.fn.DataTable.SelectRows = SelectRows;

        return SelectRows;
    }; // /factory


    // Define as an AMD module if possible
    if (typeof define === 'function' && define.amd) {
        define('datatables-selectrows', ['jquery', 'datatables'], factory);
    } else if (jQuery && !jQuery.fn.dataTable.FixedColumns) {
        // Otherwise simply initialise as normal, stopping multiple evaluation
        factory(jQuery, jQuery.fn.dataTable);
    }

})(window, document);
