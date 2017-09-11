/** ========================================================================
 * Mower: tagsinput.mower.js - v1.0.0
 *
 *  add tags listened on dropdown.query.mower.js selected event 
 *  
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

(function($) {
    "use strict";

    var query = 'queryValue';
    var defaultOptions = {
        tagClass: function(item) {
            return '';
        },
        itemValue: function(item) {
            return item ? item.toString() : item;
        },
        itemText: function(item) {
            return this.itemValue(item);
        },
        queryValue: function(item) {
            return item[query];
        },
        freeInput: true,
        addOnBlur: true,
        maxTags: undefined,
        maxChars: undefined,
        confirmKeys: [13, 44],
        trimValue: false,
        allowDuplicates: false
    };

    /**
     * Constructor function
     */
    function TagsSelect(element, options) {
        this.itemsArray = [];

        this.$element = $(element);
        this.$element.hide();

        this.objectItems = options && options.itemValue;
        this.placeholderText = element.hasAttribute('placeholder') ? this.$element.attr('placeholder') : '';
        this.inputSize = Math.max(1, this.placeholderText.length);

        this.$container = $('<div class="mu-tagsselect"></div>');
        this.$input = $('<input type="text" data-toggle="dropdownquery" data-target=".mu-dropdownquery" placeholder="' + this.placeholderText + '"/>').appendTo(this.$container);

        this.$element.after(this.$container);

        var inputWidth = (this.inputSize < 3 ? 3 : this.inputSize) + "em";
        this.$input.get(0).style.cssText = "width: " + inputWidth + " !important;";
        this.build(options);
    }

    TagsSelect.prototype = {
        constructor: TagsSelect,

        /**
         * Adds the given item as a new tag.
         */
        add: function(item) {
            var self = this;

            if (self.options.maxTags && self.itemsArray.length >= self.options.maxTags)
                return;

            // Ignore falsey values, except false
            if (item !== false && !item)
                return;

            // Throw an error when trying to add an object while the itemValue option was not set
            if (typeof item === "object" && !self.objectItems)
                throw ("Can't add objects when itemValue option is not set");

            // Ignore strings only containg whitespace
            if (item.toString().match(/^\s*$/))
                return;

            var itemValue = self.options.itemValue(item),
                itemText = self.options.itemText(item),
                queryValue = self.options.queryValue(item),
                tagClass = self.options.tagClass(item);

            // if length greater than limit
            if (self.items().toString().length + item.length + 1 > self.options.maxInputLength)
                return;

            // raise beforeItemAdd arg
            var beforeItemAddEvent = $.Event('beforeItemAdd', {
                item: item,
                cancel: false
            });
            self.$element.trigger(beforeItemAddEvent);
            if (beforeItemAddEvent.cancel)
                return;

            // register item in internal array and map
            self.itemsArray.push(item);

            // Ignore items allready added
            var $existingTag;
            var existing = $.grep(self.itemsArray, function(item) {
                return self.options.itemValue(item) === itemValue;
            })[0];
            if (existing) {
                $existingTag = $(".tag", self.$container).filter(function() {
                    return $(this).data("item") === existing;
                });
            }

            if ($existingTag.length) {
                var $newTagValue = $('<span class="tag-facet-value">' + htmlEncode(queryValue) + '</span>');
                $existingTag.find('.tag-facet-values').append($newTagValue);
            } else {
                // add a tag element
                var $tag = $('<div class="tag tag-facet' + htmlEncode(tagClass) + '"><span class="tag-facet-category">' + htmlEncode(itemText) + '</span><span class="tag-facet-values"><span class="tag-facet-value">' + htmlEncode(queryValue) + '</span></span><span class="tag-facet-remove" data-role="remove">x</span></div>');
                $tag.data('item', item);
                self.findInputWrapper().before($tag);
                $tag.after(' ');
            }

            //generate relative input with single or multiple name
            self.pushVal();

            // Add class when reached maxTags
            if (self.options.maxTags === self.itemsArray.length || self.items().toString().length === self.options.maxInputLength)
                self.$container.addClass('mu-tagsselect-max');

            self.$element.trigger($.Event('itemAdded', {
                item: item
            }));
        },
        /**
         * Removes the given item.
         */
        remove: function(item) {
            var self = this;

            if (self.objectItems) {
                if (typeof item === "object")
                    item = $.grep(self.itemsArray, function(other) {
                        return self.options.itemValue(other) == self.options.itemValue(item);
                    });
                else
                    item = $.grep(self.itemsArray, function(other) {
                        return self.options.itemValue(other) == item;
                    });
            }

            if (item.length) {
                var beforeItemRemoveEvent = $.Event('beforeItemRemove', {
                    item: item,
                    cancel: false
                });
                self.$element.trigger(beforeItemRemoveEvent);
                if (beforeItemRemoveEvent.cancel)
                    return;

                for (var i = 0; i < item.length; i++) {
                    $('.tag', self.$container).filter(function() {
                        return $(this).data('item') === item[i];
                    }).remove();
                    if ($.inArray(item[i], self.itemsArray) !== -1)
                        self.itemsArray.splice($.inArray(item[i], self.itemsArray), 1);
                }
            }

            self.pushVal();

            // Remove class when reached maxTags
            if (self.options.maxTags > self.itemsArray.length)
                self.$container.removeClass('mu-tagsselect-max');

            self.$element.trigger($.Event('itemRemoved', {
                item: item
            }));
        },

        /**
         * Removes all items
         */
        removeAll: function() {
            var self = this;

            $('.tag', self.$container).remove();

            while (self.itemsArray.length > 0)
                self.itemsArray.pop();

            self.pushVal();
        },

        /**
         * Refreshes the tags so they match the text/value of their corresponding
         * item.
         */
        refresh: function() {
            var self = this;
            $('.tag', self.$container).each(function() {
                var $tag = $(this),
                    item = $tag.data('item'),
                    itemValue = self.options.itemValue(item),
                    itemText = self.options.itemText(item),
                    tagClass = self.options.tagClass(item);

                // Update tag's class and inner text
                $tag.attr('class', null);
                $tag.addClass('tag ' + htmlEncode(tagClass));
                $tag.contents().filter(function() {
                    return this.nodeType == 3;
                })[0].nodeValue = htmlEncode(itemText);
            });
        },

        /**
         * Returns the items added as tags
         */
        items: function() {
            return this.itemsArray;
        },

        /**
         * Assembly value by retrieving the value of each item, and set it on the
         * element.
         */
        pushVal: function() {
            this.$element.siblings('input[type=hidden]').remove();

            var that = this;
            $.map(that.items(), function(item) {
                var $input = $('<input type="hidden" />').insertAfter(that.$element);
                $input.attr('name', that.options.itemValue(item));
                $input.val(item[query]);
            });

            that.$element.trigger('change');
        },

        /**
         * Initializes the tags input behaviour on the element
         */
        build: function(options) {
            var self = this;

            self.options = $.extend({}, defaultOptions, options);
            // When itemValue is set, freeInput should always be false
            if (self.objectItems)
                self.options.freeInput = false;

            makeOptionItemFunction(self.options, 'itemValue');
            makeOptionItemFunction(self.options, 'itemText');
            makeOptionFunction(self.options, 'tagClass');

            // dropdown.query.mower.js
            if (self.options.dropdownquery) {
                var dropdownquery = self.options.dropdownquery || {};

                self.$input.dropdownquery(dropdownquery).on('dropdownquery:selected', $.proxy(function(obj, datum, queryValue) {
                    datum = datum || {};
                    datum[query] = queryValue;

                    self.add(datum);

                    self.$input.dropdownquery('val', '');
                }, self));
            }

            self.$container.on('click', $.proxy(function(event) {
                if (!self.$element.attr('disabled')) {
                    self.$input.removeAttr('disabled');
                }
                self.$input.focus();
            }, self));

            if (self.options.addOnBlur && self.options.freeInput) {
                self.$input.on('focusout', $.proxy(function(event) {
                    // HACK: only process on focusout when no typeahead opened, to
                    //       avoid adding the typeahead text as tag
                    if ($('.typeahead, .twitter-typeahead', self.$container).length === 0) {
                        self.add(self.$input.val());
                        self.$input.val('');
                    }
                }, self));
            }

            self.$container.on('keydown', 'input', $.proxy(function(event) {
                var $input = $(event.target),
                    $inputWrapper = self.findInputWrapper();

                if (self.$element.attr('disabled')) {
                    self.$input.attr('disabled', 'disabled');
                    return;
                }

                switch (event.which) {
                    // BACKSPACE
                    case 8:
                        if (doGetCaretPosition($input[0]) === 0) {
                            var prev = $inputWrapper.prev();
                            if (prev) {
                                self.remove(prev.data('item'));
                            }
                        }
                        break;

                        // DELETE
                    case 46:
                        if (doGetCaretPosition($input[0]) === 0) {
                            var next = $inputWrapper.next();
                            if (next) {
                                self.remove(next.data('item'));
                            }
                        }
                        break;

                        // LEFT ARROW
                    case 37:
                        // Try to move the input before the previous tag
                        var $prevTag = $inputWrapper.prev();
                        if ($input.val().length === 0 && $prevTag[0]) {
                            $prevTag.before($inputWrapper);
                            $input.focus();
                        }
                        break;
                        // RIGHT ARROW
                    case 39:
                        // Try to move the input after the next tag
                        var $nextTag = $inputWrapper.next();
                        if ($input.val().length === 0 && $nextTag[0]) {
                            $nextTag.after($inputWrapper);
                            $input.focus();
                        }
                        break;
                    default:
                        // ignore
                }

                // Reset internal input's size
                var textLength = $input.val().length,
                    wordSpace = Math.ceil(textLength / 5),
                    size = textLength + wordSpace + 1;
                $input.attr('size', Math.max(this.inputSize, $input.val().length));
            }, self));

            self.$container.on('keypress', 'input', $.proxy(function(event) {
                var $input = $(event.target);

                if (self.$element.attr('disabled')) {
                    self.$input.attr('disabled', 'disabled');
                    return;
                }

                var text = $input.val(),
                    maxLengthReached = self.options.maxChars && text.length >= self.options.maxChars;
                if (self.options.freeInput && (keyCombinationInList(event, self.options.confirmKeys) || maxLengthReached)) {
                    self.add(maxLengthReached ? text.substr(0, self.options.maxChars) : text);
                    $input.val('');
                    event.preventDefault();
                }

                // Reset internal input's size
                var textLength = $input.val().length,
                    wordSpace = Math.ceil(textLength / 5),
                    size = textLength + wordSpace + 1;
                $input.attr('size', Math.max(this.inputSize, $input.val().length));
            }, self));

            // Remove icon clicked
            self.$container.on('click', '[data-role=remove]', $.proxy(function(event) {
                if (self.$element.attr('disabled')) {
                    return;
                }
                self.remove($(event.target).closest('.tag').data('item'));
            }, self));

            // Only add existing value as tags when using strings as tags
            if (self.options.itemValue === defaultOptions.itemValue) {
                if (self.$element[0].tagName === 'INPUT') {
                    self.add(self.$element.val());
                } else {
                    $('option', self.$element).each(function() {
                        self.add($(this).attr('value'), true);
                    });
                }
            }
        },

        /**
         * Removes all tagsselect behaviour and unregsiter all event handlers
         */
        destroy: function() {
            var self = this;

            // Unbind events
            self.$container.off('keypress', 'input');
            self.$container.off('click', '[role=remove]');

            self.$container.remove();
            self.$element.removeData('tagsselect');
            self.$element.show();
        },

        /**
         * Sets focus on the tagsselect
         */
        focus: function() {
            this.$input.focus();
        },

        /**
         * Returns the internal input element
         */
        input: function() {
            return this.$input;
        },

        /**
         * Returns the element which is wrapped around the internal input. This
         * is normally the $container, but typeahead.js moves the $input element.
         */
        findInputWrapper: function() {
            var elt = this.$input[0],
                container = this.$container[0];
            while (elt && elt.parentNode !== container)
                elt = elt.parentNode;

            return $(elt);
        }
    };

    /**
     * Register JQuery plugin
     */
    $.fn.tagsselect = function(arg1, arg2) {
        var results = [];

        this.each(function() {
            var tagsselect = $(this).data('tagsselect');
            // Initialize a new tags input
            if (!tagsselect) {
                tagsselect = new TagsSelect(this, arg1);
                $(this).data('tagsselect', tagsselect);
                results.push(tagsselect);

                if (this.tagName === 'SELECT') {
                    $('option', $(this)).attr('selected', 'selected');
                }

                // Init tags from $(this).val()
                $(this).val($(this).val());
            } else if (!arg1 && !arg2) {
                // tagsselect already exists
                // no function, trying to init
                results.push(tagsselect);
            } else if (tagsselect[arg1] !== undefined) {
                // Invoke function on existing tags input
                var retVal = tagsselect[arg1](arg2);
                if (retVal !== undefined)
                    results.push(retVal);
            }
        });

        if (typeof arg1 == 'string') {
            // Return the results from the invoked function calls
            return results.length > 1 ? results : results[0];
        } else {
            return results;
        }
    };

    $.fn.tagsselect.Constructor = TagsSelect;

    /**
     * Most options support both a string or number as well as a function as
     * option value. This function makes sure that the option with the given
     * key in the given options is wrapped in a function
     */
    function makeOptionItemFunction(options, key) {
        if (typeof options[key] !== 'function') {
            var propertyName = options[key];
            options[key] = function(item) {
                return item[propertyName];
            };
        }
    }

    function makeOptionFunction(options, key) {
            if (typeof options[key] !== 'function') {
                var value = options[key];
                options[key] = function() {
                    return value;
                };
            }
        }
        /**
         * HtmlEncodes the given value
         */
    var htmlEncodeContainer = $('<div />');

    function htmlEncode(value) {
        if (value) {
            return htmlEncodeContainer.text(value).html();
        } else {
            return '';
        }
    }

    /**
     * Returns the position of the caret in the given input field
     * http://flightschool.acylt.com/devnotes/caret-position-woes/
     */
    function doGetCaretPosition(oField) {
        var iCaretPos = 0;
        if (document.selection) {
            oField.focus();
            var oSel = document.selection.createRange();
            oSel.moveStart('character', -oField.value.length);
            iCaretPos = oSel.text.length;
        } else if (oField.selectionStart || oField.selectionStart == '0') {
            iCaretPos = oField.selectionStart;
        }
        return (iCaretPos);
    }

    /**
     * Returns boolean indicates whether user has pressed an expected key combination.
     * @param object keyPressEvent: JavaScript event object, refer
     *     http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
     * @param object lookupList: expected key combinations, as in:
     *     [13, {which: 188, shiftKey: true}]
     */
    function keyCombinationInList(keyPressEvent, lookupList) {
        var found = false;
        $.each(lookupList, function(index, keyCombination) {
            if (typeof(keyCombination) === 'number' && keyPressEvent.which === keyCombination) {
                found = true;
                return false;
            }

            if (keyPressEvent.which === keyCombination.which) {
                var alt = !keyCombination.hasOwnProperty('altKey') || keyPressEvent.altKey === keyCombination.altKey,
                    shift = !keyCombination.hasOwnProperty('shiftKey') || keyPressEvent.shiftKey === keyCombination.shiftKey,
                    ctrl = !keyCombination.hasOwnProperty('ctrlKey') || keyPressEvent.ctrlKey === keyCombination.ctrlKey;
                if (alt && shift && ctrl) {
                    found = true;
                    return false;
                }
            }
        });

        return found;
    }

    /**
     * Initialize tagsselect behaviour on inputs and selects which have
     * data-role=tagsselect
     */
    $(function() {
        $('input[rel=tagsselect], select[multiple][rel=tagsselect]').tagsselect();
    });

})(window.jQuery);
