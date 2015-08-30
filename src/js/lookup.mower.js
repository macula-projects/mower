/** ========================================================================
 * Mower: lookup.mower.js - v1.0.0
 *
 *  lookup custom container.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function($, window, document, undefined) {
    'use strict';

    if (!$.fn.slimScroll) throw new Error('Lookup requires slimScroll.js');

    // DROPDOWN CLASS DEFINITION
    // =========================

    var backdrop = '.dropdown-backdrop';
    var toggledropdown = '[data-toggle="dropdownlookup"]';
    var togglemodal = '[data-toggle="popmodal"]';
    var PLUGIN_NAME = "mu.lookup";

    var Lookup = function(element, options) {
        this.element = element;
        this.$element = $(element);
        this.options = options;

        this.isLoaded = false;
    };

    Lookup.DEFAULTS = {
        type: 'static',
        width: null, // number, css definition
        height: 'auto',
        multiple: false,
        separator: ',',
        codeField:'code',
        labelField:'label',
        template: '<div class="dropdown-menu"></div>'
    };

    Lookup.prototype._init = function(element, options) {
        var $element = $(element);
        this.$input = $element.find('.form-control:first');
        this.options = $.extend({}, Lookup.DEFAULTS, $element.data(), typeof options === 'object' && options);

        if (this.options.type === 'static' || this.options.type.indexOf('modal') >= 0) return; //html

        this.$lkContainer = $(this.options.template);
        this.$lkContainer.append('<div></div');
        this.$lkContent = this.$lkContainer.find('div:first');

        $element.prepend(this.$lkContainer);

        this._parseOptions();
        this._constructContent();
    };

    Lookup.prototype._parseOptions = function() {
        var options = this.options;

        if (options.url) {
            if (!options.type || (options.type != 'ajax' && options.type != 'iframe')) {
                options.type = 'ajax';
            }
        }
        if (options.remote) {
            options.type = 'ajax';
            if (typeof options.remote === 'string') options.url = options.remote;
        } else if (options.iframe) {
            options.type = 'iframe';
            if (typeof options.iframe === 'string') options.url = options.iframe;
        } else if (options.custom) {
            options.type = 'custom';
            if (typeof options.custom === 'string') {
                var $doms;
                try {
                    $doms = $(options.custom);
                } catch (e) {}

                if ($doms && $doms.length) {
                    options.custom = $doms;
                } else if ($.isFunction(window[options.custom])) {
                    options.custom = window[options.custom];
                }
            }
        }

        this.options.name = this.options.name || this.options.codeField;
    };

    Lookup.prototype._constructContent = function() {
        var that = this,
            options = this.options;

        var readyToShow = function(delay) {
            if (typeof delay === 'undefined') delay = 300;
            setTimeout(function() {
                if (options.type !== 'iframe') {
                    that.$lkContent.slimScroll({
                        height: options.height || 'auto',
                        width: options.width || 'auto'
                    });
                } else {
                    if (options.width && options.width != 'auto') {
                        that.$lkContent.css('width', options.width);
                    }
                    if (options.height && options.height != 'auto') {
                        that.$lkContent.css('height', options.height);
                    }
                }
                this.isLoaded = true;
            }, delay);
        };

        var custom = options.custom;
        if (options.type === 'custom' && custom) {
            if ($.isFunction(custom)) {
                var customContent = custom({
                    container: that.$lkContent,
                    options: options,
                    ready: readyToShow
                });
                if (typeof customContent === 'string') {
                    this.$lkContent.html(customContent);
                    readyToShow();
                }
            } else if (custom instanceof $) {
                this.$lkContent.html($('<div>').append(custom.clone()).html());
                readyToShow();
            } else {
                this.$lkContent.html(custom);
                readyToShow();
            }
        } else if (options.url) {
            this.$lkContent.attr('ref', options.url);
            if (options.type === 'iframe') {
                var iframeName = 'iframe-' + (options.name || '');
                this.$lkContent.css('padding', 0)
                    .html('<iframe id="' + iframeName + '" name="' + iframeName + '" src="' + options.url + '" frameborder="no" allowtransparency="true" scrolling="auto" style="width: 100%; height: 100%; left: 0px;"></iframe>');

                if (options.waittime > 0) {
                    that.waitTimeout = setTimeout(readyToShow, options.waittime);
                }

                var frame = document.getElementById(iframeName);
                frame.onload = frame.onreadystatechange = function() {
                    if (this.readyState && this.readyState != 'complete') return;
                    if (options.waittime > 0) {
                        clearTimeout(that.waitTimeout);
                    }

                    try {
                        that.$lkContent.attr('ref', frame.contentWindow.location.href);
                        var frame$ = window.frames[iframeName].$;
                        if (frame$ && options.height === 'auto') {
                            // todo: update iframe url to ref attribute
                            var $framebody = frame$('body');
                            var ajustFrameSize = function() {
                                var height = $framebody.outerHeight();
                                that.$lkContent.css('height', height);
                                readyToShow();
                            };

                            setTimeout(ajustFrameSize, 100);
                            $framebody.off('resize.mower.lookup').on('resize.mower.lookup', ajustFrameSize);
                        } else {
                            readyToShow();
                        }
                    } catch (e) {
                        readyToShow();
                    }
                };
            } else {
                that.$lkContent.load(options.url, function() {
                    readyToShow();
                });
            }
        }
    };

    Lookup.prototype._isExisted = function(val) {
        var existed = false;
        $.each(this.$element.find('._value'), function() {
            if ($(this).value == val) {
                existed = true;
                return false;
            }
        });

        return existed;
    };

    Lookup.prototype.getValue = function() {
        var $inputs = this.$element.find('._value');
        if (this.options.multiple === true) {
            var selectedValues = [];
            $.each($inputs, function(index, val) {
                selectedValues.push($(this).val());
            });
            return selectedValues.length ? selectedValues : "";
        } else {
            return $inputs.val();
        }
    };

    //value contains item = {label:"xxxx",code:"xxxxx"} or item = {value}
    Lookup.prototype.setValue = function(value) {
        var labels = [];

        if ($.isArray(value)) {
            for (var i = 0; i < value.length; i++) {
                var item = value[i];
                if (typeof item === 'object') {
                    var code = item[this.options.codeField];
                    if (code  && !this._isExisted(code)) {
                        this.$input.after('<input class="_value" type="hidden" name="' + this.options.name + '" value="' + code + '"/>');
                    }

                    item[this.options.labelField] && labels.push(item[this.options.labelField]);
                } else {
                    if (!this._isExisted(item)) {
                        this.$input.after('<input class="_value" type="hidden" name="' + this.options.name + '" value="' + item + '"/>');
                    }

                    labels.push(item);
                }
            }
        } else if (value && !this._isExisted(value)) {
            this.$input.after(' <input class="_value" type="hidden" name="' + this.options.name + '" value="' + value + '"/>');
            labels.push(value);
        }

        this.$input.val(labels.join(this.options.separator));
    };

    Lookup.prototype.clear = function() {
        this.$element.find('._value').remove();
        this.$input.val('');
    };

    Lookup.prototype.toggleDropdown = function(e) {
        var $this = $(this);

        if ($this.is('.disabled, :disabled')) return;

        var $parent = _getParent($this);
        var isActive = $parent.hasClass('open');

        _clearMenus();

        if (!isActive) {
            if ('ontouchstart' in document.documentElement && !$parent.closest('.navbar-nav').length) {
                // if mobile we use a backdrop because click events don't delegate
                $('<div class="dropdown-backdrop"/>').insertAfter($(this)).on('click', _clearMenus);
            }

            var relatedTarget = {
                relatedTarget: this
            };
            $parent.trigger(e = $.Event('show.bs.dropdown', relatedTarget));

            if (e.isDefaultPrevented()) return;

            $this.trigger('focus');

            $parent
                .toggleClass('open')
                .trigger('shown.bs.dropdown', relatedTarget);
        }

        return false;
    };

    Lookup.prototype.popModal = function(e) {
        var $this = $(this);

        if ($this.is('.disabled, :disabled')) return;

        var $parent = _getParent($this),
            lookup = $parent.data(PLUGIN_NAME),
            options;

        if (lookup) {
            options = lookup.options;
        } else {
            options = $parent.data();
        }

        if (options.type && options.type.indexOf('modal') >= 0) {
            var index = options.type.indexOf('modal-');
            options.type = options.type.substring(index + 'modal-'.length);
        }

        if (typeof window.ModalBox !== 'undefined') ModalBox.ajaxDialog(options);

        return false;
    };

    function _clearMenus(e) {
        if (e && e.which === 3) return;
        $(backdrop).remove();
        $(toggledropdown).each(function() {
            var $parent = _getParent($(this))
            if (e && $.contains($parent[0], e.target)) {
                e.preventDefault();
            } else {
                var relatedTarget = {
                    relatedTarget: this
                };
                if (!$parent.hasClass('open')) return;
                $parent.trigger(e = $.Event('hide.bs.dropdown', relatedTarget));
                if (e.isDefaultPrevented()) return;
                $parent.removeClass('open').trigger('hidden.bs.dropdown', relatedTarget);
            }
        });
    }

    function _getParent($this) {
        var selector = $this.attr('data-target');

        if (!selector) {
            selector = $this.attr('href');
            selector = selector && /#[A-Za-z]/.test(selector) && selector.replace(/.*(?=#[^\s]*$)/, ''); // strip for ie7
        }

        var $parent = selector && $(selector);

        return $parent && $parent.length ? $parent : $this.parent();
    }


    // DROPDOWN PLUGIN DEFINITION
    // ==========================

    function Plugin(options) {
        // slice arguments to leave only arguments after function name.
        var args = Array.prototype.slice.call(arguments, 1);

        // Cache any plugin method call, to make it possible to return a value
        var results;

        this.each(function() {
            var element = this,
                $element = $(element),
                pluginKey = PLUGIN_NAME,
                instance = $.data(element, pluginKey);


            // if there's no plugin instance for this element, create a new one, calling its "init" method, if it exists.
            if (!instance) {
                instance = $.data(element, pluginKey, new Lookup(element, options));
                if (instance && typeof Lookup.prototype['_init'] === 'function')
                    Lookup.prototype['_init'].apply(instance, [element, options]);
            }

            // if we have an instance, and as long as the first argument (options) is a valid string value, tries to call a method from this instance.
            if (instance && typeof options === 'string' && options[0] !== '_' && options !== 'init') {

                var methodName = (options == 'destroy' ? '_destroy' : options);
                if (typeof Lookup.prototype[methodName] === 'function')
                    results = Lookup.prototype[methodName].apply(instance, args);

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy') {
                    $.data(element, pluginKey, null);
                }
            }
        });

        // If the earlier cached method gives a value back, return the resulting value, otherwise return this to preserve chainability.
        return results !== undefined ? results : this;
    }

    var old = $.fn.lookup;

    $.fn.lookup = Plugin;
    $.fn.lookup.Constructor = Lookup;


    // DROPDOWN NO CONFLICT
    // ====================

    $.fn.lookup.noConflict = function() {
        $.fn.lookup = old;
        return this;
    };


    // APPLY TO STANDARD DROPDOWN ELEMENTS
    // ===================================

    $(document)
        .on('click.bs.dropdown.data-api', _clearMenus)
        .on('click.bs.dropdown.data-api', toggledropdown, Lookup.prototype.toggleDropdown)
        .on('click.bs.dropdown.data-api', togglemodal, Lookup.prototype.popModal)
        .on('ready update', function(event, updatedFragment) {
            var $root = $(updatedFragment || 'html');

            $root.find('[rel="lookup"]').each(function(index, el) {
                var $this = $(this);
                if ($this.data(PLUGIN_NAME))
                    return;
                // component click requires us to explicitly show it
                $this.lookup();
            });
        });

})(jQuery, window, document);
