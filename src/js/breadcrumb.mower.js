/** ========================================================================
 * Mower: breadcrumb.mower.js - v1.0.0
 *
 * breadcrumb with ajax load remote content capability.
 * 
 * Dependencies:
 *               fontawsome
 *               bootstrap tooltip
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function(json, $, window, document, undefined) {

    "use strict"

    var BreadCrumb = function(element, options) {
        this.element  = element;
        this.$element = $(element);
        this.options  = options;
    };

    BreadCrumb.DEFAULTS = {
        prefix        : "breadcrumb",
        param         : '{}',
        home          : '<i class="fa fa-home home"></i>',
        divider       : '<i class="fa fa-angle-right"></i>',
        favoritable   : true,
        favoriteTmp   : '<a href="#" data-favorite="breadcrumb" data-toggle="tooltip" ref="tooltip" data-original-title="\u6536\u85CF"><i class="fa fa-star fa-lg"></i></a>',
        keyboard      : false,
        favoriteClick : false,
        events: {
            push: "push.mu.breadcrumb",
            pushed: "pushed.mu.breadcrumb",
            pop: "pop.mu.breadcrumb",
            poped: "poped.mu.breadcrumb",
            reset: "reset.mu.breadcrumb",
            populateError: "error.populate.mu.breadcrumb",
            populateSuccess: "success.populate.mu.breadcrumb"
        }
    };

    BreadCrumb.prototype = {

        constructor: BreadCrumb,

        _init: function(element, options) {
            var $element = $(element);
            this.options = $.extend({}, BreadCrumb.DEFAULTS, $element.data(), typeof options === 'object' && options);
            this.options.param = json.decode(this.options.param || '{}');

        },
        _appendFavorite: function() {
            if (this.options.favoritable === true && this.$element.children('li.favorite').length <= 0) {
                var $li = $('<li class="favorite">' + this.options.favoriteTmp + '</li>');
                this.$element.append($li);
                $li.find('[ref="tooltip"]').tooltip({'container': 'body'});

                var that = this;
                $li.on("click.favorite.mu.breadcrumb", 'a', function(event) {
                    event.preventDefault();
                    var $activeLi = $(this).parent().siblings('.active');
                    that.options.favoriteClick && $.isFunction(that.options.favoriteClick) && that.options.favoriteClick($activeLi.data('href'));
                });
            }
        },
        _removeFavorite: function() {
            if (this.options.favoritable === true && this.$element.children('li').length === 1) {
                this.$element.children('li.favorite').remove();
            }
        },
        _getXPath: function(elements) {
            var path = new Array()

            for (var i = 0; i < elements.length; i++) {
                path.push(this._getLabel(elements[i]));
            }

            return path;
        },
        _valueof: function(argument, defaultVal) {
            return (typeof argument === 'undefined' ? defaultVal : argument);
        },
        _getLabel: function(element) {
            var $content = $(element).children('a').length ? $(element).children('a:first') : $(element);

            return $content[0].textContent || $content[0].innerText || '';
        },
        _getHref: function(element) {
            var $content = $(element).children('a').length ? $(element).children('a:first') : $(element);

            var href = $content.attr('data-href') || $content.attr('href');

            return (href && href.replace(/.*(?=#[^\s]+$)/, '')); // strip for ie7
        },
        _getTarget: function(element) {
            var $content = $(element).children('a').length ? $(element).children('a:first') : $(element);

            return $content.attr('data-target');
        },
        _pushHeader: function(label, url) {
            var path = this._getXPath(this.$element.children('li:not(.favorite)')); //exclude favorite

            if (path.length > 0) {
                var $last          = this.$element.children('li:not(.favorite)').filter(':last');
                var previousUrl    = this._getHref($last);
                var previousLabel  = this._getLabel($last);
                var previousTarget = this._getTarget($last);

                $last.remove();

                var preLi = [
                    '<li data-level="',
                    path.length,
                    '">',
                    path.length === 1 ? this.options.home : this.options.divider,
                    '<a data-toggle="breadcrumb" href="', (previousUrl || '#'),
                    '" data-target="',
                    previousTarget,
                    '">',
                    previousLabel,
                    '</a></li>'
                ].join('');

                this.$element.append(preLi);

                var that = this;
                this.$element.children('li').filter(':last')
                    .on('click.mu.breadcrumb', '[data-toggle="breadcrumb"]', function(event) {
                        event.preventDefault();
                        /* Act on the event */
                        var index = path.length - 1;
                        var popCount = that.$element.children('li:not(.favorite)').length - index;
                        that.pop(popCount);
                    });
            }

            path.push(label);

            var target = this.options.prefix + path.length;

            var li = [
                '<li data-level="',
                path.length,
                '" data-target="',
                target,
                '" data-href="', (url || '#'),
                '" class="active">',
                path.length === 1 ? this.options.home : this.options.divider,
                label,
                '</li>'
            ].join('');

            this.$element.append(li);
            return target;
        },
        _pushContent: function(panelId, _callback) {
            var $li = this.$element.find('[data-target="' + panelId + '"]');
            var url = this._getHref($li);

            if (url) {

                url = url + (url.indexOf('?') > -1 ? '&' : '?') + '_=' + (new Date()).valueOf();

                var that = this;

                var ajaxOpt = {
                    url: url,
                    data: this.options.param,
                    dataType: 'html',
                    success: function(data, status, xhr) {
                        var ct = xhr.getResponseHeader('content-type') || '';
                        if (ct.indexOf('json') > -1) {
                            that.$element.trigger('ajaxError', [xhr, ajaxOpt]); //global event
                            return;
                        }
                        var e;
                        if (data != null && data.error != null) {
                            e = $.Event(BreadCrumb.DEFAULTS.events.populateError, {
                                "data": data
                            });
                            that.$element.trigger(e);
                        } else {
                            //trigger populdate success event 
                            e = $.Event(BreadCrumb.DEFAULTS.events.populateSuccess, {
                                "data": data
                            });
                            that.$element.trigger(e);

                            var target = that.$element.data('target');
                            var $panel = $('<div data-panel="' + panelId + '"></div>');
                            $(target).append($panel.append($.parseHTML(data))); //not including script tag snippet

                            //hide siblings
                            _callback && _callback.apply(that); 

                            //reinit document ready function in the new fragment 
                            $(document).trigger('update', target);

                            //append & apply javascript 
                            var scripts = [];
                            $(data).filter('script').each(function() {
                                $(this).attr('data-ref-panel', panelId);
                                if (this.src) {
                                    scripts.push(this);
                                } else {
                                    scripts.unshift(this);
                                }
                            });
                            $.each(scripts, function(index, val) {
                                /* iterate through array or object */
                                $(target).append(val);
                            });

                            //listen on panel remove event
                            $panel.on('remove', function(event) {
                                var id = $(this).data('panel');
                                id && $('[data-ref-panel="'+id+'"]').remove();
                            });
                        }
                    },
                    error: function(data) {
                        var e = $.Event(BreadCrumb.DEFAULTS.events.populateError, {
                            "data": data
                        });
                        that.$element.trigger(e);
                    }
                };

                $.ajax(ajaxOpt);
            }
        },
        /**
         * [push add path in the breadcrumb]
         * @param  {[string]} path label
         * @param  {[string]} url ajax request page content url
         * @param  {[string]} relatedTarget
         */
        push: function(label, url, relatedTarget) {

            if (!label || !url) return;

            this._appendFavorite();

            //update header in breadcrumb
            var panelId = this._pushHeader(label, url);

            var callback = function() {
                //hide siblings
                $(this.$element.data('target'))
                    .find('[data-panel="' + panelId + '"]')
                    .prev().addClass('hide');
            };

            //update breadcrumb's target content
            this._pushContent(panelId, callback);

            var trigger = relatedTarget || this.element;
            $(this.element).trigger(BreadCrumb.DEFAULTS.events.pushed, {
                "path": this._getXPath(this.$element.children('li:not(.favorite)'))
            });
        },
        _popHeader: function(popCount) {
            var popArray = new Array();

            for (var i = 0; i < this._valueof(popCount, 1); i++) {
                var $li = this.$element.children('li:not(.favorite)').filter(':last');
                popArray.push($li.attr('data-target'));
                $li.remove();
            }

            var $last = this.$element.children('li:not(.favorite)').filter(':last');

            if ($last.length > 0) {
                var lastLabel = this._getLabel($last);
                var lastUrl = this._getHref($last);
                var lastTarget = this._getTarget($last);

                $last.remove();

                var level = (this.$element.children('li:not(.favorite)').length + 1);
                var divider = (level === 1 ? this.options.home : this.options.divider);

                var li = [
                    '<li data-level="',
                    level,
                    '" data-target="',
                    lastTarget,
                    '" data-href="',
                    lastUrl,
                    '" class="active">',
                    divider,
                    lastLabel,
                    '</li>'
                ].join('');

                this.$element.append(li);

                popArray.push(lastTarget);
            }
            return popArray;
        },
        _popContent: function(popArray) {
            var that = this;
            $.each(popArray, function(index, val) {
                /* iterate through array or object */
                $(that.$element.data("target")).children()
                    .filter('[data-panel="' + val + '"]').remove();
            });
        },
        pop: function(popCount, relatedTarget) {

            if (parseInt(popCount) <= 0) return;

            //update header in breadcrumb
            var popArray = this._popHeader(popCount);

            var showPanelId = popArray.pop();

            //update breadcrumb's target
            this._popContent(popArray);

            //show self
            $(this.$element.data('target'))
                .children('[data-panel="' + showPanelId + '"]')
                .removeClass('hide');


            this._removeFavorite();

            var trigger = relatedTarget || this.element;
            $(trigger).trigger(BreadCrumb.DEFAULTS.events.poped, {
                "path": this._getXPath(this.$element.children('li:not(.favorite)'))
            });
        },
        reset: function() {
            //remove header
            this.$element.children('li:not(.favorite)').remove();

            //remove content
            this.$element.data("target").children().remove();

            this.$element.trigger(BreadCrumb.DEFAULTS.events.reset);
        },
        _destory: function() {}
    }

    /* BREADCRUMB PLUGIN DEFINITION
     * ============================ */

    var old = $.fn.breadcrumb

    $.fn.breadcrumb = function(options) {
        // slice arguments to leave only arguments after function name.
        var args = Array.prototype.slice.call(arguments, 1);

        // Cache any plugin method call, to make it possible to return a value
        var results;

        this.each(function() {
            var element = this,
                $element = $(element),
                pluginKey = 'mu.breadcrumb',
                instance = $.data(element, pluginKey)


            // if there's no plugin instance for this element, create a new one, calling its "init" method, if it exists.
            if (!instance) {
                instance = $.data(element, pluginKey, new BreadCrumb(element, options));
                if (instance && typeof BreadCrumb.prototype['_init'] === 'function')
                    BreadCrumb.prototype['_init'].apply(instance, [element, options]);
            }

            // if we have an instance, and as long as the first argument (options) is a valid string value, tries to call a method from this instance.
            if (instance && typeof options === 'string' && options[0] !== '_' && options !== 'init') {

                var methodName = (options == 'destroy' ? '_destroy' : options);
                if (typeof BreadCrumb.prototype[methodName] === 'function')
                    results = BreadCrumb.prototype[methodName].apply(instance, args);

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy') {
                    $.data(element, pluginKey, null);
                }
            }
        });

        // If the earlier cached method gives a value back, return the resulting value, otherwise return this to preserve chainability.
        return results !== undefined ? results : this;
    }

    $.fn.breadcrumb.Constructor = BreadCrumb;


    /* BREADCRUMB NO CONFLICT
     * ================= */

    $.fn.breadcrumb.noConflict = function() {
        $.fn.breadcrumb = old
        return this
    }

    /* BREADCRUMB DATA-API
     * ============== */

    $(document)
        .on('click.mu.breadcrumb.data-api', '[data-toggle^="pushBreadcrumb"]', function(event) {
            var $this = $(this);
            var href = $this.attr('data-href') || $this.attr('href');
            href = (href && href.replace(/.*(?=#[^\s]+$)/, '')); // strip for ie7
            var label = $this.attr('data-label');
            var $target = ($this.attr('data-target') && $($this.attr('data-target'))) || $(document.body).find('.breadcrumb:first'); //breadcrumb id
            var option = $.extend({}, $target.data(), $this.data());

            if ($this.is('a')) event.preventDefault()

            var e = $.Event(BreadCrumb.DEFAULTS.events.push);

            $this.trigger(e);

            if (e.isDefaultPrevented()) return;

            $target
                .breadcrumb(option)
                .breadcrumb("push", label, href, this)
                .one('hide', function() {
                    $this.is(':visible') && $this.focus()
                })
        })
        .on('click.mu.breadcrumb.data-api', '[data-toggle^="popBreadcrumb"]', function(event) {
            var $this = $(this);
            var $target = ($this.attr('data-target') && $($this.attr('data-target'))) || $(document.body).find('.breadcrumb:first'); //breadcrumb id
            var option = $.extend({}, $target.data(), $this.data());

            if ($this.is('a')) event.preventDefault();

            var e = $.Event(BreadCrumb.DEFAULTS.events.pop);

            $this.trigger(e);

            if (e.isDefaultPrevented()) return;

            $target
                .breadcrumb(option)
                .breadcrumb("pop", 1, this)
                .one('hide', function() {
                    $this.is(':visible') && $this.focus()
                })
        });
}(JSON || {}, jQuery, window, document));
