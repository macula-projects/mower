/** ========================================================================
 * Mower: chosen.remote.mower.js - v0.1.0
 *
 * add ajax load remote data base on chosen.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

 ;(function ( $, window, document, undefined ) {

  "use strict";


 /* RemoteChosen CLASS DEFINITION
  * ====================== */

  var RemoteChosen = function (element, options) {
    this.options = options;
    this.element = element;
    this.$element = $(element);
  };

  var RemoteChosen_Name = 'mu.remoteChosen';
  var Chosen_Name = 'chosen'; //sync with chosen.jquery.js

  if (!$.fn.chosen) throw new Error('RemoteChosen requires chosen.jquery.js');

  //you can put your plugin defaults in here.
  RemoteChosen.DEFAULTS = {
    server :false,
    url        :'',
    datasource :false,
    callback   :null,
    nameField  :'text',
    valueField :'value'
  };

  RemoteChosen.prototype = {

    constructor: RemoteChosen ,  

    _init: function(element, options){
      var $element = $(element);
      this.options = $.extend({}, RemoteChosen.DEFAULTS, $element.data(), typeof options === 'object' && options);

      this._initChosen();
      this._loadData();
    },

    _initChosen: function(){
      //instance chosen plugin
      return this.$element.chosen(this.options || {});
    },

    _construct : function(data) {
      if(!data) return;

      var items, nbItems, selected_values,selected_values = [],
          that = this,$select = this.$element;

      $select.find('option').each(function() {
        if (!$(this).is(":selected")) {
          return $(this).remove();
        } else {
          return selected_values.push($(this).val() + "-" + $(this).text());
        }
      });

      $select.find('optgroup:empty').each(function() {
        return $(this).remove();
      });

      items = this.options.callback != null ? this.options.callback(data, that.element) : data;
      nbItems = 0;
      $.each(items, function(i, element) {
        var group, text, value;
        nbItems++;
        if (element.group) {
          group = $select.find("optgroup[label='" + element.text + "']");
          if (!group.size()) {
            group = $("<optgroup />");
          }
          group.attr('label', element.text).appendTo($select);
          return $.each(element.items, function(i, element) {
            var text, value;
            if (typeof element === "string") {
              value = i;
              text = element;
            } else {
              value = element[that.options.valueField];
              text = element[that.options.nameField];
            }
            if ($.inArray(value + "-" + text, selected_values) === -1) {
              return $("<option />").attr('value', value).html(text).appendTo(group);
            }
          });
        } else {
          if (typeof element === "string") {
            value = i;
            text = element;
          } else {
            value = element[that.options.valueField];
            text = element[that.options.nameField];
          }
          if ($.inArray(value + "-" + text, selected_values) === -1) {
            return $("<option />").attr('value', value).html(text).appendTo($select);
          }
        }
      });
      if (nbItems) {
        $select.trigger("chosen:updated");//notify chosen update field.
      } else {
        $select.data().chosen.no_results_clear();
        $select.data().chosen.no_results($select.val());
      }
    },
    _loadData: function(){
      var that = this,
          ajaxurl = this.options.url,
          ajaxurl = (ajaxurl && ajaxurl.replace(/.*(?=#[^\s]+$)/, '')),
          ajaxOption;

      if (this.options.server === true && ajaxurl) {

          ajaxOption = $.extend({}, {
              'url': ajaxurl,
              dataType: 'json',
              type: 'GET'
          });
          ajaxOption.success = function(data) {
              that._construct(data);
          };
          $.ajax(ajaxOption); 
      } else {
          var data = this.options.datasource;
          if ($.isFunction(window[data])){
               data = data(that);
           }
           
           this._construct(data);
      }
    },
    reload: function(options) {

      this.options = $.extend({}, this.options, typeof options === 'object' && options);

      this._loadData();
          
    },
    getChosenIntance: function(){
      return this.$element.data('chosen') || this._initChosen();
    },

    _destroy: function() {
      //clear chosen instance
      $.data(this.$element,Chosen_Name,null);
    }
  };

 /* RemoteChosen PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.remoteChosen;

  $.fn.remoteChosen = function (options) {
      var args = Array.prototype.slice.call(arguments, 1);

      var results;
      this.each(function() {
          var element = this
              ,$element = $(element)
              ,pluginKey = RemoteChosen_Name
              ,instance = $.data(element, pluginKey);

          // if there's no plugin instance for this element, create a new one, calling its "init" method, if it exists.
          if (!instance) {
              instance = $.data(element, pluginKey, new RemoteChosen(element,options));
              if (instance && typeof RemoteChosen.prototype['_init'] === 'function')
                  RemoteChosen.prototype['_init'].apply(instance, [element, options]);
          }

          // if we have an instance, and as long as the first argument (options) is a valid string value, tries to call a method from this instance.
          if (instance && typeof options === 'string' && options[0] !== '_' && options !== 'init') {

              var methodName = (options == 'destroy' ? '_destroy' : options);
              if (typeof RemoteChosen.prototype[methodName] === 'function')
                  results = RemoteChosen.prototype[methodName].apply(instance, args);

              // Allow instances to be destroyed via the 'destroy' method
              if (options === 'destroy')
                  $.data(element, pluginKey, null);
          }
      });

      // If the earlier cached method gives a value back, return the resulting value, otherwise return this to preserve chainability.
      return results !== undefined ? results : this;
  };

  $.fn.remoteChosen.Constructor = RemoteChosen;


 /* RemoteChosen NO CONFLICT
  * ================= */

  $.fn.remoteChosen.noConflict = function () {
    $.fn.remoteChosen = old;
    return this;
  };


 /* RemoteChosen DATA-API
  * ============== */

  $(document).on('ready update', function(event, updatedFragment) {
      /* Act on the event */
      var $root = $(updatedFragment || 'html');

      $root.find('[rel=remoteChosen]').each(function(index, el) {
          var $this = $(this);

          if (!$this.data(RemoteChosen_Name)) {
              $(this).remoteChosen();
          }
      });
  });
})( jQuery, window, document );