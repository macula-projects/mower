
/// <reference path="../../typings/jquery/jquery.d.ts"/>
/** ========================================================================
 * Mower: areapicker.mower.js - v1.0.0
 *
 * used for choosing area.
 *
 * Dependencies:
 *              dropdown.js
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function(json, utils, $, window, document, undefined) {

    "use strict"; // jshint

    /* MAINMENU CLASS DEFINITION
     * ====================== */

    var DROPDOWNMENU_SHOW_EVENT = 'show.bs.dropdown';
    var TOGGLE = '[data-toggle="dropdown"]';

    var AreaPicker = function(element, options) {
        this.element = element;
        this.$element = $(element);
        this.options = options;
    };

    //you can put your plugin defaults in here.
    AreaPicker.DEFAULTS = {
        name: 'areapicker',
        width: '400px',
        url: false,
        street: false,
        dataType: 'json',
        method: 'GET',
        defaultarea: '<div class="dropdown-menu" rel="dropdown-menu" data-options="closeOnBodyClick:false">' +
            '<div class="tabbable-line">' +
            '<ul class="nav nav-tabs nav-justified">' +
            '<li class="active" ><a href="#tab_province"  data-toggle="tab">省</a>' +
            '</li>' +
            '<li><a href="#tab_city" data-toggle="tab">市</a>' +
            '</li>' +
            '<li><a href="#tab_section" data-toggle="tab">区/县</a>' +
            '</li>' +
            '</ul>' +
            '<div class="tab-content">' +
            '<div class="tab-pane active" id="tab_province">' +
            '</div>' +
            '<div class="tab-pane" id="tab_city">' +
            '</div>' +
            '<div class="tab-pane" id="tab_section">' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>',
        areawithstreet: '<div class="dropdown-menu" rel="dropdown-menu" data-options="closeOnBodyClick:false">' +
            '<div class="tabbable-line">' +
            '<ul class="nav nav-tabs nav-justified">' +
            '<li class="active"><a href="#tab_province"  data-toggle="tab">省</a>' +
            '</li>' +
            '<li><a href="#tab_city" data-toggle="tab">市</a>' +
            '</li>' +
            '<li><a href="#tab_section" data-toggle="tab">区/县</a>' +
            '</li>' +
            '<li><a href="#tab_street" data-toggle="tab">街道</a>' +
            '</li>' +
            '</ul>' +
            '<div class="tab-content">' +
            '<div class="tab-pane active" id="tab_province">' +
            '</div>' +
            '<div class="tab-pane" id="tab_city">' +
            '</div>' +
            '<div class="tab-pane" id="tab_section">' +
            '</div>' +
            '<div class="tab-pane" id="tab_street">' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>',
        events: {
            clicked: 'click.mu.areapicker'
        }
    };
    
    AreaPicker.prototype = {

        constructor: AreaPicker,

        _init: function(element, options) {
            var $element = $(element);
            this.options = $.extend({}, AreaPicker.DEFAULTS, $element.data(), typeof options === 'object' && options);

            this.component = $element.is('.area') ? $element.find(TOGGLE) : false;
            this.hasInput = this.component && $element.find('input').length;
            if (this.component && this.component.length === 0) {
                this.component = false;
            }
            
            
            this.$areacontainer = this.options.street ? $(this.options.areawithstreet) : $(this.options.defaultarea);
            this.$areacontainer.css('width', this.options.width);

            this.$areaheader = this.$areacontainer.find('.nav-tabs');
            this.$areacontent = this.$areacontainer.find('.tab-content');

            $element.find(TOGGLE).after(this.$areacontainer);

            var that = this;
            this.$element.one(DROPDOWNMENU_SHOW_EVENT, this.$areacontainer, function(e) {
                that.loadAndConstruct(that.options.url, that.$areacontent.find('.tab-pane:first'));
            });

            this.$areacontent.on('click', 'a', function(e) {
                e.preventDefault();
                $(this).parent().addClass('active').siblings().removeClass("active");

                var allTabContent = that.$areacontainer.find('.tab-pane'),
                    tabContent = $(this).closest('.tab-pane'),
                    index = allTabContent.index(tabContent),
                    areaCode = $(this).attr('data-areaCode'),
                    zipCode = $(this).attr('data-zipCode'),
                    areaName = $(this).text();

                var hiddenInput = $element.find('[name="' + that.options.name + '"]');
                if (hiddenInput.length) {
                    hiddenInput.val(areaCode);
                } else {
                    $element.prepend('<input type="hidden" name="' + that.options.name + '" value="' + areaCode + '"/>');
                }

                var selectedDesc = [],
                    selected = that.$areacontent.find('li.active');
                selected.each(function(i) {
                    if (i > index) return false;

                    selectedDesc.push($(this).children('a').text());
                });

                if (that.hasInput) { // single input
                    that.$element.find('input').val(selectedDesc.join(' /'));
                } else if (that.component) { // component button
                    $(that.component).find('.text').html(selectedDesc.join(' /'));
                }

                if ((allTabContent.length - 1) == index) {
                    $element.find(TOGGLE).dropdown('toggle');
                } else {
                    if (areaCode) {
                        var url = that.options.url + '?parentAreaCode=' + areaCode;
                        that.loadAndConstruct(url, tabContent.next());
                    }
                }

                //trigger populdate success event 
                var e = $.Event(AreaPicker.DEFAULTS.events.clicked, {
                    "areaCode": areaCode,
                    "zipCode": zipCode,
                    "areaName": areaName
                });

                that.$element.trigger(e);
            });
        },
        loadAndConstruct: function(url, tabContent) {
            var that = this;
            if (url) {
                $.ajax({
                    url: url,
                    dataType: this.options.dataType,
                    type: this.options.method,
                    success: function(datas) {
                        if (datas.success) {
                            var areaInfo = datas.returnObject,
                                html = [];

                            html.push('<ul class="area-list list-inline">');
                            for (var i = 0, n = areaInfo.length; i < n; i++) {

                                if (!areaInfo[i]) continue;

                                if (typeof areaInfo[i].zipCode != 'undefined') {
                                    html.push("<li><a data-zipCode='" + areaInfo[i].zipCode + "' data-areaCode='" + areaInfo[i].areaCode + "' href='javascript:void(0);'>" + areaInfo[i].areaDesc + "</a></li>");
                                } else {
                                    html.push("<li><a data-areaCode='" + areaInfo[i].areaCode + "' href='javascript:void(0);'>" + areaInfo[i].areaDesc + "</a></li>");
                                }
                            }
                            html.push('</ul>');
                            $(tabContent).empty().append(html.join(""));

                            that.$areaheader.find('a[href="#' + $(tabContent).attr('id') + '"]').tab('show');
                        } else {
                            ModalBox.alert(datas.exceptionMessage);
                        }
                    }
                });
            }
        },
        _destroy: function() {

        }
    };

    /* MAINMENU PLUGIN DEFINITION
     * ======================= */

    var old = $.fn.areapicker;

    $.fn.areapicker = function(options) {

        // slice arguments to leave only arguments after function name.
        var args = Array.prototype.slice.call(arguments, 1);

        // Cache any plugin method call, to make it possible to return a value
        var results;

        this.each(function() {
            var element = this,
                $element = $(element),
                pluginKey = 'mu.areapicker',
                instance = $.data(element, pluginKey)


            // if there's no plugin instance for this element, create a new one, calling its "init" method, if it exists.
            if (!instance) {
                instance = $.data(element, pluginKey, new AreaPicker(element, options));
                if (instance && typeof AreaPicker.prototype['_init'] === 'function')
                    AreaPicker.prototype['_init'].apply(instance, [element, options]);
            }

            // if we have an instance, and as long as the first argument (options) is a valid string value, tries to call a method from this instance.
            if (instance && typeof options === 'string' && options[0] !== '_' && options !== 'init') {

                var methodName = (options == 'destroy' ? '_destroy' : options);
                if (typeof AreaPicker.prototype[methodName] === 'function')
                    results = AreaPicker.prototype[methodName].apply(instance, args);

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy')
                    $.data(element, pluginKey, null);
            }
        });

        // If the earlier cached method gives a value back, return the resulting value, otherwise return this to preserve chainability.
        return results !== undefined ? results : this;
    };

    $.fn.areapicker.Constructor = AreaPicker;


    /* MAINMENU NO CONFLICT
     * ================= */

    $.fn.areapicker.noConflict = function() {
        $.fn.areapicker = old
        return this
    };


    /* MAINMENU DATA-API
     * ============== */
    $(document).on('ready update', function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[rel=areapicker]').each(function(index, el) {
            var $this = $(this);
            if (!$this.data('mu.areapicker')) {
                $(this).areapicker();
            }
        });
    });

})(JSON || {}, Utils || {}, jQuery, window, document);
