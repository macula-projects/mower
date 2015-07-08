/* ========================================================================
 * ZUI: modal.trigger.js v1.2.0
 * http://zui.sexy/docs/javascript.html#modals
 * Licensed under MIT
 * ======================================================================== 
 * Updates in Mower：
 * 1. changed event namespace to *.mower.modal
 * 2. changed plugin name ModalTrigger to RemoteModal
 * 3. remove modal position
 * ======================================================================== */

;
(function(uuid, $, window, document, undefined) {
     'use strict';

     if (!$.fn.modal) throw new Error('remote modal requires bootstrap modal.');

     var NAME = 'mower.remotemodal';

     // REMOTE MODAL CLASS DEFINITION
     // ======================
     var RemoteModal = function(options)
     {
        options = $.extend(
        {}, RemoteModal.DEFAULTS, $.RemoteModalDefaults, options);
        this.options = options;
        this.isShown = false;
        this.id = uuid(this.options.prefix);

         // todo: handle when: options.show = true
     };

     RemoteModal.DEFAULTS = {
         type: 'custom',
         width: null, // number, css definition
         size: null, // 'md', 'sm', 'lg', 'fullscreen'
         height: 'auto',
         icon: null,
         name: 'remoteModal',
         fade: true,
         showHeader: true,
         delay: 0,
         backdrop: true,
         keyboard: true
     };

     RemoteModal.prototype.init = function(options)
     {
         var that = this;
         if (options.url)
         {
             if (!options.type || (options.type != 'ajax' && options.type != 'iframe'))
             {
                 options.type = 'ajax';
             }
         }
         if (options.remote)
         {
             options.type = 'ajax';
             if (typeof options.remote === 'string') options.url = options.remote;
         }
         else if (options.iframe)
         {
             options.type = 'iframe';
             if (typeof options.iframe === 'string') options.url = options.iframe;
         }
         else if (options.custom)
         {
             options.type = 'custom';
             if (typeof options.custom === 'string')
             {
                 var $doms;
                 try
                 {
                     $doms = $(options.custom);
                 }
                 catch (e)
                 {}

                 if ($doms && $doms.length)
                 {
                     options.custom = $doms;
                 }
                 else if ($.isFunction(window[options.custom]))
                 {
                     options.custom = window[options.custom];
                 }
             }
         }

         var $modal = $('#' + options.name);
         if ($modal.length)
         {
             if (!that.isShown) $modal.off('.mower.modal');
             $modal.remove();
         }
         $modal = $('<div id="' + options.name + '" class="modal modal-remote"><div class="fa fa-spinner fa-pulse loader"></div><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><button class="close" data-dismiss="modal">×</button><h4 class="modal-title"><i class="modal-icon"></i> <span class="modal-title-name"></span></h4></div><div class="modal-body"></div></div></div></div>').appendTo('body').data(NAME, that);

         var bindEvent = function(optonName, eventName)
         {
             var handleFunc = options[optonName];
             if ($.isFunction(handleFunc)) $modal.on(eventName + '.mower.modal', handleFunc);
         };
         bindEvent('onShow', 'show');
         bindEvent('shown', 'shown');
         bindEvent('onHide', 'hide');
         bindEvent('hidden', 'hidden');
         bindEvent('loaded', 'loaded');

         $modal.on('shown.mower.modal', function()
         {
             that.isShown = true;
         }).on('hidden.mower.modal', function()
         {
             that.isShown = false;
         });

         this.$modal = $modal;
         this.$dialog = $modal.find('.modal-dialog');
     };

     RemoteModal.prototype.show = function(option)
     {
         var options = $.extend(
         {}, this.options, option);
         this.init(options);
         var that = this,
             $modal = this.$modal,
             $dialog = this.$dialog,
             custom = options.custom;
         var $body = $dialog.find('.modal-body').css('padding', ''),
             $header = $dialog.find('.modal-header'),
             $content = $dialog.find('.modal-content');

         $modal.toggleClass('fade', options.fade)
             .addClass(options.cssClass)
             .toggleClass('modal-md', options.size === 'md')
             .toggleClass('modal-sm', options.size === 'sm')
             .toggleClass('modal-lg', options.size === 'lg')
             .toggleClass('modal-loading', !this.isShown);
         $header.toggle(options.showHeader);
         $header.find('.modal-icon').attr('class', 'modal-icon ' + options.icon);
         $header.find('.modal-title-name').html(options.title || '');
         if (options.size)
         {
             options.width = '';
             options.height = '';
         }

         var readyToShow = function(delay)
         {
             if (typeof delay === 'undefined') delay = 300;
             setTimeout(function()
             {
                 $dialog = $modal.find('.modal-dialog');
                 if (options.width && options.width != 'auto')
                 {
                     $dialog.css('width', options.width);
                 }
                 if (options.height && options.height != 'auto')
                 {
                     $dialog.css('height', options.height);
                     if(options.type === 'iframe') $body.css('height', $dialog.height() - $header.outerHeight());
                 }
                 $modal.removeClass('modal-loading');
             }, delay);
         };

         if (options.type === 'custom' && custom)
         {
             if ($.isFunction(custom))
             {
                 var customContent = custom(
                 {
                     modal: $modal,
                     options: options,
                     modalTrigger: that,
                     ready: readyToShow
                 });
                 if (typeof customContent === 'string')
                 {
                     $body.html(customContent);
                     readyToShow();
                 }
             }
             else if (custom instanceof $)
             {
                 $body.html($('<div>').append(custom.clone()).html());
                 readyToShow();
             }
             else
             {
                 $body.html(custom);
                 readyToShow();
             }
         }
         else if (options.url)
         {
             $modal.attr('ref', options.url);
             if (options.type === 'iframe')
             {
                 $modal.addClass('modal-iframe');
                 this.firstLoad = true;
                 var iframeName = 'iframe-' + options.name;
                 $header.detach();
                 $body.detach();
                 $content.empty().append($header).append($body);
                 $body.css('padding', 0)
                     .html('<iframe id="' + iframeName + '" name="' + iframeName + '" src="' + options.url + '" frameborder="no" allowtransparency="true" scrolling="auto" style="width: 100%; height: 100%; left: 0px;"></iframe>');

                 if (options.waittime > 0)
                 {
                     that.waitTimeout = setTimeout(readyToShow, options.waittime);
                 }

                 var frame = document.getElementById(iframeName);
                 frame.onload = frame.onreadystatechange = function()
                 {
                     if (that.firstLoad) $modal.addClass('modal-loading');
                     if (this.readyState && this.readyState != 'complete') return;
                     that.firstLoad = false;

                     if (options.waittime > 0)
                     {
                         clearTimeout(that.waitTimeout);
                     }

                     try
                     {
                         $modal.attr('ref', frame.contentWindow.location.href);
                         var frame$ = window.frames[iframeName].$;
                         if (frame$ && options.height === 'auto')
                         {
                             // todo: update iframe url to ref attribute
                             var $framebody = frame$('body').addClass('body-modal');
                             var ajustFrameSize = function()
                             {
                                 $modal.removeClass('fade');
                                 var height = $framebody.outerHeight();
                                 $body.css('height', height);
                                 if (options.fade) $modal.addClass('fade');
                                 readyToShow();
                             };

                             $modal.callEvent('loaded.mower.modal',
                             {
                                 modalType: 'iframe'
                             });

                             setTimeout(ajustFrameSize, 100);

                             $framebody.off('resize.' + NAME).on('resize.' + NAME, ajustFrameSize);
                         }

                         frame$.extend(
                         {
                             closeModal: window.closeModal
                         });
                     }
                     catch (e)
                     {
                         readyToShow();
                     }
                 };
             }
             else
             {
                 $.get(options.url, function(data)
                 {
                     try
                     {
                         var $data = $(data);
                         if ($data.hasClass('modal-dialog'))
                         {
                             $dialog.replaceWith($data);
                         }
                         else if ($data.hasClass('modal-content'))
                         {
                             $dialog.find('.modal-content').replaceWith($data);
                         }
                         else
                         {
                             $body.wrapInner($data);
                         }
                     }
                     catch(e)
                     {
                         $modal.html(data);
                     }
                     $modal.callEvent('loaded.mower.modal',
                     {
                         modalType: 'ajax'
                     });
                     readyToShow();
                 });
             }
         }

         $modal.modal(
         {
             show: 'show',
             backdrop: options.backdrop,
             keyboard: options.keyboard
         });
     };

     RemoteModal.prototype.close = function(callback, redirect)
     {
         if(callback || redirect)
         {
             this.$modal.on('hidden.mower.modal', function()
             {
                 if ($.isFunction(callback)) callback();

                 if (typeof redirect === 'string')
                 {
                     if (redirect === 'this') window.location.reload();
                     else window.location = redirect;
                 }
             });
         }
         this.$modal.modal('hide');
     };

     RemoteModal.prototype.toggle = function(options)
     {
         if (this.isShown) this.close();
         else this.show(options);
     };

    var old = $.fn.remoteModal;

     $.fn.remoteModal = function(option, settings)
     {
         return $(this).each(function()
         {
             var $this = $(this);
             var data = $this.data(NAME),
                 options = $.extend(
                 {
                     title: $this.attr('title') || $this.text(),
                     url: $this.attr('href'),
                     type: $this.hasClass('iframe') ? 'iframe' : ''
                 }, $this.data(), $.isPlainObject(option) && option);
             if (!data) $this.data(NAME, (data = new RemoteModal(options)));
             if (typeof option == 'string') data[option](settings);
             else if (options.show) data.show(settings);

             $this.on((options.trigger || 'click') + '.toggle.' + NAME, function(e)
             {
                 data.toggle(options);
                 if ($this.is('a')) e.preventDefault();
             });
         });
     };
     
     $.fn.remoteModal.Constructor = RemoteModal;


     /* RemoteModal NO CONFLICT
      * ================= */

     $.fn.remoteModal.noConflict = function() {
         $.fn.remoteModal = old;
         return this;
     };


     $(document).on('click.' + NAME + '.data-api', '[data-toggle="modal"]', function(e)
     {
         var $this = $(this);
         var href = $this.attr('href');
         var $target = null;
         try
         {
             $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, '')));
         }
         catch (ex)
         {}
         if (!$target || !$target.length)
         {
             if (!$this.data(NAME))
             {
                 $this.remoteModal(
                 {
                     show: true
                 });
             }
             else
             {
                 $this.trigger('.toggle.' + NAME);
             }
         }
         if ($this.is('a'))
         {
             e.preventDefault();
         }
     });

})(UniqueId || {}, jQuery, window, document);
