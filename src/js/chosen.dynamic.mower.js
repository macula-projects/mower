/** ========================================================================
 * Mower: chosen.dynamic.mower.js - v0.1.0
 *
 * add ajax load remote data base on chosen
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

 ;(function ( $, window, document, undefined ) {

  "use strict";


 /* DynaChosen CLASS DEFINITION
  * ====================== */

  var DynaChosen = function (element, options) {
    this.options = options;
    this.element = element;
    this.$element = $(element);
  };

  if (!$.fn.chosen) throw new Error('DynaChosen requires chosen.jquery.js');

    //you can put your plugin defaults in here.
  DynaChosen.DEFAULTS = {
    serverSide:false,
    url:'',
    datasrc:false,
    nameField:'',
    valueField:''
  };

  DynaChosen.prototype = {

      constructor: DynaChosen ,  

      _init: function(element, options){
          var $element = $(element);
          this.options = $.extend({}, DynaChosen.DEFAULTS, $element.data(), typeof options === 'object' && options);

    }

  };

 /* DynaChosen PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.dynaChosen;

  $.fn.dynaChosen = function (options) {
      var args = Array.prototype.slice.call(arguments, 1);

      var results;
      this.each(function() {
          var element = this
              ,$element = $(element)
              ,pluginKey = 'plugin_' + dynaChosen
              ,instance = $.data(element, pluginKey);

          // if there's no plugin instance for this element, create a new one, calling its "init" method, if it exists.
          if (!instance) {
              instance = $.data(element, pluginKey, new DynaChosen(element,options));
              if (instance && typeof DynaChosen.prototype['_init'] === 'function')
                  DynaChosen.prototype['_init'].apply(instance, [element, options]);
          }

          // if we have an instance, and as long as the first argument (options) is a valid string value, tries to call a method from this instance.
          if (instance && typeof options === 'string' && options[0] !== '_' && options !== 'init') {

              var methodName = (options == 'destroy' ? '_destroy' : options);
              if (typeof DynaChosen.prototype[methodName] === 'function')
                  results = DynaChosen.prototype[methodName].apply(instance, args);

              // Allow instances to be destroyed via the 'destroy' method
              if (options === 'destroy')
                  $.data(element, pluginKey, null);
          }
      });

      // If the earlier cached method gives a value back, return the resulting value, otherwise return this to preserve chainability.
      return results !== undefined ? results : this;
  };

  $.fn.dynaChosen.Constructor = DynaChosen;


 /* DynaChosen NO CONFLICT
  * ================= */

  $.fn.dynaChosen.noConflict = function () {
    $.fn.dynaChosen = old;
    return this;
  };


 /* DynaChosen DATA-API
  * ============== */

 /*
  $(document).on('click.modal.data-api', '[data-toggle="modal"]', function (e) {
    var $this = $(this)
      , href = $this.attr('href')
      , $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))) //strip for ie7
      , option = $target.data('modal') ? 'toggle' : $.extend({ remote:!/#/.test(href) && href }, $target.data(), $this.data())

    e.preventDefault()

    $target
      .modal(option)
      .one('hide', function () {
        $this.focus()
      })
  })
*/

})( jQuery, window, document );