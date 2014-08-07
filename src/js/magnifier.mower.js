/** ========================================================================
 * Mower: magnifier.mower.js - v1.0.0
 *
 * update or open _blank page.
 *
 * Dependencies:
 *              bootstrap-modal
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */
;
(function(json, $, window, document, undefined) {

  "use strict"; // jshint ;_;

  /* Magnifier CLASS DEFINITION
   * ====================== */

  var Magnifier = function(element, options) {
    this.options  = options
    this.element  = element
    this.$element = $(element)
  }

  //you can put your plugin defaults in here.
  Magnifier.DEFAULTS = {
    mode          : "_blank",
    title         : "Magnifier",
    url           : false,
    contentTarget : document.body,
    param         : '{}',
    width         : null,
    height        : null,
    events        : {
                      populateError: "error.populate.mu.magnifier",
                      populateSuccess: "success.populate.mu.magnifier"
                    }
  }

  Magnifier.prototype = {

    constructor: Magnifier,

    _init: function(element, options) {
      var $element = $(element);
      this.options = $.extend({}, Magnifier.DEFAULTS, $element.data(), typeof options == 'object' && options);
      this.options.param = json.decode(this.options.param || '{}');

      if (typeof this.init === "function") {
        this.init();
      }
    },
    init: function() {},
    _raise: function(eventName, args) {
      args = args || {};
      var def = {
        'relatedTarget': this
      };
      $.extend(true, def, args);
      var e = $.Event(eventName, def);
      if (!e.relatedTarget) {
        $.extend(true, e, def);
      } //pre jQuery 1.6 which did not allow data to be passed to event object constructor

      this.$element.trigger(e);
      return e;
    },
    _processContent: function(data) {
      this._raise(Magnifier.DEFAULTS.events.populateSuccess, {
        'data': data
      });
    },
    blank: function() {
      $.openWindow(this.options.url, this.options.title || '',
        this.options.width || -1, this.options.height || -1);
    },
    update: function() {
      $(this.options.contentTarget).updateContents(
        this.options.url, this.options.param, this._processContent);
    },
    replace: function() {
      $(this.options.contentTarget).replaceContents(
        this.options.url, this.options.param, this._processContent);
    },
    _destroy: function() {}
  }

  /* Magnifier PLUGIN DEFINITION
   * ======================= */


  function Plugin(options) {
    // slice arguments to leave only arguments after function name.
    var args = Array.prototype.slice.call(arguments, 1);

    // Cache any plugin method call, to make it possible to return a value
    var results;

    this.each(function() {
      var element = this,
        $element = $(element),
        pluginKey = 'mu.magnifier',
        instance = $.data(element, pluginKey)


      // if there's no plugin instance for this element, create a new one, calling its "init" method, if it exists.
      if (!instance) {
        instance = $.data(element, pluginKey, new Magnifier(element, options));
        if (instance && typeof Magnifier.prototype['_init'] === 'function')
          Magnifier.prototype['_init'].apply(instance, [element, options]);
      }

      // if we have an instance, and as long as the first argument (options) is a valid string value, tries to call a method from this instance.
      if (instance && typeof options === 'string' && options[0] !== '_' && options !== 'init') {

        var methodName = (options == 'destroy' ? '_destroy' : options);
        if (typeof Magnifier.prototype[methodName] === 'function')
          results = Magnifier.prototype[methodName].apply(instance, args);

        // Allow instances to be destroyed via the 'destroy' method
        if (options === 'destroy')
          $.data(element, pluginKey, null);
      }
    });

    // If the earlier cached method gives a value back, return the resulting value, otherwise return this to preserve chainability.
    return results !== undefined ? results : this;
  }


  var old = $.fn.magnifier

  $.fn.magnifier = Plugin
  $.fn.magnifier.Constructor = Magnifier


  /* Magnifier  NO CONFLICT
   * ================= */

  $.fn.magnifier.noConflict = function() {
    $.fn.magnifier = old
    return this
  }

  /* Magnifier DATA-API
   * ============== */

  $(document)
    .on('click.mu.magnifier.data-api', '[data-toggle^="blank"],[data-toggle^="_blank"]', function(e) {
      var $this = $(this);
      if ($this.is('a')) e.preventDefault();

      Plugin.call($this, 'blank');
    })
    .on('click.mu.magnifier.data-api', '[data-toggle^="update"]', function(e) {
      var $this = $(this);
      if ($this.is('a')) e.preventDefault();

      Plugin.call($this, 'update');
    })
    .on('click.mu.magnifier.data-api', '[data-toggle^="replace"]', function(e) {
      var $this = $(this);
      if ($this.is('a')) e.preventDefault();

      Plugin.call($this, 'replace');
    });

})(JSON || {}, jQuery, window, document);