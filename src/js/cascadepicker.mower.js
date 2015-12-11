/** ========================================================================
 * Mower: cascadepicker.mower.js - v1.0.0
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

    var CascadePicker = function(element, options) {
        this.element = element;
        this.$element = $(element);
        this.options = options;
    };

    //you can put your plugin defaults in here.
    CascadePicker.DEFAULTS = {
        name: 'cascadepicker',
        width: '400px',
        url: false,
        street: false,
        dataType: 'json',
        method: 'GET',
        postName:'parentAreaCode',
        codeName:'areaCode',
        displayName:'areaDesc',
        cascadeItems:['省','市','区/县'],
        container: '<div class="dropdown-menu" rel="dropdown-menu" data-options="closeOnBodyClick:false">' +
            '<div class="tabbable-line">' +
            '<ul class="nav nav-tabs nav-justified">' +
            '</ul>' +
            '<div class="tab-content">' +
            '</div>' +
            '</div>' +
            '</div>',
        events: {
            clicked: 'click.mu.cascadepicker'
        }
    };
    
    CascadePicker.prototype = {

        constructor: CascadePicker,

        _init: function(element, options) {
            var $element = $(element);
            this.options = $.extend({}, CascadePicker.DEFAULTS, $element.data(), typeof options === 'object' && options);

            this.component = $element.is('.cascade') ? $element.find(TOGGLE) : false;
            this.hasInput = this.component && $element.find('input').length;
            if (this.component && this.component.length === 0) {
                this.component = false;
            }
            
            this.$cascadecontainer = $(this.options.container);
            this.$cascadecontainer.css('width', this.options.width);

            this.$cascadeheader = this.$cascadecontainer.find('.nav-tabs');
            this.$cascadecontent = this.$cascadecontainer.find('.tab-content');

            $element.find(TOGGLE).after(this.$cascadecontainer);

            var that = this;
            //add cascade items
            $.each(this.options.cascadeItems,function(index,value){
                that.$cascadeheader.append('<li><a href="#cascade_'+ index + '"  data-toggle="tab">'+ value +'</a></li>');
                that.$cascadecontent.append('<div class="tab-pane" id="cascade_'+ index +'"></div>');
            });

            this.$cascadeheader.find('li:first').addClass('active');
            this.$cascadecontent.find('div.tab-pane:first').addClass('active');

            
            this.$element.one(DROPDOWNMENU_SHOW_EVENT, this.$cascadecontainer, function(e) {
                that.loadAndConstruct(that.options.url, that.$cascadecontent.find('.tab-pane:first'));
            });

            this.$cascadecontent.on('click', 'a', function(e) {
                e.preventDefault();
                $(this).parent().addClass('active').siblings().removeClass("active");

                var allTabContent = that.$cascadecontainer.find('.tab-pane'),
                    tabContent = $(this).closest('.tab-pane'),
                    index = allTabContent.index(tabContent),
                    code = $(this).attr('data-'+ that.options.codeName);

                var hiddenInput = $element.find('[name="' + that.options.name + '"]');
                if (hiddenInput.length) {
                    hiddenInput.val(code);
                } else {
                    $element.prepend('<input type="hidden" name="' + that.options.name + '" value="' + code + '"/>');
                }

                var selectedDesc = [],
                    selected = that.$cascadecontent.find('li.active');
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
                    if (code) {
                        var url = that.options.url + '?' +that.options.postName +'=' + code;
                        that.loadAndConstruct(url, tabContent.next());
                    }
                }

                //trigger populdate success event 
                var e = $.Event(CascadePicker.DEFAULTS.events.clicked, [].filter.call(this.attributes, function(at) { return /^data-/.test(at.name); }));

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
                            var result = datas.returnObject,
                                html = [];

                            html.push('<ul class="cascade-list list-inline">');
                            for (var i = 0, n = result.length; i < n; i++) {
                                if (!result[i]) continue;

                                var li = "<li ><a href='javascript:void(0);'>" + result[i][that.options.displayName] + "</a></li>";
                                 html.push(li);
                            }
                            html.push('</ul>');
                            $(tabContent).empty().append(html.join(""));

                            $.each($(tabContent).find('li'), function(index) {
                                    var $li = $(this),
                                        item = result[index];

                                    $.each(item, function(k, v) {
                                        $li.find('a').attr('data-'+ k,v);
                                    });
                            });

                            that.$cascadeheader.find('a[href="#' + $(tabContent).attr('id') + '"]').tab('show');
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

    var old = $.fn.cascadepicker;

    $.fn.cascadepicker = function(options) {

        // slice arguments to leave only arguments after function name.
        var args = Array.prototype.slice.call(arguments, 1);

        // Cache any plugin method call, to make it possible to return a value
        var results;

        this.each(function() {
            var element = this,
                $element = $(element),
                pluginKey = 'mu.cascadepicker',
                instance = $.data(element, pluginKey)


            // if there's no plugin instance for this element, create a new one, calling its "init" method, if it exists.
            if (!instance) {
                instance = $.data(element, pluginKey, new CascadePicker(element, options));
                if (instance && typeof CascadePicker.prototype['_init'] === 'function')
                    CascadePicker.prototype['_init'].apply(instance, [element, options]);
            }

            // if we have an instance, and as long as the first argument (options) is a valid string value, tries to call a method from this instance.
            if (instance && typeof options === 'string' && options[0] !== '_' && options !== 'init') {

                var methodName = (options == 'destroy' ? '_destroy' : options);
                if (typeof CascadePicker.prototype[methodName] === 'function')
                    results = CascadePicker.prototype[methodName].apply(instance, args);

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy')
                    $.data(element, pluginKey, null);
            }
        });

        // If the earlier cached method gives a value back, return the resulting value, otherwise return this to preserve chainability.
        return results !== undefined ? results : this;
    };

    $.fn.cascadepicker.Constructor = CascadePicker;


    /* MAINMENU NO CONFLICT
     * ================= */

    $.fn.cascadepicker.noConflict = function() {
        $.fn.cascadepicker = old
        return this
    };


    /* MAINMENU DATA-API
     * ============== */
    $(document).on('ready update', function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[rel=cascadepicker]').each(function(index, el) {
            var $this = $(this);
            if (!$this.data('mu.cascadepicker')) {
                $(this).cascadepicker();
            }
        });
    });

})(JSON || {}, Utils || {}, jQuery, window, document);
