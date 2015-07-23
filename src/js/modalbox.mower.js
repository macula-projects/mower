(function(root, factory) {

    "use strict";
    if (typeof define === "function" && define.amd) {
        // AMD. Register as an anonymous module.
        define(["jquery"], factory);
    } else if (typeof exports === "object") {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require("jquery"));
    } else {
        // Browser globals (root is window)
        root.ModalBox = factory(root.jQuery, window, document);
    }

}(this, function init($, window, document, undefined) {

    if (!window.bootbox) throw new Error('RemoteChosen requires bootbox.js');

    function _init(options) {
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
    }

    var NAME = 'mower.modalbox';

    var defaults = {
        type: 'custom',
        width: null, // number, css definition
        size: null, // 'md', 'sm', 'lg', 'fullscreen'
        height: 'auto',
        name: 'remoteModal',
        spinner: '<div class="fa fa-spinner fa-pulse loader"></div>',
        delay: 0
    };

    // our public object; augmented after our private API
    var exports = bootbox;

    exports.ajaxDialog = function(option) {
        var options = $.extend({}, defaults, option);

        _init(options);
        // capture the user's show value; we always set this to false before
        // spawning the dialog to give us a chance to attach some handlers to
        // it, but we need to make sure we respect a preference not to show it
        var shouldShow = (options.show === undefined) ? true : options.show;

        options.show = false;
        var that = this,
            $modal = exports.dialog(options),
            $dialog = $modal.find('.modal-dialog'),
            custom = options.custom,
            $body = $dialog.find('.modal-body').css('padding', ''),
            $header = $dialog.find('.modal-header'),
            $content = $dialog.find('.modal-content');

        $modal.toggleClass('modal-loading', true);
        if (options.size) {
            options.width = '';
            options.height = '';
        }

        var readyToShow = function(delay) {
            if (typeof delay === 'undefined') delay = 300;
            setTimeout(function() {
                $dialog = $modal.find('.modal-dialog');
                if (options.width && options.width != 'auto') {
                    $dialog.css('width', options.width);
                }
                if (options.height && options.height != 'auto') {
                    $dialog.css('height', options.height);
                    if (options.type === 'iframe') $body.css('height', $dialog.height() - $header.outerHeight());
                }
                $modal.removeClass('modal-loading');
            }, delay);
        };

        if (options.type === 'custom' && custom) {
            if ($.isFunction(custom)) {
                var customContent = custom({
                    modal: $modal,
                    options: options,
                    ready: readyToShow
                });
                if (typeof customContent === 'string') {
                    $body.html(customContent);
                    readyToShow();
                }
            } else if (custom instanceof $) {
                $body.html($('<div>').append(custom.clone()).html());
                readyToShow();
            } else {
                $body.html(custom);
                readyToShow();
            }
        } else if (options.url) {
            $modal.attr('ref', options.url);
            if (options.type === 'iframe') {
                $modal.addClass('modal-iframe');
                this.firstLoad = true;
                var iframeName = 'iframe-' + options.name;
                $header.detach();
                $body.detach();
                $content.empty().append($header).append($body);
                $body.css('padding', 0)
                    .html('<iframe id="' + iframeName + '" name="' + iframeName + '" src="' + options.url + '" frameborder="no" allowtransparency="true" scrolling="auto" style="width: 100%; height: 100%; left: 0px;"></iframe>');

                if (options.waittime > 0) {
                    that.waitTimeout = setTimeout(readyToShow, options.waittime);
                }

                var frame = document.getElementById(iframeName);
                frame.onload = frame.onreadystatechange = function() {
                    if (that.firstLoad) $modal.addClass('modal-loading');
                    if (this.readyState && this.readyState != 'complete') return;
                    that.firstLoad = false;

                    if (options.waittime > 0) {
                        clearTimeout(that.waitTimeout);
                    }

                    try {
                        $modal.attr('ref', frame.contentWindow.location.href);
                        var frame$ = window.frames[iframeName].$;
                        if (frame$ && options.height === 'auto') {
                            // todo: update iframe url to ref attribute
                            var $framebody = frame$('body').addClass('body-modal');
                            var ajustFrameSize = function() {
                                $modal.removeClass('fade');
                                var height = $framebody.outerHeight();
                                $body.css('height', height);
                                if (options.fade) $modal.addClass('fade');
                                readyToShow();
                            };

                            $modal.callEvent('loaded.mower.modal', {
                                modalType: 'iframe'
                            });

                            setTimeout(ajustFrameSize, 100);

                            $framebody.off('resize.' + NAME).on('resize.' + NAME, ajustFrameSize);
                        }

                        frame$.extend({
                            closeModal: window.closeModal
                        });
                    } catch (e) {
                        readyToShow();
                    }
                };
            } else {
                $.get(options.url, function(data) {
                    try {
                        var $data = $(data);
                        if ($data.hasClass('modal-dialog')) {
                            $dialog.replaceWith($data);
                        } else if ($data.hasClass('modal-content')) {
                            $dialog.find('.modal-content').replaceWith($data);
                        } else {
                            $body.wrapInner($data);
                        }
                    } catch (e) {
                        $modal.html(data);
                    }
                    $modal.callEvent('loaded.mower.modal', {
                        modalType: 'ajax'
                    });
                    readyToShow();
                });
            }
        }

        //modal show 
        if (shouldShow === true) {
            //add loading spinner
            $modal.prepend(options.spinner);
            $modal.modal("show");
        }
    };


    $(document).on('click.' + NAME + '.data-api', '[data-toggle="modalbox"]', function(e)
    {
        var $this = $(this);
        exports.ajaxDialog($.extend({}, $this.data()));

        if ($this.is('a'))
        {
            e.preventDefault();
        }
    });
    
    return exports;
}));
