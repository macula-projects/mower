/** ========================================================================
 * Mower: dropdown.tree.mower.js - v1.0.0
 *
 * dropdown tree via jstree.
 *
 * Dependencies:
 *               bootstrap dropdown
 *               jstree
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function(utils, $, window, document, undefined) {

    "use strict";

    var $window = $(window);

    var DropDownTree = function(element, options) {
        this.element = element;
        this.$element = $(element);
        this.options = options;

        this.isLoaded = false;
    };

    DropDownTree.DEFAULTS = {
        url: '',
        processData: false,
        codeField: '',
        textField: '',
        realField: '',
        multiple: false,
        separator: ',',
        height: 200,
        initValue: '',
        orientation: "auto",
        template: '<div class="mu-picker mu-picker-dropdown dropdown-menu"></div>'
    };

    DropDownTree.DEFAULTS.JSTREE_CORE = {
        data: false,
        multiple: false
    };

    DropDownTree.DEFAULTS.JSTREE_CHECKBOX = {
        whole_node: false,
        keep_selected_style: false
    };

    DropDownTree.DEFAULTS.JSTREE_SEARCH = {
        show_only_matches: false
    };

    DropDownTree.prototype = {

        constructor: DropDownTree,

        _init: function(element, options) {
            var $element = $(element);
            this.options = $.extend({}, DropDownTree.DEFAULTS, $element.data(), typeof options === 'object' && options);

            this.$input = this.$element.find('.form-control:first');
            this.$component = this.$element.is('.mu-dropdowntree') ? this.$element.find('.add-on, .input-group-addon, .btn') : false;
            this.$treeContainer = $(DropDownTree.DEFAULTS.template);
            this.$treeContainer.append('<div></div');
            this.$tree = this.$treeContainer.find('div:first');

            this.$tree.css('height', this.options.height + 'px');
            this.$tree.css('overflow', 'auto');

            this._process_options();
            this._buildEvents();
            this._attachEvents();
            this.construct();

            // var that = this;
            // if (this.options.multiple === false) {

            //     var to = false;
            //     this.$input.keyup(function(event) {
            //         if (event.keyCode == 13) return;

            //         if (that.isLoaded)
            //             $.jstree.reference(that.$tree).uncheck_all();

            //         that._getRealInput().val(that.$input.val());

            //         if (to) {
            //             clearTimeout(to);
            //         }

            //         to = setTimeout(function() {
            //             that.show();

            //             var v = that.$input.val();
            //             $.jstree.reference(that.$tree).search(v);

            //             that.place();
            //         }, 250);
            //     });
            // }
        },
        _process_options: function() {
            var o = this.options;

            var jtCoreOpt = $.extend({},
                DropDownTree.DEFAULTS.JSTREE_CORE, {
                    'data': this.populate,
                    'multiple': this.options.multiple,
                    'instance': this
                });

            this.options.jtOpt = {
                'core': jtCoreOpt,
                'checkbox': DropDownTree.DEFAULTS.JSTREE_CHECKBOX,
                'search': DropDownTree.DEFAULTS.JSTREE_SEARCH,
                "plugins": ["checkbox", "search"]
            };

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
                [this.$treeContainer, {
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
                                this.$treeContainer.is(e.target) ||
                                this.$treeContainer.find(e.target).length
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
        _scrollTo: function() {
            var selectNodeVal = this.getValue();
            var firstNodeVal;

            if ($.isArray(selectNodeVal) && selectNodeVal.length > 0) {
                firstNodeVal = selectNodeVal[0];
            } else {
                firstNodeVal = selectNodeVal;
            }

            if (firstNodeVal) {
                var scrollTo = this.$tree.find('#' + firstNodeVal);
                if (scrollTo.length) {
                    this.$tree.scrollTop(0);
                    this.$tree.scrollTop(scrollTo.offset().top - this.$tree.offset().top);
                }
            }
        },
        _show: function() {
            this.$treeContainer.show();
            //clear search result previously
            $.jstree.reference(this.$tree).clear_search();

            this._scrollTo();
            this.place();

            this._attachSecondaryEvents();
            this._trigger('shown.mu.dropdowntree');
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
            this.$treeContainer.css('width', width);
        },
        construct: function() {
            //wrap table and append to input backend
            if ($.isArray(this.options.initValue)) {
                for (var i = 0; i < this.options.initValue.length; i++) {
                    this.$input.after(' <input class="_textbox-value" type="hidden" name="' + this.options.realField + '" value="' + this.options.initValue[i] + '"/>');
                }
            } else if (this.options.initValue) {
                this.$input.after(' <input class="_textbox-value" type="hidden" name="' + this.options.realField + '" value="' + this.options.initValue + '"/>');
            }
        },
        //load data and fill tree
        // register callback in jstree core plugin
        populate: function(obj, cb) {
            var instance = this.settings.core.instance;
            var options = instance.options;

            var opt = {
                url: options.url,
                dataType: 'json',
                success: function(data) {
                    if (options.processData) {
                        if (typeof options.processData === 'string') {
                            utils.executeFunctionByName(options.processData, window, data, this);
                        }

                        if ($.isFunction(options.processData)) {
                            options.processData.call(this, data);
                        }
                    }

                    cb.call(this, data);
                }
            };
            $.ajax(opt);
        },
        show: function() {
            this.$treeContainer.appendTo('body');

            if (!this.isLoaded) {
                var that = this;

                this.$tree.on('ready.jstree', function(e, data) {
                    that.isLoaded = true;
                    that._show();
                }).jstree(this.options.jtOpt);

                return;
            }

            this._show();
        },
        hide: function() {
            if (!this.$treeContainer.is(':visible'))
                return;

            this.$treeContainer.hide().detach();
            this._detachSecondaryEvents();

            this._trigger('hidden.mu.dropdowntree');
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
            var text = [];

            if ($.isArray(value)) {
                for (var i = 0; i < value.length; i++) {
                    if (!this._isExisted(value[i])) {
                        this.$input.after('<input class="_textbox-value" type="hidden" name="' + this.options.realField + '" value="' + value[i] + '"/>');
                        $.jstree.reference(this.$tree).check_node('#' + value[i]);

                        var selectNode = $.jstree.reference(this.$tree).get_node('#' + value[i]);
                        selectNode && text.push(selectNode.text);
                    }

                }
            } else if (value && !this._isExisted(value)) {
                this.$input.after(' <input class="_textbox-value" type="hidden" name="' + this.options.realField + '" value="' + value + '"/>');
                $.jstree.reference(this.$tree).check_node('#' + value);

                var selectNode = $.jstree.reference(this.$tree).get_node('#' + value);
                selectNode && text.push(selectNode.text);
            }

            this.$input.val(text.join(this.options.separator));
        },
        click: function() {
            this.clear();

            var selectNodes = $.jstree.reference(this.$tree).get_checked(true);
            if (selectNodes.length > 0) {
                var texts = [];

                for (var i = 0; i < selectNodes.length; i++) {
                    this.$input.after('<input class="_textbox-value" type="hidden" name="' + this.options.realField + '" value="' + selectNodes[i].id + '"/>');
                    texts.push(selectNodes[i].text);
                }

                this.$input.val(texts.join(this.options.separator));
            }

            if (this.options.multiple === false)
                this.hide();

            if (this.$treeContainer.is(':visible') && this._focused_from) {
                $(this._focused_from).focus();
            }
            delete this._focused_from;
        },
        clear: function() {
            this.$element.find('._textbox-value').remove();
            this.$input.val('');
        },
        place: function() {
            //adjustment treeContainer width
            this._resize();

            var treeContainerWidth = this.$treeContainer.outerWidth(),
                treeContainerHeight = this.$treeContainer.outerHeight(),
                visualPadding = 10,
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

            this.$treeContainer.removeClass(
                'mu-picker-orient-top mu-picker-orient-bottom ' +
                'mu-picker-orient-right mu-picker-orient-left'
            );

            if (this.options.orientation.x !== 'auto') {
                this.$treeContainer.addClass('mu-picker-orient-' + this.o.orientation.x);
                if (this.options.orientation.x === 'right')
                    left -= treeContainerWidth - width;
            }
            // auto x orientation is best-placement: if it crosses a window
            // edge, fudge it sideways
            else {
                // Default to left
                this.$treeContainer.addClass('mu-picker-orient-left');
                if (offset.left < 0)
                    left -= offset.left - visualPadding;
                else if (offset.left + treeContainerWidth > windowWidth)
                    left = windowWidth - treeContainerWidth - visualPadding;
            }

            // auto y orientation is best-situation: top or bottom, no fudging,
            // decision based on which shows more of the calendar
            var yorient = this.options.orientation.y,
                top_overflow, bottom_overflow;
            if (yorient === 'auto') {
                top_overflow = -scrollTop + offset.top - treeContainerHeight;
                bottom_overflow = scrollTop + windowHeight - (offset.top + height + treeContainerHeight);
                if (Math.max(top_overflow, bottom_overflow) === bottom_overflow)
                    yorient = 'top';
                else
                    yorient = 'bottom';
            }
            this.$treeContainer.addClass('mu-picker-orient-' + yorient);
            if (yorient === 'top')
                top += height;
            else
                top -= treeContainerHeight + parseInt(this.$treeContainer.css('padding-top')) + visualPadding;

            this.$treeContainer.css({
                top: top,
                left: left,
                zIndex: zIndex
            });
        },
        _destory: function() {
            this.hide();
            this._detachEvents();
            this._detachSecondaryEvents();
            this.$treeContainer.remove();
            delete this.element.data('mu.dropdowntree');
        }
    };

    /* DROPDOWNTABLE PLUGIN DEFINITION
     * ============================ */

    var old = $.fn.dropdowntree;

    $.fn.dropdowntree = function(options) {
        // slice arguments to leave only arguments after function name.
        var args = Array.prototype.slice.call(arguments, 1);

        // Cache any plugin method call, to make it possible to return a value
        var results;

        this.each(function() {
            var element = this,
                $element = $(element),
                pluginKey = 'mu.dropdowntree',
                instance = $.data(element, pluginKey);


            // if there's no plugin instance for this element, create a new one, calling its "init" method, if it exists.
            if (!instance) {
                instance = $.data(element, pluginKey, new DropDownTree(element, options));
                if (instance && typeof DropDownTree.prototype['_init'] === 'function')
                    DropDownTree.prototype['_init'].apply(instance, [element, options]);
            }

            // if we have an instance, and as long as the first argument (options) is a valid string value, tries to call a method from this instance.
            if (instance && typeof options === 'string' && options[0] !== '_' && options !== 'init') {

                var methodName = (options == 'destroy' ? '_destroy' : options);
                if (typeof DropDownTree.prototype[methodName] === 'function')
                    results = DropDownTree.prototype[methodName].apply(instance, args);

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy') {
                    $.data(element, pluginKey, null);
                }
            }
        });

        // If the earlier cached method gives a value back, return the resulting value, otherwise return this to preserve chainability.
        return results !== undefined ? results : this;
    };

    $.fn.dropdowntree.Constructor = DropDownTree;


    /* DROPDOWNTABLE NO CONFLICT
     * ================= */

    $.fn.dropdowntree.noConflict = function() {
        $.fn.dropdowntree = old;
        return this;
    };

    /* DROPDOWNTABLE DATA-API
     * ============== */
    $(document).on(
        'focus.mu.dropdowntree.data-api click.mu.dropdowntree.data-api',
        '[data-provide="dropdowntree"]',
        function(e) {
            var $this = $(this);
            if ($this.data('mu.dropdowntree'))
                return;
            e.preventDefault();
            // component click requires us to explicitly show it
            $this.dropdowntree('show');
        });

    $(document).on('ready update', function(event, updatedFragment) {
        var $root = $(updatedFragment || 'html');

        $root.find('[rel="dropdowntree"]').each(function(index, el) {
            var $this = $(this);
            if ($this.data('mu.dropdowntree'))
                return;
            // component click requires us to explicitly show it
            $this.dropdowntree();
        });
    });

})(Utils || {}, jQuery, window, document);
