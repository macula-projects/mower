/** ========================================================================
 * Mower: dropdown.table.mower.js - v1.0.0
 *
 * dropdown table via bootstrap dropdown.
 *
 * Dependencies:
 *               bootstrap dropdown
 *               datatables.net
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function(adapter, tableUtils, utils, $, window, document, undefined) {

    "use strict";

    var $window = $(window);

    var DropDownTable = function(element, options) {
        this.element = element;
        this.$element = $(element);
        this.options = options;

        this.isLoaded = false;
    };
    DropDownTable.DEFAULTS = {
        url: '',
        codeField: '',
        textField: '',
        realField: '',
        multiple: false,
        separator: ',',
        height: 200,
        columns: '',
        initValue: '',
        orientation: "auto",
        template: '<div class="mu-picker mu-picker-dropdown dropdown-menu">' +
            '<table class="table table-striped table-bordered table-condensed"' +
            'data-paging="false" data-info="false"  data-scrollCollapse="true"' +
            'data-ordering="false" data-dom="r<\'dt-wrapper table-responsive\'t>">' +
            '</table>' +
            '</div>'
    };

    DropDownTable.prototype = {

        constructor: DropDownTable,

        _init: function(element, options) {
            var $element = $(element);
            this.options = $.extend({}, DropDownTable.DEFAULTS, $element.data(), typeof options === 'object' && options);

            this.$input = this.$element.find('.form-control:first');
            this.$component = this.$element.is('.mu-dropdowntable') ? this.$element.find('.add-on, .input-group-addon, .btn') : false;
            this.$tableContainer = $(DropDownTable.DEFAULTS.template);
            this.$table = this.$tableContainer.find('table:first');

            this.$table.attr('data-scrollY', this.options.height + 'px');

            this._process_options();
            this._buildEvents();
            this._attachEvents();
            this.construct();

            var that = this;
            this.$table.on('selected.mu.datatables', function(event, rowData) {
                event.preventDefault();
                that.click();
            });

            if (this.options.multiple === false) {
                this.$input.on('keyup', function(event) {

                    if (event.keyCode == 13) return;

                    if (that.isLoaded)
                        tableUtils.unSelectRow(that.$table);

                    that._getRealInput().val(that.$input.val());

                    that.show();
                    tableUtils.searchColumn(that.$table, '[data-name=' + that.options.textField + ']', that.$input.val());
                    that.place();
                });
            }
        },
        _process_options: function() {
            var o = this.options;

            var plc = String(o.orientation).toLowerCase().split(/\s+/g),
                _plc = o.orientation.toLowerCase();
            plc = $.grep(plc, function(word) {
                return (/^auto|left|right|top|bottom$/).test(word);
            });
            o.orientation = {
                x: 'auto',
                y: 'auto'
            };
            if (!_plc || _plc === 'auto')
            ; // no action
            else if (plc.length === 1) {
                switch (plc[0]) {
                    case 'top':
                    case 'bottom':
                        o.orientation.y = plc[0];
                        break;
                    case 'left':
                    case 'right':
                        o.orientation.x = plc[0];
                        break;
                }
            } else {
                _plc = $.grep(plc, function(word) {
                    return (/^left|right$/).test(word);
                });
                o.orientation.x = _plc[0] || 'auto';

                _plc = $.grep(plc, function(word) {
                    return (/^top|bottom$/).test(word);
                });
                o.orientation.y = _plc[0] || 'auto';
            }
        },
        _events: [],
        _secondaryEvents: [],
        _applyEvents: function(evs) {
            for (var i = 0, el, ch, ev; i < evs.length; i++) {
                el = evs[i][0];
                if (evs[i].length === 2) {
                    ch = undefined;
                    ev = evs[i][1];
                } else if (evs[i].length === 3) {
                    ch = evs[i][1];
                    ev = evs[i][2];
                }
                el.on(ev, ch);
            }
        },
        _unapplyEvents: function(evs) {
            for (var i = 0, el, ev, ch; i < evs.length; i++) {
                el = evs[i][0];
                if (evs[i].length === 2) {
                    ch = undefined;
                    ev = evs[i][1];
                } else if (evs[i].length === 3) {
                    ch = evs[i][1];
                    ev = evs[i][2];
                }
                el.off(ev, ch);
            }
        },
        _buildEvents: function() {
            this._events = [
                // For components that are not readonly, allow keyboard nav
                // [this.$input, {
                //     focus: $.proxy(this.show, this)
                // }],
                [this.$component, {
                    click: $.proxy(this.show, this)
                }]
            ];

            this._events.push(
                // Component: listen for blur on element descendants
                [this.$element, '*', {
                    blur: $.proxy(function(e) {
                        this._focused_from = e.target;
                    }, this)
                }],
                // Input: listen for blur on element
                [this.$element, {
                    blur: $.proxy(function(e) {
                        this._focused_from = e.target;
                    }, this)
                }]
            );

            this._secondaryEvents = [
                [this.$tableContainer, {
                    click: $.proxy(this.click, this)
                }],
                [$(window), {
                    resize: $.proxy(this.place, this)
                }],
                [$(document), {
                    'mousedown touchstart': $.proxy(function(e) {
                        // Clicked outside the datepicker, hide it
                        if (!(
                                this.$element.is(e.target) ||
                                this.$element.find(e.target).length ||
                                this.$tableContainer.is(e.target) ||
                                this.$tableContainer.find(e.target).length
                            )) {
                            this.hide();
                        }
                    }, this)
                }]
            ];
        },
        _attachEvents: function() {
            this._detachEvents();
            this._applyEvents(this._events);
        },
        _detachEvents: function() {
            this._unapplyEvents(this._events);
        },
        _attachSecondaryEvents: function() {
            this._detachSecondaryEvents();
            this._applyEvents(this._secondaryEvents);
        },
        _detachSecondaryEvents: function() {
            this._unapplyEvents(this._secondaryEvents);
        },
        _trigger: function(event) {
            this.$element.trigger({
                type: event
            });
        },
        _getRealInput: function() {
            return this.$element.find('._textbox-value');
        },
        _show: function() {
            this.$tableContainer.show();
            tableUtils.adjustColumn(this.$table);

            tableUtils.selectRowById(this.$table, this.getValue());

            this.place();

            this._attachSecondaryEvents();
            this._trigger('shown.mu.dropdowntable');
        },
        _isExisted: function(val) {
            var existed = false;
            $.each(this._getRealInput(), function() {
                if ($(this).value == val) {
                    existed = true;
                    return false;
                }
            });

            return existed;
        },
        _resize: function() {
            var width = this.$element.outerWidth(true);
            this.$tableContainer.css('width', width);
        },
        construct: function() {
            //make columns
            if (this.options.columns) {
                var $thead = $('<thead><tr></tr></thead>');
                var $tr = $thead.find('tr');
                $tr.attr('data-id', this.options.codeField);

                var columns = utils.strToJson(this.options.columns);

                if ($.isPlainObject(columns)) {
                    for (var name in columns) {
                        var $th = $('<th></th>');
                        $th.attr("data-name", name);
                        $th.append(columns[name]);

                        $tr.append($th);
                    }
                }

                this.$table.append($thead);
            }

            //add table ajax data
            this.$table.attr('data-ajax', this.options.url);

            //add table select attribute
            this.$table.attr('data-enableSelected', true);
            this.$table.attr('data-singleSelect', !this.options.multiple);

            //wrap table and append to input backend
            if ($.isArray(this.options.initValue)) {
                for (var i = 0; i < this.options.initValue.length; i++) {
                    this.$input.after(' <input class="_textbox-value" type="hidden" name="' + this.options.realField + '" value="' + this.options.initValue[i] + '"/>');
                }
            } else if (this.options.initValue) {
                this.$input.after(' <input class="_textbox-value" type="hidden" name="' + this.options.realField + '" value="' + this.options.initValue + '"/>');
            }
        },
        //load data and fill table
        populate: function() {
            adapter.applyDataTable(this.$table);

            var that = this;
            this.$table.on('init.dt', function() {
                that.isLoaded = true;
                that._show();
            });
        },
        show: function() {
            this.$tableContainer.appendTo('body');
            if (!this.isLoaded) {
                this.populate();
                return;
            }

            this._show();
        },
        hide: function() {
            if (!this.$tableContainer.is(':visible'))
                return;

            this.$tableContainer.hide().detach();
            this._detachSecondaryEvents();

            this._trigger('hidden.mu.dropdowntable');
        },
        getValue: function() {
            if (this.options.multiple === true) {
                var selectedValues = [];
                $.each(this._getRealInput(), function(index, val) {
                    selectedValues.push($(this).val());
                });
                return selectedValues.length ? selectedValues : "";
            } else {
                return this._getRealInput().val();
            }
        },
        setValue: function(value) {
            if ($.isArray(value)) {
                for (var i = 0; i < value.length; i++) {
                    if (!this._isExisted(value[i]))
                        this.$input.after('<input class="_textbox-value" type="hidden" name="' + this.options.realField + '" value="' + value[i] + '"/>');
                }
            } else if (value && !this._isExisted(value)) {
                this.$input.after(' <input class="_textbox-value" type="hidden" name="' + this.options.realField + '" value="' + value + '"/>');
            }

            var data = tableUtils.selectRowById(this.$table, this.getValue());
            var text = [];

            if ($.isArray(data)) {
                for (var i = 0; i < data.length; i++) {
                    text.push(data[i][this.options.textField]);
                }
            } else if (data) {
                text.push(data[this.options.textField]);
            }

            this.$input.val(text.join(this.options.separator));
        },
        click: function() {
            this.clear();

            var selectrows = tableUtils.getSelectedRows(this.$table);
            if (selectrows.length > 0) {
                var texts = [];

                for (var i = 0; i < selectrows.length; i++) {
                    this.$input.after('<input class="_textbox-value" type="hidden" name="' + this.options.realField + '" value="' + selectrows[i][this.options.codeField] + '"/>');
                    texts.push(selectrows[i][this.options.textField]);
                }

                this.$input.val(texts.join(this.options.separator));
            }

            if (this.options.multiple === false)
                this.hide();

            if (this.$tableContainer.is(':visible') && this._focused_from) {
                $(this._focused_from).focus();
            }
            delete this._focused_from;
        },
        clear: function() {
            this.$element.find('._textbox-value').remove();
            this.$input.val('');
        },
        place: function() {
            //change tableContainer width  depend on element width
            this._resize();

            var tableContainerWidth = this.$tableContainer.outerWidth(),
                tableContainerHeight = this.$tableContainer.outerHeight(),
                visualPadding = 5,
                windowWidth = $window.width(),
                windowHeight = $window.height(),
                scrollTop = $window.scrollTop();

            var zIndex = 2000 + parseInt(this.$element.parents().filter(function() {
                return $(this).css('z-index') !== 'auto';
            }).first().css('z-index')) + 10;

            var offset = this.component ? this.component.parent().offset() : this.$element.offset();
            var height = this.component ? this.component.outerHeight(true) : this.$element.outerHeight(false);
            var width = this.component ? this.component.outerWidth(true) : this.$element.outerWidth(false);
            var left = offset.left,
                top = offset.top;

            this.$tableContainer.removeClass(
                'mu-picker-orient-top mu-picker-orient-bottom ' +
                'mu-picker-orient-right mu-picker-orient-left'
            );

            if (this.options.orientation.x !== 'auto') {
                this.$tableContainer.addClass('mu-picker-orient-' + this.o.orientation.x);
                if (this.options.orientation.x === 'right')
                    left -= tableContainerWidth - width;
            }
            // auto x orientation is best-placement: if it crosses a window
            // edge, fudge it sideways
            else {
                // Default to left
                this.$tableContainer.addClass('mu-picker-orient-left');
                if (offset.left < 0)
                    left -= offset.left - visualPadding;
                else if (offset.left + tableContainerWidth > windowWidth)
                    left = windowWidth - tableContainerWidth - visualPadding;
            }

            // auto y orientation is best-situation: top or bottom, no fudging,
            // decision based on which shows more of the calendar
            var yorient = this.options.orientation.y,
                top_overflow, bottom_overflow;
            if (yorient === 'auto') {
                top_overflow = -scrollTop + offset.top - tableContainerHeight;
                bottom_overflow = scrollTop + windowHeight - (offset.top + height + tableContainerHeight);
                if (Math.max(top_overflow, bottom_overflow) === bottom_overflow)
                    yorient = 'top';
                else
                    yorient = 'bottom';
            }
            this.$tableContainer.addClass('mu-picker-orient-' + yorient);
            if (yorient === 'top')
                top += height;
            else
                top -= tableContainerHeight + parseInt(this.$tableContainer.css('padding-top')) + visualPadding;

            this.$tableContainer.css({
                top: top,
                left: left,
                zIndex: zIndex
            });
        },
        _destory: function() {
            this.hide();
            this._detachEvents();
            this._detachSecondaryEvents();
            this.$tableContainer.remove();
            delete this.element.data('mu.dropdowntable');
        }
    };

    /* DROPDOWNTABLE PLUGIN DEFINITION
     * ============================ */

    var old = $.fn.dropdowntable;

    $.fn.dropdowntable = function(options) {
        // slice arguments to leave only arguments after function name.
        var args = Array.prototype.slice.call(arguments, 1);

        // Cache any plugin method call, to make it possible to return a value
        var results;

        this.each(function() {
            var element = this,
                $element = $(element),
                pluginKey = 'mu.dropdowntable',
                instance = $.data(element, pluginKey);


            // if there's no plugin instance for this element, create a new one, calling its "init" method, if it exists.
            if (!instance) {
                instance = $.data(element, pluginKey, new DropDownTable(element, options));
                if (instance && typeof DropDownTable.prototype['_init'] === 'function')
                    DropDownTable.prototype['_init'].apply(instance, [element, options]);
            }

            // if we have an instance, and as long as the first argument (options) is a valid string value, tries to call a method from this instance.
            if (instance && typeof options === 'string' && options[0] !== '_' && options !== 'init') {

                var methodName = (options == 'destroy' ? '_destroy' : options);
                if (typeof DropDownTable.prototype[methodName] === 'function')
                    results = DropDownTable.prototype[methodName].apply(instance, args);

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy') {
                    $.data(element, pluginKey, null);
                }
            }
        });

        // If the earlier cached method gives a value back, return the resulting value, otherwise return this to preserve chainability.
        return results !== undefined ? results : this;
    };

    $.fn.dropdowntable.Constructor = DropDownTable;


    /* DROPDOWNTABLE NO CONFLICT
     * ================= */

    $.fn.dropdowntable.noConflict = function() {
        $.fn.dropdowntable = old;
        return this;
    };

    /* DROPDOWNTABLE DATA-API
     * ============== */
    $(document).on(
        'focus.mu.dropdowntable.data-api click.mu.dropdowntable.data-api',
        '[data-provide="dropdowntable"]',
        function(e) {
            var $this = $(this);
            if ($this.data('mu.dropdowntable'))
                return;
            e.preventDefault();
            // component click requires us to explicitly show it
            $this.dropdowntable('show');
        });

    $(document).on('ready update', function(event, updatedFragment) {
        var $root = $(updatedFragment || 'html');

        $root.find('[rel="dropdowntable"]').each(function(index, el) {
            var $this = $(this);
            if ($this.data('mu.dropdowntable'))
                return;
            // component click requires us to explicitly show it
            $this.dropdowntable();
        });
    });

})(DTAdapter, TableUtils, Utils, jQuery, window, document);
