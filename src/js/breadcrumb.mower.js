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
(function(json, utils, $, window, document, undefined) {

    "use strict"

    var BreadCrumb = function(element, options) {
        this.element = element;
        this.$element = $(element);
        this.options = options;

        //current location in the breadcrumb workspace
        this.current = 0;

        //sequence of panel in the breadcrumb
        this.panelSeq = 1;
    };

    BreadCrumb.DEFAULTS = {
        prefix: "breadcrumb",
        param: '{}',
        home: '<i class="fa fa-home home"></i>',
        divider: '<i class="fa fa-angle-right"></i>',
        favoritable: true,
        favoriteTmp: '<a href="#" data-favorite="breadcrumb" data-toggle="tooltip" rel="tooltip" data-original-title="\u6536\u85CF"><i class="fa fa-star fa-lg"></i></a>',
        keyboard: false,
        favoriteClick: false,
        events: {
            command: "command.mu.breadcrumb",
            commanded: "commanded.mu.breadcrumb",
            push: "push.mu.breadcrumb",
            pushed: "pushed.mu.breadcrumb",
            pop: "pop.mu.breadcrumb",
            poped: "poped.mu.breadcrumb",
            reset: "reset.mu.breadcrumb",
            populateError: "error.populate.mu.breadcrumb",
            populateSuccess: "success.populate.mu.breadcrumb",
            clickFavorite: "click.favorite.mu.breadcrumb"
        }
    };

    BreadCrumb.prototype = {

        constructor: BreadCrumb,

        _init: function(element, options) {
            var $element = $(element);
            this.options = $.extend({}, BreadCrumb.DEFAULTS, $element.data(), typeof options === 'object' && options);
            this.options.param = json.decode(this.options.param || '{}');

            this._appendFavorite();
            var that = this;
            $element.on("click.favorite.mu.breadcrumb", 'li.favorite > a', function(event) {
                event.preventDefault();

                var href = window.location.href;
                that.options.favoriteClick && $.isFunction(that.options.favoriteClick) && that.options.favoriteClick(href);
            });
        },
        _appendFavorite: function() {
            if (this.options.favoritable === true &&
                this.$element.children('li:not(.favorite)').length > 0 &&
                this.$element.children('li.favorite').length <= 0) {
                var $li = $('<li class="favorite ">' + this.options.favoriteTmp + '</li>');
                this.$element.prepend($li);
                $li.find('[rel="tooltip"]').tooltip({
                    'container': 'body'
                });
            }
        },
        _toggleFavorite: function() {
            if (this.current === 0) {
                this.$element.children('li.favorite').removeClass('hidden');
            } else {
                this.$element.children('li.favorite').removeClass('hidden').addClass('hidden');
            }
        },
        _getXPath: function(elements) {
            var path = new Array();

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
        _getTarget: function(element) {
            var $content = $(element).children('a').length ? $(element).children('a:first') : $(element);

            return $content.attr('data-target');
        },
        _pushHeader: function(label, url) {
            var path = this._getXPath(this.$element.children('li:not(.favorite)')); //exclude favorite

            if (path.length > 0) {
                var $last = this.$element.children('li:not(.favorite)').filter(':last');
                var previousLabel = this._getLabel($last);
                var previousTarget = this._getTarget($last);

                $last.remove();

                var preLi = [
                    '<li>',
                    path.length === 1 ? this.options.home : this.options.divider,
                    '<a data-toggle="breadcrumb" data-target="',
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

            var target = this.options.prefix + this.panelSeq++;

            var li = [
                '<li ',
                '" data-target="',
                target,
                '" class="active">',
                path.length === 1 ? this.options.home : this.options.divider,
                label,
                '</li>'
            ].join('');

            this.$element.append(li);
            return target;
        },
        _pushContent: function(panelId, url, _callback) {
            var $li = this.$element.find('[data-target="' + panelId + '"]'); //header

            if (url) {

                url = url + (url.indexOf('?') > -1 ? '&' : '?') + '_=' + (new Date()).valueOf();

                var ajaxOpt = {
                    data: this.options.param
                };

                var target = this.$element.data('target');
                var $panel = $('<div data-panel="' + panelId + '"></div>');
                $(target).append($panel);

                //hide siblings
                $panel.prev().addClass('hidden');

                //call jquery.fn extend appendcontent defined in utils.mower.js
                url = utils.getAbsoluteUrl(url, this.$element.getContextPath());
                $panel.appendAajxContents(url, ajaxOpt, _callback, true);
            }
        },
        /**
         * [push add path in the breadcrumb]
         * @param  {[string]} path label
         * @param  {[string]} url ajax request page content url
         * @param  {[string]} relatedTarget trigger original
         */
        push: function(label, url, relatedTarget) {
            if (!label || !url) return;

            this._appendFavorite();

            //update header in breadcrumb
            var panelId = this._pushHeader(label, url);

            var that = this;
            var callback = function(data) {
                //move forward
                that.current++;
                that._toggleFavorite();

                //trigger populdate success event 
                var e = $.Event(BreadCrumb.DEFAULTS.events.populateSuccess, {
                    "data": data
                });

                that.$element.trigger(e);
            };

            //update breadcrumb's target content
            this._pushContent(panelId, url, callback);

            var trigger = relatedTarget || this.element;
            $(trigger).trigger(BreadCrumb.DEFAULTS.events.pushed, {
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
                var lastTarget = this._getTarget($last);

                $last.remove();

                var level = (this.$element.children('li:not(.favorite)').length + 1);
                var divider = (level === 1 ? this.options.home : this.options.divider);

                var li = [
                    '<li ',
                    '" data-target="',
                    lastTarget,
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
            var showPanelId = popArray.pop();

            var that = this;
            $.each(popArray, function(index, val) {
                /* iterate through array or object */
                $(that.$element.data("target")).children()
                    .filter('[data-panel="' + val + '"]').remove();
            });

            //show self
            $(this.$element.data('target'))
                .children('[data-panel="' + showPanelId + '"]')
                .removeClass('hidden');
        },
        pop: function(popCount, relatedTarget) {
            if (parseInt(popCount) <= 0) return;

            //update header in breadcrumb
            var popArray = this._popHeader(popCount);

            //update breadcrumb's target
            this._popContent(popArray);

            //move backward
            this.current -= popArray.length;
            this._toggleFavorite();

            var trigger = relatedTarget || this.element;
            $(trigger).trigger(BreadCrumb.DEFAULTS.events.poped, {
                "path": this._getXPath(this.$element.children('li:not(.favorite)'))
            });
        },
        command: function(relatedTarget) {
            var $this = $(relatedTarget);
            var e = $.Event(BreadCrumb.DEFAULTS.events.command);
            $this.trigger(e);

            if (e.isDefaultPrevented()) return;

            var href = $this.attr('data-href') || $this.attr('href');
            href = (href && href.replace(/.*(?=#[^\s]+$)/, '')); // strip for ie7

            $.ajax({
                url: utils.getAbsoluteUrl(href, $this.getContextPath()),
                type: 'post',
                dataType: 'json',
                success: function(data) {
                    var e = $.Event(BreadCrumb.DEFAULTS.events.commanded);
                    $this.trigger(e, {
                        "data": data
                    });
                }
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
    };

    $.fn.breadcrumb.Constructor = BreadCrumb;


    /* BREADCRUMB NO CONFLICT
     * ================= */

    $.fn.breadcrumb.noConflict = function() {
        $.fn.breadcrumb = old;
        return this;
    };

    /* BREADCRUMB DATA-API
     * ============== */

    $(document)
        .on('click.mu.breadcrumb.data-api', '[data-toggle^="pushBreadcrumb"]', function(event) {
            var $this = $(this);
            if ($this.is('a')) event.preventDefault();

            var e = $.Event(BreadCrumb.DEFAULTS.events.push);
            $this.trigger(e);

            if (e.isDefaultPrevented()) return;

            var href = $this.attr('data-href') || $this.attr('href');
            href = (href && href.replace(/.*(?=#[^\s]+$)/, '')); // strip for ie7
            var label = $this.attr('data-label');
            var $target = ($this.attr('data-target') && $($this.attr('data-target'))) || $(document.body).find('.breadcrumb:first'); //breadcrumb id
            var option = $.extend({}, $target.data(), $this.data());
            $target
                .breadcrumb(option)
                .breadcrumb("push", label, href, this)
                .one('hide', function() {
                    $this.is(':visible') && $this.focus();
                });
        })
        .on('click.mu.breadcrumb.data-api', '[data-toggle^="popBreadcrumb"]', function(event) {
            var $this = $(this);
            if ($this.is('a')) event.preventDefault();

            var e = $.Event(BreadCrumb.DEFAULTS.events.pop);
            $this.trigger(e);
            if (e.isDefaultPrevented()) return;

            var $target = ($this.attr('data-target') && $($this.attr('data-target'))) || $(document.body).find('.breadcrumb:first'); //breadcrumb id
            var option = $.extend({}, $target.data(), $this.data());
            $target
                .breadcrumb(option)
                .breadcrumb("pop", 1, this)
                .one('hide', function() {
                    $this.is(':visible') && $this.focus();
                });
        })
        .on('click.mu.breadcrumb.data-api', '[data-toggle^="commandBreadcrumb"]', function(event) {
            var $this = $(this);
            if ($this.is('a')) event.preventDefault();

            BreadCrumb.command(this);
        });
})(JSON || {}, Utils || {}, jQuery, window, document);