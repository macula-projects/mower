/** ========================================================================
 * Mower: plugin.template.js - v0.1.0
 *
 * template for create plugin
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

 ;(function ( $, window, document, undefined ) {

  "use strict"; // jshint ;_;


 /* PLUGIN_NAME CLASS DEFINITION
  * ====================== */

  var PLUGIN_NAME = function (element, options) {
    this.options = options
    this.element = element
    this.$element = $(element)
  }

    //you can put your plugin defaults in here.
  PLUGIN_NAME.DEFAULTS = {
    /*  backdrop: true
     , keyboard: true
     , show: true*/
  }

  PLUGIN_NAME.prototype = {

      constructor: PLUGIN_NAME

    // plugin initialization goes here.
    // this method is called just once per instance.
    // you can use this.element to access the HTML element on which the plugin was called at.
    // this.$element is the same as $(this.element).
    // this.options represents the options object passed in during plugin initialization, mer
    ,  _init: function(element, options){
          var $element = $(element);
          this.options = $.extend({}, PLUGIN_NAME.DEFAULTS, $element.data(), typeof options == 'object' && options);

          if (typeof this.init === 'function')
              this.init();
    }

    , init: function (){

    }

    // This one is private. the user will not be able to call it!
    , _myPrivateMethod: function() {

    }

    // this is your plugin action. implement it as you wish/need/want.
    , doSomething: function(text) {
            // Public plugin action... the user can call this!
            this.$element.append('did something with ' + text +
                ' using plugin ' + this._name +
                ' for element-id ' + this.element.id + '<br/>');
    }

    // this is your plugin "destructor", but you're not required to provide it.
    , _destroy: function() {
        // This one is a bonus!
        // Here you can provide the code to actually "destroy" your plugin.
        // This will be called whenever the user calls your plugin with
        // the "destroy" method.
        this.$element.append('destroyed!<br/>');
    }
  }

 /* PLUGIN_NAME PLUGIN DEFINITION
  * ======================= */

  var old = $.fn.plugin_name

  $.fn.plugin_name = function (options) {

      // slice arguments to leave only arguments after function name.
      var args = Array.prototype.slice.call(arguments, 1);

      // Cache any plugin method call, to make it possible to return a value
      var results;

      // Creates the plugin instance and tries to call its "init" function (once),
      // As well as returning the created plugin instance for subsequent calls.
      // This method also tries to execute plugin methods,
      // as long as the first argument is a string containing a valid method name.
      this.each(function() {
          var element = this
              ,$element = $(element)
              ,pluginKey = 'plugin_' + plugin_name
              ,instance = $.data(element, pluginKey)


          // if there's no plugin instance for this element, create a new one, calling its "init" method, if it exists.
          if (!instance) {
              instance = $.data(element, pluginKey, new PLUGIN_NAME(element,options));
              if (instance && typeof PLUGIN_NAME.prototype['_init'] === 'function')
                  PLUGIN_NAME.prototype['_init'].apply(instance, [element, options]);
          }

          // if we have an instance, and as long as the first argument (options) is a valid string value, tries to call a method from this instance.
          if (instance && typeof options === 'string' && options[0] !== '_' && options !== 'init') {

              var methodName = (options == 'destroy' ? '_destroy' : options);
              if (typeof PLUGIN_NAME.prototype[methodName] === 'function')
                  results = PLUGIN_NAME.prototype[methodName].apply(instance, args);

              // Allow instances to be destroyed via the 'destroy' method
              if (options === 'destroy')
                  $.data(element, pluginKey, null);
          }
      });

      // If the earlier cached method gives a value back, return the resulting value, otherwise return this to preserve chainability.
      return results !== undefined ? results : this;
  }

  $.fn.plugin_name.Constructor = PLUGIN_NAME


 /* PLUGIN_NAME NO CONFLICT
  * ================= */

  $.fn.plugin_name.noConflict = function () {
    $.fn.plugin_name = old
    return this
  }


 /* PLUGIN_NAME DATA-API
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


// Now we just use "test1" as any regular jQuery plugin...
// The plugin initialization is called just once,
// "automagically" on your first plugin call,
// for each element that matches the specified selector.
$('#test1')
    .PLUGIN_NAME({value: 1})
    .PLUGIN_NAME('doSomething', 'my balls')
    .PLUGIN_NAME('doSomething', 'your butt-hole');

//
// if we call "destroy", we'll be able to call the plugin initialization again.
$('#test1').PLUGIN_NAME({value: 2});    // This line does nothing!!
$('#test1').PLUGIN_NAME('destroy');     // This line destroys the plugin instance.
$('#test1').PLUGIN_NAME({value: 3});    // And this one creates a new one.