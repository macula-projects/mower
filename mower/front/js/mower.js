/*! Copyright (c) 2011 Piotr Rochala (http://rocha.la)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * Version: 1.3.6
 *
 */
(function($) {

  $.fn.extend({
    slimScroll: function(options) {

      var defaults = {

        // width in pixels of the visible scroll area
        width : 'auto',

        // height in pixels of the visible scroll area
        height : '250px',

        // width in pixels of the scrollbar and rail
        size : '7px',

        // scrollbar color, accepts any hex/color value
        color: '#000',

        // scrollbar position - left/right
        position : 'right',

        // distance in pixels between the side edge and the scrollbar
        distance : '1px',

        // default scroll position on load - top / bottom / $('selector')
        start : 'top',

        // sets scrollbar opacity
        opacity : .4,

        // enables always-on mode for the scrollbar
        alwaysVisible : false,

        // check if we should hide the scrollbar when user is hovering over
        disableFadeOut : false,

        // sets visibility of the rail
        railVisible : false,

        // sets rail color
        railColor : '#333',

        // sets rail opacity
        railOpacity : .2,

        // whether  we should use jQuery UI Draggable to enable bar dragging
        railDraggable : true,

        // defautlt CSS class of the slimscroll rail
        railClass : 'slimScrollRail',

        // defautlt CSS class of the slimscroll bar
        barClass : 'slimScrollBar',

        // defautlt CSS class of the slimscroll wrapper
        wrapperClass : 'slimScrollDiv',

        // check if mousewheel should scroll the window if we reach top/bottom
        allowPageScroll : false,

        // scroll amount applied to each mouse wheel step
        wheelStep : 20,

        // scroll amount applied when user is using gestures
        touchScrollStep : 200,

        // sets border radius
        borderRadius: '7px',

        // sets border radius of the rail
        railBorderRadius : '7px'
      };

      var o = $.extend(defaults, options);

      // do it for every element that matches selector
      this.each(function(){

      var isOverPanel, isOverBar, isDragg, queueHide, touchDif,
        barHeight, percentScroll, lastScroll,
        divS = '<div></div>',
        minBarHeight = 30,
        releaseScroll = false;

        // used in event handlers and for better minification
        var me = $(this);

        // ensure we are not binding it again
        if (me.parent().hasClass(o.wrapperClass))
        {
            // start from last bar position
            var offset = me.scrollTop();

            // find bar and rail
            bar = me.closest('.' + o.barClass);
            rail = me.closest('.' + o.railClass);

            getBarHeight();

            // check if we should scroll existing instance
            if ($.isPlainObject(options))
            {
              // Pass height: auto to an existing slimscroll object to force a resize after contents have changed
              if ( 'height' in options && options.height == 'auto' ) {
                me.parent().css('height', 'auto');
                me.css('height', 'auto');
                var height = me.parent().parent().height();
                me.parent().css('height', height);
                me.css('height', height);
              }

              if ('scrollTo' in options)
              {
                // jump to a static point
                offset = parseInt(o.scrollTo);
              }
              else if ('scrollBy' in options)
              {
                // jump by value pixels
                offset += parseInt(o.scrollBy);
              }
              else if ('destroy' in options)
              {
                // remove slimscroll elements
                bar.remove();
                rail.remove();
                me.unwrap();
                return;
              }

              // scroll content by the given offset
              scrollContent(offset, false, true);
            }

            return;
        }
        else if ($.isPlainObject(options))
        {
            if ('destroy' in options)
            {
            	return;
            }
        }

        // optionally set height to the parent's height
        o.height = (o.height == 'auto') ? me.parent().height() : o.height;

        // wrap content
        var wrapper = $(divS)
          .addClass(o.wrapperClass)
          .css({
            position: 'relative',
            overflow: 'hidden',
            width: o.width,
            height: o.height
          });

        // update style for the div
        me.css({
          overflow: 'hidden',
          width: o.width,
          height: o.height
        });

        // create scrollbar rail
        var rail = $(divS)
          .addClass(o.railClass)
          .css({
            width: o.size,
            height: '100%',
            position: 'absolute',
            top: 0,
            display: (o.alwaysVisible && o.railVisible) ? 'block' : 'none',
            'border-radius': o.railBorderRadius,
            background: o.railColor,
            opacity: o.railOpacity,
            zIndex: 90
          });

        // create scrollbar
        var bar = $(divS)
          .addClass(o.barClass)
          .css({
            background: o.color,
            width: o.size,
            position: 'absolute',
            top: 0,
            opacity: o.opacity,
            display: o.alwaysVisible ? 'block' : 'none',
            'border-radius' : o.borderRadius,
            BorderRadius: o.borderRadius,
            MozBorderRadius: o.borderRadius,
            WebkitBorderRadius: o.borderRadius,
            zIndex: 99
          });

        // set position
        var posCss = (o.position == 'right') ? { right: o.distance } : { left: o.distance };
        rail.css(posCss);
        bar.css(posCss);

        // wrap it
        me.wrap(wrapper);

        // append to parent div
        me.parent().append(bar);
        me.parent().append(rail);

        // make it draggable and no longer dependent on the jqueryUI
        if (o.railDraggable){
          bar.bind("mousedown", function(e) {
            var $doc = $(document);
            isDragg = true;
            t = parseFloat(bar.css('top'));
            pageY = e.pageY;

            $doc.bind("mousemove.slimscroll", function(e){
              currTop = t + e.pageY - pageY;
              bar.css('top', currTop);
              scrollContent(0, bar.position().top, false);// scroll content
            });

            $doc.bind("mouseup.slimscroll", function(e) {
              isDragg = false;hideBar();
              $doc.unbind('.slimscroll');
            });
            return false;
          }).bind("selectstart.slimscroll", function(e){
            e.stopPropagation();
            e.preventDefault();
            return false;
          });
        }

        // on rail over
        rail.hover(function(){
          showBar();
        }, function(){
          hideBar();
        });

        // on bar over
        bar.hover(function(){
          isOverBar = true;
        }, function(){
          isOverBar = false;
        });

        // show on parent mouseover
        me.hover(function(){
          isOverPanel = true;
          showBar();
          hideBar();
        }, function(){
          isOverPanel = false;
          hideBar();
        });

        // support for mobile
        me.bind('touchstart', function(e,b){
          if (e.originalEvent.touches.length)
          {
            // record where touch started
            touchDif = e.originalEvent.touches[0].pageY;
          }
        });

        me.bind('touchmove', function(e){
          // prevent scrolling the page if necessary
          if(!releaseScroll)
          {
  		      e.originalEvent.preventDefault();
		      }
          if (e.originalEvent.touches.length)
          {
            // see how far user swiped
            var diff = (touchDif - e.originalEvent.touches[0].pageY) / o.touchScrollStep;
            // scroll content
            scrollContent(diff, true);
            touchDif = e.originalEvent.touches[0].pageY;
          }
        });

        // set up initial height
        getBarHeight();

        // check start position
        if (o.start === 'bottom')
        {
          // scroll content to bottom
          bar.css({ top: me.outerHeight() - bar.outerHeight() });
          scrollContent(0, true);
        }
        else if (o.start !== 'top')
        {
          // assume jQuery selector
          scrollContent($(o.start).position().top, null, true);

          // make sure bar stays hidden
          if (!o.alwaysVisible) { bar.hide(); }
        }

        // attach scroll events
        attachWheel(this);

        function _onWheel(e)
        {
          // use mouse wheel only when mouse is over
          if (!isOverPanel) { return; }

          var e = e || window.event;

          var delta = 0;
          if (e.wheelDelta) { delta = -e.wheelDelta/120; }
          if (e.detail) { delta = e.detail / 3; }

          var target = e.target || e.srcTarget || e.srcElement;
          if ($(target).closest('.' + o.wrapperClass).is(me.parent())) {
            // scroll content
            scrollContent(delta, true);
          }

          // stop window scroll
          if (e.preventDefault && !releaseScroll) { e.preventDefault(); }
          if (!releaseScroll) { e.returnValue = false; }
        }

        function scrollContent(y, isWheel, isJump)
        {
          releaseScroll = false;
          var delta = y;
          var maxTop = me.outerHeight() - bar.outerHeight();

          if (isWheel)
          {
            // move bar with mouse wheel
            delta = parseInt(bar.css('top')) + y * parseInt(o.wheelStep) / 100 * bar.outerHeight();

            // move bar, make sure it doesn't go out
            delta = Math.min(Math.max(delta, 0), maxTop);

            // if scrolling down, make sure a fractional change to the
            // scroll position isn't rounded away when the scrollbar's CSS is set
            // this flooring of delta would happened automatically when
            // bar.css is set below, but we floor here for clarity
            delta = (y > 0) ? Math.ceil(delta) : Math.floor(delta);

            // scroll the scrollbar
            bar.css({ top: delta + 'px' });
          }

          // calculate actual scroll amount
          percentScroll = parseInt(bar.css('top')) / (me.outerHeight() - bar.outerHeight());
          delta = percentScroll * (me[0].scrollHeight - me.outerHeight());

          if (isJump)
          {
            delta = y;
            var offsetTop = delta / me[0].scrollHeight * me.outerHeight();
            offsetTop = Math.min(Math.max(offsetTop, 0), maxTop);
            bar.css({ top: offsetTop + 'px' });
          }

          // scroll content
          me.scrollTop(delta);

          // fire scrolling event
          me.trigger('slimscrolling', ~~delta);

          // ensure bar is visible
          showBar();

          // trigger hide when scroll is stopped
          hideBar();
        }

        function attachWheel(target)
        {
          if (window.addEventListener)
          {
            target.addEventListener('DOMMouseScroll', _onWheel, false );
            target.addEventListener('mousewheel', _onWheel, false );
          }
          else
          {
            document.attachEvent("onmousewheel", _onWheel)
          }
        }

        function getBarHeight()
        {
          // calculate scrollbar height and make sure it is not too small
          barHeight = Math.max((me.outerHeight() / me[0].scrollHeight) * me.outerHeight(), minBarHeight);
          bar.css({ height: barHeight + 'px' });

          // hide scrollbar if content is not long enough
          var display = barHeight == me.outerHeight() ? 'none' : 'block';
          bar.css({ display: display });
        }

        function showBar()
        {
          // recalculate bar height
          getBarHeight();
          clearTimeout(queueHide);

          // when bar reached top or bottom
          if (percentScroll == ~~percentScroll)
          {
            //release wheel
            releaseScroll = o.allowPageScroll;

            // publish approporiate event
            if (lastScroll != percentScroll)
            {
                var msg = (~~percentScroll == 0) ? 'top' : 'bottom';
                me.trigger('slimscroll', msg);
            }
          }
          else
          {
            releaseScroll = false;
          }
          lastScroll = percentScroll;

          // show only when required
          if(barHeight >= me.outerHeight()) {
            //allow window scroll
            releaseScroll = true;
            return;
          }
          bar.stop(true,true).fadeIn('fast');
          if (o.railVisible) { rail.stop(true,true).fadeIn('fast'); }
        }

        function hideBar()
        {
          // only hide when options allow it
          if (!o.alwaysVisible)
          {
            queueHide = setTimeout(function(){
              if (!(o.disableFadeOut && isOverPanel) && !isOverBar && !isDragg)
              {
                bar.fadeOut('slow');
                rail.fadeOut('slow');
              }
            }, 1000);
          }
        }

      });

      // maintain chainability
      return this;
    }
  });

  $.fn.extend({
    slimscroll: $.fn.slimScroll
  });

})(jQuery);

;/*!
Chosen, a Select Box Enhancer for jQuery and Prototype
by Patrick Filler for Harvest, http://getharvest.com

Version 1.4.2
Full source at https://github.com/harvesthq/chosen
Copyright (c) 2011-2015 Harvest http://getharvest.com

MIT License, https://github.com/harvesthq/chosen/blob/master/LICENSE.md
This file is generated by `grunt build`, do not edit it by hand.
*/

(function() {
  var $, AbstractChosen, Chosen, SelectParser, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  SelectParser = (function() {
    function SelectParser() {
      this.options_index = 0;
      this.parsed = [];
    }

    SelectParser.prototype.add_node = function(child) {
      if (child.nodeName.toUpperCase() === "OPTGROUP") {
        return this.add_group(child);
      } else {
        return this.add_option(child);
      }
    };

    SelectParser.prototype.add_group = function(group) {
      var group_position, option, _i, _len, _ref, _results;
      group_position = this.parsed.length;
      this.parsed.push({
        array_index: group_position,
        group: true,
        label: this.escapeExpression(group.label),
        title: group.title ? group.title : void 0,
        children: 0,
        disabled: group.disabled,
        classes: group.className
      });
      _ref = group.childNodes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        _results.push(this.add_option(option, group_position, group.disabled));
      }
      return _results;
    };

    SelectParser.prototype.add_option = function(option, group_position, group_disabled) {
      if (option.nodeName.toUpperCase() === "OPTION") {
        if (option.text !== "") {
          if (group_position != null) {
            this.parsed[group_position].children += 1;
          }
          this.parsed.push({
            array_index: this.parsed.length,
            options_index: this.options_index,
            value: option.value,
            text: option.text,
            html: option.innerHTML,
            title: option.title ? option.title : void 0,
            selected: option.selected,
            disabled: group_disabled === true ? group_disabled : option.disabled,
            group_array_index: group_position,
            group_label: group_position != null ? this.parsed[group_position].label : null,
            classes: option.className,
            style: option.style.cssText
          });
        } else {
          this.parsed.push({
            array_index: this.parsed.length,
            options_index: this.options_index,
            empty: true
          });
        }
        return this.options_index += 1;
      }
    };

    SelectParser.prototype.escapeExpression = function(text) {
      var map, unsafe_chars;
      if ((text == null) || text === false) {
        return "";
      }
      if (!/[\&\<\>\"\'\`]/.test(text)) {
        return text;
      }
      map = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "`": "&#x60;"
      };
      unsafe_chars = /&(?!\w+;)|[\<\>\"\'\`]/g;
      return text.replace(unsafe_chars, function(chr) {
        return map[chr] || "&amp;";
      });
    };

    return SelectParser;

  })();

  SelectParser.select_to_array = function(select) {
    var child, parser, _i, _len, _ref;
    parser = new SelectParser();
    _ref = select.childNodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      parser.add_node(child);
    }
    return parser.parsed;
  };

  AbstractChosen = (function() {
    function AbstractChosen(form_field, options) {
      this.form_field = form_field;
      this.options = options != null ? options : {};
      if (!AbstractChosen.browser_is_supported()) {
        return;
      }
      this.is_multiple = this.form_field.multiple;
      this.set_default_text();
      this.set_default_values();
      this.setup();
      this.set_up_html();
      this.register_observers();
      this.on_ready();
    }

    AbstractChosen.prototype.set_default_values = function() {
      var _this = this;
      this.click_test_action = function(evt) {
        return _this.test_active_click(evt);
      };
      this.activate_action = function(evt) {
        return _this.activate_field(evt);
      };
      this.active_field = false;
      this.mouse_on_container = false;
      this.results_showing = false;
      this.result_highlighted = null;
      this.allow_single_deselect = (this.options.allow_single_deselect != null) && (this.form_field.options[0] != null) && this.form_field.options[0].text === "" ? this.options.allow_single_deselect : false;
      this.disable_search_threshold = this.options.disable_search_threshold || 0;
      this.disable_search = this.options.disable_search || false;
      this.enable_split_word_search = this.options.enable_split_word_search != null ? this.options.enable_split_word_search : true;
      this.group_search = this.options.group_search != null ? this.options.group_search : true;
      this.search_contains = this.options.search_contains || false;
      this.single_backstroke_delete = this.options.single_backstroke_delete != null ? this.options.single_backstroke_delete : true;
      this.max_selected_options = this.options.max_selected_options || Infinity;
      this.inherit_select_classes = this.options.inherit_select_classes || false;
      this.display_selected_options = this.options.display_selected_options != null ? this.options.display_selected_options : true;
      this.display_disabled_options = this.options.display_disabled_options != null ? this.options.display_disabled_options : true;
      return this.include_group_label_in_selected = this.options.include_group_label_in_selected || false;
    };

    AbstractChosen.prototype.set_default_text = function() {
      if (this.form_field.getAttribute("data-placeholder")) {
        this.default_text = this.form_field.getAttribute("data-placeholder");
      } else if (this.is_multiple) {
        this.default_text = this.options.placeholder_text_multiple || this.options.placeholder_text || AbstractChosen.default_multiple_text;
      } else {
        this.default_text = this.options.placeholder_text_single || this.options.placeholder_text || AbstractChosen.default_single_text;
      }
      return this.results_none_found = this.form_field.getAttribute("data-no_results_text") || this.options.no_results_text || AbstractChosen.default_no_result_text;
    };

    AbstractChosen.prototype.choice_label = function(item) {
      if (this.include_group_label_in_selected && (item.group_label != null)) {
        return "<b class='group-name'>" + item.group_label + "</b>" + item.html;
      } else {
        return item.html;
      }
    };

    AbstractChosen.prototype.mouse_enter = function() {
      return this.mouse_on_container = true;
    };

    AbstractChosen.prototype.mouse_leave = function() {
      return this.mouse_on_container = false;
    };

    AbstractChosen.prototype.input_focus = function(evt) {
      var _this = this;
      if (this.is_multiple) {
        if (!this.active_field) {
          return setTimeout((function() {
            return _this.container_mousedown();
          }), 50);
        }
      } else {
        if (!this.active_field) {
          return this.activate_field();
        }
      }
    };

    AbstractChosen.prototype.input_blur = function(evt) {
      var _this = this;
      if (!this.mouse_on_container) {
        this.active_field = false;
        return setTimeout((function() {
          return _this.blur_test();
        }), 100);
      }
    };

    AbstractChosen.prototype.results_option_build = function(options) {
      var content, data, _i, _len, _ref;
      content = '';
      _ref = this.results_data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        data = _ref[_i];
        if (data.group) {
          content += this.result_add_group(data);
        } else {
          content += this.result_add_option(data);
        }
        if (options != null ? options.first : void 0) {
          if (data.selected && this.is_multiple) {
            this.choice_build(data);
          } else if (data.selected && !this.is_multiple) {
            this.single_set_selected_text(this.choice_label(data));
          }
        }
      }
      return content;
    };

    AbstractChosen.prototype.result_add_option = function(option) {
      var classes, option_el;
      if (!option.search_match) {
        return '';
      }
      if (!this.include_option_in_results(option)) {
        return '';
      }
      classes = [];
      if (!option.disabled && !(option.selected && this.is_multiple)) {
        classes.push("active-result");
      }
      if (option.disabled && !(option.selected && this.is_multiple)) {
        classes.push("disabled-result");
      }
      if (option.selected) {
        classes.push("result-selected");
      }
      if (option.group_array_index != null) {
        classes.push("group-option");
      }
      if (option.classes !== "") {
        classes.push(option.classes);
      }
      option_el = document.createElement("li");
      option_el.className = classes.join(" ");
      option_el.style.cssText = option.style;
      option_el.setAttribute("data-option-array-index", option.array_index);
      option_el.innerHTML = option.search_text;
      if (option.title) {
        option_el.title = option.title;
      }
      return this.outerHTML(option_el);
    };

    AbstractChosen.prototype.result_add_group = function(group) {
      var classes, group_el;
      if (!(group.search_match || group.group_match)) {
        return '';
      }
      if (!(group.active_options > 0)) {
        return '';
      }
      classes = [];
      classes.push("group-result");
      if (group.classes) {
        classes.push(group.classes);
      }
      group_el = document.createElement("li");
      group_el.className = classes.join(" ");
      group_el.innerHTML = group.search_text;
      if (group.title) {
        group_el.title = group.title;
      }
      return this.outerHTML(group_el);
    };

    AbstractChosen.prototype.results_update_field = function() {
      this.set_default_text();
      if (!this.is_multiple) {
        this.results_reset_cleanup();
      }
      this.result_clear_highlight();
      this.results_build();
      if (this.results_showing) {
        return this.winnow_results();
      }
    };

    AbstractChosen.prototype.reset_single_select_options = function() {
      var result, _i, _len, _ref, _results;
      _ref = this.results_data;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        result = _ref[_i];
        if (result.selected) {
          _results.push(result.selected = false);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    AbstractChosen.prototype.results_toggle = function() {
      if (this.results_showing) {
        return this.results_hide();
      } else {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.results_search = function(evt) {
      if (this.results_showing) {
        return this.winnow_results();
      } else {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.winnow_results = function() {
      var escapedSearchText, option, regex, results, results_group, searchText, startpos, text, zregex, _i, _len, _ref;
      this.no_results_clear();
      results = 0;
      searchText = this.get_search_text();
      escapedSearchText = searchText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      zregex = new RegExp(escapedSearchText, 'i');
      regex = this.get_search_regex(escapedSearchText);
      _ref = this.results_data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        option.search_match = false;
        results_group = null;
        if (this.include_option_in_results(option)) {
          if (option.group) {
            option.group_match = false;
            option.active_options = 0;
          }
          if ((option.group_array_index != null) && this.results_data[option.group_array_index]) {
            results_group = this.results_data[option.group_array_index];
            if (results_group.active_options === 0 && results_group.search_match) {
              results += 1;
            }
            results_group.active_options += 1;
          }
          option.search_text = option.group ? option.label : option.html;
          if (!(option.group && !this.group_search)) {
            option.search_match = this.search_string_match(option.search_text, regex);
            if (option.search_match && !option.group) {
              results += 1;
            }
            if (option.search_match) {
              if (searchText.length) {
                startpos = option.search_text.search(zregex);
                text = option.search_text.substr(0, startpos + searchText.length) + '</em>' + option.search_text.substr(startpos + searchText.length);
                option.search_text = text.substr(0, startpos) + '<em>' + text.substr(startpos);
              }
              if (results_group != null) {
                results_group.group_match = true;
              }
            } else if ((option.group_array_index != null) && this.results_data[option.group_array_index].search_match) {
              option.search_match = true;
            }
          }
        }
      }
      this.result_clear_highlight();
      if (results < 1 && searchText.length) {
        this.update_results_content("");
        return this.no_results(searchText);
      } else {
        this.update_results_content(this.results_option_build());
        return this.winnow_results_set_highlight();
      }
    };

    AbstractChosen.prototype.get_search_regex = function(escaped_search_string) {
      var regex_anchor;
      regex_anchor = this.search_contains ? "" : "^";
      return new RegExp(regex_anchor + escaped_search_string, 'i');
    };

    AbstractChosen.prototype.search_string_match = function(search_string, regex) {
      var part, parts, _i, _len;
      if (regex.test(search_string)) {
        return true;
      } else if (this.enable_split_word_search && (search_string.indexOf(" ") >= 0 || search_string.indexOf("[") === 0)) {
        parts = search_string.replace(/\[|\]/g, "").split(" ");
        if (parts.length) {
          for (_i = 0, _len = parts.length; _i < _len; _i++) {
            part = parts[_i];
            if (regex.test(part)) {
              return true;
            }
          }
        }
      }
    };

    AbstractChosen.prototype.choices_count = function() {
      var option, _i, _len, _ref;
      if (this.selected_option_count != null) {
        return this.selected_option_count;
      }
      this.selected_option_count = 0;
      _ref = this.form_field.options;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        if (option.selected) {
          this.selected_option_count += 1;
        }
      }
      return this.selected_option_count;
    };

    AbstractChosen.prototype.choices_click = function(evt) {
      evt.preventDefault();
      if (!(this.results_showing || this.is_disabled)) {
        return this.results_show();
      }
    };

    AbstractChosen.prototype.keyup_checker = function(evt) {
      var stroke, _ref;
      stroke = (_ref = evt.which) != null ? _ref : evt.keyCode;
      this.search_field_scale();
      switch (stroke) {
        case 8:
          if (this.is_multiple && this.backstroke_length < 1 && this.choices_count() > 0) {
            return this.keydown_backstroke();
          } else if (!this.pending_backstroke) {
            this.result_clear_highlight();
            return this.results_search();
          }
          break;
        case 13:
          evt.preventDefault();
          if (this.results_showing) {
            return this.result_select(evt);
          }
          break;
        case 27:
          if (this.results_showing) {
            this.results_hide();
          }
          return true;
        case 9:
        case 38:
        case 40:
        case 16:
        case 91:
        case 17:
          break;
        default:
          return this.results_search();
      }
    };

    AbstractChosen.prototype.clipboard_event_checker = function(evt) {
      var _this = this;
      return setTimeout((function() {
        return _this.results_search();
      }), 50);
    };

    AbstractChosen.prototype.container_width = function() {
      if (this.options.width != null) {
        return this.options.width;
      } else {
        return "" + this.form_field.offsetWidth + "px";
      }
    };

    AbstractChosen.prototype.include_option_in_results = function(option) {
      if (this.is_multiple && (!this.display_selected_options && option.selected)) {
        return false;
      }
      if (!this.display_disabled_options && option.disabled) {
        return false;
      }
      if (option.empty) {
        return false;
      }
      return true;
    };

    AbstractChosen.prototype.search_results_touchstart = function(evt) {
      this.touch_started = true;
      return this.search_results_mouseover(evt);
    };

    AbstractChosen.prototype.search_results_touchmove = function(evt) {
      this.touch_started = false;
      return this.search_results_mouseout(evt);
    };

    AbstractChosen.prototype.search_results_touchend = function(evt) {
      if (this.touch_started) {
        return this.search_results_mouseup(evt);
      }
    };

    AbstractChosen.prototype.outerHTML = function(element) {
      var tmp;
      if (element.outerHTML) {
        return element.outerHTML;
      }
      tmp = document.createElement("div");
      tmp.appendChild(element);
      return tmp.innerHTML;
    };

    AbstractChosen.browser_is_supported = function() {
      if (window.navigator.appName === "Microsoft Internet Explorer") {
        return document.documentMode >= 8;
      }
      if (/iP(od|hone)/i.test(window.navigator.userAgent)) {
        return false;
      }
      if (/Android/i.test(window.navigator.userAgent)) {
        if (/Mobile/i.test(window.navigator.userAgent)) {
          return false;
        }
      }
      return true;
    };

    AbstractChosen.default_multiple_text = "Select Some Options";

    AbstractChosen.default_single_text = "Select an Option";

    AbstractChosen.default_no_result_text = "No results match";

    return AbstractChosen;

  })();

  $ = jQuery;

  $.fn.extend({
    chosen: function(options) {
      if (!AbstractChosen.browser_is_supported()) {
        return this;
      }
      return this.each(function(input_field) {
        var $this, chosen;
        $this = $(this);
        chosen = $this.data('chosen');
        if (options === 'destroy' && chosen instanceof Chosen) {
          chosen.destroy();
        } else if (!(chosen instanceof Chosen)) {
          $this.data('chosen', new Chosen(this, options));
        }
      });
    }
  });

  Chosen = (function(_super) {
    __extends(Chosen, _super);

    function Chosen() {
      _ref = Chosen.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Chosen.prototype.setup = function() {
      this.form_field_jq = $(this.form_field);
      this.current_selectedIndex = this.form_field.selectedIndex;
      return this.is_rtl = this.form_field_jq.hasClass("chosen-rtl");
    };

    Chosen.prototype.set_up_html = function() {
      var container_classes, container_props;
      container_classes = ["chosen-container"];
      container_classes.push("chosen-container-" + (this.is_multiple ? "multi" : "single"));
      if (this.inherit_select_classes && this.form_field.className) {
        container_classes.push(this.form_field.className);
      }
      if (this.is_rtl) {
        container_classes.push("chosen-rtl");
      }
      container_props = {
        'class': container_classes.join(' '),
        'style': "width: " + (this.container_width()) + ";",
        'title': this.form_field.title
      };
      if (this.form_field.id.length) {
        container_props.id = this.form_field.id.replace(/[^\w]/g, '_') + "_chosen";
      }
      this.container = $("<div />", container_props);
      if (this.is_multiple) {
        this.container.html('<ul class="chosen-choices"><li class="search-field"><input type="text" value="' + this.default_text + '" class="default" autocomplete="off" style="width:25px;" /></li></ul><div class="chosen-drop"><ul class="chosen-results"></ul></div>');
      } else {
        this.container.html('<a class="chosen-single chosen-default" tabindex="-1"><span>' + this.default_text + '</span><div><b></b></div></a><div class="chosen-drop"><div class="chosen-search"><input type="text" autocomplete="off" /></div><ul class="chosen-results"></ul></div>');
      }
      this.form_field_jq.hide().after(this.container);
      this.dropdown = this.container.find('div.chosen-drop').first();
      this.search_field = this.container.find('input').first();
      this.search_results = this.container.find('ul.chosen-results').first();
      this.search_field_scale();
      this.search_no_results = this.container.find('li.no-results').first();
      if (this.is_multiple) {
        this.search_choices = this.container.find('ul.chosen-choices').first();
        this.search_container = this.container.find('li.search-field').first();
      } else {
        this.search_container = this.container.find('div.chosen-search').first();
        this.selected_item = this.container.find('.chosen-single').first();
      }
      this.results_build();
      this.set_tab_index();
      return this.set_label_behavior();
    };

    Chosen.prototype.on_ready = function() {
      return this.form_field_jq.trigger("chosen:ready", {
        chosen: this
      });
    };

    Chosen.prototype.register_observers = function() {
      var _this = this;
      this.container.bind('touchstart.chosen', function(evt) {
        _this.container_mousedown(evt);
        return evt.preventDefault();
      });
      this.container.bind('touchend.chosen', function(evt) {
        _this.container_mouseup(evt);
        return evt.preventDefault();
      });
      this.container.bind('mousedown.chosen', function(evt) {
        _this.container_mousedown(evt);
      });
      this.container.bind('mouseup.chosen', function(evt) {
        _this.container_mouseup(evt);
      });
      this.container.bind('mouseenter.chosen', function(evt) {
        _this.mouse_enter(evt);
      });
      this.container.bind('mouseleave.chosen', function(evt) {
        _this.mouse_leave(evt);
      });
      this.search_results.bind('mouseup.chosen', function(evt) {
        _this.search_results_mouseup(evt);
      });
      this.search_results.bind('mouseover.chosen', function(evt) {
        _this.search_results_mouseover(evt);
      });
      this.search_results.bind('mouseout.chosen', function(evt) {
        _this.search_results_mouseout(evt);
      });
      this.search_results.bind('mousewheel.chosen DOMMouseScroll.chosen', function(evt) {
        _this.search_results_mousewheel(evt);
      });
      this.search_results.bind('touchstart.chosen', function(evt) {
        _this.search_results_touchstart(evt);
      });
      this.search_results.bind('touchmove.chosen', function(evt) {
        _this.search_results_touchmove(evt);
      });
      this.search_results.bind('touchend.chosen', function(evt) {
        _this.search_results_touchend(evt);
      });
      this.form_field_jq.bind("chosen:updated.chosen", function(evt) {
        _this.results_update_field(evt);
      });
      this.form_field_jq.bind("chosen:activate.chosen", function(evt) {
        _this.activate_field(evt);
      });
      this.form_field_jq.bind("chosen:open.chosen", function(evt) {
        _this.container_mousedown(evt);
      });
      this.form_field_jq.bind("chosen:close.chosen", function(evt) {
        _this.input_blur(evt);
      });
      this.search_field.bind('blur.chosen', function(evt) {
        _this.input_blur(evt);
      });
      this.search_field.bind('keyup.chosen', function(evt) {
        _this.keyup_checker(evt);
      });
      this.search_field.bind('keydown.chosen', function(evt) {
        _this.keydown_checker(evt);
      });
      this.search_field.bind('focus.chosen', function(evt) {
        _this.input_focus(evt);
      });
      this.search_field.bind('cut.chosen', function(evt) {
        _this.clipboard_event_checker(evt);
      });
      this.search_field.bind('paste.chosen', function(evt) {
        _this.clipboard_event_checker(evt);
      });
      if (this.is_multiple) {
        return this.search_choices.bind('click.chosen', function(evt) {
          _this.choices_click(evt);
        });
      } else {
        return this.container.bind('click.chosen', function(evt) {
          evt.preventDefault();
        });
      }
    };

    Chosen.prototype.destroy = function() {
      $(this.container[0].ownerDocument).unbind("click.chosen", this.click_test_action);
      if (this.search_field[0].tabIndex) {
        this.form_field_jq[0].tabIndex = this.search_field[0].tabIndex;
      }
      this.container.remove();
      this.form_field_jq.removeData('chosen');
      return this.form_field_jq.show();
    };

    Chosen.prototype.search_field_disabled = function() {
      this.is_disabled = this.form_field_jq[0].disabled;
      if (this.is_disabled) {
        this.container.addClass('chosen-disabled');
        this.search_field[0].disabled = true;
        if (!this.is_multiple) {
          this.selected_item.unbind("focus.chosen", this.activate_action);
        }
        return this.close_field();
      } else {
        this.container.removeClass('chosen-disabled');
        this.search_field[0].disabled = false;
        if (!this.is_multiple) {
          return this.selected_item.bind("focus.chosen", this.activate_action);
        }
      }
    };

    Chosen.prototype.container_mousedown = function(evt) {
      if (!this.is_disabled) {
        if (evt && evt.type === "mousedown" && !this.results_showing) {
          evt.preventDefault();
        }
        if (!((evt != null) && ($(evt.target)).hasClass("search-choice-close"))) {
          if (!this.active_field) {
            if (this.is_multiple) {
              this.search_field.val("");
            }
            $(this.container[0].ownerDocument).bind('click.chosen', this.click_test_action);
            this.results_show();
          } else if (!this.is_multiple && evt && (($(evt.target)[0] === this.selected_item[0]) || $(evt.target).parents("a.chosen-single").length)) {
            evt.preventDefault();
            this.results_toggle();
          }
          return this.activate_field();
        }
      }
    };

    Chosen.prototype.container_mouseup = function(evt) {
      if (evt.target.nodeName === "ABBR" && !this.is_disabled) {
        return this.results_reset(evt);
      }
    };

    Chosen.prototype.search_results_mousewheel = function(evt) {
      var delta;
      if (evt.originalEvent) {
        delta = evt.originalEvent.deltaY || -evt.originalEvent.wheelDelta || evt.originalEvent.detail;
      }
      if (delta != null) {
        evt.preventDefault();
        if (evt.type === 'DOMMouseScroll') {
          delta = delta * 40;
        }
        return this.search_results.scrollTop(delta + this.search_results.scrollTop());
      }
    };

    Chosen.prototype.blur_test = function(evt) {
      if (!this.active_field && this.container.hasClass("chosen-container-active")) {
        return this.close_field();
      }
    };

    Chosen.prototype.close_field = function() {
      $(this.container[0].ownerDocument).unbind("click.chosen", this.click_test_action);
      this.active_field = false;
      this.results_hide();
      this.container.removeClass("chosen-container-active");
      this.clear_backstroke();
      this.show_search_field_default();
      return this.search_field_scale();
    };

    Chosen.prototype.activate_field = function() {
      this.container.addClass("chosen-container-active");
      this.active_field = true;
      this.search_field.val(this.search_field.val());
      return this.search_field.focus();
    };

    Chosen.prototype.test_active_click = function(evt) {
      var active_container;
      active_container = $(evt.target).closest('.chosen-container');
      if (active_container.length && this.container[0] === active_container[0]) {
        return this.active_field = true;
      } else {
        return this.close_field();
      }
    };

    Chosen.prototype.results_build = function() {
      this.parsing = true;
      this.selected_option_count = null;
      this.results_data = SelectParser.select_to_array(this.form_field);
      if (this.is_multiple) {
        this.search_choices.find("li.search-choice").remove();
      } else if (!this.is_multiple) {
        this.single_set_selected_text();
        if (this.disable_search || this.form_field.options.length <= this.disable_search_threshold) {
          this.search_field[0].readOnly = true;
          this.container.addClass("chosen-container-single-nosearch");
        } else {
          this.search_field[0].readOnly = false;
          this.container.removeClass("chosen-container-single-nosearch");
        }
      }
      this.update_results_content(this.results_option_build({
        first: true
      }));
      this.search_field_disabled();
      this.show_search_field_default();
      this.search_field_scale();
      return this.parsing = false;
    };

    Chosen.prototype.result_do_highlight = function(el) {
      var high_bottom, high_top, maxHeight, visible_bottom, visible_top;
      if (el.length) {
        this.result_clear_highlight();
        this.result_highlight = el;
        this.result_highlight.addClass("highlighted");
        maxHeight = parseInt(this.search_results.css("maxHeight"), 10);
        visible_top = this.search_results.scrollTop();
        visible_bottom = maxHeight + visible_top;
        high_top = this.result_highlight.position().top + this.search_results.scrollTop();
        high_bottom = high_top + this.result_highlight.outerHeight();
        if (high_bottom >= visible_bottom) {
          return this.search_results.scrollTop((high_bottom - maxHeight) > 0 ? high_bottom - maxHeight : 0);
        } else if (high_top < visible_top) {
          return this.search_results.scrollTop(high_top);
        }
      }
    };

    Chosen.prototype.result_clear_highlight = function() {
      if (this.result_highlight) {
        this.result_highlight.removeClass("highlighted");
      }
      return this.result_highlight = null;
    };

    Chosen.prototype.results_show = function() {
      if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
        this.form_field_jq.trigger("chosen:maxselected", {
          chosen: this
        });
        return false;
      }
      this.container.addClass("chosen-with-drop");
      this.results_showing = true;
      this.search_field.focus();
      this.search_field.val(this.search_field.val());
      this.winnow_results();
      return this.form_field_jq.trigger("chosen:showing_dropdown", {
        chosen: this
      });
    };

    Chosen.prototype.update_results_content = function(content) {
      return this.search_results.html(content);
    };

    Chosen.prototype.results_hide = function() {
      if (this.results_showing) {
        this.result_clear_highlight();
        this.container.removeClass("chosen-with-drop");
        this.form_field_jq.trigger("chosen:hiding_dropdown", {
          chosen: this
        });
      }
      return this.results_showing = false;
    };

    Chosen.prototype.set_tab_index = function(el) {
      var ti;
      if (this.form_field.tabIndex) {
        ti = this.form_field.tabIndex;
        this.form_field.tabIndex = -1;
        return this.search_field[0].tabIndex = ti;
      }
    };

    Chosen.prototype.set_label_behavior = function() {
      var _this = this;
      this.form_field_label = this.form_field_jq.parents("label");
      if (!this.form_field_label.length && this.form_field.id.length) {
        this.form_field_label = $("label[for='" + this.form_field.id + "']");
      }
      if (this.form_field_label.length > 0) {
        return this.form_field_label.bind('click.chosen', function(evt) {
          if (_this.is_multiple) {
            return _this.container_mousedown(evt);
          } else {
            return _this.activate_field();
          }
        });
      }
    };

    Chosen.prototype.show_search_field_default = function() {
      if (this.is_multiple && this.choices_count() < 1 && !this.active_field) {
        this.search_field.val(this.default_text);
        return this.search_field.addClass("default");
      } else {
        this.search_field.val("");
        return this.search_field.removeClass("default");
      }
    };

    Chosen.prototype.search_results_mouseup = function(evt) {
      var target;
      target = $(evt.target).hasClass("active-result") ? $(evt.target) : $(evt.target).parents(".active-result").first();
      if (target.length) {
        this.result_highlight = target;
        this.result_select(evt);
        return this.search_field.focus();
      }
    };

    Chosen.prototype.search_results_mouseover = function(evt) {
      var target;
      target = $(evt.target).hasClass("active-result") ? $(evt.target) : $(evt.target).parents(".active-result").first();
      if (target) {
        return this.result_do_highlight(target);
      }
    };

    Chosen.prototype.search_results_mouseout = function(evt) {
      if ($(evt.target).hasClass("active-result" || $(evt.target).parents('.active-result').first())) {
        return this.result_clear_highlight();
      }
    };

    Chosen.prototype.choice_build = function(item) {
      var choice, close_link,
        _this = this;
      choice = $('<li />', {
        "class": "search-choice"
      }).html("<span>" + (this.choice_label(item)) + "</span>");
      if (item.disabled) {
        choice.addClass('search-choice-disabled');
      } else {
        close_link = $('<a />', {
          "class": 'search-choice-close',
          'data-option-array-index': item.array_index
        });
        close_link.bind('click.chosen', function(evt) {
          return _this.choice_destroy_link_click(evt);
        });
        choice.append(close_link);
      }
      return this.search_container.before(choice);
    };

    Chosen.prototype.choice_destroy_link_click = function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      if (!this.is_disabled) {
        return this.choice_destroy($(evt.target));
      }
    };

    Chosen.prototype.choice_destroy = function(link) {
      if (this.result_deselect(link[0].getAttribute("data-option-array-index"))) {
        this.show_search_field_default();
        if (this.is_multiple && this.choices_count() > 0 && this.search_field.val().length < 1) {
          this.results_hide();
        }
        link.parents('li').first().remove();
        return this.search_field_scale();
      }
    };

    Chosen.prototype.results_reset = function() {
      this.reset_single_select_options();
      this.form_field.options[0].selected = true;
      this.single_set_selected_text();
      this.show_search_field_default();
      this.results_reset_cleanup();
      this.form_field_jq.trigger("change");
      if (this.active_field) {
        return this.results_hide();
      }
    };

    Chosen.prototype.results_reset_cleanup = function() {
      this.current_selectedIndex = this.form_field.selectedIndex;
      return this.selected_item.find("abbr").remove();
    };

    Chosen.prototype.result_select = function(evt) {
      var high, item;
      if (this.result_highlight) {
        high = this.result_highlight;
        this.result_clear_highlight();
        if (this.is_multiple && this.max_selected_options <= this.choices_count()) {
          this.form_field_jq.trigger("chosen:maxselected", {
            chosen: this
          });
          return false;
        }
        if (this.is_multiple) {
          high.removeClass("active-result");
        } else {
          this.reset_single_select_options();
        }
        high.addClass("result-selected");
        item = this.results_data[high[0].getAttribute("data-option-array-index")];
        item.selected = true;
        this.form_field.options[item.options_index].selected = true;
        this.selected_option_count = null;
        if (this.is_multiple) {
          this.choice_build(item);
        } else {
          this.single_set_selected_text(this.choice_label(item));
        }
        if (!((evt.metaKey || evt.ctrlKey) && this.is_multiple)) {
          this.results_hide();
        }
        this.search_field.val("");
        if (this.is_multiple || this.form_field.selectedIndex !== this.current_selectedIndex) {
          this.form_field_jq.trigger("change", {
            'selected': this.form_field.options[item.options_index].value
          });
        }
        this.current_selectedIndex = this.form_field.selectedIndex;
        evt.preventDefault();
        return this.search_field_scale();
      }
    };

    Chosen.prototype.single_set_selected_text = function(text) {
      if (text == null) {
        text = this.default_text;
      }
      if (text === this.default_text) {
        this.selected_item.addClass("chosen-default");
      } else {
        this.single_deselect_control_build();
        this.selected_item.removeClass("chosen-default");
      }
      return this.selected_item.find("span").html(text);
    };

    Chosen.prototype.result_deselect = function(pos) {
      var result_data;
      result_data = this.results_data[pos];
      if (!this.form_field.options[result_data.options_index].disabled) {
        result_data.selected = false;
        this.form_field.options[result_data.options_index].selected = false;
        this.selected_option_count = null;
        this.result_clear_highlight();
        if (this.results_showing) {
          this.winnow_results();
        }
        this.form_field_jq.trigger("change", {
          deselected: this.form_field.options[result_data.options_index].value
        });
        this.search_field_scale();
        return true;
      } else {
        return false;
      }
    };

    Chosen.prototype.single_deselect_control_build = function() {
      if (!this.allow_single_deselect) {
        return;
      }
      if (!this.selected_item.find("abbr").length) {
        this.selected_item.find("span").first().after("<abbr class=\"search-choice-close\"></abbr>");
      }
      return this.selected_item.addClass("chosen-single-with-deselect");
    };

    Chosen.prototype.get_search_text = function() {
      return $('<div/>').text($.trim(this.search_field.val())).html();
    };

    Chosen.prototype.winnow_results_set_highlight = function() {
      var do_high, selected_results;
      selected_results = !this.is_multiple ? this.search_results.find(".result-selected.active-result") : [];
      do_high = selected_results.length ? selected_results.first() : this.search_results.find(".active-result").first();
      if (do_high != null) {
        return this.result_do_highlight(do_high);
      }
    };

    Chosen.prototype.no_results = function(terms) {
      var no_results_html;
      no_results_html = $('<li class="no-results">' + this.results_none_found + ' "<span></span>"</li>');
      no_results_html.find("span").first().html(terms);
      this.search_results.append(no_results_html);
      return this.form_field_jq.trigger("chosen:no_results", {
        chosen: this
      });
    };

    Chosen.prototype.no_results_clear = function() {
      return this.search_results.find(".no-results").remove();
    };

    Chosen.prototype.keydown_arrow = function() {
      var next_sib;
      if (this.results_showing && this.result_highlight) {
        next_sib = this.result_highlight.nextAll("li.active-result").first();
        if (next_sib) {
          return this.result_do_highlight(next_sib);
        }
      } else {
        return this.results_show();
      }
    };

    Chosen.prototype.keyup_arrow = function() {
      var prev_sibs;
      if (!this.results_showing && !this.is_multiple) {
        return this.results_show();
      } else if (this.result_highlight) {
        prev_sibs = this.result_highlight.prevAll("li.active-result");
        if (prev_sibs.length) {
          return this.result_do_highlight(prev_sibs.first());
        } else {
          if (this.choices_count() > 0) {
            this.results_hide();
          }
          return this.result_clear_highlight();
        }
      }
    };

    Chosen.prototype.keydown_backstroke = function() {
      var next_available_destroy;
      if (this.pending_backstroke) {
        this.choice_destroy(this.pending_backstroke.find("a").first());
        return this.clear_backstroke();
      } else {
        next_available_destroy = this.search_container.siblings("li.search-choice").last();
        if (next_available_destroy.length && !next_available_destroy.hasClass("search-choice-disabled")) {
          this.pending_backstroke = next_available_destroy;
          if (this.single_backstroke_delete) {
            return this.keydown_backstroke();
          } else {
            return this.pending_backstroke.addClass("search-choice-focus");
          }
        }
      }
    };

    Chosen.prototype.clear_backstroke = function() {
      if (this.pending_backstroke) {
        this.pending_backstroke.removeClass("search-choice-focus");
      }
      return this.pending_backstroke = null;
    };

    Chosen.prototype.keydown_checker = function(evt) {
      var stroke, _ref1;
      stroke = (_ref1 = evt.which) != null ? _ref1 : evt.keyCode;
      this.search_field_scale();
      if (stroke !== 8 && this.pending_backstroke) {
        this.clear_backstroke();
      }
      switch (stroke) {
        case 8:
          this.backstroke_length = this.search_field.val().length;
          break;
        case 9:
          if (this.results_showing && !this.is_multiple) {
            this.result_select(evt);
          }
          this.mouse_on_container = false;
          break;
        case 13:
          if (this.results_showing) {
            evt.preventDefault();
          }
          break;
        case 32:
          if (this.disable_search) {
            evt.preventDefault();
          }
          break;
        case 38:
          evt.preventDefault();
          this.keyup_arrow();
          break;
        case 40:
          evt.preventDefault();
          this.keydown_arrow();
          break;
      }
    };

    Chosen.prototype.search_field_scale = function() {
      var div, f_width, h, style, style_block, styles, w, _i, _len;
      if (this.is_multiple) {
        h = 0;
        w = 0;
        style_block = "position:absolute; left: -1000px; top: -1000px; display:none;";
        styles = ['font-size', 'font-style', 'font-weight', 'font-family', 'line-height', 'text-transform', 'letter-spacing'];
        for (_i = 0, _len = styles.length; _i < _len; _i++) {
          style = styles[_i];
          style_block += style + ":" + this.search_field.css(style) + ";";
        }
        div = $('<div />', {
          'style': style_block
        });
        div.text(this.search_field.val());
        $('body').append(div);
        w = div.width() + 25;
        div.remove();
        f_width = this.container.outerWidth();
        if (w > f_width - 10) {
          w = f_width - 10;
        }
        return this.search_field.css({
          'width': w + 'px'
        });
      }
    };

    return Chosen;

  })(AbstractChosen);

}).call(this);

;/*!
 * BootstrapValidator (http://bootstrapvalidator.com)
 * The best jQuery plugin to validate form fields. Designed to use with Bootstrap 3
 *
 * @version     v0.5.3, built on 2015-08-07 5:01:19 PM
 * @author      https://twitter.com/nghuuphuoc
 * @copyright   (c) 2013 - 2015 Nguyen Huu Phuoc
 * @license     Commercial: http://bootstrapvalidator.com/license/
 *              Non-commercial: http://creativecommons.org/licenses/by-nc-nd/3.0/
 */
if (typeof jQuery === 'undefined') {
    throw new Error('BootstrapValidator requires jQuery');
}

(function($) {
    var version = $.fn.jquery.split(' ')[0].split('.');
    if ((+version[0] < 2 && +version[1] < 9) || (+version[0] === 1 && +version[1] === 9 && +version[2] < 1)) {
        throw new Error('BootstrapValidator requires jQuery version 1.9.1 or higher');
    }
}(window.jQuery));

(function($) {
    var BootstrapValidator = function(form, options) {
        this.$form   = $(form);
        this.options = $.extend({}, $.fn.bootstrapValidator.DEFAULT_OPTIONS, options);

        this.$invalidFields = $([]);    // Array of invalid fields
        this.$submitButton  = null;     // The submit button which is clicked to submit form
        this.$hiddenButton  = null;

        // Validating status
        this.STATUS_NOT_VALIDATED = 'NOT_VALIDATED';
        this.STATUS_VALIDATING    = 'VALIDATING';
        this.STATUS_INVALID       = 'INVALID';
        this.STATUS_VALID         = 'VALID';

        // Determine the event that is fired when user change the field value
        // Most modern browsers supports input event except IE 7, 8.
        // IE 9 supports input event but the event is still not fired if I press the backspace key.
        // Get IE version
        // https://gist.github.com/padolsey/527683/#comment-7595
        var ieVersion = (function() {
            var v = 3, div = document.createElement('div'), a = div.all || [];
            while (div.innerHTML = '<!--[if gt IE '+(++v)+']><br><![endif]-->', a[0]) {}
            return v > 4 ? v : !v;
        }());

        var el = document.createElement('div');
        this._changeEvent = (ieVersion === 9 || !('oninput' in el)) ? 'keyup' : 'input';

        // The flag to indicate that the form is ready to submit when a remote/callback validator returns
        this._submitIfValid = null;

        // Field elements
        this._cacheFields = {};

        this._init();
    };

    BootstrapValidator.prototype = {
        constructor: BootstrapValidator,

        /**
         * Init form
         */
        _init: function() {
            var that    = this,
                options = {
                    autoFocus:      this.$form.attr('data-bv-autofocus'),
                    container:      this.$form.attr('data-bv-container'),
                    events: {
                        formInit:         this.$form.attr('data-bv-events-form-init'),
                        formError:        this.$form.attr('data-bv-events-form-error'),
                        formSuccess:      this.$form.attr('data-bv-events-form-success'),
                        fieldAdded:       this.$form.attr('data-bv-events-field-added'),
                        fieldRemoved:     this.$form.attr('data-bv-events-field-removed'),
                        fieldInit:        this.$form.attr('data-bv-events-field-init'),
                        fieldError:       this.$form.attr('data-bv-events-field-error'),
                        fieldSuccess:     this.$form.attr('data-bv-events-field-success'),
                        fieldStatus:      this.$form.attr('data-bv-events-field-status'),
                        validatorError:   this.$form.attr('data-bv-events-validator-error'),
                        validatorSuccess: this.$form.attr('data-bv-events-validator-success')
                    },
                    excluded:       this.$form.attr('data-bv-excluded'),
                    feedbackIcons: {
                        valid:      this.$form.attr('data-bv-feedbackicons-valid'),
                        invalid:    this.$form.attr('data-bv-feedbackicons-invalid'),
                        validating: this.$form.attr('data-bv-feedbackicons-validating')
                    },
                    group:          this.$form.attr('data-bv-group'),
                    live:           this.$form.attr('data-bv-live'),
                    message:        this.$form.attr('data-bv-message'),
                    onError:        this.$form.attr('data-bv-onerror'),
                    onSuccess:      this.$form.attr('data-bv-onsuccess'),
                    submitButtons:  this.$form.attr('data-bv-submitbuttons'),
                    threshold:      this.$form.attr('data-bv-threshold'),
                    trigger:        this.$form.attr('data-bv-trigger'),
                    verbose:        this.$form.attr('data-bv-verbose'),
                    fields:         {}
                };

            this.$form
                // Disable client side validation in HTML 5
                .attr('novalidate', 'novalidate')
                .addClass(this.options.elementClass)
                // Disable the default submission first
                .on('submit.bv', function(e) {
                    e.preventDefault();
                    that.validate();
                })
                .on('click.bv', this.options.submitButtons, function() {
                    that.$submitButton  = $(this);
					// The user just click the submit button
					that._submitIfValid = true;
                })
                // Find all fields which have either "name" or "data-bv-field" attribute
                .find('[name], [data-bv-field]')
                    .each(function() {
                        var $field = $(this),
                            field  = $field.attr('name') || $field.attr('data-bv-field'),
                            opts   = that._parseOptions($field);
                        if (opts) {
                            $field.attr('data-bv-field', field);
                            options.fields[field] = $.extend({}, opts, options.fields[field]);
                        }
                    });

            this.options = $.extend(true, this.options, options);

            // When pressing Enter on any field in the form, the first submit button will do its job.
            // The form then will be submitted.
            // I create a first hidden submit button
            this.$hiddenButton = $('<button/>')
                                    .attr('type', 'submit')
                                    .prependTo(this.$form)
                                    .addClass('bv-hidden-submit')
                                    .css({ display: 'none', width: 0, height: 0 });

            this.$form
                .on('click.bv', '[type="submit"]', function(e) {
                    // #746: Check if the button click handler returns false
                    if (!e.isDefaultPrevented()) {
                        var $target = $(e.target),
                            // The button might contain HTML tag
                            $button = $target.is('[type="submit"]') ? $target.eq(0) : $target.parent('[type="submit"]').eq(0);

                        // Don't perform validation when clicking on the submit button/input
                        // which aren't defined by the 'submitButtons' option
                        if (that.options.submitButtons && !$button.is(that.options.submitButtons) && !$button.is(that.$hiddenButton)) {
                            that.$form.off('submit.bv').submit();
                        }
                    }
                });

            for (var field in this.options.fields) {
                this._initField(field);
            }

            this.$form.trigger($.Event(this.options.events.formInit), {
                bv: this,
                options: this.options
            });

            // Prepare the events
            if (this.options.onSuccess) {
                this.$form.on(this.options.events.formSuccess, function(e) {
                    $.fn.bootstrapValidator.helpers.call(that.options.onSuccess, [e]);
                });
            }
            if (this.options.onError) {
                this.$form.on(this.options.events.formError, function(e) {
                    $.fn.bootstrapValidator.helpers.call(that.options.onError, [e]);
                });
            }
        },

        /**
         * Parse the validator options from HTML attributes
         *
         * @param {jQuery} $field The field element
         * @returns {Object}
         */
        _parseOptions: function($field) {
            var field      = $field.attr('name') || $field.attr('data-bv-field'),
                validators = {},
                validator,
                v,          // Validator name
                attrName,
                enabled,
                optionName,
                optionAttrName,
                optionValue,
                html5AttrName,
                html5AttrMap;

            for (v in $.fn.bootstrapValidator.validators) {
                validator    = $.fn.bootstrapValidator.validators[v];
                attrName     = 'data-bv-' + v.toLowerCase(),
                enabled      = $field.attr(attrName) + '';
                html5AttrMap = ('function' === typeof validator.enableByHtml5) ? validator.enableByHtml5($field) : null;

                if ((html5AttrMap && enabled !== 'false')
                    || (html5AttrMap !== true && ('' === enabled || 'true' === enabled || attrName === enabled.toLowerCase())))
                {
                    // Try to parse the options via attributes
                    validator.html5Attributes = $.extend({}, { message: 'message', onerror: 'onError', onsuccess: 'onSuccess' }, validator.html5Attributes);
                    validators[v] = $.extend({}, html5AttrMap === true ? {} : html5AttrMap, validators[v]);

                    for (html5AttrName in validator.html5Attributes) {
                        optionName  = validator.html5Attributes[html5AttrName];
                        optionAttrName = 'data-bv-' + v.toLowerCase() + '-' + html5AttrName,
                        optionValue = $field.attr(optionAttrName);
                        if (optionValue) {
                            if ('true' === optionValue || optionAttrName === optionValue.toLowerCase()) {
                                optionValue = true;
                            } else if ('false' === optionValue) {
                                optionValue = false;
                            }
                            validators[v][optionName] = optionValue;
                        }
                    }
                }
            }

            var opts = {
                    autoFocus:     $field.attr('data-bv-autofocus'),
                    container:     $field.attr('data-bv-container'),
                    excluded:      $field.attr('data-bv-excluded'),
                    feedbackIcons: $field.attr('data-bv-feedbackicons'),
                    group:         $field.attr('data-bv-group'),
                    message:       $field.attr('data-bv-message'),
                    onError:       $field.attr('data-bv-onerror'),
                    onStatus:      $field.attr('data-bv-onstatus'),
                    onSuccess:     $field.attr('data-bv-onsuccess'),
                    selector:      $field.attr('data-bv-selector'),
                    threshold:     $field.attr('data-bv-threshold'),
                    trigger:       $field.attr('data-bv-trigger'),
                    verbose:       $field.attr('data-bv-verbose'),
                    validators:    validators
                },
                emptyOptions    = $.isEmptyObject(opts),        // Check if the field options are set using HTML attributes
                emptyValidators = $.isEmptyObject(validators);  // Check if the field validators are set using HTML attributes

            if (!emptyValidators || (!emptyOptions && this.options.fields && this.options.fields[field])) {
                opts.validators = validators;
                return opts;
            } else {
                return null;
            }
        },

        /**
         * Init field
         *
         * @param {String|jQuery} field The field name or field element
         */
        _initField: function(field) {
            var fields = $([]);
            switch (typeof field) {
                case 'object':
                    fields = field;
                    field  = field.attr('data-bv-field');
                    break;
                case 'string':
                    fields = this.getFieldElements(field);
                    fields.attr('data-bv-field', field);
                    break;
                default:
                    break;
            }

            // We don't need to validate non-existing fields
            if (fields.length === 0) {
                return;
            }

            var fieldValidators = this.options.fields[field].validators;
            if (this.options.fields[field] === null ||  fieldValidators=== null) {
                return;
            }

            var validatorName;
            for (validatorName in fieldValidators) {
                if (!$.fn.bootstrapValidator.validators[validatorName]) {
                    delete fieldValidators[validatorName];
                }
            }
            if (this.options.fields[field].enabled === null) {
                this.options.fields[field].enabled = true;
            }

            var that      = this,
                total     = fields.length,
                type      = fields.attr('type'),
                updateAll = (total === 1) || ('radio' === type) || ('checkbox' === type),
                event     = ('radio' === type || 'checkbox' === type || 'file' === type || 'SELECT' === fields.eq(0).get(0).tagName) ? 'change' : this._changeEvent,
                trigger   = (this.options.fields[field].trigger || this.options.trigger || event).split(' '),
                events    = $.map(trigger, function(item) {
                    return item + '.update.bv';
                }).join(' ');

            for (var i = 0; i < total; i++) {
                var $field    = fields.eq(i),
                    group     = this.options.fields[field].group || this.options.group,
                    $parent   = $field.parents(group),
                    // Allow user to indicate where the error messages are shown
                    container = ('function' === typeof (this.options.fields[field].container || this.options.container)) ? (this.options.fields[field].container || this.options.container).call(this, $field, this) : (this.options.fields[field].container || this.options.container),
                    $message  = (container && container !== 'tooltip' && container !== 'popover') ? $(container) : this._getMessageContainer($field, group);

                if (container && container !== 'tooltip' && container !== 'popover') {
                    $message.addClass('has-error');
                }

                // Remove all error messages and feedback icons
                $message.find('.help-block[data-bv-validator][data-bv-for="' + field + '"]').remove();
                $parent.find('i[data-bv-icon-for="' + field + '"]').remove();

                // Whenever the user change the field value, mark it as not validated yet
                $field.off(events).on(events, function() {
                    that.updateStatus($(this), that.STATUS_NOT_VALIDATED);
                });
                
                // Create help block elements for showing the error messages
                $field.data('bv.messages', $message);
                for (validatorName in fieldValidators) {
                    $field.data('bv.result.' + validatorName, this.STATUS_NOT_VALIDATED);

                    if (!updateAll || i === total - 1) {
                        $('<small/>')
                            .css('display', 'none')
                            .addClass('help-block')
                            .attr('data-bv-validator', validatorName)
                            .attr('data-bv-for', field)
                            .attr('data-bv-result', this.STATUS_NOT_VALIDATED)
                            .html(this._getMessage(field, validatorName))
                            .appendTo($message);
                    }

                    // Init the validator
                    if ('function' === typeof $.fn.bootstrapValidator.validators[validatorName].init) {
                        $.fn.bootstrapValidator.validators[validatorName].init(this, $field, fieldValidators[validatorName]);
                    }
                }

                // Prepare the feedback icons
                // Available from Bootstrap 3.1 (http://getbootstrap.com/css/#forms-control-validation)
                var fieldFeedbackIcons  = this.options.fields[field].feedbackIcons,
                    feedbackIcons = this.options.feedbackIcons;
                if (fieldFeedbackIcons !== false && fieldFeedbackIcons !== 'false'
                    && feedbackIcons
                    && feedbackIcons.validating && feedbackIcons.invalid && feedbackIcons.valid
                    && (!updateAll || i === total - 1))
                {
                    // $parent.removeClass('has-success').removeClass('has-error').addClass('has-feedback');
                    // Keep error messages which are populated from back-end
                    $parent.addClass('has-feedback');
                    var $icon = $('<i/>')
                                    .css('display', 'none')
                                    .addClass('form-control-feedback')
                                    .attr('data-bv-icon-for', field)
                                    .insertAfter($field);

                    if (fieldValidators.notEmpty && feedbackIcons.required) {
                        // The field uses notEmpty validator
                        // Add required icon
                        $icon.addClass(feedbackIcons.required).show();
                    }

                    // Place it after the container of checkbox/radio
                    // so when clicking the icon, it doesn't effect to the checkbox/radio element
                    if ('checkbox' === type || 'radio' === type) {
                        var $fieldParent = $field.parent();
                        if ($fieldParent.hasClass(type)) {
                            $icon.insertAfter($fieldParent);
                        } else if ($fieldParent.parent().hasClass(type)) {
                            $icon.insertAfter($fieldParent.parent());
                        }
                    }

                    // The feedback icon does not render correctly if there is no label
                    // https://github.com/twbs/bootstrap/issues/12873
                    if ($parent.find('label').length === 0) {
                        $icon.addClass('bv-no-label');
                    }
                    // Fix feedback icons in input-group
                    if ($parent.find('.input-group').length !== 0) {
                        $icon.addClass('bv-icon-input-group')
                             .insertAfter($parent.find('.input-group').eq(0));
                    }

                    // Store the icon as a data of field element
                    if (!updateAll) {
                        $field.data('bv.icon', $icon);
                    } else if (i === total - 1) {
                        // All fields with the same name have the same icon
                        fields.data('bv.icon', $icon);
                    }
                    
                    if (container) {
                        $field
                            // Show tooltip/popover message when field gets focus
                            .off('focus.container.bv')
                            .on('focus.container.bv', function() {
                                switch (container) {
                                    case 'tooltip':
                                        $(this).data('bv.icon').tooltip('show');
                                        break;
                                    case 'popover':
                                        $(this).data('bv.icon').popover('show');
                                        break;
                                    default:
                                        break;
                                }
                            })
                            // and hide them when losing focus
                            .off('blur.container.bv')
                            .on('blur.container.bv', function() {
                                switch (container) {
                                    case 'tooltip':
                                        $(this).data('bv.icon').tooltip('hide');
                                        break;
                                    case 'popover':
                                        $(this).data('bv.icon').popover('hide');
                                        break;
                                    default:
                                        break;
                                }
                            });
                    }
                }
            }

            // Prepare the events
            fields
                .on(this.options.events.fieldSuccess, function(e, data) {
                    var onSuccess = that.getOptions(data.field, null, 'onSuccess');
                    if (onSuccess) {
                        $.fn.bootstrapValidator.helpers.call(onSuccess, [e, data]);
                    }
                })
                .on(this.options.events.fieldError, function(e, data) {
                    var onError = that.getOptions(data.field, null, 'onError');
                    if (onError) {
                        $.fn.bootstrapValidator.helpers.call(onError, [e, data]);
                    }
                })
                .on(this.options.events.fieldStatus, function(e, data) {
                    var onStatus = that.getOptions(data.field, null, 'onStatus');
                    if (onStatus) {
                        $.fn.bootstrapValidator.helpers.call(onStatus, [e, data]);
                    }
                })
                .on(this.options.events.validatorError, function(e, data) {
                    var onError = that.getOptions(data.field, data.validator, 'onError');
                    if (onError) {
                        $.fn.bootstrapValidator.helpers.call(onError, [e, data]);
                    }
                })
                .on(this.options.events.validatorSuccess, function(e, data) {
                    var onSuccess = that.getOptions(data.field, data.validator, 'onSuccess');
                    if (onSuccess) {
                        $.fn.bootstrapValidator.helpers.call(onSuccess, [e, data]);
                    }
                });

            // Set live mode
            events = $.map(trigger, function(item) {
                return item + '.live.bv';
            }).join(' ');
            switch (this.options.live) {
                case 'submitted':
                    break;
                case 'disabled':
                    fields.off(events);
                    break;
                case 'enabled':
                /* falls through */
                default:
                    fields.off(events).on(events, function() {
                        if (that._exceedThreshold($(this))) {
                            that.validateField($(this));
                        }
                    });
                    break;
            }

            fields.trigger($.Event(this.options.events.fieldInit), {
                bv: this,
                field: field,
                element: fields
            });
        },

        /**
         * Get the error message for given field and validator
         *
         * @param {String} field The field name
         * @param {String} validatorName The validator name
         * @returns {String}
         */
        _getMessage: function(field, validatorName) {
            if (!this.options.fields[field] || !$.fn.bootstrapValidator.validators[validatorName]
                || !this.options.fields[field].validators || !this.options.fields[field].validators[validatorName])
            {
                return '';
            }

            var options = this.options.fields[field].validators[validatorName];
            switch (true) {
                case (!!options.message):
                    return options.message;
                case (!!this.options.fields[field].message):
                    return this.options.fields[field].message;
                case (!!$.fn.bootstrapValidator.i18n[validatorName]):
                    return $.fn.bootstrapValidator.i18n[validatorName]['default'];
                default:
                    return this.options.message;
            }
        },

        /**
         * Get the element to place the error messages
         *
         * @param {jQuery} $field The field element
         * @param {String} group
         * @returns {jQuery}
         */
        _getMessageContainer: function($field, group) {
            var $parent = $field.parent();
            if ($parent.is(group)) {
                return $parent;
            }

            var cssClasses = $parent.attr('class');
            if (!cssClasses) {
                return this._getMessageContainer($parent, group);
            }

            cssClasses = cssClasses.split(' ');
            var n = cssClasses.length;
            for (var i = 0; i < n; i++) {
                if (/^col-(xs|sm|md|lg)-\d+$/.test(cssClasses[i]) || /^col-(xs|sm|md|lg)-offset-\d+$/.test(cssClasses[i])) {
                    return $parent;
                }
            }

            return this._getMessageContainer($parent, group);
        },

        /**
         * Called when all validations are completed
         */
        _submit: function() {
            var isValid   = this.isValid(),
                eventType = isValid ? this.options.events.formSuccess : this.options.events.formError,
                e         = $.Event(eventType);

            this.$form.trigger(e);

            // Call default handler
            // Check if whether the submit button is clicked
            if (this.$submitButton) {
                isValid ? this._onSuccess(e) : this._onError(e);
            }
        },

        /**
         * Check if the field is excluded.
         * Returning true means that the field will not be validated
         *
         * @param {jQuery} $field The field element
         * @returns {Boolean}
         */
        _isExcluded: function($field) {
            var excludedAttr = $field.attr('data-bv-excluded'),
                // I still need to check the 'name' attribute while initializing the field
                field        = $field.attr('data-bv-field') || $field.attr('name');

            switch (true) {
                case (!!field && this.options.fields && this.options.fields[field] && (this.options.fields[field].excluded === 'true' || this.options.fields[field].excluded === true)):
                case (excludedAttr === 'true'):
                case (excludedAttr === ''):
                    return true;

                case (!!field && this.options.fields && this.options.fields[field] && (this.options.fields[field].excluded === 'false' || this.options.fields[field].excluded === false)):
                case (excludedAttr === 'false'):
                    return false;

                default:
                    if (this.options.excluded) {
                        // Convert to array first
                        if ('string' === typeof this.options.excluded) {
                            this.options.excluded = $.map(this.options.excluded.split(','), function(item) {
                                // Trim the spaces
                                return $.trim(item);
                            });
                        }

                        var length = this.options.excluded.length;
                        for (var i = 0; i < length; i++) {
                            if (('string' === typeof this.options.excluded[i] && $field.is(this.options.excluded[i]))
                                || ('function' === typeof this.options.excluded[i] && this.options.excluded[i].call(this, $field, this) === true))
                            {
                                return true;
                            }
                        }
                    }
                    return false;
            }
        },

        /**
         * Check if the number of characters of field value exceed the threshold or not
         *
         * @param {jQuery} $field The field element
         * @returns {Boolean}
         */
        _exceedThreshold: function($field) {
            var field     = $field.attr('data-bv-field'),
                threshold = this.options.fields[field].threshold || this.options.threshold;
            if (!threshold) {
                return true;
            }
            var cannotType = $.inArray($field.attr('type'), ['button', 'checkbox', 'file', 'hidden', 'image', 'radio', 'reset', 'submit']) !== -1;
            return (cannotType || $field.val().length >= threshold);
        },
        
        // ---
        // Events
        // ---

        /**
         * The default handler of error.form.bv event.
         * It will be called when there is a invalid field
         *
         * @param {jQuery.Event} e The jQuery event object
         */
        _onError: function(e) {
            if (e.isDefaultPrevented()) {
                return;
            }

            if ('submitted' === this.options.live) {
                // Enable live mode
                this.options.live = 'enabled';
                var that = this;
                for (var field in this.options.fields) {
                    (function(f) {
                        var fields  = that.getFieldElements(f);
                        if (fields.length) {
                            var type    = $(fields[0]).attr('type'),
                                event   = ('radio' === type || 'checkbox' === type || 'file' === type || 'SELECT' === $(fields[0]).get(0).tagName) ? 'change' : that._changeEvent,
                                trigger = that.options.fields[field].trigger || that.options.trigger || event,
                                events  = $.map(trigger.split(' '), function(item) {
                                    return item + '.live.bv';
                                }).join(' ');

                            fields.off(events).on(events, function() {
                                if (that._exceedThreshold($(this))) {
                                    that.validateField($(this));
                                }
                            });
                        }
                    })(field);
                }
            }

            // Determined the first invalid field which will be focused on automatically
            for (var i = 0; i < this.$invalidFields.length; i++) {
                var $field    = this.$invalidFields.eq(i),
                    autoFocus = this._isOptionEnabled($field.attr('data-bv-field'), 'autoFocus');
                if (autoFocus) {
                    // Activate the tab containing the field if exists
                    var $tabPane = $field.parents('.tab-pane'), tabId;
                    if ($tabPane && (tabId = $tabPane.attr('id'))) {
                        $('a[href="#' + tabId + '"][data-toggle="tab"]').tab('show');
                    }

                    // Focus the field
                    $field.focus();
                    break;
                }
            }
        },

        /**
         * The default handler of success.form.bv event.
         * It will be called when all the fields are valid
         *
         * @param {jQuery.Event} e The jQuery event object
         */
        _onSuccess: function(e) {
            if (e.isDefaultPrevented()) {
                return;
            }

            // Submit the form
            this.disableSubmitButtons(true).defaultSubmit();
        },

        /**
         * Called after validating a field element
         *
         * @param {jQuery} $field The field element
         * @param {String} [validatorName] The validator name
         */
        _onFieldValidated: function($field, validatorName) {
            var field         = $field.attr('data-bv-field'),
                validators    = this.options.fields[field].validators,
                counter       = {},
                numValidators = 0,
                data          = {
                    bv: this,
                    field: field,
                    element: $field,
                    validator: validatorName,
                    result: $field.data('bv.response.' + validatorName)
                };

            // Trigger an event after given validator completes
            if (validatorName) {
                switch ($field.data('bv.result.' + validatorName)) {
                    case this.STATUS_INVALID:
                        $field.trigger($.Event(this.options.events.validatorError), data);
                        break;
                    case this.STATUS_VALID:
                        $field.trigger($.Event(this.options.events.validatorSuccess), data);
                        break;
                    default:
                        break;
                }
            }

            counter[this.STATUS_NOT_VALIDATED] = 0;
            counter[this.STATUS_VALIDATING]    = 0;
            counter[this.STATUS_INVALID]       = 0;
            counter[this.STATUS_VALID]         = 0;

            for (var v in validators) {
                if (validators[v].enabled === false) {
                    continue;
                }

                numValidators++;
                var result = $field.data('bv.result.' + v);
                if (result) {
                    counter[result]++;
                }
            }

            if (counter[this.STATUS_VALID] === numValidators) {
                // Remove from the list of invalid fields
                this.$invalidFields = this.$invalidFields.not($field);

                $field.trigger($.Event(this.options.events.fieldSuccess), data);
            }
            // If all validators are completed and there is at least one validator which doesn't pass
            else if ((counter[this.STATUS_NOT_VALIDATED] === 0 || !this._isOptionEnabled(field, 'verbose')) && counter[this.STATUS_VALIDATING] === 0 && counter[this.STATUS_INVALID] > 0) {
                // Add to the list of invalid fields
                this.$invalidFields = this.$invalidFields.add($field);

                $field.trigger($.Event(this.options.events.fieldError), data);
            }
        },

        /**
         * Check whether or not a field option is enabled
         *
         * @param {String} field The field name
         * @param {String} option The option name, "verbose", "autoFocus", for example
         * @returns {Boolean}
         */
        _isOptionEnabled: function(field, option) {
            if (this.options.fields[field] && (this.options.fields[field][option] === 'true' || this.options.fields[field][option] === true)) {
                return true;
            }
            if (this.options.fields[field] && (this.options.fields[field][option] === 'false' || this.options.fields[field][option] === false)) {
                return false;
            }
            return this.options[option] === 'true' || this.options[option] === true;
        },

        // ---
        // Public methods
        // ---

        /**
         * Retrieve the field elements by given name
         *
         * @param {String} field The field name
         * @returns {null|jQuery[]}
         */
        getFieldElements: function(field) {
            if (!this._cacheFields[field]) {
                this._cacheFields[field] = (this.options.fields[field] && this.options.fields[field].selector)
                                         ? $(this.options.fields[field].selector)
                                         : this.$form.find('[name="' + field + '"],[data-bv-field="'+field + '"]');
            }

            return this._cacheFields[field];
        },

        /**
         * Get the field options
         *
         * @param {String|jQuery} [field] The field name or field element. If it is not set, the method returns the form options
         * @param {String} [validator] The name of validator. It null, the method returns form options
         * @param {String} [option] The option name
         * @return {String|Object}
         */
        getOptions: function(field, validator, option) {
            if (!field) {
                return option ? this.options[option] : this.options;
            }
            if ('object' === typeof field) {
                field = field.attr('data-bv-field');
            }
            if (!this.options.fields[field]) {
                return null;
            }

            var options = this.options.fields[field];
            if (!validator) {
                return option ? options[option] : options;
            }
            if (!options.validators || !options.validators[validator]) {
                return null;
            }

            return option ? options.validators[validator][option] : options.validators[validator];
        },

        /**
         * Disable/enable submit buttons
         *
         * @param {Boolean} disabled Can be true or false
         * @returns {BootstrapValidator}
         */
        disableSubmitButtons: function(disabled) {
            if (!disabled) {
                this.$form.find(this.options.submitButtons).removeAttr('disabled');
            } else if (this.options.live !== 'disabled') {
                // Don't disable if the live validating mode is disabled
                this.$form.find(this.options.submitButtons).attr('disabled', 'disabled');
            }

            return this;
        },

        /**
         * Validate the form
         *
         * @returns {BootstrapValidator}
         */
        validate: function() {
            if (!this.options.fields) {
                return this;
            }
            this.disableSubmitButtons(true);

            this._submitIfValid = false;
            for (var field in this.options.fields) {
                this.validateField(field);
            }

            this._submit();
            this._submitIfValid = true;

            return this;
        },

        /**
         * Validate given field
         *
         * @param {String|jQuery} field The field name or field element
         * @returns {BootstrapValidator}
         */
        validateField: function(field) {
            var fields = $([]);
            switch (typeof field) {
                case 'object':
                    fields = field;
                    field  = field.attr('data-bv-field');
                    break;
                case 'string':
                    fields = this.getFieldElements(field);
                    break;
                default:
                    break;
            }

            if (fields.length === 0 || !this.options.fields[field] || this.options.fields[field].enabled === false) {
                return this;
            }

            var that       = this,
                type       = fields.attr('type'),
                total      = ('radio' === type || 'checkbox' === type) ? 1 : fields.length,
                updateAll  = ('radio' === type || 'checkbox' === type),
                validators = this.options.fields[field].validators,
                verbose    = this._isOptionEnabled(field, 'verbose'),
                validatorName,
                validateResult;

            for (var i = 0; i < total; i++) {
                var $field = fields.eq(i);
                if (this._isExcluded($field)) {
                    continue;
                }

                var stop = false;
                for (validatorName in validators) {
                    if ($field.data('bv.dfs.' + validatorName)) {
                        $field.data('bv.dfs.' + validatorName).reject();
                    }
                    if (stop) {
                        break;
                    }

                    // Don't validate field if it is already done
                    var result = $field.data('bv.result.' + validatorName);
                    if (result === this.STATUS_VALID || result === this.STATUS_INVALID) {
                        this._onFieldValidated($field, validatorName);
                        continue;
                    } else if (validators[validatorName].enabled === false) {
                        this.updateStatus(updateAll ? field : $field, this.STATUS_VALID, validatorName);
                        continue;
                    }

                    $field.data('bv.result.' + validatorName, this.STATUS_VALIDATING);
                    validateResult = $.fn.bootstrapValidator.validators[validatorName].validate(this, $field, validators[validatorName]);

                    // validateResult can be a $.Deferred object ...
                    if ('object' === typeof validateResult && validateResult.resolve) {
                        this.updateStatus(updateAll ? field : $field, this.STATUS_VALIDATING, validatorName);
                        $field.data('bv.dfs.' + validatorName, validateResult);

                        validateResult.done(function($f, v, response) {
                            // v is validator name
                            $f.removeData('bv.dfs.' + v).data('bv.response.' + v, response);
                            if (response.message) {
                                that.updateMessage($f, v, response.message);
                            }

                            that.updateStatus(updateAll ? $f.attr('data-bv-field') : $f, response.valid ? that.STATUS_VALID : that.STATUS_INVALID, v);

                            if (response.valid && that._submitIfValid === true) {
                                // If a remote validator returns true and the form is ready to submit, then do it
                                that._submit();
                            } else if (!response.valid && !verbose) {
                                stop = true;
                            }
                        });
                    }
                    // ... or object { valid: true/false, message: 'dynamic message' }
                    else if ('object' === typeof validateResult && validateResult.valid !== undefined && validateResult.message !== undefined) {
                        $field.data('bv.response.' + validatorName, validateResult);
                        this.updateMessage(updateAll ? field : $field, validatorName, validateResult.message);
                        this.updateStatus(updateAll ? field : $field, validateResult.valid ? this.STATUS_VALID : this.STATUS_INVALID, validatorName);
                        if (!validateResult.valid && !verbose) {
                            break;
                        }
                    }
                    // ... or a boolean value
                    else if ('boolean' === typeof validateResult) {
                        $field.data('bv.response.' + validatorName, validateResult);
                        this.updateStatus(updateAll ? field : $field, validateResult ? this.STATUS_VALID : this.STATUS_INVALID, validatorName);
                        if (!validateResult && !verbose) {
                            break;
                        }
                    }
                }
            }

            return this;
        },

        /**
         * Update the error message
         *
         * @param {String|jQuery} field The field name or field element
         * @param {String} validator The validator name
         * @param {String} message The message
         * @returns {BootstrapValidator}
         */
        updateMessage: function(field, validator, message) {
            var $fields = $([]);
            switch (typeof field) {
                case 'object':
                    $fields = field;
                    field   = field.attr('data-bv-field');
                    break;
                case 'string':
                    $fields = this.getFieldElements(field);
                    break;
                default:
                    break;
            }

            $fields.each(function() {
                $(this).data('bv.messages').find('.help-block[data-bv-validator="' + validator + '"][data-bv-for="' + field + '"]').html(message);
            });
        },
        
        /**
         * Update all validating results of field
         *
         * @param {String|jQuery} field The field name or field element
         * @param {String} status The status. Can be 'NOT_VALIDATED', 'VALIDATING', 'INVALID' or 'VALID'
         * @param {String} [validatorName] The validator name. If null, the method updates validity result for all validators
         * @returns {BootstrapValidator}
         */
        updateStatus: function(field, status, validatorName) {
            var fields = $([]);
            switch (typeof field) {
                case 'object':
                    fields = field;
                    field  = field.attr('data-bv-field');
                    break;
                case 'string':
                    fields = this.getFieldElements(field);
                    break;
                default:
                    break;
            }

            if (status === this.STATUS_NOT_VALIDATED) {
                // Reset the flag
                // To prevent the form from doing submit when a deferred validator returns true while typing
                this._submitIfValid = false;
            }

            var that  = this,
                type  = fields.attr('type'),
                group = this.options.fields[field].group || this.options.group,
                total = ('radio' === type || 'checkbox' === type) ? 1 : fields.length,
                feedbackIcons = this.options.feedbackIcons,
                fieldValidators = this.options.fields[field].validators;

            for (var i = 0; i < total; i++) {
                var $field       = fields.eq(i);
                if (this._isExcluded($field)) {
                    continue;
                }

                var $parent      = $field.parents(group),
                    $message     = $field.data('bv.messages'),
                    $allErrors   = $message.find('.help-block[data-bv-validator][data-bv-for="' + field + '"]'),
                    $errors      = validatorName ? $allErrors.filter('[data-bv-validator="' + validatorName + '"]') : $allErrors,
                    $icon        = $field.data('bv.icon'),
                    container    = ('function' === typeof (this.options.fields[field].container || this.options.container)) ? (this.options.fields[field].container || this.options.container).call(this, $field, this) : (this.options.fields[field].container || this.options.container),
                    isValidField = null;
                    
                // Update status
                if (validatorName) {
                    $field.data('bv.result.' + validatorName, status);
                } else {
                    for (var v in this.options.fields[field].validators) {
                        $field.data('bv.result.' + v, status);
                    }
                }

                // Show/hide error elements and feedback icons
                $errors.attr('data-bv-result', status);

                // Determine the tab containing the element
                var $tabPane = $field.parents('.tab-pane'),
                    tabId, $tab;
                if ($tabPane && (tabId = $tabPane.attr('id'))) {
                    $tab = $('a[href="#' + tabId + '"][data-toggle="tab"]').parent();
                }

                switch (status) {
                    case this.STATUS_VALIDATING:
                        isValidField = null;
                        this.disableSubmitButtons(true);
                        $parent.removeClass('has-success').removeClass('has-error');
                        if ($icon) {
                            $icon.removeClass(feedbackIcons.required).removeClass(this.options.feedbackIcons.valid).removeClass(this.options.feedbackIcons.invalid).addClass(this.options.feedbackIcons.validating).show();
                        }
                        if ($tab) {
                            $tab.removeClass('bv-tab-success').removeClass('bv-tab-error');
                        }

                        break;

                    case this.STATUS_INVALID:
                        isValidField = false;
                        this.disableSubmitButtons(true);
                        $parent.removeClass('has-success').addClass('has-error');
                        if ($icon) {
                            $icon.removeClass(feedbackIcons.required).removeClass(this.options.feedbackIcons.valid).removeClass(this.options.feedbackIcons.validating).addClass(this.options.feedbackIcons.invalid).show();
                        }
                        if ($tab) {
                            $tab.removeClass('bv-tab-success').addClass('bv-tab-error');
                        }

                        break;

                    case this.STATUS_VALID:
                        // If the field is valid (passes all validators)
                        isValidField = ($allErrors.filter('[data-bv-result="' + this.STATUS_NOT_VALIDATED +'"]').length === 0)
                                     ? ($allErrors.filter('[data-bv-result="' + this.STATUS_VALID +'"]').length === $allErrors.length)  // All validators are completed
                                     : null;                                                                                            // There are some validators that have not done
                        if (isValidField !== null) {
                            this.disableSubmitButtons(this.$submitButton ? !this.isValid() : !isValidField);
                            if ($icon) {
                                $icon
                                    .removeClass(feedbackIcons.required).removeClass(this.options.feedbackIcons.invalid).removeClass(this.options.feedbackIcons.validating).removeClass(this.options.feedbackIcons.valid)
                                    .addClass(isValidField ? this.options.feedbackIcons.valid : this.options.feedbackIcons.invalid)
                                    .show(); 
                            }
                        }

                        $parent.removeClass('has-error has-success').addClass(this.isValidContainer($parent) ? 'has-success' : 'has-error');
                        if ($tab) {
                            $tab.removeClass('bv-tab-success').removeClass('bv-tab-error').addClass(this.isValidContainer($tabPane) ? 'bv-tab-success' : 'bv-tab-error');
                        }
                        break;

                    case this.STATUS_NOT_VALIDATED:
                    /* falls through */
                    default:
                        isValidField = null;
                        this.disableSubmitButtons(false);
                        $parent.removeClass('has-success').removeClass('has-error');
                        if ($icon) {
                            $icon.removeClass(this.options.feedbackIcons.valid).removeClass(this.options.feedbackIcons.invalid).removeClass(this.options.feedbackIcons.validating).hide();
                            if (fieldValidators.notEmpty && feedbackIcons.required) {
                                // The field uses notEmpty validator
                                // Add required icon
                                $icon.addClass(feedbackIcons.required).show();
                            }
                        }
                        if ($tab) {
                            $tab.removeClass('bv-tab-success').removeClass('bv-tab-error');
                        }


                        break;
                }

                switch (true) {
                    // Only show the first error message if it is placed inside a tooltip ...
                    case ($icon && 'tooltip' === container):
                        (isValidField === false)
                                ? $icon.css('cursor', 'pointer').tooltip('destroy').tooltip({
                                    container: 'body',
                                    html: true,
                                    placement: 'auto top',
                                    title: $allErrors.filter('[data-bv-result="' + that.STATUS_INVALID + '"]').eq(0).html()
                                })
                                : $icon.css('cursor', '').tooltip('destroy');
                        break;
                    // ... or popover
                    case ($icon && 'popover' === container):
                        (isValidField === false)
                                ? $icon.css('cursor', 'pointer').popover('destroy').popover({
                                    container: 'body',
                                    content: $allErrors.filter('[data-bv-result="' + that.STATUS_INVALID + '"]').eq(0).html(),
                                    html: true,
                                    placement: 'auto top',
                                    trigger: 'hover click'
                                })
                                : $icon.css('cursor', '').popover('destroy');
                        break;
                    default:
                        (status === this.STATUS_INVALID) ? $errors.show() : $errors.hide();
                        break;
                }

                // Trigger an event
                $field.trigger($.Event(this.options.events.fieldStatus), {
                    bv: this,
                    field: field,
                    element: $field,
                    status: status
                });
                this._onFieldValidated($field, validatorName);
            }

            return this;
        },

        /**
         * Check the form validity
         *
         * @returns {Boolean}
         */
        isValid: function() {
            for (var field in this.options.fields) {
                if (!this.isValidField(field)) {
                    return false;
                }
            }

            return true;
        },

        /**
         * Check if the field is valid or not
         *
         * @param {String|jQuery} field The field name or field element
         * @returns {Boolean}
         */
        isValidField: function(field) {
            var fields = $([]);
            switch (typeof field) {
                case 'object':
                    fields = field;
                    field  = field.attr('data-bv-field');
                    break;
                case 'string':
                    fields = this.getFieldElements(field);
                    break;
                default:
                    break;
            }
            if (fields.length === 0 || !this.options.fields[field] || this.options.fields[field].enabled === false) {
                return true;
            }

            var type  = fields.attr('type'),
                total = ('radio' === type || 'checkbox' === type) ? 1 : fields.length,
                $field, validatorName, status;
            for (var i = 0; i < total; i++) {
                $field = fields.eq(i);
                if (this._isExcluded($field)) {
                    continue;
                }

                for (validatorName in this.options.fields[field].validators) {
                    if (this.options.fields[field].validators[validatorName].enabled === false) {
                        continue;
                    }

                    status = $field.data('bv.result.' + validatorName);
                    if (status !== this.STATUS_VALID) {
                        return false;
                    }
                }
            }

            return true;
        },

        /**
         * Check if all fields inside a given container are valid.
         * It's useful when working with a wizard-like such as tab, collapse
         *
         * @param {String|jQuery} container The container selector or element
         * @returns {Boolean}
         */
        isValidContainer: function(container) {
            var that       = this,
                map        = {},
                $container = ('string' === typeof container) ? $(container) : container;
            if ($container.length === 0) {
                return true;
            }

            $container.find('[data-bv-field]').each(function() {
                var $field = $(this),
                    field  = $field.attr('data-bv-field');
                if (!that._isExcluded($field) && !map[field]) {
                    map[field] = $field;
                }
            });

            for (var field in map) {
                var $f = map[field];
                if ($f.data('bv.messages')
                      .find('.help-block[data-bv-validator][data-bv-for="' + field + '"]')
                      .filter('[data-bv-result="' + this.STATUS_INVALID +'"]')
                      .length > 0)
                {
                    return false;
                }
            }

            return true;
        },

        /**
         * Submit the form using default submission.
         * It also does not perform any validations when submitting the form
         */
        defaultSubmit: function() {
            if (this.$submitButton) {
                // Create hidden input to send the submit buttons
                $('<input/>')
                    .attr('type', 'hidden')
                    .attr('data-bv-submit-hidden', '')
                    .attr('name', this.$submitButton.attr('name'))
                    .val(this.$submitButton.val())
                    .appendTo(this.$form);
            }

            // Submit form
            this.$form.off('submit.bv').submit();
        },

        // ---
        // Useful APIs which aren't used internally
        // ---

        // /**
        //  * Get the list of invalid fields
        //  *
        //  * @returns {jQuery[]}
        //  */
        // getInvalidFields: function() {
        //     return this.$invalidFields;
        // },

        // /**
        //  * Returns the clicked submit button
        //  *
        //  * @returns {jQuery}
        //  */
        // getSubmitButton: function() {
        //     return this.$submitButton;
        // },

        /**
         * Get the error messages
         *
         * @param {String|jQuery} [field] The field name or field element
         * If the field is not defined, the method returns all error messages of all fields
         * @param {String} [validator] The name of validator
         * If the validator is not defined, the method returns error messages of all validators
         * @returns {String[]}
         */
        // getMessages: function(field, validator) {
        //     var that     = this,
        //         messages = [],
        //         $fields  = $([]);

        //     switch (true) {
        //         case (field && 'object' === typeof field):
        //             $fields = field;
        //             break;
        //         case (field && 'string' === typeof field):
        //             var f = this.getFieldElements(field);
        //             if (f.length > 0) {
        //                 var type = f.attr('type');
        //                 $fields = ('radio' === type || 'checkbox' === type) ? f.eq(0) : f;
        //             }
        //             break;
        //         default:
        //             $fields = this.$invalidFields;
        //             break;
        //     }

        //     var filter = validator ? '[data-bv-validator="' + validator + '"]' : '';
        //     $fields.each(function() {
        //         messages = messages.concat(
        //             $(this)
        //                 .data('bv.messages')
        //                 .find('.help-block[data-bv-for="' + $(this).attr('data-bv-field') + '"][data-bv-result="' + that.STATUS_INVALID + '"]' + filter)
        //                 .map(function() {
        //                     var v = $(this).attr('data-bv-validator'),
        //                         f = $(this).attr('data-bv-for');
        //                     return (that.options.fields[f].validators[v].enabled === false) ? '' : $(this).html();
        //                 })
        //                 .get()
        //         );
        //     });

        //     return messages;
        // },

        /**
         * Update the option of a specific validator
         *
         * @param {String|jQuery} field The field name or field element
         * @param {String} validator The validator name
         * @param {String} option The option name
         * @param {String} value The value to set
         * @returns {BootstrapValidator}
         */
        // updateOption: function(field, validator, option, value) {
        //     if ('object' === typeof field) {
        //         field = field.attr('data-bv-field');
        //     }
        //     if (this.options.fields[field] && this.options.fields[field].validators[validator]) {
        //         this.options.fields[field].validators[validator][option] = value;
        //         this.updateStatus(field, this.STATUS_NOT_VALIDATED, validator);
        //     }

        //     return this;
        // },

        /**
         * Add a new field
         *
         * @param {String|jQuery} field The field name or field element
         * @param {Object} [options] The validator rules
         * @returns {BootstrapValidator}
         */
        addField: function(field, options) {
            var fields = $([]);
            switch (typeof field) {
                case 'object':
                    fields = field;
                    field  = field.attr('data-bv-field') || field.attr('name');
                    break;
                case 'string':
                    delete this._cacheFields[field];
                    fields = this.getFieldElements(field);
                    break;
                default:
                    break;
            }

            // maybe something not need validate
            //fields.attr('data-bv-field', field);

            var type  = fields.attr('type'),
                total = ('radio' === type || 'checkbox' === type) ? 1 : fields.length;

            for (var i = 0; i < total; i++) {
                var $field = fields.eq(i);

                // Try to parse the options from HTML attributes
                var opts = this._parseOptions($field);
                opts = (opts === null) ? options : $.extend(true, options, opts);

                if(!opts) continue;

                //add tag for field
                $field.attr('data-bv-field', field);

                this.options.fields[field] = $.extend(true, this.options.fields[field], opts);

                // Update the cache
                this._cacheFields[field] = this._cacheFields[field] ? this._cacheFields[field].add($field) : $field;

                // Init the element
                this._initField(('checkbox' === type || 'radio' === type) ? field : $field);
            }

            this.disableSubmitButtons(false);
            // Trigger an event
            this.$form.trigger($.Event(this.options.events.fieldAdded), {
                field: field,
                element: fields,
                options: this.options.fields[field]
            });

            return this;
        },

        /**
         * Remove a given field
         *
         * @param {String|jQuery} field The field name or field element
         * @returns {BootstrapValidator}
         */
        removeField: function(field) {
            var fields = $([]);
            switch (typeof field) {
                case 'object':
                    fields = field;
                    field  = field.attr('data-bv-field') || field.attr('name');
                    fields.attr('data-bv-field', field);
                    break;
                case 'string':
                    fields = this.getFieldElements(field);
                    break;
                default:
                    break;
            }

            if (fields.length === 0) {
                return this;
            }

            var type  = fields.attr('type'),
                total = ('radio' === type || 'checkbox' === type) ? 1 : fields.length;

            for (var i = 0; i < total; i++) {
                var $field = fields.eq(i);

                // Remove from the list of invalid fields
                this.$invalidFields = this.$invalidFields.not($field);

                // Update the cache
                this._cacheFields[field] = this._cacheFields[field].not($field);
            }

            if (!this._cacheFields[field] || this._cacheFields[field].length === 0) {
                delete this.options.fields[field];
            }
            if ('checkbox' === type || 'radio' === type) {
                this._initField(field);
            }

            this.disableSubmitButtons(false);
            // Trigger an event
            this.$form.trigger($.Event(this.options.events.fieldRemoved), {
                field: field,
                element: fields
            });

            return this;
        },

        /**
         * Reset given field
         *
         * @param {String|jQuery} field The field name or field element
         * @param {Boolean} [resetValue] If true, the method resets field value to empty or remove checked/selected attribute (for radio/checkbox)
         * @returns {BootstrapValidator}
         */
        resetField: function(field, resetValue) {
            var $fields = $([]);
            switch (typeof field) {
                case 'object':
                    $fields = field;
                    field   = field.attr('data-bv-field');
                    break;
                case 'string':
                    $fields = this.getFieldElements(field);
                    break;
                default:
                    break;
            }

            var total = $fields.length;
            if (this.options.fields[field]) {
                for (var i = 0; i < total; i++) {
                    for (var validator in this.options.fields[field].validators) {
                        $fields.eq(i).removeData('bv.dfs.' + validator);
                    }
                }
            }

            // Mark field as not validated yet
            this.updateStatus(field, this.STATUS_NOT_VALIDATED);

            if (resetValue) {
                var type = $fields.attr('type');
                ('radio' === type || 'checkbox' === type) ? $fields.removeAttr('checked').removeAttr('selected') : $fields.val('');
            }

            return this;
        },

        /**
         * Reset the form
         *
         * @param {Boolean} [resetValue] If true, the method resets field value to empty or remove checked/selected attribute (for radio/checkbox)
         * @returns {BootstrapValidator}
         */
        resetForm: function(resetValue) {
            for (var field in this.options.fields) {
                this.resetField(field, resetValue);
            }

            this.$invalidFields = $([]);
            this.$submitButton  = null;

            // Enable submit buttons
            this.disableSubmitButtons(false);

            return this;
        },

        /**
         * Revalidate given field
         * It's used when you need to revalidate the field which its value is updated by other plugin
         *
         * @param {String|jQuery} field The field name of field element
         * @returns {BootstrapValidator}
         */
        revalidateField: function(field) {
            this.updateStatus(field, this.STATUS_NOT_VALIDATED)
                .validateField(field);

            return this;
        },

        /**
         * Enable/Disable all validators to given field
         *
         * @param {String} field The field name
         * @param {Boolean} enabled Enable/Disable field validators
         * @param {String} [validatorName] The validator name. If null, all validators will be enabled/disabled
         * @returns {BootstrapValidator}
         */
        enableFieldValidators: function(field, enabled, validatorName) {
            var validators = this.options.fields[field].validators;

            // Enable/disable particular validator
            if (validatorName
                && validators
                && validators[validatorName] && validators[validatorName].enabled !== enabled)
            {
                this.options.fields[field].validators[validatorName].enabled = enabled;
                this.updateStatus(field, this.STATUS_NOT_VALIDATED, validatorName);
            }
            // Enable/disable all validators
            else if (!validatorName && this.options.fields[field].enabled !== enabled) {
                this.options.fields[field].enabled = enabled;
                for (var v in validators) {
                    this.enableFieldValidators(field, enabled, v);
                }
            }

            return this;
        },

        /**
         * Some validators have option which its value is dynamic.
         * For example, the zipCode validator has the country option which might be changed dynamically by a select element.
         *
         * @param {jQuery|String} field The field name or element
         * @param {String|Function} option The option which can be determined by:
         * - a string
         * - name of field which defines the value
         * - name of function which returns the value
         * - a function returns the value
         *
         * The callback function has the format of
         *      callback: function(value, validator, $field) {
         *          // value is the value of field
         *          // validator is the BootstrapValidator instance
         *          // $field is the field element
         *      }
         *
         * @returns {String}
         */
        getDynamicOption: function(field, option) {
            var $field = ('string' === typeof field) ? this.getFieldElements(field) : field,
                value  = $field.val();

            // Option can be determined by
            // ... a function
            if ('function' === typeof option) {
                return $.fn.bootstrapValidator.helpers.call(option, [value, this, $field]);
            }
            // ... value of other field
            else if ('string' === typeof option) {
                var $f = this.getFieldElements(option);
                if ($f.length) {
                    return $f.val();
                }
                // ... return value of callback
                else {
                    return $.fn.bootstrapValidator.helpers.call(option, [value, this, $field]) || option;
                }
            }

            return null;
        },

        /**
         * Destroy the plugin
         * It will remove all error messages, feedback icons and turn off the events
         */
        destroy: function() {
            var field, fields, $field, validator, $icon, group;
            for (field in this.options.fields) {
                fields    = this.getFieldElements(field);
                group     = this.options.fields[field].group || this.options.group;
                for (var i = 0; i < fields.length; i++) {
                    $field = fields.eq(i);
                    $field
                        // Remove all error messages
                        .data('bv.messages')
                            .find('.help-block[data-bv-validator][data-bv-for="' + field + '"]').remove().end()
                            .end()
                        .removeData('bv.messages')
                        // Remove feedback classes
                        .parents(group)
                            .removeClass('has-feedback has-error has-success')
                            .end()
                        // Turn off events
                        .off('.bv')
                        .removeAttr('data-bv-field');

                    // Remove feedback icons, tooltip/popover container
                    $icon = $field.data('bv.icon');
                    if ($icon) {
                        var container = ('function' === typeof (this.options.fields[field].container || this.options.container)) ? (this.options.fields[field].container || this.options.container).call(this, $field, this) : (this.options.fields[field].container || this.options.container);
                        switch (container) {
                            case 'tooltip':
                                $icon.tooltip('destroy').remove();
                                break;
                            case 'popover':
                                $icon.popover('destroy').remove();
                                break;
                            default:
                                $icon.remove();
                                break;
                        }
                    }
                    $field.removeData('bv.icon');

                    for (validator in this.options.fields[field].validators) {
                        if ($field.data('bv.dfs.' + validator)) {
                            $field.data('bv.dfs.' + validator).reject();
                        }
                        $field.removeData('bv.result.' + validator)
                              .removeData('bv.response.' + validator)
                              .removeData('bv.dfs.' + validator);

                        // Destroy the validator
                        if ('function' === typeof $.fn.bootstrapValidator.validators[validator].destroy) {
                            $.fn.bootstrapValidator.validators[validator].destroy(this, $field, this.options.fields[field].validators[validator]);
                        }
                    }
                }
            }

            this.disableSubmitButtons(false);   // Enable submit buttons
            this.$hiddenButton.remove();        // Remove the hidden button

            this.$form
                .removeClass(this.options.elementClass)
                .off('.bv')
                .removeData('bootstrapValidator')
                // Remove generated hidden elements
                .find('[data-bv-submit-hidden]').remove().end()
                .find('[type="submit"]').off('click.bv');
        }
    };

    // Plugin definition
    $.fn.bootstrapValidator = function(option) {
        var params = arguments;
        return this.each(function() {
            var $this   = $(this),
                data    = $this.data('bootstrapValidator'),
                options = 'object' === typeof option && option;
            if (!data) {
                data = new BootstrapValidator(this, options);
                $this.data('bootstrapValidator', data);
            }

            // Allow to call plugin method
            if ('string' === typeof option) {
                data[option].apply(data, Array.prototype.slice.call(params, 1));
            }
        });
    };

    // The default options
    // Sorted in alphabetical order
    $.fn.bootstrapValidator.DEFAULT_OPTIONS = {
        // The first invalid field will be focused automatically
        autoFocus: true,

        //The error messages container. It can be:
        // - 'tooltip' if you want to use Bootstrap tooltip to show error messages
        // - 'popover' if you want to use Bootstrap popover to show error messages
        // - a CSS selector indicating the container
        // In the first two cases, since the tooltip/popover should be small enough, the plugin only shows only one error message
        // You also can define the message container for particular field
        container: null,

        // The form CSS class
        elementClass: 'bv-form',

        // Use custom event name to avoid window.onerror being invoked by jQuery
        // See https://github.com/nghuuphuoc/bootstrapvalidator/issues/630
        events: {
            formInit: 'init.form.bv',
            formError: 'error.form.bv',
            formSuccess: 'success.form.bv',
            fieldAdded: 'added.field.bv',
            fieldRemoved: 'removed.field.bv',
            fieldInit: 'init.field.bv',
            fieldError: 'error.field.bv',
            fieldSuccess: 'success.field.bv',
            fieldStatus: 'status.field.bv',
            validatorError: 'error.validator.bv',
            validatorSuccess: 'success.validator.bv'
        },

        // Indicate fields which won't be validated
        // By default, the plugin will not validate the following kind of fields:
        // - disabled
        // - hidden
        // - invisible
        //
        // The setting consists of jQuery filters. Accept 3 formats:
        // - A string. Use a comma to separate filter
        // - An array. Each element is a filter
        // - An array. Each element can be a callback function
        //      function($field, validator) {
        //          $field is jQuery object representing the field element
        //          validator is the BootstrapValidator instance
        //          return true or false;
        //      }
        //
        // The 3 following settings are equivalent:
        //
        // 1) ':disabled, :hidden, :not(:visible)'
        // 2) [':disabled', ':hidden', ':not(:visible)']
        // 3) [':disabled', ':hidden', function($field) {
        //        return !$field.is(':visible');
        //    }]
        excluded: [':disabled', ':hidden', ':not(:visible)'],

        // Shows ok/error/loading icons based on the field validity.
        // This feature requires Bootstrap v3.1.0 or later (http://getbootstrap.com/css/#forms-control-validation).
        // Since Bootstrap doesn't provide any methods to know its version, this option cannot be on/off automatically.
        // In other word, to use this feature you have to upgrade your Bootstrap to v3.1.0 or later.
        //
        // Examples:
        // - Use Glyphicons icons:
        //  feedbackIcons: {
        //      valid: 'glyphicon glyphicon-ok',
        //      invalid: 'glyphicon glyphicon-remove',
        //      validating: 'glyphicon glyphicon-refresh'
        //  }
        // - Use FontAwesome icons:
        //  feedbackIcons: {
        //      valid: 'fa fa-check',
        //      invalid: 'fa fa-times',
        //      validating: 'fa fa-refresh'
        //  }
        feedbackIcons: {
            valid:      null,
            invalid:    null,
            validating: null
        },

        // Map the field name with validator rules
        fields: null,

        // The CSS selector for indicating the element consists the field
        // By default, each field is placed inside the <div class="form-group"></div>
        // You should adjust this option if your form group consists of many fields which not all of them need to be validated
        group: '.form-group',

        // Live validating option
        // Can be one of 3 values:
        // - enabled: The plugin validates fields as soon as they are changed
        // - disabled: Disable the live validating. The error messages are only shown after the form is submitted
        // - submitted: The live validating is enabled after the form is submitted
        live: 'enabled',

        // Default invalid message
        message: 'This value is not valid',

        // The submit buttons selector
        // These buttons will be disabled to prevent the valid form from multiple submissions
        submitButtons: '[type="submit"]',

        // The field will not be live validated if its length is less than this number of characters
        threshold: null,

        // Whether to be verbose when validating a field or not.
        // Possible values:
        // - true:  when a field has multiple validators, all of them will be checked, and respectively - if errors occur in
        //          multiple validators, all of them will be displayed to the user
        // - false: when a field has multiple validators, validation for this field will be terminated upon the first encountered error.
        //          Thus, only the very first error message related to this field will be displayed to the user
        verbose: true
    };

    // Available validators
    $.fn.bootstrapValidator.validators  = {};

    // i18n
    $.fn.bootstrapValidator.i18n        = {};

    $.fn.bootstrapValidator.Constructor = BootstrapValidator;

    // Helper methods, which can be used in validator class
    $.fn.bootstrapValidator.helpers = {
        /**
         * Execute a callback function
         *
         * @param {String|Function} functionName Can be
         * - name of global function
         * - name of namespace function (such as A.B.C)
         * - a function
         * @param {Array} args The callback arguments
         */
        call: function(functionName, args) {
            if ('function' === typeof functionName) {
                return functionName.apply(this, args);
            } else if ('string' === typeof functionName) {
                if ('()' === functionName.substring(functionName.length - 2)) {
                    functionName = functionName.substring(0, functionName.length - 2);
                }
                var ns      = functionName.split('.'),
                    func    = ns.pop(),
                    context = window;
                for (var i = 0; i < ns.length; i++) {
                    context = context[ns[i]];
                }

                return (typeof context[func] === 'undefined') ? null : context[func].apply(this, args);
            }
        },

        /**
         * Format a string
         * It's used to format the error message
         * format('The field must between %s and %s', [10, 20]) = 'The field must between 10 and 20'
         *
         * @param {String} message
         * @param {Array} parameters
         * @returns {String}
         */
        format: function(message, parameters) {
            if (!$.isArray(parameters)) {
                parameters = [parameters];
            }

            for (var i in parameters) {
                message = message.replace('%s', parameters[i]);
            }

            return message;
        },

        /**
         * Validate a date
         *
         * @param {Number} year The full year in 4 digits
         * @param {Number} month The month number
         * @param {Number} day The day number
         * @param {Boolean} [notInFuture] If true, the date must not be in the future
         * @returns {Boolean}
         */
        date: function(year, month, day, notInFuture) {
            if (isNaN(year) || isNaN(month) || isNaN(day)) {
                return false;
            }
            if (day.length > 2 || month.length > 2 || year.length > 4) {
                return false;
            }

            day   = parseInt(day, 10);
            month = parseInt(month, 10);
            year  = parseInt(year, 10);

            if (year < 1000 || year > 9999 || month <= 0 || month > 12) {
                return false;
            }
            var numDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            // Update the number of days in Feb of leap year
            if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
                numDays[1] = 29;
            }

            // Check the day
            if (day <= 0 || day > numDays[month - 1]) {
                return false;
            }

            if (notInFuture === true) {
                var currentDate  = new Date(),
                    currentYear  = currentDate.getFullYear(),
                    currentMonth = currentDate.getMonth(),
                    currentDay   = currentDate.getDate();
                return (year < currentYear
                        || (year === currentYear && month - 1 < currentMonth)
                        || (year === currentYear && month - 1 === currentMonth && day < currentDay));
            }

            return true;
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.i18n.between = $.extend($.fn.bootstrapValidator.i18n.between || {}, {
        'default': 'Please enter a value between %s and %s',
        notInclusive: 'Please enter a value between %s and %s strictly'
    });

    $.fn.bootstrapValidator.validators.between = {
        html5Attributes: {
            message: 'message',
            min: 'min',
            max: 'max',
            inclusive: 'inclusive'
        },

        enableByHtml5: function($field) {
            if ('range' === $field.attr('type')) {
                return {
                    min: $field.attr('min'),
                    max: $field.attr('max')
                };
            }

            return false;
        },

        /**
         * Return true if the input value is between (strictly or not) two given numbers
         *
         * @param {BootstrapValidator} validator The validator plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} options Can consist of the following keys:
         * - min
         * - max
         *
         * The min, max keys define the number which the field value compares to. min, max can be
         *      - A number
         *      - Name of field which its value defines the number
         *      - Name of callback function that returns the number
         *      - A callback function that returns the number
         *
         * - inclusive [optional]: Can be true or false. Default is true
         * - message: The invalid message
         * @returns {Boolean|Object}
         */
        validate: function(validator, $field, options) {
            var value = $field.val();
            if (value === '') {
                return true;
            }

			value = this._format(value);
            if (!$.isNumeric(value)) {
                return false;
            }

            var min      = $.isNumeric(options.min) ? options.min : validator.getDynamicOption($field, options.min),
                max      = $.isNumeric(options.max) ? options.max : validator.getDynamicOption($field, options.max),
                minValue = this._format(min),
                maxValue = this._format(max);

            value = parseFloat(value);
			return (options.inclusive === true || options.inclusive === undefined)
                    ? {
                        valid: value >= minValue && value <= maxValue,
                        message: $.fn.bootstrapValidator.helpers.format(options.message || $.fn.bootstrapValidator.i18n.between['default'], [min, max])
                    }
                    : {
                        valid: value > minValue  && value <  maxValue,
                        message: $.fn.bootstrapValidator.helpers.format(options.message || $.fn.bootstrapValidator.i18n.between.notInclusive, [min, max])
                    };
        },

        _format: function(value) {
            return (value + '').replace(',', '.');
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.validators.blank = {
        /**
         * Placeholder validator that can be used to display a custom validation message
         * returned from the server
         * Example:
         *
         * (1) a "blank" validator is applied to an input field.
         * (2) data is entered via the UI that is unable to be validated client-side.
         * (3) server returns a 400 with JSON data that contains the field that failed
         *     validation and an associated message.
         * (4) ajax 400 call handler does the following:
         *
         *      bv.updateMessage(field, 'blank', errorMessage);
         *      bv.updateStatus(field, 'INVALID');
         *
         * @see https://github.com/nghuuphuoc/bootstrapvalidator/issues/542
         * @see https://github.com/nghuuphuoc/bootstrapvalidator/pull/666
         * @param {BootstrapValidator} validator The validator plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} options Can consist of the following keys:
         * - message: The invalid message
         * @returns {Boolean}
         */
        validate: function(validator, $field, options) {
            return true;
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.i18n.callback = $.extend($.fn.bootstrapValidator.i18n.callback || {}, {
        'default': 'Please enter a valid value'
    });

    $.fn.bootstrapValidator.validators.callback = {
        html5Attributes: {
            message: 'message',
            callback: 'callback'
        },

        /**
         * Return result from the callback method
         *
         * @param {BootstrapValidator} validator The validator plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} options Can consist of the following keys:
         * - callback: The callback method that passes 2 parameters:
         *      callback: function(fieldValue, validator, $field) {
         *          // fieldValue is the value of field
         *          // validator is instance of BootstrapValidator
         *          // $field is the field element
         *      }
         * - message: The invalid message
         * @returns {Deferred}
         */
        validate: function(validator, $field, options) {
            var value  = $field.val(),
                dfd    = new $.Deferred(),
                result = { valid: true };

            if (options.callback) {
                var response = $.fn.bootstrapValidator.helpers.call(options.callback, [value, validator, $field]);
                result = ('boolean' === typeof response) ? { valid: response } :  response;
            }

            dfd.resolve($field, 'callback', result);
            return dfd;
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.i18n.choice = $.extend($.fn.bootstrapValidator.i18n.choice || {}, {
        'default': 'Please enter a valid value',
        less: 'Please choose %s options at minimum',
        more: 'Please choose %s options at maximum',
        between: 'Please choose %s - %s options'
    });

    $.fn.bootstrapValidator.validators.choice = {
        html5Attributes: {
            message: 'message',
            min: 'min',
            max: 'max'
        },

        /**
         * Check if the number of checked boxes are less or more than a given number
         *
         * @param {BootstrapValidator} validator The validator plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} options Consists of following keys:
         * - min
         * - max
         *
         * At least one of two keys is required
         * The min, max keys define the number which the field value compares to. min, max can be
         *      - A number
         *      - Name of field which its value defines the number
         *      - Name of callback function that returns the number
         *      - A callback function that returns the number
         *
         * - message: The invalid message
         * @returns {Object}
         */
        validate: function(validator, $field, options) {
            var numChoices = $field.is('select')
                            ? validator.getFieldElements($field.attr('data-bv-field')).find('option').filter(':selected').length
                            : validator.getFieldElements($field.attr('data-bv-field')).filter(':checked').length,
                min        = options.min ? ($.isNumeric(options.min) ? options.min : validator.getDynamicOption($field, options.min)) : null,
                max        = options.max ? ($.isNumeric(options.max) ? options.max : validator.getDynamicOption($field, options.max)) : null,
                isValid    = true,
                message    = options.message || $.fn.bootstrapValidator.i18n.choice['default'];

            if ((min && numChoices < parseInt(min, 10)) || (max && numChoices > parseInt(max, 10))) {
                isValid = false;
            }

            switch (true) {
                case (!!min && !!max):
                    message = $.fn.bootstrapValidator.helpers.format(options.message || $.fn.bootstrapValidator.i18n.choice.between, [parseInt(min, 10), parseInt(max, 10)]);
                    break;

                case (!!min):
                    message = $.fn.bootstrapValidator.helpers.format(options.message || $.fn.bootstrapValidator.i18n.choice.less, parseInt(min, 10));
                    break;

                case (!!max):
                    message = $.fn.bootstrapValidator.helpers.format(options.message || $.fn.bootstrapValidator.i18n.choice.more, parseInt(max, 10));
                    break;

                default:
                    break;
            }

            return { valid: isValid, message: message };
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.i18n.date = $.extend($.fn.bootstrapValidator.i18n.date || {}, {
        'default': 'Please enter a valid date',
        min: 'Please enter a date after %s',
        max: 'Please enter a date before %s',
        range: 'Please enter a date in the range %s - %s'
    });

    $.fn.bootstrapValidator.validators.date = {
        html5Attributes: {
            message: 'message',
            format: 'format',
            min: 'min',
            max: 'max',
            separator: 'separator'
        },

        /**
         * Return true if the input value is valid date
         *
         * @param {BootstrapValidator} validator The validator plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} options Can consist of the following keys:
         * - message: The invalid message
         * - min: the minimum date
         * - max: the maximum date
         * - separator: Use to separate the date, month, and year.
         * By default, it is /
         * - format: The date format. Default is MM/DD/YYYY
         * The format can be:
         *
         * i) date: Consist of DD, MM, YYYY parts which are separated by the separator option
         * ii) date and time:
         * The time can consist of h, m, s parts which are separated by :
         * ii) date, time and A (indicating AM or PM)
         * @returns {Boolean|Object}
         */
        validate: function(validator, $field, options) {
            var value = $field.val();
            if (value === '') {
                return true;
            }

            options.format = options.format || 'MM/DD/YYYY';

            // #683: Force the format to YYYY-MM-DD as the default browser behaviour when using type="date" attribute
            if ($field.attr('type') === 'date') {
                options.format = 'YYYY-MM-DD';
            }

            var formats    = options.format.split(' '),
                dateFormat = formats[0],
                timeFormat = (formats.length > 1) ? formats[1] : null,
                amOrPm     = (formats.length > 2) ? formats[2] : null,
                sections   = value.split(' '),
                date       = sections[0],
                time       = (sections.length > 1) ? sections[1] : null;

            if (formats.length !== sections.length) {
                return {
                    valid: false,
                    message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                };
            }

            // Determine the separator
            var separator = options.separator;
            if (!separator) {
                separator = (date.indexOf('/') !== -1) ? '/' : ((date.indexOf('-') !== -1) ? '-' : null);
            }
            if (separator === null || date.indexOf(separator) === -1) {
                return {
                    valid: false,
                    message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                };
            }

            // Determine the date
            date       = date.split(separator);
            dateFormat = dateFormat.split(separator);
            if (date.length !== dateFormat.length) {
                return {
                    valid: false,
                    message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                };
            }

            var year  = date[$.inArray('YYYY', dateFormat)],
                month = date[$.inArray('MM', dateFormat)],
                day   = date[$.inArray('DD', dateFormat)];

            if (!year || !month || !day || year.length !== 4) {
                return {
                    valid: false,
                    message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                };
            }

            // Determine the time
            var minutes = null, hours = null, seconds = null;
            if (timeFormat) {
                timeFormat = timeFormat.split(':');
                time       = time.split(':');

                if (timeFormat.length !== time.length) {
                    return {
                        valid: false,
                        message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                    };
                }

                hours   = time.length > 0 ? time[0] : null;
                minutes = time.length > 1 ? time[1] : null;
                seconds = time.length > 2 ? time[2] : null;

                // Validate seconds
                if (seconds) {
                    if (isNaN(seconds) || seconds.length > 2) {
                        return {
                            valid: false,
                            message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                        };
                    }
                    seconds = parseInt(seconds, 10);
                    if (seconds < 0 || seconds > 60) {
                        return {
                            valid: false,
                            message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                        };
                    }
                }

                // Validate hours
                if (hours) {
                    if (isNaN(hours) || hours.length > 2) {
                        return {
                            valid: false,
                            message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                        };
                    }
                    hours = parseInt(hours, 10);
                    if (hours < 0 || hours >= 24 || (amOrPm && hours > 12)) {
                        return {
                            valid: false,
                            message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                        };
                    }
                }

                // Validate minutes
                if (minutes) {
                    if (isNaN(minutes) || minutes.length > 2) {
                        return {
                            valid: false,
                            message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                        };
                    }
                    minutes = parseInt(minutes, 10);
                    if (minutes < 0 || minutes > 59) {
                        return {
                            valid: false,
                            message: options.message || $.fn.bootstrapValidator.i18n.date['default']
                        };
                    }
                }
            }

            // Validate day, month, and year
            var valid   = $.fn.bootstrapValidator.helpers.date(year, month, day),
                message = options.message || $.fn.bootstrapValidator.i18n.date['default'];

            // declare the date, min and max objects
            var min       = null,
                max       = null,
                minOption = options.min,
                maxOption = options.max;

            if (minOption) {
                if (isNaN(Date.parse(minOption))) {
                    minOption = validator.getDynamicOption($field, minOption);
                }
                min = this._parseDate(minOption, dateFormat, separator);
            }

            if (maxOption) {
                if (isNaN(Date.parse(maxOption))) {
                    maxOption = validator.getDynamicOption($field, maxOption);
                }
                max = this._parseDate(maxOption, dateFormat, separator);
            }

            date = new Date(year, month, day, hours, minutes, seconds);

            switch (true) {
                case (minOption && !maxOption && valid):
                    valid   = date.getTime() >= min.getTime();
                    message = options.message || $.fn.bootstrapValidator.helpers.format($.fn.bootstrapValidator.i18n.date.min, minOption);
                    break;

                case (maxOption && !minOption && valid):
                    valid   = date.getTime() <= max.getTime();
                    message = options.message || $.fn.bootstrapValidator.helpers.format($.fn.bootstrapValidator.i18n.date.max, maxOption);
                    break;

                case (maxOption && minOption && valid):
                    valid   = date.getTime() <= max.getTime() && date.getTime() >= min.getTime();
                    message = options.message || $.fn.bootstrapValidator.helpers.format($.fn.bootstrapValidator.i18n.date.range, [minOption, maxOption]);
                    break;

                default:
                    break;
            }

            return {
                valid: valid,
                message: message
            };
        },

        /**
         * Return a date object after parsing the date string
         *
         * @param {String} date   The date string to parse
         * @param {String} format The date format
         * The format can be:
         *   - date: Consist of DD, MM, YYYY parts which are separated by the separator option
         *   - date and time:
         *     The time can consist of h, m, s parts which are separated by :
         * @param {String} separator The separator used to separate the date, month, and year
         * @returns {Date}
         */
        _parseDate: function(date, format, separator) {
            var minutes     = 0, hours = 0, seconds = 0,
                sections    = date.split(' '),
                dateSection = sections[0],
                timeSection = (sections.length > 1) ? sections[1] : null;

            dateSection = dateSection.split(separator);
            var year  = dateSection[$.inArray('YYYY', format)],
                month = dateSection[$.inArray('MM', format)],
                day   = dateSection[$.inArray('DD', format)];
            if (timeSection) {
                timeSection = timeSection.split(':');
                hours       = timeSection.length > 0 ? timeSection[0] : null;
                minutes     = timeSection.length > 1 ? timeSection[1] : null;
                seconds     = timeSection.length > 2 ? timeSection[2] : null;
            }

            return new Date(year, month, day, hours, minutes, seconds);
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.i18n.different = $.extend($.fn.bootstrapValidator.i18n.different || {}, {
        'default': 'Please enter a different value'
    });

    $.fn.bootstrapValidator.validators.different = {
        html5Attributes: {
            message: 'message',
            field: 'field'
        },

        /**
         * Return true if the input value is different with given field's value
         *
         * @param {BootstrapValidator} validator The validator plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} options Consists of the following key:
         * - field: The name of field that will be used to compare with current one
         * - message: The invalid message
         * @returns {Boolean}
         */
        validate: function(validator, $field, options) {
            var value = $field.val();
            if (value === '') {
                return true;
            }

            var fields  = options.field.split(','),
                isValid = true;

            for (var i = 0; i < fields.length; i++) {
                var compareWith = validator.getFieldElements(fields[i]);
                if (compareWith == null || compareWith.length === 0) {
                    continue;
                }

                var compareValue = compareWith.val();
                if (value === compareValue) {
                    isValid = false;
                } else if (compareValue !== '') {
                    validator.updateStatus(compareWith, validator.STATUS_VALID, 'different');
                }
            }

            return isValid;
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.i18n.digits = $.extend($.fn.bootstrapValidator.i18n.digits || {}, {
        'default': 'Please enter only digits'
    });

    $.fn.bootstrapValidator.validators.digits = {
        /**
         * Return true if the input value contains digits only
         *
         * @param {BootstrapValidator} validator Validate plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} [options]
         * @returns {Boolean}
         */
        validate: function(validator, $field, options) {
            var value = $field.val();
            if (value === '') {
                return true;
            }

            return /^\d+$/.test(value);
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.i18n.emailAddress = $.extend($.fn.bootstrapValidator.i18n.emailAddress || {}, {
        'default': 'Please enter a valid email address'
    });

    $.fn.bootstrapValidator.validators.emailAddress = {
        html5Attributes: {
            message: 'message',
            multiple: 'multiple',
            separator: 'separator'
        },

        enableByHtml5: function($field) {
            return ('email' === $field.attr('type'));
        },

        /**
         * Return true if and only if the input value is a valid email address
         *
         * @param {BootstrapValidator} validator Validate plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} [options]
         * - multiple: Allow multiple email addresses, separated by a comma or semicolon; default is false.
         * - separator: Regex for character or characters expected as separator between addresses; default is comma /[,;]/, i.e. comma or semicolon.
         * @returns {Boolean}
         */
        validate: function(validator, $field, options) {
            var value = $field.val();
            if (value === '') {
                return true;
            }

            // Email address regular expression
            // http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
            var emailRegExp   = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
                allowMultiple = options.multiple === true || options.multiple === 'true';

            if (allowMultiple) {
                var separator = options.separator || /[,;]/,
                    addresses = this._splitEmailAddresses(value, separator);

                for (var i = 0; i < addresses.length; i++) {
                    if (!emailRegExp.test(addresses[i])) {
                        return false;
                    }
                }

                return true;
            } else {
                return emailRegExp.test(value);
            }
        },

        _splitEmailAddresses: function(emailAddresses, separator) {
            var quotedFragments     = emailAddresses.split(/"/),
                quotedFragmentCount = quotedFragments.length,
                emailAddressArray   = [],
                nextEmailAddress    = '';

            for (var i = 0; i < quotedFragmentCount; i++) {
                if (i % 2 === 0) {
                    var splitEmailAddressFragments     = quotedFragments[i].split(separator),
                        splitEmailAddressFragmentCount = splitEmailAddressFragments.length;

                    if (splitEmailAddressFragmentCount === 1) {
                        nextEmailAddress += splitEmailAddressFragments[0];
                    } else {
                        emailAddressArray.push(nextEmailAddress + splitEmailAddressFragments[0]);

                        for (var j = 1; j < splitEmailAddressFragmentCount - 1; j++) {
                            emailAddressArray.push(splitEmailAddressFragments[j]);
                        }
                        nextEmailAddress = splitEmailAddressFragments[splitEmailAddressFragmentCount - 1];
                    }
                } else {
                    nextEmailAddress += '"' + quotedFragments[i];
                    if (i < quotedFragmentCount - 1) {
                        nextEmailAddress += '"';
                    }
                }
            }

            emailAddressArray.push(nextEmailAddress);
            return emailAddressArray;
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.i18n.file = $.extend($.fn.bootstrapValidator.i18n.file || {}, {
        'default': 'Please choose a valid file'
    });

    $.fn.bootstrapValidator.validators.file = {
        html5Attributes: {
            extension: 'extension',
            maxfiles: 'maxFiles',
            minfiles: 'minFiles',
            maxsize: 'maxSize',
            minsize: 'minSize',
            maxtotalsize: 'maxTotalSize',
            mintotalsize: 'minTotalSize',
            message: 'message',
            type: 'type'
        },

        /**
         * Validate upload file. Use HTML 5 API if the browser supports
         *
         * @param {BootstrapValidator} validator The validator plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} options Can consist of the following keys:
         * - extension: The allowed extensions, separated by a comma
         * - maxFiles: The maximum number of files
         * - minFiles: The minimum number of files
         * - maxSize: The maximum size in bytes
         * - minSize: The minimum size in bytes
         * - maxTotalSize: The maximum size in bytes for all files
         * - minTotalSize: The minimum size in bytes for all files
         * - message: The invalid message
         * - type: The allowed MIME type, separated by a comma
         * @returns {Boolean}
         */
        validate: function(validator, $field, options) {
            var value = $field.val();
            if (value === '') {
                return true;
            }

            var ext,
                extensions = options.extension ? options.extension.toLowerCase().split(',') : null,
                types      = options.type      ? options.type.toLowerCase().split(',')      : null,
                html5      = (window.File && window.FileList && window.FileReader);

            if (html5) {
                // Get FileList instance
                var files     = $field.get(0).files,
                    total     = files.length,
                    totalSize = 0;

                if ((options.maxFiles && total > parseInt(options.maxFiles, 10))        // Check the maxFiles
                    || (options.minFiles && total < parseInt(options.minFiles, 10)))    // Check the minFiles
                {
                    return false;
                }

                for (var i = 0; i < total; i++) {
                    totalSize += files[i].size;
                    ext        = files[i].name.substr(files[i].name.lastIndexOf('.') + 1);

                    if ((options.minSize && files[i].size < parseInt(options.minSize, 10))                      // Check the minSize
                        || (options.maxSize && files[i].size > parseInt(options.maxSize, 10))                   // Check the maxSize
                        || (extensions && $.inArray(ext.toLowerCase(), extensions) === -1)                      // Check file extension
                        || (files[i].type && types && $.inArray(files[i].type.toLowerCase(), types) === -1))    // Check file type
                    {
                        return false;
                    }
                }

                if ((options.maxTotalSize && totalSize > parseInt(options.maxTotalSize, 10))        // Check the maxTotalSize
                    || (options.minTotalSize && totalSize < parseInt(options.minTotalSize, 10)))    // Check the minTotalSize
                {
                    return false;
                }
            } else {
                // Check file extension
                ext = value.substr(value.lastIndexOf('.') + 1);
                if (extensions && $.inArray(ext.toLowerCase(), extensions) === -1) {
                    return false;
                }
            }

            return true;
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.i18n.greaterThan = $.extend($.fn.bootstrapValidator.i18n.greaterThan || {}, {
        'default': 'Please enter a value greater than or equal to %s',
        notInclusive: 'Please enter a value greater than %s'
    });

    $.fn.bootstrapValidator.validators.greaterThan = {
        html5Attributes: {
            message: 'message',
            value: 'value',
            inclusive: 'inclusive'
        },

        enableByHtml5: function($field) {
            var type = $field.attr('type'),
                min  = $field.attr('min');
            if (min && type !== 'date') {
                return {
                    value: min
                };
            }

            return false;
        },

        /**
         * Return true if the input value is greater than or equals to given number
         *
         * @param {BootstrapValidator} validator Validate plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} options Can consist of the following keys:
         * - value: Define the number to compare with. It can be
         *      - A number
         *      - Name of field which its value defines the number
         *      - Name of callback function that returns the number
         *      - A callback function that returns the number
         *
         * - inclusive [optional]: Can be true or false. Default is true
         * - message: The invalid message
         * @returns {Boolean|Object}
         */
        validate: function(validator, $field, options) {
            var value = $field.val();
            if (value === '') {
                return true;
            }
            
            value = this._format(value);
            if (!$.isNumeric(value)) {
                return false;
            }

            var compareTo      = $.isNumeric(options.value) ? options.value : validator.getDynamicOption($field, options.value),
                compareToValue = this._format(compareTo);

            value = parseFloat(value);
			return (options.inclusive === true || options.inclusive === undefined)
                    ? {
                        valid: value >= compareToValue,
                        message: $.fn.bootstrapValidator.helpers.format(options.message || $.fn.bootstrapValidator.i18n.greaterThan['default'], compareTo)
                    }
                    : {
                        valid: value > compareToValue,
                        message: $.fn.bootstrapValidator.helpers.format(options.message || $.fn.bootstrapValidator.i18n.greaterThan.notInclusive, compareTo)
                    };
        },

        _format: function(value) {
            return (value + '').replace(',', '.');
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.i18n.identical = $.extend($.fn.bootstrapValidator.i18n.identical || {}, {
        'default': 'Please enter the same value'
    });

    $.fn.bootstrapValidator.validators.identical = {
        html5Attributes: {
            message: 'message',
            field: 'field'
        },

        /**
         * Check if input value equals to value of particular one
         *
         * @param {BootstrapValidator} validator The validator plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} options Consists of the following key:
         * - field: The name of field that will be used to compare with current one
         * @returns {Boolean}
         */
        validate: function(validator, $field, options) {
            var value = $field.val();
            if (value === '') {
                return true;
            }

            var compareWith = validator.getFieldElements(options.field);
            if (compareWith === null || compareWith.length === 0) {
                return true;
            }

            if (value === compareWith.val()) {
                validator.updateStatus(options.field, validator.STATUS_VALID, 'identical');
                return true;
            } else {
                return false;
            }
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.i18n.integer = $.extend($.fn.bootstrapValidator.i18n.integer || {}, {
        'default': 'Please enter a valid number'
    });

    $.fn.bootstrapValidator.validators.integer = {
        enableByHtml5: function($field) {
            return ('number' === $field.attr('type')) && ($field.attr('step') === undefined || $field.attr('step') % 1 === 0);
        },

        /**
         * Return true if the input value is an integer
         *
         * @param {BootstrapValidator} validator The validator plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} options Can consist of the following key:
         * - message: The invalid message
         * @returns {Boolean}
         */
        validate: function(validator, $field, options) {
            if (this.enableByHtml5($field) && $field.get(0).validity && $field.get(0).validity.badInput === true) {
                return false;
            }

            var value = $field.val();
            if (value === '') {
                return true;
            }
            return /^(?:-?(?:0|[1-9][0-9]*))$/.test(value);
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.i18n.lessThan = $.extend($.fn.bootstrapValidator.i18n.lessThan || {}, {
        'default': 'Please enter a value less than or equal to %s',
        notInclusive: 'Please enter a value less than %s'
    });

    $.fn.bootstrapValidator.validators.lessThan = {
        html5Attributes: {
            message: 'message',
            value: 'value',
            inclusive: 'inclusive'
        },

        enableByHtml5: function($field) {
            var type = $field.attr('type'),
                max  = $field.attr('max');
            if (max && type !== 'date') {
                return {
                    value: max
                };
            }

            return false;
        },

        /**
         * Return true if the input value is less than or equal to given number
         *
         * @param {BootstrapValidator} validator The validator plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} options Can consist of the following keys:
         * - value: The number used to compare to. It can be
         *      - A number
         *      - Name of field which its value defines the number
         *      - Name of callback function that returns the number
         *      - A callback function that returns the number
         *
         * - inclusive [optional]: Can be true or false. Default is true
         * - message: The invalid message
         * @returns {Boolean|Object}
         */
        validate: function(validator, $field, options) {
            var value = $field.val();
            if (value === '') {
                return true;
            }
            
			value = this._format(value);
            if (!$.isNumeric(value)) {
                return false;
            }

            var compareTo      = $.isNumeric(options.value) ? options.value : validator.getDynamicOption($field, options.value),
                compareToValue = this._format(compareTo);

            value = parseFloat(value);
            return (options.inclusive === true || options.inclusive === undefined)
                    ? {
                        valid: value <= compareToValue,
                        message: $.fn.bootstrapValidator.helpers.format(options.message || $.fn.bootstrapValidator.i18n.lessThan['default'], compareTo)
                    }
                    : {
                        valid: value < compareToValue,
                        message: $.fn.bootstrapValidator.helpers.format(options.message || $.fn.bootstrapValidator.i18n.lessThan.notInclusive, compareTo)
                    };
        },

        _format: function(value) {
            return (value + '').replace(',', '.');
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.i18n.notEmpty = $.extend($.fn.bootstrapValidator.i18n.notEmpty || {}, {
        'default': 'Please enter a value'
    });

    $.fn.bootstrapValidator.validators.notEmpty = {
        enableByHtml5: function($field) {
            var required = $field.attr('required') + '';
            return ('required' === required || 'true' === required);
        },

        /**
         * Check if input value is empty or not
         *
         * @param {BootstrapValidator} validator The validator plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} options
         * @returns {Boolean}
         */
        validate: function(validator, $field, options) {
            var type = $field.attr('type');
            if ('radio' === type || 'checkbox' === type) {
                return validator
                            .getFieldElements($field.attr('data-bv-field'))
                            .filter(':checked')
                            .length > 0;
            }

            if ('number' === type && $field.get(0).validity && $field.get(0).validity.badInput === true) {
                return true;
            }

            return $.trim($field.val()) !== '';
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.i18n.numeric = $.extend($.fn.bootstrapValidator.i18n.numeric || {}, {
        'default': 'Please enter a valid float number'
    });

    $.fn.bootstrapValidator.validators.numeric = {
        html5Attributes: {
            message: 'message',
            separator: 'separator'
        },

        enableByHtml5: function($field) {
            return ('number' === $field.attr('type')) && ($field.attr('step') !== undefined) && ($field.attr('step') % 1 !== 0);
        },

        /**
         * Validate decimal number
         *
         * @param {BootstrapValidator} validator The validator plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} options Consist of key:
         * - message: The invalid message
         * - separator: The decimal separator. Can be "." (default), ","
         * @returns {Boolean}
         */
        validate: function(validator, $field, options) {
            if (this.enableByHtml5($field) && $field.get(0).validity && $field.get(0).validity.badInput === true) {
                return false;
            }

            var value = $field.val();
            if (value === '') {
                return true;
            }
            var separator = options.separator || '.';
            if (separator !== '.') {
                value = value.replace(separator, '.');
            }

            return !isNaN(parseFloat(value)) && isFinite(value);
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.i18n.phone = $.extend($.fn.bootstrapValidator.i18n.phone || {}, {
        'default': 'Please enter a valid phone number',
        countryNotSupported: 'The country code %s is not supported',
        country: 'Please enter a valid phone number in %s',
        countries: {
            // BR: 'Brazil',
            CN: 'China'
            // CZ: 'Czech Republic',
            // DE: 'Germany',
            // DK: 'Denmark',
            // ES: 'Spain',
            // FR: 'France',
            // GB: 'United Kingdom',
            // MA: 'Morocco',
            // PK: 'Pakistan',
            // RO: 'Romania',
            // RU: 'Russia',
            // SK: 'Slovakia',
            // TH: 'Thailand',
            // US: 'USA',
            // VE: 'Venezuela'
        }
    });

    $.fn.bootstrapValidator.validators.phone = {
        html5Attributes: {
            message: 'message',
            country: 'country'
        },

        // The supported countries
        COUNTRY_CODES: ['BR', 'CN', 'CZ', 'DE', 'DK', 'ES', 'FR', 'GB', 'MA', 'PK', 'RO', 'RU', 'SK', 'TH', 'US', 'VE'],

        /**
         * Return true if the input value contains a valid phone number for the country
         * selected in the options
         *
         * @param {BootstrapValidator} validator Validate plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} options Consist of key:
         * - message: The invalid message
         * - country: The ISO-3166 country code. It can be
         *      - A country code
         *      - Name of field which its value defines the country code
         *      - Name of callback function that returns the country code
         *      - A callback function that returns the country code
         *
         * @returns {Boolean|Object}
         */
        validate: function(validator, $field, options) {
            var value = $field.val();
            if (value === '') {
                return true;
            }

            var country = options.country;
            if (typeof country !== 'string' || $.inArray(country, this.COUNTRY_CODES) === -1) {
                // Try to determine the country
                country = validator.getDynamicOption($field, country);
            }

            if (!country || $.inArray(country.toUpperCase(), this.COUNTRY_CODES) === -1) {
                return {
                    valid: false,
                    message: $.fn.bootstrapValidator.helpers.format($.fn.bootstrapValidator.i18n.phone.countryNotSupported, country)
                };
            }

            var isValid = true;
            switch (country.toUpperCase()) {
                // case 'BR':
                //     // Test: http://regexr.com/399m1
                //     value   = $.trim(value);
                //     isValid = (/^(([\d]{4}[-.\s]{1}[\d]{2,3}[-.\s]{1}[\d]{2}[-.\s]{1}[\d]{2})|([\d]{4}[-.\s]{1}[\d]{3}[-.\s]{1}[\d]{4})|((\(?\+?[0-9]{2}\)?\s?)?(\(?\d{2}\)?\s?)?\d{4,5}[-.\s]?\d{4}))$/).test(value);
                //     break;

                case 'CN':
                    // http://regexr.com/39dq4
                    value   = $.trim(value);
                    isValid = (/^((00|\+)?(86(?:-| )))?((\d{11})|(\d{3}[- ]{1}\d{4}[- ]{1}\d{4})|((\d{2,4}[- ]){1}(\d{7,8}|(\d{3,4}[- ]{1}\d{4}))([- ]{1}\d{1,4})?))$/).test(value);
                    break;

          //       case 'CZ':
          //           // Test: http://regexr.com/39hhl
          //           isValid = /^(((00)([- ]?)|\+)(420)([- ]?))?((\d{3})([- ]?)){2}(\d{3})$/.test(value);
          //           break;

          //       case 'DE':
          //           // Test: http://regexr.com/39pkg
          //           value   = $.trim(value);
          //           isValid = (/^(((((((00|\+)49[ \-/]?)|0)[1-9][0-9]{1,4})[ \-/]?)|((((00|\+)49\()|\(0)[1-9][0-9]{1,4}\)[ \-/]?))[0-9]{1,7}([ \-/]?[0-9]{1,5})?)$/).test(value);
          //           break;

          //       case 'DK':
          //           // Mathing DK phone numbers with country code in 1 of 3 formats and an
          //           // 8 digit phone number not starting with a 0 or 1. Can have 1 space
          //           // between each character except inside the country code.
          //           // Test: http://regex101.com/r/sS8fO4/1
          //           value   = $.trim(value);
          //           isValid = (/^(\+45|0045|\(45\))?\s?[2-9](\s?\d){7}$/).test(value);
          //           break;

          //       case 'ES':
          //           // http://regex101.com/r/rB9mA9/1
          //           value   = $.trim(value);
          //           isValid = (/^(?:(?:(?:\+|00)34\D?))?(?:9|6)(?:\d\D?){8}$/).test(value);
          //           break;

          //       case 'FR':
          //           // http://regexr.com/39a2p
          //           value   = $.trim(value);
          //           isValid = (/^(?:(?:(?:\+|00)33[ ]?(?:\(0\)[ ]?)?)|0){1}[1-9]{1}([ .-]?)(?:\d{2}\1?){3}\d{2}$/).test(value);
          //           break;

          //   	case 'GB':
          //   		// http://aa-asterisk.org.uk/index.php/Regular_Expressions_for_Validating_and_Formatting_GB_Telephone_Numbers#Match_GB_telephone_number_in_any_format
          //   		// Test: http://regexr.com/38uhv
          //   		value   = $.trim(value);
          //   		isValid = (/^\(?(?:(?:0(?:0|11)\)?[\s-]?\(?|\+)44\)?[\s-]?\(?(?:0\)?[\s-]?\(?)?|0)(?:\d{2}\)?[\s-]?\d{4}[\s-]?\d{4}|\d{3}\)?[\s-]?\d{3}[\s-]?\d{3,4}|\d{4}\)?[\s-]?(?:\d{5}|\d{3}[\s-]?\d{3})|\d{5}\)?[\s-]?\d{4,5}|8(?:00[\s-]?11[\s-]?11|45[\s-]?46[\s-]?4\d))(?:(?:[\s-]?(?:x|ext\.?\s?|\#)\d+)?)$/).test(value);
          //           break;

          //       case 'MA':
          //           // http://en.wikipedia.org/wiki/Telephone_numbers_in_Morocco
          //           // Test: http://regexr.com/399n8
          //           value   = $.trim(value);
          //           isValid = (/^(?:(?:(?:\+|00)212[\s]?(?:[\s]?\(0\)[\s]?)?)|0){1}(?:5[\s.-]?[2-3]|6[\s.-]?[13-9]){1}[0-9]{1}(?:[\s.-]?\d{2}){3}$/).test(value);
          //           break;

          //       case 'PK':
          //           // http://regex101.com/r/yH8aV9/2
          //           value   = $.trim(value);
          //           isValid = (/^0?3[0-9]{2}[0-9]{7}$/).test(value);
          //           break;

        		// case 'RO':
        		//     // All mobile network and land line
          //           // http://regexr.com/39fv1
        		//     isValid = (/^(\+4|)?(07[0-8]{1}[0-9]{1}|02[0-9]{2}|03[0-9]{2}){1}?(\s|\.|\-)?([0-9]{3}(\s|\.|\-|)){2}$/g).test(value);
        		//     break;

          //       case 'RU':
          //           // http://regex101.com/r/gW7yT5/5
          //           isValid = (/^((8|\+7|007)[\-\.\/ ]?)?([\(\/\.]?\d{3}[\)\/\.]?[\-\.\/ ]?)?[\d\-\.\/ ]{7,10}$/g).test(value);
          //           break;

          //       case 'SK':
          //           // Test: http://regexr.com/39hhl
          //           isValid = /^(((00)([- ]?)|\+)(420)([- ]?))?((\d{3})([- ]?)){2}(\d{3})$/.test(value);
          //           break;

          //       case 'TH':
        		//     // http://regex101.com/r/vM5mZ4/2
        		//     isValid = (/^0\(?([6|8-9]{2})*-([0-9]{3})*-([0-9]{4})$/).test(value);
        		//     break;

          //       case 'VE':
          //           // http://regex101.com/r/eM2yY0/6
          //           value   = $.trim(value);
          //           isValid = (/^0(?:2(?:12|4[0-9]|5[1-9]|6[0-9]|7[0-8]|8[1-35-8]|9[1-5]|3[45789])|4(?:1[246]|2[46]))\d{7}$/).test(value);
          //           break;

          //       case 'US':
          //       /* falls through */
                default:
                    // Make sure US phone numbers have 10 digits
                    // May start with 1, +1, or 1-; should discard
                    // Area code may be delimited with (), & sections may be delimited with . or -
                    // Test: http://regexr.com/38mqi
                    value   = value.replace(/\D/g, '');
                    isValid = (/^(?:(1\-?)|(\+1 ?))?\(?(\d{3})[\)\-\.]?(\d{3})[\-\.]?(\d{4})$/).test(value) && (value.length === 10);
                    break;
            }

            return {
                valid: isValid,
                message: $.fn.bootstrapValidator.helpers.format(options.message || $.fn.bootstrapValidator.i18n.phone.country, $.fn.bootstrapValidator.i18n.phone.countries[country])
            };
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.i18n.regexp = $.extend($.fn.bootstrapValidator.i18n.regexp || {}, {
        'default': 'Please enter a value matching the pattern'
    });

    $.fn.bootstrapValidator.validators.regexp = {
        html5Attributes: {
            message: 'message',
            regexp: 'regexp'
        },

        enableByHtml5: function($field) {
            var pattern = $field.attr('pattern');
            if (pattern) {
                return {
                    regexp: pattern
                };
            }

            return false;
        },

        /**
         * Check if the element value matches given regular expression
         *
         * @param {BootstrapValidator} validator The validator plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} options Consists of the following key:
         * - regexp: The regular expression you need to check
         * @returns {Boolean}
         */
        validate: function(validator, $field, options) {
            var value = $field.val();
            if (value === '') {
                return true;
            }

            var regexp = ('string' === typeof options.regexp) ? new RegExp(options.regexp) : options.regexp;
            return regexp.test(value);
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.i18n.remote = $.extend($.fn.bootstrapValidator.i18n.remote || {}, {
        'default': 'Please enter a valid value'
    });

    $.fn.bootstrapValidator.validators.remote = {
        html5Attributes: {
            message: 'message',
            name: 'name',
            type: 'type',
            url: 'url',
            data: 'data',
            delay: 'delay'
        },

        /**
         * Destroy the timer when destroying the bootstrapValidator (using validator.destroy() method)
         */
        destroy: function(validator, $field, options) {
            if ($field.data('bv.remote.timer')) {
                clearTimeout($field.data('bv.remote.timer'));
                $field.removeData('bv.remote.timer');
            }
        },

        /**
         * Request a remote server to check the input value
         *
         * @param {BootstrapValidator} validator Plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} options Can consist of the following keys:
         * - url {String|Function}
         * - type {String} [optional] Can be GET or POST (default)
         * - data {Object|Function} [optional]: By default, it will take the value
         *  {
         *      <fieldName>: <fieldValue>
         *  }
         * - delay
         * - name {String} [optional]: Override the field name for the request.
         * - message: The invalid message
         * - headers: Additional headers
         * @returns {Deferred}
         */
        validate: function(validator, $field, options) {
            var value = $field.val(),
                dfd   = new $.Deferred();
            if (value === '') {
                dfd.resolve($field, 'remote', { valid: true });
                return dfd;
            }

            var name    = $field.attr('data-bv-field'),
                data    = options.data || {},
                url     = options.url,
                type    = options.type || 'GET',
                headers = options.headers || {};

            // Support dynamic data
            if ('function' === typeof data) {
                data = data.call(this, validator);
            }

            // Parse string data from HTML5 attribute
            if ('string' === typeof data) {
                data = JSON.parse(data);
            }

            // Support dynamic url
            if ('function' === typeof url) {
                url = url.call(this, validator);
            }

            data[options.name || name] = value;
            function runCallback() {
                var xhr = $.ajax({
                    type: type,
                    headers: headers,
                    url: url,
                    dataType: 'json',
                    data: data
                });
                xhr.then(function(response) {
                    response.valid = response.valid === true || response.valid === 'true';
                    dfd.resolve($field, 'remote', response);
                });

                dfd.fail(function() {
                    xhr.abort();
                });

                return dfd;
            }
            
            if (options.delay) {
                // Since the form might have multiple fields with the same name
                // I have to attach the timer to the field element
                if ($field.data('bv.remote.timer')) {
                    clearTimeout($field.data('bv.remote.timer'));
                }

                $field.data('bv.remote.timer', setTimeout(runCallback, options.delay));
                return dfd;
            } else {
                return runCallback();
            }
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.i18n.stringCase = $.extend($.fn.bootstrapValidator.i18n.stringCase || {}, {
        'default': 'Please enter only lowercase characters',
        upper: 'Please enter only uppercase characters'
    });

    $.fn.bootstrapValidator.validators.stringCase = {
        html5Attributes: {
            message: 'message',
            'case': 'case'
        },

        /**
         * Check if a string is a lower or upper case one
         *
         * @param {BootstrapValidator} validator The validator plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} options Consist of key:
         * - message: The invalid message
         * - case: Can be 'lower' (default) or 'upper'
         * @returns {Object}
         */
        validate: function(validator, $field, options) {
            var value = $field.val();
            if (value === '') {
                return true;
            }

            var stringCase = (options['case'] || 'lower').toLowerCase();
            return {
                valid: ('upper' === stringCase) ? value === value.toUpperCase() : value === value.toLowerCase(),
                message: options.message || (('upper' === stringCase) ? $.fn.bootstrapValidator.i18n.stringCase.upper : $.fn.bootstrapValidator.i18n.stringCase['default'])
            };
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.i18n.stringLength = $.extend($.fn.bootstrapValidator.i18n.stringLength || {}, {
        'default': 'Please enter a value with valid length',
        less: 'Please enter less than %s characters',
        more: 'Please enter more than %s characters',
        between: 'Please enter value between %s and %s characters long'
    });

    $.fn.bootstrapValidator.validators.stringLength = {
        html5Attributes: {
            message: 'message',
            min: 'min',
            max: 'max',
            trim: 'trim',
            utf8bytes: 'utf8Bytes'
        },

        enableByHtml5: function($field) {
            var options   = {},
                maxLength = $field.attr('maxlength'),
                minLength = $field.attr('minlength');
            if (maxLength) {
                options.max = parseInt(maxLength, 10);
            }
            if (minLength) {
                options.min = parseInt(minLength, 10);
            }

            return $.isEmptyObject(options) ? false : options;
        },

        /**
         * Check if the length of element value is less or more than given number
         *
         * @param {BootstrapValidator} validator The validator plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} options Consists of following keys:
         * - min
         * - max
         * At least one of two keys is required
         * The min, max keys define the number which the field value compares to. min, max can be
         *      - A number
         *      - Name of field which its value defines the number
         *      - Name of callback function that returns the number
         *      - A callback function that returns the number
         *
         * - message: The invalid message
         * - trim: Indicate the length will be calculated after trimming the value or not. It is false, by default
         * - utf8bytes: Evaluate string length in UTF-8 bytes, default to false
         * @returns {Object}
         */
        validate: function(validator, $field, options) {
            var value = $field.val();
            if (options.trim === true || options.trim === 'true') {
                value = $.trim(value);
            }

            if (value === '') {
                return true;
            }

            var min        = $.isNumeric(options.min) ? options.min : validator.getDynamicOption($field, options.min),
                max        = $.isNumeric(options.max) ? options.max : validator.getDynamicOption($field, options.max),
                // Credit to http://stackoverflow.com/a/23329386 (@lovasoa) for UTF-8 byte length code
                utf8Length = function(str) {
                                 var s = str.length;
                                 for (var i = str.length - 1; i >= 0; i--) {
                                     var code = str.charCodeAt(i);
                                     if (code > 0x7f && code <= 0x7ff) {
                                         s++;
                                     } else if (code > 0x7ff && code <= 0xffff) {
                                         s += 2;
                                     }
                                     if (code >= 0xDC00 && code <= 0xDFFF) {
                                         i--;
                                     }
                                 }
                                 return s;
                             },
                length     = options.utf8Bytes ? utf8Length(value) : value.length,
                isValid    = true,
                message    = options.message || $.fn.bootstrapValidator.i18n.stringLength['default'];

            if ((min && length < parseInt(min, 10)) || (max && length > parseInt(max, 10))) {
                isValid = false;
            }

            switch (true) {
                case (!!min && !!max):
                    message = $.fn.bootstrapValidator.helpers.format(options.message || $.fn.bootstrapValidator.i18n.stringLength.between, [parseInt(min, 10), parseInt(max, 10)]);
                    break;

                case (!!min):
                    message = $.fn.bootstrapValidator.helpers.format(options.message || $.fn.bootstrapValidator.i18n.stringLength.more, parseInt(min, 10));
                    break;

                case (!!max):
                    message = $.fn.bootstrapValidator.helpers.format(options.message || $.fn.bootstrapValidator.i18n.stringLength.less, parseInt(max, 10));
                    break;

                default:
                    break;
            }

            return { valid: isValid, message: message };
        }
    };
}(window.jQuery));
;(function($) {
    $.fn.bootstrapValidator.i18n.uri = $.extend($.fn.bootstrapValidator.i18n.uri || {}, {
        'default': 'Please enter a valid URI'
    });

    $.fn.bootstrapValidator.validators.uri = {
        html5Attributes: {
            message: 'message',
            allowlocal: 'allowLocal',
            protocol: 'protocol'
        },

        enableByHtml5: function($field) {
            return ('url' === $field.attr('type'));
        },

        /**
         * Return true if the input value is a valid URL
         *
         * @param {BootstrapValidator} validator The validator plugin instance
         * @param {jQuery} $field Field element
         * @param {Object} options
         * - message: The error message
         * - allowLocal: Allow the private and local network IP. Default to false
         * - protocol: The protocols, separated by a comma. Default to "http, https, ftp"
         * @returns {Boolean}
         */
        validate: function(validator, $field, options) {
            var value = $field.val();
            if (value === '') {
                return true;
            }

            // Credit to https://gist.github.com/dperini/729294
            //
            // Regular Expression for URL validation
            //
            // Author: Diego Perini
            // Updated: 2010/12/05
            //
            // the regular expression composed & commented
            // could be easily tweaked for RFC compliance,
            // it was expressly modified to fit & satisfy
            // these test for an URL shortener:
            //
            //   http://mathiasbynens.be/demo/url-regex
            //
            // Notes on possible differences from a standard/generic validation:
            //
            // - utf-8 char class take in consideration the full Unicode range
            // - TLDs are mandatory unless `allowLocal` is true
            // - protocols have been restricted to ftp, http and https only as requested
            //
            // Changes:
            //
            // - IP address dotted notation validation, range: 1.0.0.0 - 223.255.255.255
            //   first and last IP address of each class is considered invalid
            //   (since they are broadcast/network addresses)
            //
            // - Added exclusion of private, reserved and/or local networks ranges
            //   unless `allowLocal` is true
            //
            // - Added possibility of choosing a custom protocol
            //
            var allowLocal = options.allowLocal === true || options.allowLocal === 'true',
                protocol   = (options.protocol || 'http, https, ftp').split(',').join('|').replace(/\s/g, ''),
                urlExp     = new RegExp(
                    "^" +
                    // protocol identifier
                    "(?:(?:" + protocol + ")://)" +
                    // user:pass authentication
                    "(?:\\S+(?::\\S*)?@)?" +
                    "(?:" +
                    // IP address exclusion
                    // private & local networks
                    (allowLocal
                        ? ''
                        : ("(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
                           "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
                           "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})")) +
                    // IP address dotted notation octets
                    // excludes loopback network 0.0.0.0
                    // excludes reserved space >= 224.0.0.0
                    // excludes network & broadcast addresses
                    // (first & last IP address of each class)
                    "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
                    "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
                    "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
                    "|" +
                    // host name
                    "(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)" +
                    // domain name
                    "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*" +
                    // TLD identifier
                    "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
                    // Allow intranet sites (no TLD) if `allowLocal` is true
                    (allowLocal ? '?' : '') +
                    ")" +
                    // port number
                    "(?::\\d{2,5})?" +
                    // resource path
                    "(?:/[^\\s]*)?" +
                    "$", "i"
            );

            return urlExp.test(value);
        }
    };
}(window.jQuery));

;(function ($) {
    /**
     * Simplified Chinese language package
     * Translated by @shamiao
     */
    $.fn.bootstrapValidator.i18n = $.extend(true, $.fn.bootstrapValidator.i18n, {
        between: {
            'default': '请输入在 %s 和 %s 之间的数值',
            notInclusive: '请输入在 %s 和 %s 之间(不含两端)的数值'
        },
        callback: {
            'default': '请输入有效的值'
        },
        choice: {
            'default': '请输入有效的值',
            less: '请至少选中 %s 个选项',
            more: '最多只能选中 %s 个选项',
            between: '请选择 %s 至 %s 个选项'
        },
        date: {
            'default': '请输入有效的日期', 
            min: '请输入 %s 或之后的日期',
            max: '请输入 %s 或以前的日期',
            range: '请输入 %s 和 %s 之间的日期'
        },
        different: {
            'default': '请输入不同的值'
        },
        digits: {
            'default': '请输入有效的数字'
        },
        emailAddress: {
            'default': '请输入有效的邮件地址'
        },
        file: {
            'default': '请选择有效的文件'
        },
        greaterThan: {
            'default': '请输入大于等于 %s 的数值',
            notInclusive: '请输入大于 %s 的数值'
        },
        identical: {
            'default': '请输入相同的值'
        },
        integer: {
            'default': '请输入有效的整数值'
        },
        
        lessThan: {
            'default': '请输入小于等于 %s 的数值',
            notInclusive: '请输入小于 %s 的数值'
        },
        
        notEmpty: {
            'default': '请填写必填项目'
        },
        numeric: {
            'default': '请输入有效的数值，允许小数'
        },
        phone: {
            'default': '请输入有效的电话号码',
            countryNotSupported: '不支持 %s 国家或地区',
            country: '请输入有效的 %s 国家或地区的电话号码',
            countries: {
                CN: '中国'
            }
        },
        regexp: {
            'default': '请输入符合正则表达式限制的值'
        },
        remote: {
            'default': '请输入有效的值'
        },
        stringCase: {
            'default': '只能输入小写字母',
            upper: '只能输入大写字母'
        },
        stringLength: {
            'default': '请输入符合长度限制的值',
            less: '最多只能输入 %s 个字符',
            more: '需要输入至少 %s 个字符',
            between: '请输入 %s 至 %s 个字符'
        },
        uri: {
            'default': '请输入一个有效的URL地址'
        }
    });
}(window.jQuery));

;/*!
 * jQuery Form Plugin
 * version: 3.51.0-2014.06.20
 * Requires jQuery v1.5 or later
 * Copyright (c) 2014 M. Alsup
 * Examples and documentation at: http://malsup.com/jquery/form/
 * Project repository: https://github.com/malsup/form
 * Dual licensed under the MIT and GPL licenses.
 * https://github.com/malsup/form#copyright-and-license
 */
/*global ActiveXObject */

// AMD support
(function (factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        // using AMD; register as anon module
        define(['jquery'], factory);
    } else {
        // no AMD; invoke directly
        factory( (typeof(jQuery) != 'undefined') ? jQuery : window.Zepto );
    }
}

(function($) {
"use strict";

/*
    Usage Note:
    -----------
    Do not use both ajaxSubmit and ajaxForm on the same form.  These
    functions are mutually exclusive.  Use ajaxSubmit if you want
    to bind your own submit handler to the form.  For example,

    $(document).ready(function() {
        $('#myForm').on('submit', function(e) {
            e.preventDefault(); // <-- important
            $(this).ajaxSubmit({
                target: '#output'
            });
        });
    });

    Use ajaxForm when you want the plugin to manage all the event binding
    for you.  For example,

    $(document).ready(function() {
        $('#myForm').ajaxForm({
            target: '#output'
        });
    });

    You can also use ajaxForm with delegation (requires jQuery v1.7+), so the
    form does not have to exist when you invoke ajaxForm:

    $('#myForm').ajaxForm({
        delegation: true,
        target: '#output'
    });

    When using ajaxForm, the ajaxSubmit function will be invoked for you
    at the appropriate time.
*/

/**
 * Feature detection
 */
var feature = {};
feature.fileapi = $("<input type='file'/>").get(0).files !== undefined;
feature.formdata = window.FormData !== undefined;

var hasProp = !!$.fn.prop;

// attr2 uses prop when it can but checks the return type for
// an expected string.  this accounts for the case where a form 
// contains inputs with names like "action" or "method"; in those
// cases "prop" returns the element
$.fn.attr2 = function() {
    if ( ! hasProp ) {
        return this.attr.apply(this, arguments);
    }
    var val = this.prop.apply(this, arguments);
    if ( ( val && val.jquery ) || typeof val === 'string' ) {
        return val;
    }
    return this.attr.apply(this, arguments);
};

/**
 * ajaxSubmit() provides a mechanism for immediately submitting
 * an HTML form using AJAX.
 */
$.fn.ajaxSubmit = function(options) {
    /*jshint scripturl:true */

    // fast fail if nothing selected (http://dev.jquery.com/ticket/2752)
    if (!this.length) {
        log('ajaxSubmit: skipping submit process - no element selected');
        return this;
    }

    var method, action, url, $form = this;

    if (typeof options == 'function') {
        options = { success: options };
    }
    else if ( options === undefined ) {
        options = {};
    }

    method = options.type || this.attr2('method');
    action = options.url  || this.attr2('action');

    url = (typeof action === 'string') ? $.trim(action) : '';
    url = url || window.location.href || '';
    if (url) {
        // clean url (don't include hash vaue)
        url = (url.match(/^([^#]+)/)||[])[1];
    }

    options = $.extend(true, {
        url:  url,
        success: $.ajaxSettings.success,
        type: method || $.ajaxSettings.type,
        iframeSrc: /^https/i.test(window.location.href || '') ? 'javascript:false' : 'about:blank'
    }, options);

    // hook for manipulating the form data before it is extracted;
    // convenient for use with rich editors like tinyMCE or FCKEditor
    var veto = {};
    this.trigger('form-pre-serialize', [this, options, veto]);
    if (veto.veto) {
        log('ajaxSubmit: submit vetoed via form-pre-serialize trigger');
        return this;
    }

    // provide opportunity to alter form data before it is serialized
    if (options.beforeSerialize && options.beforeSerialize(this, options) === false) {
        log('ajaxSubmit: submit aborted via beforeSerialize callback');
        return this;
    }

    var traditional = options.traditional;
    if ( traditional === undefined ) {
        traditional = $.ajaxSettings.traditional;
    }

    var elements = [];
    var qx, a = this.formToArray(options.semantic, elements);
    if (options.data) {
        options.extraData = options.data;
        qx = $.param(options.data, traditional);
    }

    // give pre-submit callback an opportunity to abort the submit
    if (options.beforeSubmit && options.beforeSubmit(a, this, options) === false) {
        log('ajaxSubmit: submit aborted via beforeSubmit callback');
        return this;
    }

    // fire vetoable 'validate' event
    this.trigger('form-submit-validate', [a, this, options, veto]);
    if (veto.veto) {
        log('ajaxSubmit: submit vetoed via form-submit-validate trigger');
        return this;
    }

    var q = $.param(a, traditional);
    if (qx) {
        q = ( q ? (q + '&' + qx) : qx );
    }
    if (options.type.toUpperCase() == 'GET') {
        options.url += (options.url.indexOf('?') >= 0 ? '&' : '?') + q;
        options.data = null;  // data is null for 'get'
    }
    else {
        options.data = q; // data is the query string for 'post'
    }

    var callbacks = [];
    if (options.resetForm) {
        callbacks.push(function() { $form.resetForm(); });
    }
    if (options.clearForm) {
        callbacks.push(function() { $form.clearForm(options.includeHidden); });
    }

    // perform a load on the target only if dataType is not provided
    if (!options.dataType && options.target) {
        var oldSuccess = options.success || function(){};
        callbacks.push(function(data) {
            var fn = options.replaceTarget ? 'replaceWith' : 'html';
            $(options.target)[fn](data).each(oldSuccess, arguments);
        });
    }
    else if (options.success) {
        callbacks.push(options.success);
    }

    options.success = function(data, status, xhr) { // jQuery 1.4+ passes xhr as 3rd arg
        var context = options.context || this ;    // jQuery 1.4+ supports scope context
        for (var i=0, max=callbacks.length; i < max; i++) {
            callbacks[i].apply(context, [data, status, xhr || $form, $form]);
        }
    };

    if (options.error) {
        var oldError = options.error;
        options.error = function(xhr, status, error) {
            var context = options.context || this;
            oldError.apply(context, [xhr, status, error, $form]);
        };
    }

     if (options.complete) {
        var oldComplete = options.complete;
        options.complete = function(xhr, status) {
            var context = options.context || this;
            oldComplete.apply(context, [xhr, status, $form]);
        };
    }

    // are there files to upload?

    // [value] (issue #113), also see comment:
    // https://github.com/malsup/form/commit/588306aedba1de01388032d5f42a60159eea9228#commitcomment-2180219
    var fileInputs = $('input[type=file]:enabled', this).filter(function() { return $(this).val() !== ''; });

    var hasFileInputs = fileInputs.length > 0;
    var mp = 'multipart/form-data';
    var multipart = ($form.attr('enctype') == mp || $form.attr('encoding') == mp);

    var fileAPI = feature.fileapi && feature.formdata;
    log("fileAPI :" + fileAPI);
    var shouldUseFrame = (hasFileInputs || multipart) && !fileAPI;

    var jqxhr;

    // options.iframe allows user to force iframe mode
    // 06-NOV-09: now defaulting to iframe mode if file input is detected
    if (options.iframe !== false && (options.iframe || shouldUseFrame)) {
        // hack to fix Safari hang (thanks to Tim Molendijk for this)
        // see:  http://groups.google.com/group/jquery-dev/browse_thread/thread/36395b7ab510dd5d
        if (options.closeKeepAlive) {
            $.get(options.closeKeepAlive, function() {
                jqxhr = fileUploadIframe(a);
            });
        }
        else {
            jqxhr = fileUploadIframe(a);
        }
    }
    else if ((hasFileInputs || multipart) && fileAPI) {
        jqxhr = fileUploadXhr(a);
    }
    else {
        jqxhr = $.ajax(options);
    }

    $form.removeData('jqxhr').data('jqxhr', jqxhr);

    // clear element array
    for (var k=0; k < elements.length; k++) {
        elements[k] = null;
    }

    // fire 'notify' event
    this.trigger('form-submit-notify', [this, options]);
    return this;

    // utility fn for deep serialization
    function deepSerialize(extraData){
        var serialized = $.param(extraData, options.traditional).split('&');
        var len = serialized.length;
        var result = [];
        var i, part;
        for (i=0; i < len; i++) {
            // #252; undo param space replacement
            serialized[i] = serialized[i].replace(/\+/g,' ');
            part = serialized[i].split('=');
            // #278; use array instead of object storage, favoring array serializations
            result.push([decodeURIComponent(part[0]), decodeURIComponent(part[1])]);
        }
        return result;
    }

     // XMLHttpRequest Level 2 file uploads (big hat tip to francois2metz)
    function fileUploadXhr(a) {
        var formdata = new FormData();

        for (var i=0; i < a.length; i++) {
            formdata.append(a[i].name, a[i].value);
        }

        if (options.extraData) {
            var serializedData = deepSerialize(options.extraData);
            for (i=0; i < serializedData.length; i++) {
                if (serializedData[i]) {
                    formdata.append(serializedData[i][0], serializedData[i][1]);
                }
            }
        }

        options.data = null;

        var s = $.extend(true, {}, $.ajaxSettings, options, {
            contentType: false,
            processData: false,
            cache: false,
            type: method || 'POST'
        });

        if (options.uploadProgress) {
            // workaround because jqXHR does not expose upload property
            s.xhr = function() {
                var xhr = $.ajaxSettings.xhr();
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', function(event) {
                        var percent = 0;
                        var position = event.loaded || event.position; /*event.position is deprecated*/
                        var total = event.total;
                        if (event.lengthComputable) {
                            percent = Math.ceil(position / total * 100);
                        }
                        options.uploadProgress(event, position, total, percent);
                    }, false);
                }
                return xhr;
            };
        }

        s.data = null;
        var beforeSend = s.beforeSend;
        s.beforeSend = function(xhr, o) {
            //Send FormData() provided by user
            if (options.formData) {
                o.data = options.formData;
            }
            else {
                o.data = formdata;
            }
            if(beforeSend) {
                beforeSend.call(this, xhr, o);
            }
        };
        return $.ajax(s);
    }

    // private function for handling file uploads (hat tip to YAHOO!)
    function fileUploadIframe(a) {
        var form = $form[0], el, i, s, g, id, $io, io, xhr, sub, n, timedOut, timeoutHandle;
        var deferred = $.Deferred();

        // #341
        deferred.abort = function(status) {
            xhr.abort(status);
        };

        if (a) {
            // ensure that every serialized input is still enabled
            for (i=0; i < elements.length; i++) {
                el = $(elements[i]);
                if ( hasProp ) {
                    el.prop('disabled', false);
                }
                else {
                    el.removeAttr('disabled');
                }
            }
        }

        s = $.extend(true, {}, $.ajaxSettings, options);
        s.context = s.context || s;
        id = 'jqFormIO' + (new Date().getTime());
        if (s.iframeTarget) {
            $io = $(s.iframeTarget);
            n = $io.attr2('name');
            if (!n) {
                $io.attr2('name', id);
            }
            else {
                id = n;
            }
        }
        else {
            $io = $('<iframe name="' + id + '" src="'+ s.iframeSrc +'" />');
            $io.css({ position: 'absolute', top: '-1000px', left: '-1000px' });
        }
        io = $io[0];


        xhr = { // mock object
            aborted: 0,
            responseText: null,
            responseXML: null,
            status: 0,
            statusText: 'n/a',
            getAllResponseHeaders: function() {},
            getResponseHeader: function() {},
            setRequestHeader: function() {},
            abort: function(status) {
                var e = (status === 'timeout' ? 'timeout' : 'aborted');
                log('aborting upload... ' + e);
                this.aborted = 1;

                try { // #214, #257
                    if (io.contentWindow.document.execCommand) {
                        io.contentWindow.document.execCommand('Stop');
                    }
                }
                catch(ignore) {}

                $io.attr('src', s.iframeSrc); // abort op in progress
                xhr.error = e;
                if (s.error) {
                    s.error.call(s.context, xhr, e, status);
                }
                if (g) {
                    $.event.trigger("ajaxError", [xhr, s, e]);
                }
                if (s.complete) {
                    s.complete.call(s.context, xhr, e);
                }
            }
        };

        g = s.global;
        // trigger ajax global events so that activity/block indicators work like normal
        if (g && 0 === $.active++) {
            $.event.trigger("ajaxStart");
        }
        if (g) {
            $.event.trigger("ajaxSend", [xhr, s]);
        }

        if (s.beforeSend && s.beforeSend.call(s.context, xhr, s) === false) {
            if (s.global) {
                $.active--;
            }
            deferred.reject();
            return deferred;
        }
        if (xhr.aborted) {
            deferred.reject();
            return deferred;
        }

        // add submitting element to data if we know it
        sub = form.clk;
        if (sub) {
            n = sub.name;
            if (n && !sub.disabled) {
                s.extraData = s.extraData || {};
                s.extraData[n] = sub.value;
                if (sub.type == "image") {
                    s.extraData[n+'.x'] = form.clk_x;
                    s.extraData[n+'.y'] = form.clk_y;
                }
            }
        }

        var CLIENT_TIMEOUT_ABORT = 1;
        var SERVER_ABORT = 2;
                
        function getDoc(frame) {
            /* it looks like contentWindow or contentDocument do not
             * carry the protocol property in ie8, when running under ssl
             * frame.document is the only valid response document, since
             * the protocol is know but not on the other two objects. strange?
             * "Same origin policy" http://en.wikipedia.org/wiki/Same_origin_policy
             */
            
            var doc = null;
            
            // IE8 cascading access check
            try {
                if (frame.contentWindow) {
                    doc = frame.contentWindow.document;
                }
            } catch(err) {
                // IE8 access denied under ssl & missing protocol
                log('cannot get iframe.contentWindow document: ' + err);
            }

            if (doc) { // successful getting content
                return doc;
            }

            try { // simply checking may throw in ie8 under ssl or mismatched protocol
                doc = frame.contentDocument ? frame.contentDocument : frame.document;
            } catch(err) {
                // last attempt
                log('cannot get iframe.contentDocument: ' + err);
                doc = frame.document;
            }
            return doc;
        }

        // Rails CSRF hack (thanks to Yvan Barthelemy)
        var csrf_token = $('meta[name=csrf-token]').attr('content');
        var csrf_param = $('meta[name=csrf-param]').attr('content');
        if (csrf_param && csrf_token) {
            s.extraData = s.extraData || {};
            s.extraData[csrf_param] = csrf_token;
        }

        // take a breath so that pending repaints get some cpu time before the upload starts
        function doSubmit() {
            // make sure form attrs are set
            var t = $form.attr2('target'), 
                a = $form.attr2('action'), 
                mp = 'multipart/form-data',
                et = $form.attr('enctype') || $form.attr('encoding') || mp;

            // update form attrs in IE friendly way
            form.setAttribute('target',id);
            if (!method || /post/i.test(method) ) {
                form.setAttribute('method', 'POST');
            }
            if (a != s.url) {
                form.setAttribute('action', s.url);
            }

            // ie borks in some cases when setting encoding
            if (! s.skipEncodingOverride && (!method || /post/i.test(method))) {
                $form.attr({
                    encoding: 'multipart/form-data',
                    enctype:  'multipart/form-data'
                });
            }

            // support timout
            if (s.timeout) {
                timeoutHandle = setTimeout(function() { timedOut = true; cb(CLIENT_TIMEOUT_ABORT); }, s.timeout);
            }

            // look for server aborts
            function checkState() {
                try {
                    var state = getDoc(io).readyState;
                    log('state = ' + state);
                    if (state && state.toLowerCase() == 'uninitialized') {
                        setTimeout(checkState,50);
                    }
                }
                catch(e) {
                    log('Server abort: ' , e, ' (', e.name, ')');
                    cb(SERVER_ABORT);
                    if (timeoutHandle) {
                        clearTimeout(timeoutHandle);
                    }
                    timeoutHandle = undefined;
                }
            }

            // add "extra" data to form if provided in options
            var extraInputs = [];
            try {
                if (s.extraData) {
                    for (var n in s.extraData) {
                        if (s.extraData.hasOwnProperty(n)) {
                           // if using the $.param format that allows for multiple values with the same name
                           if($.isPlainObject(s.extraData[n]) && s.extraData[n].hasOwnProperty('name') && s.extraData[n].hasOwnProperty('value')) {
                               extraInputs.push(
                               $('<input type="hidden" name="'+s.extraData[n].name+'">').val(s.extraData[n].value)
                                   .appendTo(form)[0]);
                           } else {
                               extraInputs.push(
                               $('<input type="hidden" name="'+n+'">').val(s.extraData[n])
                                   .appendTo(form)[0]);
                           }
                        }
                    }
                }

                if (!s.iframeTarget) {
                    // add iframe to doc and submit the form
                    $io.appendTo('body');
                }
                if (io.attachEvent) {
                    io.attachEvent('onload', cb);
                }
                else {
                    io.addEventListener('load', cb, false);
                }
                setTimeout(checkState,15);

                try {
                    form.submit();
                } catch(err) {
                    // just in case form has element with name/id of 'submit'
                    var submitFn = document.createElement('form').submit;
                    submitFn.apply(form);
                }
            }
            finally {
                // reset attrs and remove "extra" input elements
                form.setAttribute('action',a);
                form.setAttribute('enctype', et); // #380
                if(t) {
                    form.setAttribute('target', t);
                } else {
                    $form.removeAttr('target');
                }
                $(extraInputs).remove();
            }
        }

        if (s.forceSync) {
            doSubmit();
        }
        else {
            setTimeout(doSubmit, 10); // this lets dom updates render
        }

        var data, doc, domCheckCount = 50, callbackProcessed;

        function cb(e) {
            if (xhr.aborted || callbackProcessed) {
                return;
            }
            
            doc = getDoc(io);
            if(!doc) {
                log('cannot access response document');
                e = SERVER_ABORT;
            }
            if (e === CLIENT_TIMEOUT_ABORT && xhr) {
                xhr.abort('timeout');
                deferred.reject(xhr, 'timeout');
                return;
            }
            else if (e == SERVER_ABORT && xhr) {
                xhr.abort('server abort');
                deferred.reject(xhr, 'error', 'server abort');
                return;
            }

            if (!doc || doc.location.href == s.iframeSrc) {
                // response not received yet
                if (!timedOut) {
                    return;
                }
            }
            if (io.detachEvent) {
                io.detachEvent('onload', cb);
            }
            else {
                io.removeEventListener('load', cb, false);
            }

            var status = 'success', errMsg;
            try {
                if (timedOut) {
                    throw 'timeout';
                }

                var isXml = s.dataType == 'xml' || doc.XMLDocument || $.isXMLDoc(doc);
                log('isXml='+isXml);
                if (!isXml && window.opera && (doc.body === null || !doc.body.innerHTML)) {
                    if (--domCheckCount) {
                        // in some browsers (Opera) the iframe DOM is not always traversable when
                        // the onload callback fires, so we loop a bit to accommodate
                        log('requeing onLoad callback, DOM not available');
                        setTimeout(cb, 250);
                        return;
                    }
                    // let this fall through because server response could be an empty document
                    //log('Could not access iframe DOM after mutiple tries.');
                    //throw 'DOMException: not available';
                }

                //log('response detected');
                var docRoot = doc.body ? doc.body : doc.documentElement;
                xhr.responseText = docRoot ? docRoot.innerHTML : null;
                xhr.responseXML = doc.XMLDocument ? doc.XMLDocument : doc;
                if (isXml) {
                    s.dataType = 'xml';
                }
                xhr.getResponseHeader = function(header){
                    var headers = {'content-type': s.dataType};
                    return headers[header.toLowerCase()];
                };
                // support for XHR 'status' & 'statusText' emulation :
                if (docRoot) {
                    xhr.status = Number( docRoot.getAttribute('status') ) || xhr.status;
                    xhr.statusText = docRoot.getAttribute('statusText') || xhr.statusText;
                }

                var dt = (s.dataType || '').toLowerCase();
                var scr = /(json|script|text)/.test(dt);
                if (scr || s.textarea) {
                    // see if user embedded response in textarea
                    var ta = doc.getElementsByTagName('textarea')[0];
                    if (ta) {
                        xhr.responseText = ta.value;
                        // support for XHR 'status' & 'statusText' emulation :
                        xhr.status = Number( ta.getAttribute('status') ) || xhr.status;
                        xhr.statusText = ta.getAttribute('statusText') || xhr.statusText;
                    }
                    else if (scr) {
                        // account for browsers injecting pre around json response
                        var pre = doc.getElementsByTagName('pre')[0];
                        var b = doc.getElementsByTagName('body')[0];
                        if (pre) {
                            xhr.responseText = pre.textContent ? pre.textContent : pre.innerText;
                        }
                        else if (b) {
                            xhr.responseText = b.textContent ? b.textContent : b.innerText;
                        }
                    }
                }
                else if (dt == 'xml' && !xhr.responseXML && xhr.responseText) {
                    xhr.responseXML = toXml(xhr.responseText);
                }

                try {
                    data = httpData(xhr, dt, s);
                }
                catch (err) {
                    status = 'parsererror';
                    xhr.error = errMsg = (err || status);
                }
            }
            catch (err) {
                log('error caught: ',err);
                status = 'error';
                xhr.error = errMsg = (err || status);
            }

            if (xhr.aborted) {
                log('upload aborted');
                status = null;
            }

            if (xhr.status) { // we've set xhr.status
                status = (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) ? 'success' : 'error';
            }

            // ordering of these callbacks/triggers is odd, but that's how $.ajax does it
            if (status === 'success') {
                if (s.success) {
                    s.success.call(s.context, data, 'success', xhr);
                }
                deferred.resolve(xhr.responseText, 'success', xhr);
                if (g) {
                    $.event.trigger("ajaxSuccess", [xhr, s]);
                }
            }
            else if (status) {
                if (errMsg === undefined) {
                    errMsg = xhr.statusText;
                }
                if (s.error) {
                    s.error.call(s.context, xhr, status, errMsg);
                }
                deferred.reject(xhr, 'error', errMsg);
                if (g) {
                    $.event.trigger("ajaxError", [xhr, s, errMsg]);
                }
            }

            if (g) {
                $.event.trigger("ajaxComplete", [xhr, s]);
            }

            if (g && ! --$.active) {
                $.event.trigger("ajaxStop");
            }

            if (s.complete) {
                s.complete.call(s.context, xhr, status);
            }

            callbackProcessed = true;
            if (s.timeout) {
                clearTimeout(timeoutHandle);
            }

            // clean up
            setTimeout(function() {
                if (!s.iframeTarget) {
                    $io.remove();
                }
                else { //adding else to clean up existing iframe response.
                    $io.attr('src', s.iframeSrc);
                }
                xhr.responseXML = null;
            }, 100);
        }

        var toXml = $.parseXML || function(s, doc) { // use parseXML if available (jQuery 1.5+)
            if (window.ActiveXObject) {
                doc = new ActiveXObject('Microsoft.XMLDOM');
                doc.async = 'false';
                doc.loadXML(s);
            }
            else {
                doc = (new DOMParser()).parseFromString(s, 'text/xml');
            }
            return (doc && doc.documentElement && doc.documentElement.nodeName != 'parsererror') ? doc : null;
        };
        var parseJSON = $.parseJSON || function(s) {
            /*jslint evil:true */
            return window['eval']('(' + s + ')');
        };

        var httpData = function( xhr, type, s ) { // mostly lifted from jq1.4.4

            var ct = xhr.getResponseHeader('content-type') || '',
                xml = type === 'xml' || !type && ct.indexOf('xml') >= 0,
                data = xml ? xhr.responseXML : xhr.responseText;

            if (xml && data.documentElement.nodeName === 'parsererror') {
                if ($.error) {
                    $.error('parsererror');
                }
            }
            if (s && s.dataFilter) {
                data = s.dataFilter(data, type);
            }
            if (typeof data === 'string') {
                if (type === 'json' || !type && ct.indexOf('json') >= 0) {
                    data = parseJSON(data);
                } else if (type === "script" || !type && ct.indexOf("javascript") >= 0) {
                    $.globalEval(data);
                }
            }
            return data;
        };

        return deferred;
    }
};

/**
 * ajaxForm() provides a mechanism for fully automating form submission.
 *
 * The advantages of using this method instead of ajaxSubmit() are:
 *
 * 1: This method will include coordinates for <input type="image" /> elements (if the element
 *    is used to submit the form).
 * 2. This method will include the submit element's name/value data (for the element that was
 *    used to submit the form).
 * 3. This method binds the submit() method to the form for you.
 *
 * The options argument for ajaxForm works exactly as it does for ajaxSubmit.  ajaxForm merely
 * passes the options argument along after properly binding events for submit elements and
 * the form itself.
 */
$.fn.ajaxForm = function(options) {
    options = options || {};
    //options.delegation = options.delegation && $.isFunction($.fn.on);

    // in jQuery 1.3+ we can fix mistakes with the ready state
    // if (!options.delegation && this.length === 0) {
    //     var o = { s: this.selector, c: this.context };
    //     if (!$.isReady && o.s) {
    //         log('DOM not ready, queuing ajaxForm');
    //         $(function() {
    //             $(o.s,o.c).ajaxForm(options);
    //         });
    //         return this;
    //     }
    //     // is your DOM ready?  http://docs.jquery.com/Tutorials:Introducing_$(document).ready()
    //     log('terminating; zero elements found by selector' + ($.isReady ? '' : ' (DOM not ready)'));
    //     return this;
    // }

    //if ( options.delegation ) {
        $(document)
            .off('submit.form-plugin', this.selector, doAjaxSubmit)
            .off('click.form-plugin', this.selector, captureSubmittingElement)
            .on('submit.form-plugin', this.selector, options, doAjaxSubmit)
            .on('click.form-plugin', this.selector, options, captureSubmittingElement);
        return this;
    //}

    // return this.ajaxFormUnbind()
    //     .bind('submit.form-plugin', options, doAjaxSubmit)
    //     .bind('click.form-plugin', options, captureSubmittingElement);
};

// private event handlers
function doAjaxSubmit(e) {
    /*jshint validthis:true */
    var options = e.data;
    if (!e.isDefaultPrevented()) { // if event has been canceled, don't proceed
        e.preventDefault();
        $(e.target).ajaxSubmit(options); // #365
    }
}

function captureSubmittingElement(e) {
    /*jshint validthis:true */
    var target = e.target;
    var $el = $(target);
    if (!($el.is("[type=submit],[type=image]"))) {
        // is this a child element of the submit el?  (ex: a span within a button)
        var t = $el.closest('[type=submit]');
        if (t.length === 0) {
            return;
        }
        target = t[0];
    }
    var form = this;
    form.clk = target;
    if (target.type == 'image') {
        if (e.offsetX !== undefined) {
            form.clk_x = e.offsetX;
            form.clk_y = e.offsetY;
        } else if (typeof $.fn.offset == 'function') {
            var offset = $el.offset();
            form.clk_x = e.pageX - offset.left;
            form.clk_y = e.pageY - offset.top;
        } else {
            form.clk_x = e.pageX - target.offsetLeft;
            form.clk_y = e.pageY - target.offsetTop;
        }
    }
    // clear form vars
    setTimeout(function() { form.clk = form.clk_x = form.clk_y = null; }, 100);
}


// ajaxFormUnbind unbinds the event handlers that were bound by ajaxForm
// $.fn.ajaxFormUnbind = function() {
//     return this.unbind('submit.form-plugin click.form-plugin');
// };

/**
 * formToArray() gathers form element data into an array of objects that can
 * be passed to any of the following ajax functions: $.get, $.post, or load.
 * Each object in the array has both a 'name' and 'value' property.  An example of
 * an array for a simple login form might be:
 *
 * [ { name: 'username', value: 'jresig' }, { name: 'password', value: 'secret' } ]
 *
 * It is this array that is passed to pre-submit callback functions provided to the
 * ajaxSubmit() and ajaxForm() methods.
 */
$.fn.formToArray = function(semantic, elements) {
    var a = [];
    if (this.length === 0) {
        return a;
    }

    var form = this[0];
    var formId = this.attr('id');
    var els = semantic ? form.getElementsByTagName('*') : form.elements;
    var els2;

    if (els && !/MSIE [678]/.test(navigator.userAgent)) { // #390
        els = $(els).get();  // convert to standard array
    }

    // #386; account for inputs outside the form which use the 'form' attribute
    if ( formId ) {
        els2 = $(':input[form="' + formId + '"]').get(); // hat tip @thet
        if ( els2.length ) {
            els = (els || []).concat(els2);
        }
    }

    if (!els || !els.length) {
        return a;
    }

    var i,j,n,v,el,max,jmax;
    for(i=0, max=els.length; i < max; i++) {
        el = els[i];
        n = el.name;
        if (!n || el.disabled) {
            continue;
        }

        if (semantic && form.clk && el.type == "image") {
            // handle image inputs on the fly when semantic == true
            if(form.clk == el) {
                a.push({name: n, value: $(el).val(), type: el.type });
                a.push({name: n+'.x', value: form.clk_x}, {name: n+'.y', value: form.clk_y});
            }
            continue;
        }

        v = $.fieldValue(el, true);
        if (v && v.constructor == Array) {
            if (elements) {
                elements.push(el);
            }
            for(j=0, jmax=v.length; j < jmax; j++) {
                a.push({name: n, value: v[j]});
            }
        }
        else if (feature.fileapi && el.type == 'file') {
            if (elements) {
                elements.push(el);
            }
            var files = el.files;
            if (files.length) {
                for (j=0; j < files.length; j++) {
                    a.push({name: n, value: files[j], type: el.type});
                }
            }
            else {
                // #180
                a.push({ name: n, value: '', type: el.type });
            }
        }
        else if (v !== null && typeof v != 'undefined') {
            if (elements) {
                elements.push(el);
            }
            a.push({name: n, value: v, type: el.type, required: el.required});
        }
    }

    if (!semantic && form.clk) {
        // input type=='image' are not found in elements array! handle it here
        var $input = $(form.clk), input = $input[0];
        n = input.name;
        if (n && !input.disabled && input.type == 'image') {
            a.push({name: n, value: $input.val()});
            a.push({name: n+'.x', value: form.clk_x}, {name: n+'.y', value: form.clk_y});
        }
    }
    return a;
};

/**
 * Serializes form data into a 'submittable' string. This method will return a string
 * in the format: name1=value1&amp;name2=value2
 */
$.fn.formSerialize = function(semantic) {
    //hand off to jQuery.param for proper encoding
    return $.param(this.formToArray(semantic));
};

/**
 * Serializes all field elements in the jQuery object into a query string.
 * This method will return a string in the format: name1=value1&amp;name2=value2
 */
$.fn.fieldSerialize = function(successful) {
    var a = [];
    this.each(function() {
        var n = this.name;
        if (!n) {
            return;
        }
        var v = $.fieldValue(this, successful);
        if (v && v.constructor == Array) {
            for (var i=0,max=v.length; i < max; i++) {
                a.push({name: n, value: v[i]});
            }
        }
        else if (v !== null && typeof v != 'undefined') {
            a.push({name: this.name, value: v});
        }
    });
    //hand off to jQuery.param for proper encoding
    return $.param(a);
};

/**
 * Returns the value(s) of the element in the matched set.  For example, consider the following form:
 *
 *  <form><fieldset>
 *      <input name="A" type="text" />
 *      <input name="A" type="text" />
 *      <input name="B" type="checkbox" value="B1" />
 *      <input name="B" type="checkbox" value="B2"/>
 *      <input name="C" type="radio" value="C1" />
 *      <input name="C" type="radio" value="C2" />
 *  </fieldset></form>
 *
 *  var v = $('input[type=text]').fieldValue();
 *  // if no values are entered into the text inputs
 *  v == ['','']
 *  // if values entered into the text inputs are 'foo' and 'bar'
 *  v == ['foo','bar']
 *
 *  var v = $('input[type=checkbox]').fieldValue();
 *  // if neither checkbox is checked
 *  v === undefined
 *  // if both checkboxes are checked
 *  v == ['B1', 'B2']
 *
 *  var v = $('input[type=radio]').fieldValue();
 *  // if neither radio is checked
 *  v === undefined
 *  // if first radio is checked
 *  v == ['C1']
 *
 * The successful argument controls whether or not the field element must be 'successful'
 * (per http://www.w3.org/TR/html4/interact/forms.html#successful-controls).
 * The default value of the successful argument is true.  If this value is false the value(s)
 * for each element is returned.
 *
 * Note: This method *always* returns an array.  If no valid value can be determined the
 *    array will be empty, otherwise it will contain one or more values.
 */
$.fn.fieldValue = function(successful) {
    for (var val=[], i=0, max=this.length; i < max; i++) {
        var el = this[i];
        var v = $.fieldValue(el, successful);
        if (v === null || typeof v == 'undefined' || (v.constructor == Array && !v.length)) {
            continue;
        }
        if (v.constructor == Array) {
            $.merge(val, v);
        }
        else {
            val.push(v);
        }
    }
    return val;
};

/**
 * Returns the value of the field element.
 */
$.fieldValue = function(el, successful) {
    var n = el.name, t = el.type, tag = el.tagName.toLowerCase();
    if (successful === undefined) {
        successful = true;
    }

    if (successful && (!n || el.disabled || t == 'reset' || t == 'button' ||
        (t == 'checkbox' || t == 'radio') && !el.checked ||
        (t == 'submit' || t == 'image') && el.form && el.form.clk != el ||
        tag == 'select' && el.selectedIndex == -1)) {
            return null;
    }

    if (tag == 'select') {
        var index = el.selectedIndex;
        if (index < 0) {
            return null;
        }
        var a = [], ops = el.options;
        var one = (t == 'select-one');
        var max = (one ? index+1 : ops.length);
        for(var i=(one ? index : 0); i < max; i++) {
            var op = ops[i];
            if (op.selected) {
                var v = op.value;
                if (!v) { // extra pain for IE...
                    v = (op.attributes && op.attributes.value && !(op.attributes.value.specified)) ? op.text : op.value;
                }
                if (one) {
                    return v;
                }
                a.push(v);
            }
        }
        return a;
    }
    return $(el).val();
};

/**
 * Clears the form data.  Takes the following actions on the form's input fields:
 *  - input text fields will have their 'value' property set to the empty string
 *  - select elements will have their 'selectedIndex' property set to -1
 *  - checkbox and radio inputs will have their 'checked' property set to false
 *  - inputs of type submit, button, reset, and hidden will *not* be effected
 *  - button elements will *not* be effected
 */
$.fn.clearForm = function(includeHidden) {
    return this.each(function() {
        $('input,select,textarea', this).clearFields(includeHidden);
    });
};

/**
 * Clears the selected form elements.
 */
$.fn.clearFields = $.fn.clearInputs = function(includeHidden) {
    var re = /^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i; // 'hidden' is not in this list
    return this.each(function() {
        var t = this.type, tag = this.tagName.toLowerCase();
        if (re.test(t) || tag == 'textarea') {
            this.value = '';
        }
        else if (t == 'checkbox' || t == 'radio') {
            this.checked = false;
        }
        else if (tag == 'select') {
            this.selectedIndex = -1;
        }
        else if (t == "file") {
            if (/MSIE/.test(navigator.userAgent)) {
                $(this).replaceWith($(this).clone(true));
            } else {
                $(this).val('');
            }
        }
        else if (includeHidden) {
            // includeHidden can be the value true, or it can be a selector string
            // indicating a special test; for example:
            //  $('#myForm').clearForm('.special:hidden')
            // the above would clean hidden inputs that have the class of 'special'
            if ( (includeHidden === true && /hidden/.test(t)) ||
                 (typeof includeHidden == 'string' && $(this).is(includeHidden)) ) {
                this.value = '';
            }
        }
    });
};

/**
 * Resets the form data.  Causes all form elements to be reset to their original value.
 */
$.fn.resetForm = function() {
    return this.each(function() {
        // guard against an input with the name of 'reset'
        // note that IE reports the reset function as an 'object'
        if (typeof this.reset == 'function' || (typeof this.reset == 'object' && !this.reset.nodeType)) {
            this.reset();
        }
    });
};

/**
 * Enables or disables any matching elements.
 */
$.fn.enable = function(b) {
    if (b === undefined) {
        b = true;
    }
    return this.each(function() {
        this.disabled = !b;
    });
};

/**
 * Checks/unchecks any matching checkboxes or radio buttons and
 * selects/deselects and matching option elements.
 */
$.fn.selected = function(select) {
    if (select === undefined) {
        select = true;
    }
    return this.each(function() {
        var t = this.type;
        if (t == 'checkbox' || t == 'radio') {
            this.checked = select;
        }
        else if (this.tagName.toLowerCase() == 'option') {
            var $sel = $(this).parent('select');
            if (select && $sel[0] && $sel[0].type == 'select-one') {
                // deselect all other options
                $sel.find('option').selected(false);
            }
            this.selected = select;
        }
    });
};

// expose debug var
$.fn.ajaxSubmit.debug = false;

// helper fn for console logging
function log() {
    if (!$.fn.ajaxSubmit.debug) {
        return;
    }
    var msg = '[jquery.form] ' + Array.prototype.join.call(arguments,'');
    if (window.console && window.console.log) {
        window.console.log(msg);
    }
    else if (window.opera && window.opera.postError) {
        window.opera.postError(msg);
    }
}

}));

;/**
 * bootbox.js v4.4.0
 *
 * http://bootboxjs.com/license.txt
 */

// @see https://github.com/makeusabrew/bootbox/issues/180
// @see https://github.com/makeusabrew/bootbox/issues/186
(function (root, factory) {

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
    root.bootbox = factory(root.jQuery);
  }

}(this, function init($, undefined) {

  "use strict";

  // the base DOM structure needed to create a modal
  var templates = {
    dialog:
      "<div class='bootbox modal' tabindex='-1' role='dialog' aria-hidden='true'>" +
        "<div class='modal-dialog'>" +
          "<div class='modal-content'>" +
            "<div class='modal-body'><div class='bootbox-body'></div></div>" +
          "</div>" +
        "</div>" +
      "</div>",
    header:
      "<div class='modal-header'>" +
        "<h4 class='modal-title'></h4>" +
      "</div>",
    footer:
      "<div class='modal-footer'></div>",
    closeButton:
      "<button type='button' class='bootbox-close-button close' data-dismiss='modal' aria-hidden='true'>&times;</button>",
    form:
      "<form class='bootbox-form'></form>",
    inputs: {
      text:
        "<input class='bootbox-input bootbox-input-text form-control' autocomplete=off type=text />",
      textarea:
        "<textarea class='bootbox-input bootbox-input-textarea form-control'></textarea>",
      email:
        "<input class='bootbox-input bootbox-input-email form-control' autocomplete='off' type='email' />",
      select:
        "<select class='bootbox-input bootbox-input-select form-control'></select>",
      checkbox:
        "<div class='checkbox'><label><input class='bootbox-input bootbox-input-checkbox' type='checkbox' /></label></div>",
      date:
        "<input class='bootbox-input bootbox-input-date form-control' autocomplete=off type='date' />",
      time:
        "<input class='bootbox-input bootbox-input-time form-control' autocomplete=off type='time' />",
      number:
        "<input class='bootbox-input bootbox-input-number form-control' autocomplete=off type='number' />",
      password:
        "<input class='bootbox-input bootbox-input-password form-control' autocomplete='off' type='password' />"
    }
  };

  var defaults = {
    // default language
    locale: "zh_CN",
    // show backdrop or not. Default to static so user has to interact with dialog
    backdrop: "static",
    // animate the modal in/out
    animate: true,
    // additional class string applied to the top level dialog
    className: null,
    // whether or not to include a close button
    closeButton: true,
    // show the dialog immediately by default
    show: true,
    // dialog container
    container: "body"
  };

  // our public object; augmented after our private API
  var exports = {};

  /**
   * @private
   */
  function _t(key) {
    var locale = locales[defaults.locale];
    return locale ? locale[key] : locales.en[key];
  }

  function processCallback(e, dialog, callback) {
    e.stopPropagation();
    e.preventDefault();

    // by default we assume a callback will get rid of the dialog,
    // although it is given the opportunity to override this

    // so, if the callback can be invoked and it *explicitly returns false*
    // then we'll set a flag to keep the dialog active...
    var preserveDialog = $.isFunction(callback) && callback.call(dialog, e) === false;

    // ... otherwise we'll bin it
    if (!preserveDialog) {
      dialog.modal("hide");
    }
  }

  function getKeyLength(obj) {
    // @TODO defer to Object.keys(x).length if available?
    var k, t = 0;
    for (k in obj) {
      t ++;
    }
    return t;
  }

  function each(collection, iterator) {
    var index = 0;
    $.each(collection, function(key, value) {
      iterator(key, value, index++);
    });
  }

  function sanitize(options) {
    var buttons;
    var total;

    if (typeof options !== "object") {
      throw new Error("Please supply an object of options");
    }

    // if (!options.message) {
    //   throw new Error("Please specify a message");
    // }

    // make sure any supplied options take precedence over defaults
    options = $.extend({}, defaults, options);

    if (!options.buttons) {
      options.buttons = {};
    }

    buttons = options.buttons;

    total = getKeyLength(buttons);

    each(buttons, function(key, button, index) {

      if ($.isFunction(button)) {
        // short form, assume value is our callback. Since button
        // isn't an object it isn't a reference either so re-assign it
        button = buttons[key] = {
          callback: button
        };
      }

      // before any further checks make sure by now button is the correct type
      if ($.type(button) !== "object") {
        throw new Error("button with key " + key + " must be an object");
      }

      if (!button.label) {
        // the lack of an explicit label means we'll assume the key is good enough
        button.label = key;
      }

      if (!button.className) {
        if (total <= 2 && index === total-1) {
          // always add a primary to the main option in a two-button dialog
          button.className = "btn-primary";
        } else {
          button.className = "btn-default";
        }
      }
    });

    return options;
  }

  /**
   * map a flexible set of arguments into a single returned object
   * if args.length is already one just return it, otherwise
   * use the properties argument to map the unnamed args to
   * object properties
   * so in the latter case:
   * mapArguments(["foo", $.noop], ["message", "callback"])
   * -> { message: "foo", callback: $.noop }
   */
  function mapArguments(args, properties) {
    var argn = args.length;
    var options = {};

    if (argn < 1 || argn > 2) {
      throw new Error("Invalid argument length");
    }

    if (argn === 2 || typeof args[0] === "string") {
      options[properties[0]] = args[0];
      options[properties[1]] = args[1];
    } else {
      options = args[0];
    }

    return options;
  }

  /**
   * merge a set of default dialog options with user supplied arguments
   */
  function mergeArguments(defaults, args, properties) {
    return $.extend(
      // deep merge
      true,
      // ensure the target is an empty, unreferenced object
      {},
      // the base options object for this type of dialog (often just buttons)
      defaults,
      // args could be an object or array; if it's an array properties will
      // map it to a proper options object
      mapArguments(
        args,
        properties
      )
    );
  }

  /**
   * this entry-level method makes heavy use of composition to take a simple
   * range of inputs and return valid options suitable for passing to bootbox.dialog
   */
  function mergeDialogOptions(className, labels, properties, args) {
    //  build up a base set of dialog properties
    var baseOptions = {
      className: "bootbox-" + className,
      buttons: createLabels.apply(null, labels)
    };

    // ensure the buttons properties generated, *after* merging
    // with user args are still valid against the supplied labels
    return validateButtons(
      // merge the generated base properties with user supplied arguments
      mergeArguments(
        baseOptions,
        args,
        // if args.length > 1, properties specify how each arg maps to an object key
        properties
      ),
      labels
    );
  }

  /**
   * from a given list of arguments return a suitable object of button labels
   * all this does is normalise the given labels and translate them where possible
   * e.g. "ok", "confirm" -> { ok: "OK, cancel: "Annuleren" }
   */
  function createLabels() {
    var buttons = {};

    for (var i = 0, j = arguments.length; i < j; i++) {
      var argument = arguments[i];
      var key = argument.toLowerCase();
      var value = argument.toUpperCase();

      buttons[key] = {
        label: _t(value)
      };
    }

    return buttons;
  }

  function validateButtons(options, buttons) {
    var allowedButtons = {};
    each(buttons, function(key, value) {
      allowedButtons[value] = true;
    });

    each(options.buttons, function(key) {
      if (allowedButtons[key] === undefined) {
        throw new Error("button key " + key + " is not allowed (options are " + buttons.join("\n") + ")");
      }
    });

    return options;
  }

  exports.alert = function() {
    var options;

    options = mergeDialogOptions("alert", ["ok"], ["message", "callback"], arguments);

    if (options.callback && !$.isFunction(options.callback)) {
      throw new Error("alert requires callback property to be a function when provided");
    }

    /**
     * overrides
     */
    options.buttons.ok.callback = options.onEscape = function() {
      if ($.isFunction(options.callback)) {
        return options.callback.call(this);
      }
      return true;
    };

    return exports.dialog(options);
  };

  exports.confirm = function() {
    var options;

    options = mergeDialogOptions("confirm", ["cancel", "confirm"], ["message", "callback"], arguments);

    /**
     * overrides; undo anything the user tried to set they shouldn't have
     */
    options.buttons.cancel.callback = options.onEscape = function() {
      return options.callback.call(this, false);
    };

    options.buttons.confirm.callback = function() {
      return options.callback.call(this, true);
    };

    // confirm specific validation
    if (!$.isFunction(options.callback)) {
      throw new Error("confirm requires a callback");
    }

    return exports.dialog(options);
  };

  exports.prompt = function() {
    var options;
    var defaults;
    var dialog;
    var form;
    var input;
    var shouldShow;
    var inputOptions;

    // we have to create our form first otherwise
    // its value is undefined when gearing up our options
    // @TODO this could be solved by allowing message to
    // be a function instead...
    form = $(templates.form);

    // prompt defaults are more complex than others in that
    // users can override more defaults
    // @TODO I don't like that prompt has to do a lot of heavy
    // lifting which mergeDialogOptions can *almost* support already
    // just because of 'value' and 'inputType' - can we refactor?
    defaults = {
      className: "bootbox-prompt",
      buttons: createLabels("cancel", "confirm"),
      value: "",
      inputType: "text"
    };

    options = validateButtons(
      mergeArguments(defaults, arguments, ["title", "callback"]),
      ["cancel", "confirm"]
    );

    // capture the user's show value; we always set this to false before
    // spawning the dialog to give us a chance to attach some handlers to
    // it, but we need to make sure we respect a preference not to show it
    shouldShow = (options.show === undefined) ? true : options.show;

    /**
     * overrides; undo anything the user tried to set they shouldn't have
     */
    options.message = form;

    options.buttons.cancel.callback = options.onEscape = function() {
      return options.callback.call(this, null);
    };

    options.buttons.confirm.callback = function() {
      var value;

      switch (options.inputType) {
        case "text":
        case "textarea":
        case "email":
        case "select":
        case "date":
        case "time":
        case "number":
        case "password":
          value = input.val();
          break;

        case "checkbox":
          var checkedItems = input.find("input:checked");

          // we assume that checkboxes are always multiple,
          // hence we default to an empty array
          value = [];

          each(checkedItems, function(_, item) {
            value.push($(item).val());
          });
          break;
      }

      return options.callback.call(this, value);
    };

    options.show = false;

    // prompt specific validation
    if (!options.title) {
      throw new Error("prompt requires a title");
    }

    if (!$.isFunction(options.callback)) {
      throw new Error("prompt requires a callback");
    }

    if (!templates.inputs[options.inputType]) {
      throw new Error("invalid prompt type");
    }

    // create the input based on the supplied type
    input = $(templates.inputs[options.inputType]);

    switch (options.inputType) {
      case "text":
      case "textarea":
      case "email":
      case "date":
      case "time":
      case "number":
      case "password":
        input.val(options.value);
        break;

      case "select":
        var groups = {};
        inputOptions = options.inputOptions || [];

        if (!$.isArray(inputOptions)) {
          throw new Error("Please pass an array of input options");
        }

        if (!inputOptions.length) {
          throw new Error("prompt with select requires options");
        }

        each(inputOptions, function(_, option) {

          // assume the element to attach to is the input...
          var elem = input;

          if (option.value === undefined || option.text === undefined) {
            throw new Error("given options in wrong format");
          }

          // ... but override that element if this option sits in a group

          if (option.group) {
            // initialise group if necessary
            if (!groups[option.group]) {
              groups[option.group] = $("<optgroup/>").attr("label", option.group);
            }

            elem = groups[option.group];
          }

          elem.append("<option value='" + option.value + "'>" + option.text + "</option>");
        });

        each(groups, function(_, group) {
          input.append(group);
        });

        // safe to set a select's value as per a normal input
        input.val(options.value);
        break;

      case "checkbox":
        var values   = $.isArray(options.value) ? options.value : [options.value];
        inputOptions = options.inputOptions || [];

        if (!inputOptions.length) {
          throw new Error("prompt with checkbox requires options");
        }

        if (!inputOptions[0].value || !inputOptions[0].text) {
          throw new Error("given options in wrong format");
        }

        // checkboxes have to nest within a containing element, so
        // they break the rules a bit and we end up re-assigning
        // our 'input' element to this container instead
        input = $("<div/>");

        each(inputOptions, function(_, option) {
          var checkbox = $(templates.inputs[options.inputType]);

          checkbox.find("input").attr("value", option.value);
          checkbox.find("label").append(option.text);

          // we've ensured values is an array so we can always iterate over it
          each(values, function(_, value) {
            if (value === option.value) {
              checkbox.find("input").prop("checked", true);
            }
          });

          input.append(checkbox);
        });
        break;
    }

    // @TODO provide an attributes option instead
    // and simply map that as keys: vals
    if (options.placeholder) {
      input.attr("placeholder", options.placeholder);
    }

    if (options.pattern) {
      input.attr("pattern", options.pattern);
    }

    if (options.maxlength) {
      input.attr("maxlength", options.maxlength);
    }

    // now place it in our form
    form.append(input);

    form.on("submit", function(e) {
      e.preventDefault();
      // Fix for SammyJS (or similar JS routing library) hijacking the form post.
      e.stopPropagation();
      // @TODO can we actually click *the* button object instead?
      // e.g. buttons.confirm.click() or similar
      dialog.find(".btn-primary").click();
    });

    dialog = exports.dialog(options);

    // clear the existing handler focusing the submit button...
    dialog.off("shown.bs.modal");

    // ...and replace it with one focusing our input, if possible
    dialog.on("shown.bs.modal", function() {
      // need the closure here since input isn't
      // an object otherwise
      input.focus();
    });

    if (shouldShow === true) {
      dialog.modal("show");
    }

    return dialog;
  };

  exports.dialog = function(options) {
    options = sanitize(options);

    var dialog = $(templates.dialog);
    var innerDialog = dialog.find(".modal-dialog");
    var body = dialog.find(".modal-body");
    var buttons = options.buttons;
    var buttonStr = "";
    var callbacks = {
      onEscape: options.onEscape
    };

    if ($.fn.modal === undefined) {
      throw new Error(
        "$.fn.modal is not defined; please double check you have included " +
        "the Bootstrap JavaScript library. See http://getbootstrap.com/javascript/ " +
        "for more details."
      );
    }

    each(buttons, function(key, button) {

      // @TODO I don't like this string appending to itself; bit dirty. Needs reworking
      // can we just build up button elements instead? slower but neater. Then button
      // can just become a template too
      buttonStr += "<button data-bb-handler='" + key + "' type='button' class='btn " + button.className + "'>" + button.label + "</button>";
      callbacks[key] = button.callback;
    });

    body.find(".bootbox-body").html(options.message);

    if (options.animate === true) {
      dialog.addClass("fade");
    }

    if (options.className) {
      dialog.addClass(options.className);
    }

    if (options.size === "large") {
      innerDialog.addClass("modal-lg");
    } else if (options.size === "small") {
      innerDialog.addClass("modal-sm");
    }

    if (options.title) {
      body.before(templates.header);
    }

    if (options.closeButton) {
      var closeButton = $(templates.closeButton);

      if (options.title) {
        dialog.find(".modal-header").prepend(closeButton);
      } else {
        closeButton.css("margin-top", "-10px").prependTo(body);
      }
    }

    if (options.title) {
      dialog.find(".modal-title").html(options.title);
    }

    if (buttonStr.length) {
      body.after(templates.footer);
      dialog.find(".modal-footer").html(buttonStr);
    }


    /**
     * Bootstrap event listeners; used handle extra
     * setup & teardown required after the underlying
     * modal has performed certain actions
     */

    dialog.on("hidden.bs.modal", function(e) {
      // ensure we don't accidentally intercept hidden events triggered
      // by children of the current dialog. We shouldn't anymore now BS
      // namespaces its events; but still worth doing
      if (e.target === this) {
        dialog.remove();
      }
    });

    /*
    dialog.on("show.bs.modal", function() {
      // sadly this doesn't work; show is called *just* before
      // the backdrop is added so we'd need a setTimeout hack or
      // otherwise... leaving in as would be nice
      if (options.backdrop) {
        dialog.next(".modal-backdrop").addClass("bootbox-backdrop");
      }
    });
    */

    dialog.on("shown.bs.modal", function() {
      dialog.find(".btn-primary:first").focus();
    });

    /**
     * Bootbox event listeners; experimental and may not last
     * just an attempt to decouple some behaviours from their
     * respective triggers
     */

    if (options.backdrop !== "static") {
      // A boolean true/false according to the Bootstrap docs
      // should show a dialog the user can dismiss by clicking on
      // the background.
      // We always only ever pass static/false to the actual
      // $.modal function because with `true` we can't trap
      // this event (the .modal-backdrop swallows it)
      // However, we still want to sort of respect true
      // and invoke the escape mechanism instead
      dialog.on("click.dismiss.bs.modal", function(e) {
        // @NOTE: the target varies in >= 3.3.x releases since the modal backdrop
        // moved *inside* the outer dialog rather than *alongside* it
        if (dialog.children(".modal-backdrop").length) {
          e.currentTarget = dialog.children(".modal-backdrop").get(0);
        }

        if (e.target !== e.currentTarget) {
          return;
        }

        dialog.trigger("escape.close.bb");
      });
    }

    dialog.on("escape.close.bb", function(e) {
      if (callbacks.onEscape) {
        processCallback(e, dialog, callbacks.onEscape);
      }
    });

    /**
     * Standard jQuery event listeners; used to handle user
     * interaction with our dialog
     */

    dialog.on("click", ".modal-footer button", function(e) {
      var callbackKey = $(this).data("bb-handler");

      processCallback(e, dialog, callbacks[callbackKey]);
    });

    dialog.on("click", ".bootbox-close-button", function(e) {
      // onEscape might be falsy but that's fine; the fact is
      // if the user has managed to click the close button we
      // have to close the dialog, callback or not
      processCallback(e, dialog, callbacks.onEscape);
    });

    dialog.on("keyup", function(e) {
      if (e.which === 27) {
        dialog.trigger("escape.close.bb");
      }
    });

    // the remainder of this method simply deals with adding our
    // dialogent to the DOM, augmenting it with Bootstrap's modal
    // functionality and then giving the resulting object back
    // to our caller

    $(options.container).append(dialog);

    dialog.modal({
      backdrop: options.backdrop ? "static": false,
      keyboard: false,
      show: false
    });

    if (options.show) {
      dialog.modal("show");
    }

    // @TODO should we return the raw element here or should
    // we wrap it in an object on which we can expose some neater
    // methods, e.g. var d = bootbox.alert(); d.hide(); instead
    // of d.modal("hide");

   /*
    function BBDialog(elem) {
      this.elem = elem;
    }

    BBDialog.prototype = {
      hide: function() {
        return this.elem.modal("hide");
      },
      show: function() {
        return this.elem.modal("show");
      }
    };
    */

    return dialog;

  };

  exports.setDefaults = function() {
    var values = {};

    if (arguments.length === 2) {
      // allow passing of single key/value...
      values[arguments[0]] = arguments[1];
    } else {
      // ... and as an object too
      values = arguments[0];
    }

    $.extend(defaults, values);
  };

  exports.hideAll = function() {
    $(".bootbox").modal("hide");

    return exports;
  };


  /**
   * standard locales. Please add more according to ISO 639-1 standard. Multiple language variants are
   * unlikely to be required. If this gets too large it can be split out into separate JS files.
   */
  var locales = {
    zh_CN : {
      OK      : "OK",
      CANCEL  : "取消",
      CONFIRM : "确认"
    }
  };

  exports.addLocale = function(name, values) {
    $.each(["OK", "CANCEL", "CONFIRM"], function(_, v) {
      if (!values[v]) {
        throw new Error("Please supply a translation for '" + v + "'");
      }
    });

    locales[name] = {
      OK: values.OK,
      CANCEL: values.CANCEL,
      CONFIRM: values.CONFIRM
    };

    return exports;
  };

  exports.removeLocale = function(name) {
    delete locales[name];

    return exports;
  };

  exports.setLocale = function(name) {
    return exports.setDefaults("locale", name);
  };

  exports.init = function(_$) {
    return init(_$ || $);
  };

  return exports;
}));

;/*
 * Toastr
 * Copyright 2012-2015
 * Authors: John Papa, Hans Fjällemark, and Tim Ferrell.
 * All Rights Reserved.
 * Use, reproduction, distribution, and modification of this code is subject to the terms and
 * conditions of the MIT license, available at http://www.opensource.org/licenses/mit-license.php
 *
 * ARIA Support: Greta Krafsig
 *
 * Project: https://github.com/CodeSeven/toastr
 */
/* global define */
(function (define) {
    define(['jquery'], function ($) {
        return (function () {
            var $container;
            var listener;
            var toastId = 0;
            var toastType = {
                error: 'error',
                info: 'info',
                success: 'success',
                warning: 'warning'
            };

            var toastr = {
                clear: clear,
                remove: remove,
                error: error,
                getContainer: getContainer,
                info: info,
                options: {},
                subscribe: subscribe,
                success: success,
                version: '2.1.2',
                warning: warning
            };

            var previousToast;

            return toastr;

            ////////////////

            function error(message, title, optionsOverride) {
                return notify({
                    type: toastType.error,
                    iconClass: getOptions().iconClasses.error,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function getContainer(options, create) {
                if (!options) { options = getOptions(); }
                $container = $('#' + options.containerId);
                if ($container.length) {
                    return $container;
                }
                if (create) {
                    $container = createContainer(options);
                }
                return $container;
            }

            function info(message, title, optionsOverride) {
                return notify({
                    type: toastType.info,
                    iconClass: getOptions().iconClasses.info,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function subscribe(callback) {
                listener = callback;
            }

            function success(message, title, optionsOverride) {
                return notify({
                    type: toastType.success,
                    iconClass: getOptions().iconClasses.success,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function warning(message, title, optionsOverride) {
                return notify({
                    type: toastType.warning,
                    iconClass: getOptions().iconClasses.warning,
                    message: message,
                    optionsOverride: optionsOverride,
                    title: title
                });
            }

            function clear($toastElement, clearOptions) {
                var options = getOptions();
                if (!$container) { getContainer(options); }
                if (!clearToast($toastElement, options, clearOptions)) {
                    clearContainer(options);
                }
            }

            function remove($toastElement) {
                var options = getOptions();
                if (!$container) { getContainer(options); }
                if ($toastElement && $(':focus', $toastElement).length === 0) {
                    removeToast($toastElement);
                    return;
                }
                if ($container.children().length) {
                    $container.remove();
                }
            }

            // internal functions

            function clearContainer (options) {
                var toastsToClear = $container.children();
                for (var i = toastsToClear.length - 1; i >= 0; i--) {
                    clearToast($(toastsToClear[i]), options);
                }
            }

            function clearToast ($toastElement, options, clearOptions) {
                var force = clearOptions && clearOptions.force ? clearOptions.force : false;
                if ($toastElement && (force || $(':focus', $toastElement).length === 0)) {
                    $toastElement[options.hideMethod]({
                        duration: options.hideDuration,
                        easing: options.hideEasing,
                        complete: function () { removeToast($toastElement); }
                    });
                    return true;
                }
                return false;
            }

            function createContainer(options) {
                $container = $('<div/>')
                    .attr('id', options.containerId)
                    .addClass(options.positionClass)
                    .attr('aria-live', 'polite')
                    .attr('role', 'alert');

                $container.appendTo($(options.target));
                return $container;
            }

            function getDefaults() {
                return {
                    tapToDismiss: true,
                    toastClass: 'toast',
                    containerId: 'toast-container',
                    debug: false,

                    showMethod: 'fadeIn', //fadeIn, slideDown, and show are built into jQuery
                    showDuration: 300,
                    showEasing: 'swing', //swing and linear are built into jQuery
                    onShown: undefined,
                    hideMethod: 'fadeOut',
                    hideDuration: 1000,
                    hideEasing: 'swing',
                    onHidden: undefined,
                    closeMethod: false,
                    closeDuration: false,
                    closeEasing: false,

                    extendedTimeOut: 1000,
                    iconClasses: {
                        error: 'toast-error',
                        info: 'toast-info',
                        success: 'toast-success',
                        warning: 'toast-warning'
                    },
                    iconClass: 'toast-info',
                    positionClass: 'toast-top-right',
                    timeOut: 5000, // Set timeOut and extendedTimeOut to 0 to make it sticky
                    titleClass: 'toast-title',
                    messageClass: 'toast-message',
                    escapeHtml: false,
                    target: 'body',
                    closeHtml: '<button type="button">&times;</button>',
                    newestOnTop: true,
                    preventDuplicates: false,
                    progressBar: false
                };
            }

            function publish(args) {
                if (!listener) { return; }
                listener(args);
            }

            function notify(map) {
                var options = getOptions();
                var iconClass = map.iconClass || options.iconClass;

                if (typeof (map.optionsOverride) !== 'undefined') {
                    options = $.extend(options, map.optionsOverride);
                    iconClass = map.optionsOverride.iconClass || iconClass;
                }

                if (shouldExit(options, map)) { return; }

                toastId++;

                $container = getContainer(options, true);

                var intervalId = null;
                var $toastElement = $('<div/>');
                var $titleElement = $('<div/>');
                var $messageElement = $('<div/>');
                var $progressElement = $('<div/>');
                var $closeElement = $(options.closeHtml);
                var progressBar = {
                    intervalId: null,
                    hideEta: null,
                    maxHideTime: null
                };
                var response = {
                    toastId: toastId,
                    state: 'visible',
                    startTime: new Date(),
                    options: options,
                    map: map
                };

                personalizeToast();

                displayToast();

                handleEvents();

                publish(response);

                if (options.debug && console) {
                    console.log(response);
                }

                return $toastElement;

                function escapeHtml(source) {
                    if (source == null)
                        source = "";

                    return new String(source)
                        .replace(/&/g, '&amp;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                }

                function personalizeToast() {
                    setIcon();
                    setTitle();
                    setMessage();
                    setCloseButton();
                    setProgressBar();
                    setSequence();
                }

                function handleEvents() {
                    $toastElement.hover(stickAround, delayedHideToast);
                    if (!options.onclick && options.tapToDismiss) {
                        $toastElement.click(hideToast);
                    }

                    if (options.closeButton && $closeElement) {
                        $closeElement.click(function (event) {
                            if (event.stopPropagation) {
                                event.stopPropagation();
                            } else if (event.cancelBubble !== undefined && event.cancelBubble !== true) {
                                event.cancelBubble = true;
                            }
                            hideToast(true);
                        });
                    }

                    if (options.onclick) {
                        $toastElement.click(function (event) {
                            options.onclick(event);
                            hideToast();
                        });
                    }
                }

                function displayToast() {
                    $toastElement.hide();

                    $toastElement[options.showMethod](
                        {duration: options.showDuration, easing: options.showEasing, complete: options.onShown}
                    );

                    if (options.timeOut > 0) {
                        intervalId = setTimeout(hideToast, options.timeOut);
                        progressBar.maxHideTime = parseFloat(options.timeOut);
                        progressBar.hideEta = new Date().getTime() + progressBar.maxHideTime;
                        if (options.progressBar) {
                            progressBar.intervalId = setInterval(updateProgress, 10);
                        }
                    }
                }

                function setIcon() {
                    if (map.iconClass) {
                        $toastElement.addClass(options.toastClass).addClass(iconClass);
                    }
                }

                function setSequence() {
                    if (options.newestOnTop) {
                        $container.prepend($toastElement);
                    } else {
                        $container.append($toastElement);
                    }
                }

                function setTitle() {
                    if (map.title) {
                        $titleElement.append(!options.escapeHtml ? map.title : escapeHtml(map.title)).addClass(options.titleClass);
                        $toastElement.append($titleElement);
                    }
                }

                function setMessage() {
                    if (map.message) {
                        $messageElement.append(!options.escapeHtml ? map.message : escapeHtml(map.message)).addClass(options.messageClass);
                        $toastElement.append($messageElement);
                    }
                }

                function setCloseButton() {
                    if (options.closeButton) {
                        $closeElement.addClass('toast-close-button').attr('role', 'button');
                        $toastElement.prepend($closeElement);
                    }
                }

                function setProgressBar() {
                    if (options.progressBar) {
                        $progressElement.addClass('toast-progress');
                        $toastElement.prepend($progressElement);
                    }
                }

                function shouldExit(options, map) {
                    if (options.preventDuplicates) {
                        if (map.message === previousToast) {
                            return true;
                        } else {
                            previousToast = map.message;
                        }
                    }
                    return false;
                }

                function hideToast(override) {
                    var method = override && options.closeMethod !== false ? options.closeMethod : options.hideMethod;
                    var duration = override && options.closeDuration !== false ?
                        options.closeDuration : options.hideDuration;
                    var easing = override && options.closeEasing !== false ? options.closeEasing : options.hideEasing;
                    if ($(':focus', $toastElement).length && !override) {
                        return;
                    }
                    clearTimeout(progressBar.intervalId);
                    return $toastElement[method]({
                        duration: duration,
                        easing: easing,
                        complete: function () {
                            removeToast($toastElement);
                            if (options.onHidden && response.state !== 'hidden') {
                                options.onHidden();
                            }
                            response.state = 'hidden';
                            response.endTime = new Date();
                            publish(response);
                        }
                    });
                }

                function delayedHideToast() {
                    if (options.timeOut > 0 || options.extendedTimeOut > 0) {
                        intervalId = setTimeout(hideToast, options.extendedTimeOut);
                        progressBar.maxHideTime = parseFloat(options.extendedTimeOut);
                        progressBar.hideEta = new Date().getTime() + progressBar.maxHideTime;
                    }
                }

                function stickAround() {
                    clearTimeout(intervalId);
                    progressBar.hideEta = 0;
                    $toastElement.stop(true, true)[options.showMethod](
                        {duration: options.showDuration, easing: options.showEasing}
                    );
                }

                function updateProgress() {
                    var percentage = ((progressBar.hideEta - (new Date().getTime())) / progressBar.maxHideTime) * 100;
                    $progressElement.width(percentage + '%');
                }
            }

            function getOptions() {
                return $.extend({}, getDefaults(), toastr.options);
            }

            function removeToast($toastElement) {
                if (!$container) { $container = getContainer(); }
                if ($toastElement.is(':visible')) {
                    return;
                }
                $toastElement.remove();
                $toastElement = null;
                if ($container.children().length === 0) {
                    $container.remove();
                    previousToast = undefined;
                }
            }

        })();
    });
}(typeof define === 'function' && define.amd ? define : function (deps, factory) {
    if (typeof module !== 'undefined' && module.exports) { //Node
        module.exports = factory(require('jquery'));
    } else {
        window.toastr = factory(window.jQuery);
    }
}));

;/**
 * @preserve
 * bootpag - jQuery plugin for dynamic pagination
 *
 * Copyright (c) 2015 botmonster@7items.com
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Project home:
 *   http://botmonster.com/jquery-bootpag/
 *
 * Version:  1.0.7
 *
 */
(function($, window) {

    $.fn.bootpag = function(options){

        var $owner = this,
            settings = $.extend({
                total: 0,
                page: 1,
                maxVisible: null,
                leaps: true,
                href: 'javascript:void(0);',
                hrefVariable: '{{number}}',
                next: '&raquo;',
                prev: '&laquo;',
				firstLastUse: false,
                first: '<span aria-hidden="true">&larr;</span>',
                last: '<span aria-hidden="true">&rarr;</span>',
                wrapClass: 'pagination',
                activeClass: 'active',
                disabledClass: 'disabled',
                nextClass: 'next',
                prevClass: 'prev',
		        lastClass: 'last',
                firstClass: 'first'
            },
            $owner.data('settings') || {},
            options || {});

        if(settings.total <= 0)
            return this;

          if(!$.isNumeric(settings.maxVisible) && !settings.maxVisible){
            settings.maxVisible = parseInt(settings.total, 10);
        }

        $owner.data('settings', settings);

        function renderPage($bootpag, page){

            page = parseInt(page, 10);
            var lp,
                maxV = settings.maxVisible == 0 ? 1 : settings.maxVisible,
                step = settings.maxVisible == 1 ? 0 : 1,
                vis = Math.floor((page - 1) / maxV) * maxV,
                $page = $bootpag.find('li');
            settings.page = page = page < 0 ? 0 : page > settings.total ? settings.total : page;
            $page.removeClass(settings.activeClass);
            lp = page - 1 < 1 ? 1 :
                    settings.leaps && page - 1 >= settings.maxVisible ?
                        Math.floor((page - 1) / maxV) * maxV : page - 1;

			if(settings.firstLastUse) {
				$page
					.first()
					.toggleClass(settings.disabledClass, page === 1);
			}

			var lfirst = $page.first();
			if(settings.firstLastUse) {
				lfirst = lfirst.next();
			}

			lfirst
                .toggleClass(settings.disabledClass, page === 1)
                .attr('data-lp', lp)
                .find('a').attr('href', href(lp));

            var step = settings.maxVisible == 1 ? 0 : 1;

            lp = page + 1 > settings.total ? settings.total :
                    settings.leaps && page + 1 < settings.total - settings.maxVisible ?
                        vis + settings.maxVisible + step: page + 1;

			var llast = $page.last();
			if(settings.firstLastUse) {
				llast = llast.prev();
			}

			llast
                .toggleClass(settings.disabledClass, page === settings.total)
                .attr('data-lp', lp)
                .find('a').attr('href', href(lp));

			$page
				.last()
				.toggleClass(settings.disabledClass, page === settings.total);


            var $currPage = $page.filter('[data-lp='+page+']');

			var clist = "." + [settings.nextClass,
							   settings.prevClass,
                               settings.firstClass,
                               settings.lastClass].join(",.");
            if(!$currPage.not(clist).length){
                var d = page <= vis ? -settings.maxVisible : 0;
                $page.not(clist).each(function(index){
                    lp = index + 1 + vis + d;
                    $(this)
                        .attr('data-lp', lp)
                        .toggle(lp <= settings.total)
                        .find('a').html(lp).attr('href', href(lp));
                });
                $currPage = $page.filter('[data-lp='+page+']');
            }
            $currPage.not(clist).addClass(settings.activeClass);
            $owner.data('settings', settings);
        }

        function href(c){

            return settings.href.replace(settings.hrefVariable, c);
        }

        return this.each(function(){

            var $bootpag, lp, me = $(this),
                p = ['<ul class="', settings.wrapClass, ' bootpag">'];

            if(settings.firstLastUse){
                p = p.concat(['<li data-lp="1" class="', settings.firstClass,
                       '"><a href="', href(1), '">', settings.first, '</a></li>']);
            }
            if(settings.prev){
                p = p.concat(['<li data-lp="1" class="', settings.prevClass,
                       '"><a href="', href(1), '">', settings.prev, '</a></li>']);
            }
            for(var c = 1; c <= Math.min(settings.total, settings.maxVisible); c++){
                p = p.concat(['<li data-lp="', c, '"><a href="', href(c), '">', c, '</a></li>']);
            }
            if(settings.next){
                lp = settings.leaps && settings.total > settings.maxVisible
                    ? Math.min(settings.maxVisible + 1, settings.total) : 2;
                p = p.concat(['<li data-lp="', lp, '" class="',
                             settings.nextClass, '"><a href="', href(lp),
                             '">', settings.next, '</a></li>']);
            }
            if(settings.firstLastUse){
                p = p.concat(['<li data-lp="', settings.total, '" class="last"><a href="',
                             href(settings.total),'">', settings.last, '</a></li>']);
            }
            p.push('</ul>');
            me.find('ul.bootpag').remove();
            me.append(p.join(''));
            $bootpag = me.find('ul.bootpag');

            me.find('li').click(function paginationClick(){

                var me = $(this);
                if(me.hasClass(settings.disabledClass) || me.hasClass(settings.activeClass)){
                    return;
                }
                var page = parseInt(me.attr('data-lp'), 10);
                $owner.find('ul.bootpag').each(function(){
                    renderPage($(this), page);
                });

                $owner.trigger('page', page);
            });
            renderPage($bootpag, settings.page);
        });
    }

})(jQuery, window);

;/*!
 * mower - v1.1.1 - 2015-10-22
 * Copyright (c) 2015 Infinitus, Inc.
 * Licensed under Apache License 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 */

if (typeof jQuery === 'undefined') { throw new Error('mower\'s JavaScript requires jQuery') }

/** ========================================================================
 * Mower: string.mower.js
 *
 * string uitility
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

var UniqueId = (function() {
    return function(prefix) {
        do prefix += ~~(Math.random() * 1000000)
        while (document.getElementById(prefix))
        return prefix;
    };
})();

/**
 * 线形树，不修改原始数据，只是原始数据的重新排序.
 */
Array.prototype.makeLineTree = function(option) {
    var o = option || {},
        id = o.id || 'id',
        pid = o.pid || 'pid',
        order = o.order || 'ordered';

    function node(origin) {
        var self = this;
        self.origin = origin;
        self.getKey = function() {
            if (self.key) {
                return self.key;
            }
            self.key = [];
            self.key.push(getOrder(self.origin));
            self.key.push(getId(self.origin));
            if (self.parent) {
                var pkey = self.parent.getKey();
                for (var i = pkey.length - 1; i >= 0; i--) {
                    self.key.unshift(pkey[i]);
                }
            }
            return self.key;
        };
        self.compare2 = function(other) {
            var lk = self.getKey(),
                rk = other.getKey(),
                loop = Math.min(lk.length, rk.length);
            for (var i = 0; i < loop; i++) {
                if (typeof(lk[i]) == 'undefined' || typeof(rk[i]) == 'undefined') {
                    break;
                }
                if (lk[i] != rk[i]) {
                    var diff = (lk[i] + '').length - (rk[i] + '').length;
                    return diff == 0 ? (lk[i] > rk[i] ? 1 : -1) : (diff > 0 ? 1 : -1);
                }
            }
            return lk.length > rk.length ? 1 : -1;
        };
    }

    function getId(m) {
        if (typeof(id) == 'function') {
            return id(m) || 0;
        }
        return m[id] || 0;
    }

    function getPid(m) {
        if (typeof(pid) == 'function') {
            return pid(m) || 0;
        }
        return m[pid] || 0;
    }

    function getOrder(m) {
        if (typeof(order) == 'function') {
            return order(m) || 0;
        }
        return m[order] || 0;
    }

    var tmpNodes = [];
    for (var i = 0; i < this.length; i++) {
        var cur = this[i];
        if (cur != null) {
            tmpNodes['$' + getId(cur)] = new node(cur);
        }
    }
    for (var i = 0; i < this.length; i++) {
        var cur = this[i];
        if (cur != null) {
            tmpNodes['$' + getId(cur)].parent = tmpNodes['$' + getPid(cur)];
        }
    }

    return this.sort(function(l, r) {
        return tmpNodes['$' + getId(l)].compare2(tmpNodes['$' + getId(r)]);
    });
};

//返回一个树形的根集合，对原有的数组顺序不改变，但会增加parent和children两个属性
Array.prototype.makeLevelTree = function(option) {
    var o = option || {},
        id = o.id || 'id',
        pid = o.pid || 'pid',
        order = o.order || 'ordered';

    function node(origin) {
        var self = this;
        self.origin = origin;
        self.getKey = function() {
            if (self.key) {
                return self.key;
            }
            self.key = [];
            self.key.push(getOrder(self.origin));
            self.key.push(getId(self.origin));
            if (self.parent) {
                var pkey = self.parent.getKey();
                for (var i = pkey.length - 1; i >= 0; i--) {
                    self.key.unshift(pkey[i]);
                }
            }
            return self.key;
        };
        self.compare2 = function(other) {
            var lk = self.getKey(),
                rk = other.getKey(),
                loop = Math.min(lk.length, rk.length);
            for (var i = 0; i < loop; i++) {
                if (typeof(lk[i]) == 'undefined' || typeof(rk[i]) == 'undefined') {
                    break;
                }
                if (lk[i] != rk[i]) {
                    var diff = (lk[i] + '').length - (rk[i] + '').length;
                    return diff == 0 ? (lk[i] > rk[i] ? 1 : -1) : (diff > 0 ? 1 : -1);
                }
            }
            return lk.length > rk.length ? 1 : -1;
        };
    }

    function getId(m) {
        if (typeof(id) == 'function') {
            return id(m) || 0;
        }
        return m[id] || 0;
    }

    function getPid(m) {
        if (typeof(pid) == 'function') {
            return pid(m) || 0;
        }
        return m[pid] || 0;
    }

    function getOrder(m) {
        if (typeof(order) == 'function') {
            return order(m) || 0;
        }
        return m[order] || 0;
    }

    var tmpNodes = [],
        sorted = [],
        root = [];
    // add children attribute 
    for (var i = 0; i < this.length; i++) {
        var cur = this[i];
        if (cur != null) {
            cur.children = [];
            tmpNodes['$' + getId(cur)] = new node(cur);
        }
    }
    for (var i = 0; i < this.length; i++) {
        var cur = this[i];
        if (cur != null) {
            var parent = tmpNodes['$' + getPid(cur)];
            if (parent) {
                tmpNodes['$' + getId(cur)].parent = parent;
                cur.parent = parent.origin;
            }
            sorted.push(cur);
        }
    }

    sorted.sort(function(l, r) {
        return tmpNodes['$' + getId(l)].compare2(tmpNodes['$' + getId(r)]);
    });

    tmpNodes = [];
    for (var i = 0; i < sorted.length; i++) {
        var cur = sorted[i];
        if (cur.parent) {
            cur.parent.children.push(cur);
        } else {
            root.push(cur);
        }

        tmpNodes[cur.code] = cur;
    }

    sorted = [];
    return {
        "tree": root,
        "nodes": tmpNodes
    };
};

Date.prototype.setISO8601 = function(string) {
    if (!string) {
        return;
    }
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" + "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" + "(Z|(([-+])([0-9]{2}):?([0-9]{2})))?)?)?)?";
    var d = string.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) {
        date.setMonth(d[3] - 1);
    }
    if (d[5]) {
        date.setDate(d[5]);
    }
    if (d[7]) {
        date.setHours(d[7]);
    }
    if (d[8]) {
        date.setMinutes(d[8]);
    }
    if (d[10]) {
        date.setSeconds(d[10]);
    }
    if (d[12]) {
        date.setMilliseconds(Number("0." + d[12]) * 1000);
    }
    if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
    }
    offset -= date.getTimezoneOffset();
    time = (Number(date) + (offset * 60 * 1000));
    this.setTime(Number(time));
};

/** 获取介于之间的数值 */
Number.prototype.limit = function(min, max) {
    return (this < min) ? min : (this > max ? max : this);
};

/** 匹配与字符串相同的split方法 */
Number.prototype.split = function() {
    return [this];
};


(function(uuid, $, window, document, undefined) {

    var _update = function(html, container) {
        var $this = $(html),
            $container = $(container),
            id = $this.attr('id'),
            ajaxId = $this.attr('data-uuid');

        if (id) {
            var existed = $container.find('#' + id);
            if (existed.exists()) {
                $container.find('#' + id).html($this.html())
                    .attr('base', $this.attr('base'))
                    .attr('data-uuid', ajaxId);
                $this = existed;
            } else {
                $container.html($this.html())
                    .attr('base', $this.attr('base'))
                    .attr('data-uuid', ajaxId);
                $this = $container;
            }

            ajaxId && $this.on("remove", function() {
                $('html').find('[data-ref-target="' + this.attr('data-uuid') + '"]').remove();
            });
        }
    };

    var _replace = function(html, container) {
        var $this = $(html),
            $container = $(container),
            id = $this.attr('id'),
            ajaxId = $this.attr('data-uuid');

        if (id) {
            $this.attr('data-uuid', ajaxId);

            var existed = $container.find('#' + id);
            if (existed.exists()) {
                $container.find('#' + id).replaceWith($this);
            } else {
                $container.replaceWith($this);
            }

            ajaxId && $this.on("remove", function() {
                $('html').find('[data-ref-target="' + this.attr('data-uuid') + '"]').remove();
            });
        }
    };

    var _append = function(html, container) {
        var $this = $(html),
            $container = $(container),
            id = $this.attr('id'),
            ajaxId = $this.attr('data-uuid');

        $this.attr('data-uuid', ajaxId);

        if (id && $container.find('#' + id).length > 0) {
            $container.find('#' + id).append($this);
        } else {
            $container.append($this);
        }

        ajaxId && $this.on("remove", function() {
            $('html').find('[data-ref-target="' + $this.attr('data-uuid') + '"]').remove();
        });
    };

    $.fn.extend({
        /** 获取该元素所隶属的应用上下文信息 */
        getContextPath: function() {
            if (typeof base == "undefined") {
                var base = '/';
            }

            try {
                var closest = $(this).closest('[data-base]');
                if (closest != null && closest.size()) {
                    return closest.attr('data-base') || base;
                }
                return base;
            } catch (e) {
                return base;
            }
        },
        /** 检测是否存在 */
        exists: function() {
            return $(this) && $(this).size() > 0;
        },
        /** 获取(padding+border+margin)高度 */
        patchHeight: function() {
            return $(this).outerHeight(true) - $(this).height();
        },
        /** 获取(padding+border+margin)宽度 */
        patchWidth: function() {
            return $(this).outerWidth(true) - $(this).width();
        },
        /** 获取元素的scrollHeight */
        scrollHeight: function() {
            return $(this)[0].scrollHeight;
        },
        center: function(parent) {
            var $parent = $(parent || window);
            var winHeight = $parent.height(),
                itemHeight = $(this).height(),
                calHeight = (winHeight - itemHeight) / 2;
            var winWidth = $parent.width(),
                itemWidth = $(this).width(),
                calWidth = (winWidth - itemWidth) / 2;
            return $(this).css({
                'top': (calHeight > 20 ? calHeight / 3 : 0),
                'left': (calWidth > 20 ? calWidth : 0)
            });
        },
        /** 显示元素 */
        showme: function() {
            return $(this).css({
                'display': 'block',
                'visibility': 'visible'
            });
        },
        /** 隐藏元素 */
        hideme: function() {
            return $(this).css({
                'display': 'none',
                'visibility': 'hidden'
            });
        },
        /** 设置元素为相同高度，高度按指定或元素中最大高度为准 */
        sameHeight: function(height) {
            var max = height || -1;
            if (max < 0) {
                $(this).each(function() {
                    max = Math.max($(this).height(), max);
                });
            }
            return $(this).css('min-height', max);
        },
        /** 设置元素为相同宽度，宽度按指定或元素中最大宽度为准 */
        sameWidth: function(width) {
            var max = width || -1;
            if (max < 0) {
                $(this).each(function() {
                    max = Math.max($(this).width(), max);
                });
            }
            return $(this).css('min-width', max);
        },
        alignFollow: function($el) {
            var $wrapper = $(this);
            var p = $el.position();
            var $parent = $el.offsetParent();
            var scrollTop = $parent.scrollTop();
            var scrollLeft = $parent.scrollLeft();
            var mainWidth = $parent.width();
            var mainHeight = $parent.height();

            var elTop = p.top + scrollTop;
            var elLeft = p.left + scrollLeft;
            var elBottom = elTop + $el.outerHeight(true);
            var elRight = elLeft + $el.outerWidth(true);

            var wrapperTop = elBottom;
            var wrapperLeft = elLeft;

            var wrapperHeight = $wrapper.outerHeight(true);
            var wrapperWidth = $wrapper.outerWidth(true);

            var wrapperTop1 = elTop - wrapperHeight;
            var wrapperLeft1 = elRight - wrapperWidth;

            $wrapper.css({
                top: wrapperTop + wrapperHeight - scrollTop < mainHeight ? wrapperTop + 'px' : wrapperTop1 + 'px',
                left: wrapperLeft + wrapperWidth - scrollLeft < mainWidth ? wrapperLeft + 'px' : wrapperLeft1 + 'px'
            });
        },
        cloneAttr: function(source) {
            var self = this,
                cloneAttrs = ['style', 'class'];
            $.each(cloneAttrs, function(index, value) {
                self.attr(value, $(source).attr(value) || '');
            });
            return this;
        },
        setChecked: function(bool) {
            if ($.isFunction($.prop)) {
                $(this).prop('checked', bool);
            } else {
                $(this).attr('checked', bool);
            }
            return this;
        },
        getChecked: function() {
            if ($.isFunction($.prop)) {
                return $(this).prop('checked');
            }
            return $(this).attr('checked');
        },
        callEvent: function(func, event, proxy) {
            if ($.isFunction(func)) {
                if (typeof proxy != 'undefined') {
                    func = $.proxy(func, proxy);
                }
                var result = func(event);
                if (event) event.result = result;
                return !(result !== undefined && (!result));
            }
            return 1;
        },
        updateRegions: function(url, ajaxOptions, updates, callback) {
            var self = $(this),
                s = {};
            s = $.extend({
                url: url,
                dataType: 'html',
                success: function(data, status, xhr) {
                    var ct = xhr.getResponseHeader('content-type') || '';
                    if (ct.indexOf('json') > -1) {
                        self.trigger('ajaxError', [xhr, s]);
                        return;
                    }
                    var $html = $(data),
                        $region = self;
                    if (updates && updates.length) {
                        for (var i = updates.length - 1; i >= 0; i--) {
                            var selector = updates[i],
                                $region2;
                            if ($.type(selector) == 'string') {
                                $region2 = self.find(selector);
                            } else {
                                $region2 = $(selector);
                                selector = $region2.selector;
                            }
                            var htmlpart = $html.filter(selector);
                            if (htmlpart.exists()) {
                                $region2.html(htmlpart.html());
                            }
                        }
                        var titlepart = $html.filter('title');
                        if (titlepart.exists()) {
                            document.title = titlepart.text();
                        }
                        $region.append($html.filter('script'));
                    } else {
                        self.html(data);
                    }
                    if (callback && $.isFunction(callback)) {
                        callback.apply(self);
                    }
                    $(window).trigger('resize');
                }
            }, ajaxOptions || {});
            $.ajax(s);
        },
        updateAjaxContents: function(url, ajaxOptions, callback, isScrollTop) {
            $(this)._privateProcessContents(url, ajaxOptions, _update, callback, isScrollTop);
        },
        replaceAjaxContents: function(url, ajaxOptions, callback, isScrollTop) {
            $(this)._privateProcessContents(url, ajaxOptions, _replace, callback, isScrollTop);
        },
        appendAjaxContents: function(url, ajaxOptions, callback, isScrollTop) {
            $(this)._privateProcessContents(url, ajaxOptions, _append, callback, isScrollTop);
        },
        updateHtml: function(data, action, callback) {
            var self = $(this),
                $html = $(data),
                ajaxId = uuid('ajax-uid-');

            //update title
            var titlepart = $html.filter('title');
            if (titlepart.exists()) {
                document.title = titlepart.text();
            }

            //update version
            var version = $html.filter('meta');
            if (version.exists()) {
                $('meta[name=version]', document).attr('content', version.attr('content'));
            }

            var exclude = ':not(meta,title)';
            //update content
            $($.parseHTML(data)).filter(exclude).each(function() {
                !$(this).attr('data-uuid') && $(this).attr('data-uuid', ajaxId);
                action && $.isFunction(action) && action(this, self);
            });

            //reinit document ready function in the new fragment 
            $(document).triggerHandler('update', self);

            //update javascript 
            $.merge($html.find('script'), $html.filter('script')).each(function() {
                var $script = $(this);
                var id = $script.attr('id');
                if (id) {
                    self.find('#' + id).remove();
                }
                if (!$script.attr('data-ref-target')) $script.attr('data-ref-target', ajaxId);
                self.append($script);
            });

            //process call back
            if ($.isFunction(callback)) {
                callback.apply(self, [true, data]);
            }

            return self; //keep chain
        },
        _privateProcessContents: function(url, ajaxOptions, action, callback, isScrollTop) {
            var self = $(this),
                s = {},
                handleError = function() {
                    if (callback && $.isFunction(callback)) {
                        callback.apply(self, [false]);
                    }
                };

            s = $.extend({
                url: url,
                dataType: 'html',
                beforeSend: function() {
                    self.children().addClass('hidden');
                    self.append('<h2 class="_loadmask"><i class="fa fa-spinner fa-pulse"></i></h2>');
                    if (isScrollTop === true) {
                        // scroll up
                        $("html").animate({
                            scrollTop: 0
                        }, "fast");
                    }
                },
                success: function(data, status, xhr) {
                    var ct = xhr.getResponseHeader('content-type') || '';
                    if (ct.indexOf('json') > -1) {
                        handleError();
                        self.trigger('ajaxError', [xhr, s]);
                        return;
                    }
                    try {
                        self.css({
                            opacity: '0.0'
                        }).updateHtml(data, action, callback).delay(50).animate({
                            opacity: '1.0'
                        }, 300);

                        $(window).trigger('resize');
                    } catch (e) {
                        if (window.console && console.log) {
                            console.log(e);
                        }
                        handleError();
                    }
                },
                error: function(xhr, ajaxOptions, thrownError) {
                    handleError();
                },
                complete: function(xhr, status) {
                    self.find('h2._loadmask').remove();
                    self.children().removeClass('hidden');
                }
            }, ajaxOptions || {});
            $.ajax(s);
        }
    });

}(UniqueId || {}, jQuery, window, document));

var JSON = (function(json) {

    json.useHasOwn = ({}.hasOwnProperty ? true : false);

    json.pad = function(n) {
        return n < 10 ? "0" + n : n;
    };

    json.m = {
        "\b": '\\b',
        "\t": '\\t',
        "\n": '\\n',
        "\f": '\\f',
        "\r": '\\r',
        '"': '\\"',
        "\\": '\\\\'
    };

    json.encodeString = function(s) {
        if (/["\\\x00-\x1f]/.test(s)) {
            return '"' + s.replace(/([\x00-\x1f\\"])/g, function(a, b) {
                var c = m[b];
                if (c) {
                    return c;
                }
                c = b.charCodeAt();
                return "\\u00" + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
            }) + '"';
        }
        return '"' + s + '"';
    };

    json.encodeArray = function(o) {
        var a = ["["],
            b = false,
            i, l = o.length,
            v;
        for (i = 0; i < l; i += 1) {
            v = o[i];
            switch (typeof v) {
                case "undefined":
                case "function":
                case "unknown":
                    break;
                default:
                    if (b) {
                        a.push(',');
                    }
                    a.push(v === null ? "null" : this.encode(v));
                    b = true;
            }
        }
        a.push("]");
        return a.join("");
    };

    json.ncodeDate = function(o) {
        return '"' + o.getFullYear() + "-" + pad(o.getMonth() + 1) + "-" + pad(o.getDate()) + "T" + pad(o.getHours()) + ":" + pad(o.getMinutes()) + ":" + pad(o.getSeconds()) + '"';
    };

    json.encode = function(o) {
        if (typeof o == "undefined" || o === null) {
            return "null";
        } else if (o instanceof Array) {
            return this.encodeArray(o);
        } else if (o instanceof Date) {
            return this.encodeDate(o);
        } else if (typeof o == "string") {
            return this.encodeString(o);
        } else if (typeof o == "number") {
            return isFinite(o) ? String(o) : "null";
        } else if (typeof o == "boolean") {
            return String(o);
        } else {
            var self = this;
            var a = ["{"],
                b, i, v;
            for (i in o) {
                if (!this.useHasOwn || o.hasOwnProperty(i)) {
                    v = o[i];
                    switch (typeof v) {
                        case "undefined":
                        case "function":
                        case "unknown":
                            break;
                        default:
                            if (b) {
                                a.push(',');
                            }
                            a.push(self.encode(i), ":", v === null ? "null" : self.encode(v));
                            b = true;
                    }
                }
            }
            a.push("}");
            return a.join("");
        }
    };

    json.decode = function(json) {
        return (new Function('return ' + json))();
    }

    return json;

}(JSON || {}));

var Utils = (function($, window, document, undefined) {

    // private functions & variables

    // IE mode
    var isIE8 = false;
    var isIE9 = false;
    var isIE10 = false;

    var resizeHandlers = [];

    // initializes main settings
    var handleInit = function() {

        isIE8 = !!navigator.userAgent.match(/MSIE 8.0/);
        isIE9 = !!navigator.userAgent.match(/MSIE 9.0/);
        isIE10 = !!navigator.userAgent.match(/MSIE 10.0/);

        if (isIE10) {
            $('html').addClass('ie10'); // detect IE10 version
        }

        if (isIE10 || isIE9 || isIE8) {
            $('html').addClass('ie'); // detect IE10 version
        }
    };

    // runs callback functions set by Utils.addResizeHandler().
    var _runResizeHandlers = function() {
        // reinitialize other subscribed elements
        for (var i = 0; i < resizeHandlers.length; i++) {
            var each = resizeHandlers[i];
            each.call();
        }
    };

    // handle the layout reinitialization on window resize
    var handleOnResize = function() {
        var resize;
        if (isIE8) {
            var currheight;
            $(window).resize(function() {
                if (currheight == document.documentElement.clientHeight) {
                    return; //quite event since only body resized not window.
                }
                if (resize) {
                    clearTimeout(resize);
                }
                resize = setTimeout(function() {
                    _runResizeHandlers();
                }, 50); // wait 50ms until window resize finishes.                
                currheight = document.documentElement.clientHeight; // store last body client height
            });
        } else {
            $(window).resize(function() {
                if (resize) {
                    clearTimeout(resize);
                }
                resize = setTimeout(function() {
                    _runResizeHandlers();
                }, 50); // wait 50ms until window resize finishes.
            });
        }
    };


    // public functions
    return {

        //main function to initiate the theme
        init: function() {
            //IMPORTANT!!!: Do not modify the core handlers call order.

            handleInit(); // initialize core variables
            handleOnResize(); // set and handle responsive    
        },
        executeFunction: function(functionName /*, args */ ) {
            var args = Array.prototype.slice.call(arguments, 1);
            if ('function' === typeof functionName) {
                return functionName.apply(this, args);
            } else if ('string' === typeof functionName) {
                if ('()' === functionName.substring(functionName.length - 2)) {
                    functionName = functionName.substring(0, functionName.length - 2);
                }
                var ns = functionName.split('.'),
                    func = ns.pop(),
                    context = window;
                for (var i = 0; i < ns.length; i++) {
                    context = context[ns[i]];
                }

                return (typeof context[func] === 'undefined') ? null : context[func].apply(this, args);
            }
        },
        getAbsoluteUrl: function(url, contextPath) {
            if (url.indexOf('://') >= 0) {
                return url;
            }
            if (url.charAt(0) != '/') {
                url = '/' + url;
            }

            var root = (contextPath || base);
            return url.startWith(root) ? url : root + url;
        },
        //public function to get a paremeter by name from URL
        getURLParameter: function(paramName) {
            var searchString = window.location.search.substring(1),
                i, val, params = searchString.split("&");

            for (i = 0; i < params.length; i++) {
                val = params[i].split("=");
                if (val[0] == paramName) {
                    return unescape(val[1]);
                }
            }
            return null;
        },
        // To get the correct viewport width based on  http://andylangton.co.uk/articles/javascript/get-viewport-size-javascript/
        getViewPort: function() {
            var e = window,
                a = 'inner';
            if (!('innerWidth' in window)) {
                a = 'client';
                e = document.documentElement || document.body;
            }

            return {
                width: e[a + 'Width'],
                height: e[a + 'Height']
            };
        },
        //public function to add callback a function which will be called on window resize
        addResizeHandler: function(func) {
            resizeHandlers.push(func);
        },
        //public functon to call _runresizeHandlers
        runResizeHandlers: function() {
            _runResizeHandlers();
        },
        getResponsiveBreakpoint: function(size) {
            // bootstrap responsive breakpoints
            var sizes = {
                'xs': 480, // extra small
                'sm': 768, // small
                'md': 992, // medium
                'lg': 1200 // large
            };

            return sizes[size] ? sizes[size] : 0;
        },
        strToJson: function(str) {
            var json = (new Function("return " + str))();
            return json;
        },
        // check IE8 mode
        isIE8: function() {
            return isIE8;
        },
        // check IE9 mode
        isIE9: function() {
            return isIE9;
        },
        isMsie: function() {
            return /(msie|trident)/i.test(navigator.userAgent) ? navigator.userAgent.match(/(msie |rv:)(\d+(.\d+)?)/i)[2] : false;
        },
        isBlankString: function(str) {
            return !str || /^\s*$/.test(str);
        },
        escapeRegExChars: function(str) {
            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        },
        isString: function(obj) {
            return typeof obj === "string";
        },
        isNumber: function(obj) {
            return typeof obj === "number";
        },
        isArray: $.isArray,
        isFunction: $.isFunction,
        isObject: $.isPlainObject,
        isUndefined: function(obj) {
            return typeof obj === "undefined";
        },
        toStr: function toStr(s) {
            return _.isUndefined(s) || s === null ? "" : s + "";
        },
        bind: $.proxy,
        each: function(collection, cb) {
            $.each(collection, reverseArgs);

            function reverseArgs(index, value) {
                return cb(value, index);
            }
        },
        map: $.map,
        filter: $.grep,
        every: function(obj, test) {
            var result = true;
            if (!obj) {
                return result;
            }
            $.each(obj, function(key, val) {
                if (!(result = test.call(null, val, key, obj))) {
                    return false;
                }
            });
            return !!result;
        },
        some: function(obj, test) {
            var result = false;
            if (!obj) {
                return result;
            }
            $.each(obj, function(key, val) {
                if (result = test.call(null, val, key, obj)) {
                    return false;
                }
            });
            return !!result;
        },
        mixin: $.extend,
        templatify: function templatify(obj) {
            return $.isFunction(obj) ? obj : template;

            function template() {
                return String(obj);
            }
        },
        defer: function(fn) {
            setTimeout(fn, 0);
        },
        debounce: function(func, wait, immediate) {
            var timeout, result;
            return function() {
                var context = this,
                    args = arguments,
                    later, callNow;
                later = function() {
                    timeout = null;
                    if (!immediate) {
                        result = func.apply(context, args);
                    }
                };
                callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) {
                    result = func.apply(context, args);
                }
                return result;
            };
        },
        throttle: function(func, wait) {
            var context, args, timeout, result, previous, later;
            previous = 0;
            later = function() {
                previous = new Date();
                timeout = null;
                result = func.apply(context, args);
            };
            return function() {
                var now = new Date(),
                    remaining = wait - (now - previous);
                context = this;
                args = arguments;
                if (remaining <= 0) {
                    clearTimeout(timeout);
                    timeout = null;
                    previous = now;
                    result = func.apply(context, args);
                } else if (!timeout) {
                    timeout = setTimeout(later, remaining);
                }
                return result;
            };
        },
        noop: function() {},
        scrollTo: function(el, offeset) {
            var pos = (el && el.size() > 0) ? el.offset().top : 0;

            if (el) {
                //caution: if use boostrap navbar-fixed-top,substract it's height.

                pos = pos + (offeset ? offeset : -1 * el.height());
            }

            $('html,body').animate({
                scrollTop: pos
            }, 'slow');
        },
        mdifference: function(postIds, existedIds, details, idAttr, nameAttr) {
            if (!idAttr) {
                idAttr = 'id';
            }
            if (!nameAttr) {
                nameAttr = 'name';
            }
            var removed = [],
                added = [];

            function getName(el) {
                for (var i = 0; i < details.length; i++) {
                    if (details[i][idAttr] == el) {
                        return details[i][nameAttr];
                    }
                }
                return '未知';
            }
            jQuery.grep(postIds, function(el) {
                if (el != '' && jQuery.inArray(el, existedIds) == -1) {
                    added.push(getName(el));
                }
            });
            jQuery.grep(existedIds, function(el) {
                if (el != '' && jQuery.inArray(el, postIds) == -1) {
                    removed.push(getName(el));
                }
            });
            return {
                'removed': removed,
                'added': added
            };
        }
    };

}(jQuery, window, document));

$(function() {
    Utils.init();
});
;/** ========================================================================
 * Mower: utils.mower.js - v1.0.0
 *
 * utility
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */


(function()
{
    'use strict';

    String.prototype.format = function(args)
    {
        var result = this;
        if (arguments.length > 0)
        {
            var reg;
            if (arguments.length == 1 && typeof(args) == "object")
            {
                for (var key in args)
                {
                    if (args[key] !== undefined)
                    {
                        reg = new RegExp("({" + key + "})", "g");
                        result = result.replace(reg, args[key]);
                    }
                }
            }
            else
            {
                for (var i = 0; i < arguments.length; i++)
                {
                    if (arguments[i] !== undefined)
                    {
                        reg = new RegExp("({[" + i + "]})", "g");
                        result = result.replace(reg, arguments[i]);
                    }
                }
            }
        }
        return result;
    };


    /**
     * Judge the string is a integer number
     *
     * @access public
     * @return bool
     */
    String.prototype.isNum = function(s)
    {
        if (s !== null)
        {
            var r, re;
            re = /\d*/i;
            r = s.match(re);
            return (r == s) ? true : false;
        }
        return false;
    };


    String.prototype.endWith = function(str) {
        if (str == null || str == "" || this.length == 0 || str.length > this.length)
            return false;
        if (this.substring(this.length - str.length) == str)
            return true;
        else
            return false;
        return true;
    };

    String.prototype.startWith = function(str) {
        if (str == null || str == "" || this.length == 0 || str.length > this.length)
            return false;
        if (this.substr(0, str.length) == str)
            return true;
        else
            return false;
        return true;
    };

    String.prototype.length2 = function() {
        var cArr = this.match(/[^\x00-\xff]/ig);
        return this.length + (cArr == null ? 0 : cArr.length);
    };

    String.prototype.trim=function(){
        "use strict";
        return this.replace(/(^\s*)|(\s*$)/g, "");
    };

})();
;(function($) {
	$.date = (function() {
		function strDay(value) {
			switch (parseInt(value)) {
			case 0:
				return "Sunday";
			case 1:
				return "Monday";
			case 2:
				return "Tuesday";
			case 3:
				return "Wednesday";
			case 4:
				return "Thursday";
			case 5:
				return "Friday";
			case 6:
				return "Saturday";
			default:
				return value;
			}
		}

		function strMonth(value) {
			switch (parseInt(value)) {
			case 1:
				return "Jan";
			case 2:
				return "Feb";
			case 3:
				return "Mar";
			case 4:
				return "Apr";
			case 5:
				return "May";
			case 6:
				return "Jun";
			case 7:
				return "Jul";
			case 8:
				return "Aug";
			case 9:
				return "Sep";
			case 10:
				return "Oct";
			case 11:
				return "Nov";
			case 12:
				return "Dec";
			default:
				return value;
			}
		}

		var parseMonth = function(value) {
			switch (value) {
			case "Jan":
				return "01";
			case "Feb":
				return "02";
			case "Mar":
				return "03";
			case "Apr":
				return "04";
			case "May":
				return "05";
			case "Jun":
				return "06";
			case "Jul":
				return "07";
			case "Aug":
				return "08";
			case "Sep":
				return "09";
			case "Oct":
				return "10";
			case "Nov":
				return "11";
			case "Dec":
				return "12";
			default:
				return value;
			}
		};

		var parseTime = function(value) {
			var retValue = value;
			var millis = "";
			if (retValue.indexOf(".") !== -1) {
				var delimited = retValue.split('.');
				retValue = delimited[0];
				millis = delimited[1];
			}

			var values3 = retValue.split(":");

			if (values3.length === 3) {
				hour = values3[0];
				minute = values3[1];
				second = values3[2];

				return {
					time : retValue,
					hour : hour,
					minute : minute,
					second : second,
					millis : millis
				};
			} else {
				return {
					time : "",
					hour : "",
					minute : "",
					second : "",
					millis : ""
				};
			}
		};

		var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" + "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" + "(Z|(([-+])([0-9]{2}):?([0-9]{2})))?)?)?)?";

		var setISO8601 = function(string) {
			var d = string.match(new RegExp(regexp));

			var offset = 0;
			var date = new Date(d[1], 0, 1);

			if (d[3]) {
				date.setMonth(d[3] - 1);
			}
			if (d[5]) {
				date.setDate(d[5]);
			}
			if (d[7]) {
				date.setHours(d[7]);
			}
			if (d[8]) {
				date.setMinutes(d[8]);
			}
			if (d[10]) {
				date.setSeconds(d[10]);
			}
			if (d[12]) {
				date.setMilliseconds(Number("0." + d[12]) * 1000);
			}
			if (d[14]) {
				offset = (Number(d[16]) * 60) + Number(d[17]);
				offset *= ((d[15] == '-') ? 1 : -1);
			}

			offset -= date.getTimezoneOffset();
			var time = (Number(date) + (offset * 60 * 1000));
			date.setTime(Number(time));
			return date;
		};
		return {
			format : function(value, format) {
				if (value == null) {
					return '';
				}
				// value = new java.util.Date()
				// 2009-12-18 10:54:50.546
				try {
					var date = null;
					var year = null;
					var month = null;
					var dayOfMonth = null;
					var dayOfWeek = null;
					var time = null; // json, time, hour, minute, second
					if (typeof value.getFullYear === "function") {
						year = value.getFullYear();
						month = value.getMonth() + 1;
						dayOfMonth = value.getDate();
						dayOfWeek = value.getDay();
						time = parseTime(value.toTimeString());
					} else if (value.search(regexp) != -1) { // 2009-04-19T16:11:05+02:00
						var iso = setISO8601(value);
						year = iso.getFullYear();
						month = iso.getMonth() + 1;
						dayOfMonth = iso.getDate();
						dayOfWeek = iso.getDay();
						time = parseTime(iso.toTimeString());
					} else {
						var values = value.split(" ");
						switch (values.length) {
						case 6:
							// Wed Jan 13 10:43:41 CET 2010
							year = values[5];
							month = parseMonth(values[1]);
							dayOfMonth = values[2];
							time = parseTime(values[3]);
							date = new Date(year, month - 1, dayOfMonth);
							dayOfWeek = date.getDay();
							break;
						case 2:
							// 2009-12-18 10:54:50.546
							var values2 = values[0].split("-");
							year = values2[0];
							month = values2[1];
							dayOfMonth = values2[2];
							time = parseTime(values[1]);
							date = new Date(year, month - 1, dayOfMonth);
							dayOfWeek = date.getDay();
							break;
						case 7:
							// Tue Mar 01 2011 12:01:42 GMT-0800 (PST)
						case 9:
							// added by Larry, for Fri Apr 08 2011 00:00:00
							// GMT+0800 (China Standard Time)
						case 10:
							// added by Larry, for Fri Apr 08 2011 00:00:00
							// GMT+0200 (W. Europe Daylight Time)
							year = values[3];
							month = parseMonth(values[1]);
							dayOfMonth = values[2];
							time = parseTime(values[4]);
							date = new Date(year, month - 1, dayOfMonth);
							dayOfWeek = date.getDay();
							break;
						/*
						 * case 7: // Tue Mar 01 2011 12:01:42 GMT-0800 (PST)
						 * year = values[3]; month = parseMonth(values[1]);
						 * dayOfMonth = values[2]; time = parseTime(values[4]);
						 * break;
						 */
						default:
							return value;
						}
					}

					var pattern = "";
					var retValue = "";
					// Issue 1 - variable scope issue in format.date
					// Thanks jakemonO
					for ( var i = 0; i < format.length; i++) {
						var currentPattern = format.charAt(i);
						pattern += currentPattern;
						switch (pattern) {
						case "ddd":
							retValue += strDay(dayOfWeek);
							pattern = "";
							break;
						case "dd":
							if (format.charAt(i + 1) == "d") {
								break;
							}
							if (String(dayOfMonth).length === 1) {
								dayOfMonth = '0' + dayOfMonth;
							}
							retValue += dayOfMonth;
							pattern = "";
							break;
						case "MMM":
							retValue += strMonth(month);
							pattern = "";
							break;
						case "MM":
							if (format.charAt(i + 1) == "M") {
								break;
							}
							if (String(month).length === 1) {
								month = '0' + month;
							}
							retValue += month;
							pattern = "";
							break;
						case "yyyy":
							retValue += year;
							pattern = "";
							break;
						case "HH":
							retValue += time.hour;
							pattern = "";
							break;
						case "hh":
							// time.hour is "00" as string == is used instead of
							// ===
							retValue += (time.hour == 0 ? 12 : time.hour < 13 ? time.hour : time.hour - 12);
							pattern = "";
							break;
						case "mm":
							retValue += time.minute;
							pattern = "";
							break;
						case "ss":
							// ensure only seconds are added to the return
							// string
							retValue += time.second.substring(0, 2);
							pattern = "";
							break;
						// case "tz":
						// //parse out the timezone information
						// retValue += time.second.substring(3,
						// time.second.length);
						// pattern = "";
						// break;
						case "SSS":
							retValue += time.millis.substring(0, 3);
							pattern = "";
							break;
						case "a":
							retValue += time.hour >= 12 ? "PM" : "AM";
							pattern = "";
							break;
						case " ":
							retValue += currentPattern;
							pattern = "";
							break;
						case "/":
							retValue += currentPattern;
							pattern = "";
							break;
						case ":":
							retValue += currentPattern;
							pattern = "";
							break;
						default:
							if (pattern.length === 2 && pattern.indexOf("y") !== 0 && pattern != "SS") {
								retValue += pattern.substring(0, 1);
								pattern = pattern.substring(1, 2);
							} else if ((pattern.length === 3 && pattern.indexOf("yyy") === -1)) {
								pattern = "";
							}
						}
					}
					return retValue;
				} catch (e) {
					return value;
				}
			}
		};
	}());
}(jQuery));;/** ========================================================================
 * Mower: base.mower.js - v1.0.0
 *
 *  base script to handle utility methodes
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
var Base = (function($, utils, window, document, undefined) {

    'use strict';

    var base = {};

    // private functions & variables
    var _attachDomRemoveEvent = function() {
        var _cleanData = $.cleanData;
        $.cleanData = function(elems) {
            for (var i = 0, elem;
                (elem = elems[i]) != null; i++) {
                try {
                    $(elem).triggerHandler("remove");
                } catch (e) {}
            }
            _cleanData(elems);
        };
    };

    //
    var _resetIconContent = function() {
        if (utils.isIE8()) {

            var head = document.getElementsByTagName('head')[0];
            var style = document.createElement('style');

            style.type = 'text/css';
            style.styleSheet.cssText = ':before,:after{content:none !important}';

            head.appendChild(style);
            setTimeout(function() {
                head.removeChild(style);
            }, 0);
        }
    };

    var _resettimezone = function() {
        var timeZoneOffset = new Date().getTimezoneOffset();

        var expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 365);

        document.cookie = "timezoneOffset=" + escape(timeZoneOffset * (-1)) + ";expires=" + expireDate.toGMTString();
    };

    var _enterToTab = function() {
        $(document).on("keypress", "input", function(e) {
            /* ENTER PRESSED*/
            var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
            if (key == 13) {
                var inputs = $(this).parents("form").eq(0).find(":input:visible:not(disabled):not([readonly])");
                var idx = inputs.index(this);
                if (idx == inputs.length - 1) {
                    idx = -1;
                } else {
                    inputs[idx + 1].focus(); // handles submit buttons
                }
                try {
                    inputs[idx + 1].select();
                } catch (err) {
                    // handle objects not offering select
                }
                return false;
            }
        });
    };


    var _parseComposite = function(key, value, t, prefix, parentkey) {
        var opts = {};
        var attrName = 'data-' + prefix + (parentkey ? (parentkey.toLowerCase() + '-') : '') + key.toLowerCase();

        if (!t.attr(attrName)) return opts;

        if (value === 'function') {
            opts[key] = (new Function("return " + t.attr(attrName)))(); //设置页面全局函数
        } else if (value === 'string') { //字符串直接从宿主对象对应属性中取值
            opts[key] = t.attr(attrName);
        } else if (value === 'boolean') { //布尔型从宿主对象对应属性中取值，同时将属性值转为布尔型
            opts[key] = t.attr(attrName) ? (t.attr(attrName) === 'true') : undefined;
        } else if (value === 'number') { //数字型也从宿主对象对应属性中取值，同时将属性值转为浮数
            opts[key] = t.attr(attrName) == '0' ? 0 : parseFloat(t.attr(attrName)) || undefined;
        } else if (value === 'array') { //数组型也从宿主对象对应属性中取值，同时将属性值转为数组
            var value = t.attr(attrName);
            if (value) {
                //嵌套数组 数值形式:'1,2,3;4,5,6'
                if (value.indexOf(';') >= 0) {
                    var nestedArray = new Array();
                    $.each(value.split(';'), function(index, value) {
                        if (value !== undefined && value.length > 0) {
                            nestedArray.push(value.split(','));
                        }
                    });
                    opts[key] = nestedArray;
                } else {
                    opts[key] = value.split(',');
                }
            } else {
                opts[key] = undefined;
            }
        }

        return opts;
    };

    // public functions
    base.init = function() {
        _resettimezone();
        _attachDomRemoveEvent();
        _resetIconContent();
        _enterToTab();
    };

    /**
     * parse options, including standard 'data-options' attribute.
     *
     * @param target [DOM对象] 组件的宿主对象
     * @param properties [数组] 需要优先从宿主对象属性(不包含data-options属性)中取的opts列表
     * @param tPrefix [DOM对象] 组件的宿主对象前缀
     *
     * calling examples:
     * Base.parseOptions(target);
     * Base.parseOptions(target, ['id','title','width',{fit:'boolean',border:'boolean'},{min:'number'},{orderSeq:'array'}]);
     * Base.parseOptions(target, [{ajax:{url:'string',method:'string'}}]);
     */
    base.parseOptions = function(target, properties, tPrefix) {
        var t = $(target);
        var prefix = (tPrefix ? (tPrefix.toLowerCase() + '-') : '');

        var options = {};
        //第一步：首先从data-options属性中取opts
        var s = $.trim(t.attr('data-options'));
        if (s) {
            //兼容写大括号和不写大括号的写法
            if (s.substring(0, 1) != '{') {
                s = '{' + s + '}';
            }
            //利用Function函数将字符串转为化对象
            options = (new Function('return ' + s))();
        }
        //第二步：如果properties不为空的话，则将properties中定义的属性增加或者覆盖到“第一步”中取到的属性列表中
        if (properties) {
            var opts = {};
            for (var i = 0; i < properties.length; i++) {
                var pp = properties[i];
                //如果是字符串型
                if (typeof pp === 'string') {
                    //width height left top四个属性从宿主对象的style属性中取值
                    if (pp === 'width' || pp === 'height' || pp === 'left' || pp === 'top') {
                        opts[pp] = parseInt(target.style[pp]) || undefined;
                    } else { //其它情况直接从宿主对象的对应属性中取值
                        opts[pp] = t.attr('data-' + prefix + pp.toLowerCase());
                    }
                } else if($.isPlainObject(pp)) { //json对象'{}'
                    for (var pkey in pp) {
                        var pvalue = pp[pkey];

                        if (typeof pvalue === 'string') { //字符串型
                            //解析字符串或布尔型或者数字型或者数组
                            $.extend(opts, _parseComposite(pkey, pvalue, t, prefix));
                        } else if($.isPlainObject(pvalue)){ //对象'{}'
                            var nestedOpts = {};
                            for (var ckey in pvalue) {
                                var cvalue = pvalue[ckey];
                                //data attribute name ie: data-parent=""; children : data-parent-children.
                                var cOpts = _parseComposite(ckey, cvalue, t, prefix, pkey);
                                if (!$.isEmptyObject(cOpts)) $.extend(nestedOpts, cOpts); //maybe empty object
                            }
                            //maybe empty object
                            if (!$.isEmptyObject(nestedOpts) || (typeof pvalue.empty !== 'undefined' && pvalue.empty === true)) {
                                opts[pkey] = nestedOpts;
                            }
                        }
                    }
                }
            }
            //第二步取得的结果覆盖到第一步取得的结果中
            $.extend(options, opts);
        }
        return options;
    };

    return base;

}(jQuery, Utils, window, document));

$(function() {
    Base.init();
});
;/** ========================================================================
 * Mower: chosen.mower.js - v1.0.0
 *
 * apply chosen on document ready.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function($, base, window, document, undefined) {

    'use strict';

    // private functions & variables

    // Apply chosen to all elements with the rel="chosen" attribute
    // ===================================
    
    $(document).on('ready update', function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[rel=chosen]').each(function(index, el) {
            var $this = $(this);

            if (!$this.data('chosen')) {
                $(this).chosen($this.data());
            }
        });
    });

}(jQuery, Base || {}, window, document));;/** ========================================================================
 * Mower: chosen.remote.mower.js - v0.1.0
 *
 * add ajax load remote data base on chosen.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

 ;(function (  $, utils, window, document, undefined ) {

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
    url        :'',
    datasource :false,
    callback   :null,
    nameField  :'label',
    valueField :'code'
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

      if (ajaxurl) {
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
        if(typeof data === 'object') return this._construct(data);
        
        var cbData = utils.executeFunction(data,that);
        return cbData ? this._construct(cbData) : this._construct(data);
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
})( jQuery, Utils, window, document );;/**
 * Project: Bootstrap Hover Dropdown
 * Author: Cameron Spear
 * Contributors: Mattia Larentis
 *
 * Dependencies: Bootstrap's Dropdown plugin, jQuery
 *
 * A simple plugin to enable Bootstrap dropdowns to active on hover and provide a nice user experience.
 *
 * License: MIT
 *
 * http://cameronspear.com/blog/bootstrap-dropdown-on-hover-plugin/
 *
 * updated By Eric.Ou:
 *     1.Organize code as like bootstrap javascript
 *     2.Add plugin data to keep instance
 *     3.Add support reinit plugin after load dynamicly
 */

(function($, window, undefined) {

    // outside the scope of the jQuery plugin to
    // keep track of all dropdowns
    var $allDropdowns = $();

    var DropdownHover = function(element,options) {
        this.element = element;
        this.$element = $(element);
        this.options = options;

        this.init();
    }

    DropdownHover.prototype.init = function() {
        var $parent = this.$element.parent(),
            defaults = {
                delay: 500,
                instantlyCloseOthers: true
            },
            data = {
                delay: this.$element.data('delay'),
                instantlyCloseOthers: this.$element.data('close-others')
            },
            showEvent = 'show.bs.dropdown',
            hideEvent = 'hide.bs.dropdown',
            // shownEvent  = 'shown.bs.dropdown',
            // hiddenEvent = 'hidden.bs.dropdown',
            settings = $.extend(true, {}, defaults, this.options, data),
            timeout;

        var that = this;
        $parent.hover(function(event) {
            // so a neighbor can't open the dropdown
            if (!$parent.hasClass('open') && !that.$element.is(event.target)) {
                // stop this event, stop executing any code
                // in this callback but continue to propagate
                return true;
            }

            $allDropdowns.find(':focus').blur();

            if (settings.instantlyCloseOthers === true)
                $allDropdowns.removeClass('open');

            window.clearTimeout(timeout);
            $parent.addClass('open');
            that.$element.trigger(showEvent);

        }, function() {
            timeout = window.setTimeout(function() {
                $parent.removeClass('open');
                that.$element.trigger(hideEvent);
            }, settings.delay);
        });

        // this helps with button groups!
        this.$element.hover(function() {
            $allDropdowns.find(':focus').blur();

            if (settings.instantlyCloseOthers === true)
                $allDropdowns.removeClass('open');

            window.clearTimeout(timeout);
            $parent.addClass('open');
            that.$element.trigger(showEvent);
        });

        // handle submenus
        $parent.find('.dropdown-submenu').each(function (){
            var $this = $(this);
            var subTimeout;
            $this.hover(function () {
                window.clearTimeout(subTimeout);
                $this.children('.dropdown-menu').show();
                // always close submenu siblings instantly
                $this.siblings().children('.dropdown-menu').hide();
            }, function () {
                var $submenu = $this.children('.dropdown-menu');
                subTimeout = window.setTimeout(function () {
                    $submenu.hide();
                }, settings.delay);
            });
        });
    }


    // DROPDOWNHOVER PLUGIN DEFINITION
    // ==========================

    // if instantlyCloseOthers is true, then it will instantly
    // shut other nav items when a new one is hovered over
    function Plugin(options) {
        // don't do anything if touch is supported
        // (plugin causes some issues on mobile)
        if ('ontouchstart' in document) return this; // don't want to affect chaining

        // the element we really care about
        // is the dropdown-toggle's parent
        $allDropdowns = $allDropdowns.add(this.parent());

        return this.each(function() {
            var $this = $(this)
            var data = $this.data('bs.dropdownhover')

            if (!data) $this.data('bs.dropdownhover', (data = new DropdownHover(this,options)))
            if (typeof options == 'string') data[options].call($this)
        })
    }

    var old = $.fn.dropdownHover

    $.fn.dropdownHover = Plugin
    $.fn.dropdownHover.Constructor = DropdownHover


    // DROPDOWNHOVER NO CONFLICT
    // ====================

    $.fn.dropdownHover.noConflict = function() {
        $.fn.dropdownHover = old;
        return this;
    };


    // Apply dropdownHover to all elements with the data-hover="dropdown" attribute
    // ===================================
    $(document).on('ready update', function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[data-hover="dropdown"]').each(function(index, el) {
            var $this = $(this);

            if (!$this.data('bs.dropdownhover')) {

                $this.dropdownHover();
            }
        });
    });
    
})(jQuery, window);
;/** ========================================================================
 * Mower: dropdown.bootstrap.js - v0.1.0
 *
 * close or not when clicking on  bootstrap dropdown container.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

(function($, base, window, document, undefined) {

    'use strict';

    var isClosedOnDMBodyClick = function(event) {

        var options = base.parseOptions(this) || {};

        var isClosed = options.closeOnBodyClick;

        if (isClosed === false) {

            event.stopPropagation();

        }
    };

    // Apply to  all elements with the rel="dropdown-menu" attribute
    // ===================================
    $(document)
        .on('click.bs.dropdown.data-api', '[rel=dropdown-menu]', isClosedOnDMBodyClick);

}(jQuery, Base || {}, window, document));

;/** ========================================================================
 * Mower: nvabar.menu.mower.js - v1.0.0
 *
 * navbar mega menu to display menu as two level lay.
 *
 * <ul class="dropdown-menu">
 *      <li>
 *          <div class="yamm-content">
 *              <ul class="list-unstyled">
 *                  {{each(index2, menu2) children}}
 *                  <li>
 *                      <h4 class="title">${menu2.name}</h4>
 *                      <ul class="list-unstyled list-inline">{{each(index3, menu3) menu2.children}}
 *                          <li><a mid="${menu3.id}" href="javascript:void(0);" data-href="${menu3.uri}" data-toggle="menu">${menu3.name}</a>
 *                          </li>{{/each}}</ul>
 *                  </li>
 *                  {{if (($index2 + 1) < children.length)}}
 *                      <li class="divider"></li>
 *                  {{/if}} {{/each}}
 *              </ul>
 *          </div>
 *      </li>
 *  </ul>
 *
 * Dependencies:
 *              jquery.tmpl.js
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function(json, utils, $, window, document, undefined) {

    "use strict"; // jshint ;_;

    /* MAINMENU CLASS DEFINITION
     * ====================== */

    var menuItemSelector = '[data-toggle=menu]';

    var NBMenu = function(element, options) {
        this.element = element;
        this.$element = $(element);
        this.options = options;
        this.nodes = [];
    };

    //you can put your plugin defaults in here.
    NBMenu.DEFAULTS = {
        url: '', //ajax url
        param: '{}', //data to be sent to the server.
        method: 'GET', // data sending method
        dataType: 'json', // type of data loaded
        groupTemplate: function() {
            if (typeof $.template === "function") {
                return $.template(null, '{{each(index2, menu2) children}} <li> {{if menu2.children.length}} <h3 class="title">${menu2.name}</h3> <ul class="list-unstyled list-inline"> {{each(index3, menu3) menu2.children}} <li> <a mcode="${menu3.code}" href="javascript:void(0);" data-href="${menu3.uri}" data-toggle="menu">${menu3.name}</a> </li>{{/each}} </ul> {{else}} <a mcode="${menu2.code}" href="javascript:void(0);" data-href="${menu2.uri}" data-toggle="menu">${menu2.name}</a> {{/if}} </li> <li class="divider"> </li> {{/each}}');
            } else {
                return "";
            }
        },
        defaultTemplate: function() {
            if (typeof $.template === "function") {
                return $.template(null, '{{each(index2, menu2) children}} <li>   <a mcode="${menu2.code}" href="javascript:void(0);" data-href="${menu2.uri}" data-toggle="menu">${menu2.name}</a> </li> {{/each}}');
            } else {
                return "";
            }
        },
        events: {
            clickMenu: "clickMenu.mu.nbMenu",
            complete: "complete.mu.nbMenu",
            populateError: "error.populate.mu.nbMenu",
            populateSuccess: "success.populate.mu.nbMenu"
        }
    };

    NBMenu.prototype = {

        constructor: NBMenu,

        _init: function(element, options) {
            var $element = $(element);
            this.options = $.extend({}, NBMenu.DEFAULTS, $element.data(), typeof options === 'object' && options);
            this.options.url && (this.options.url = utils.getAbsoluteUrl(this.options.url, $element.getContextPath()));

            this.options.param = json.decode(this.options.param || '{}');

            var that = this;
            $element.one("mouseover", function(event) {
                var target = event.relatedTarget;
                that.populate();
            });
        },
        constructTree: function(treeFlatData) {
            var datasource = treeFlatData.makeLevelTree({
                pid: 'parentId',
                order: function(m) {
                    return m['attributes']['ordered'];
                }
            });

            this.nodes = datasource.nodes;

            this.renderMenu();

            var e = $.Event(NBMenu.DEFAULTS.events.complete);
            this.$element.trigger(e);

            return datasource.tree;
        },
        renderMenu: function() {

            var that = this;
            $(menuItemSelector, this.$element).each(function(index, el) {
                /* iterate through array or object */
                var $parent = $(el).closest('li');
                var menuCode = $(el).attr("data-code");
                var $menu = $(el);

                if (menuCode) {
                    $parent.children('.dropdown-menu').remove();
                    var menuObj = that.findMenuByCode(menuCode);

                    if ($.isPlainObject(menuObj)) {
                        var dataLevel = $(el).attr("data-level");
                        var $menuContent;
                        if (dataLevel === 'two') {
                          $menuContent = $('<ul class="dropdown-menu" role="menu"></ul>');
                          $.tmpl(that.options.defaultTemplate(), menuObj).appendTo($menuContent);
                          $menuContent.appendTo($parent);
                        } else {
                            $menuContent = $('<ul class="dropdown-menu" role="menu"> <li> <div class="yamm-content"> <ul class="list-unstyled"> </ul> </div> </li> </ul>');
                            $.tmpl(that.options.groupTemplate(), menuObj).appendTo($menuContent.find('.yamm-content').children('ul'));
                            $menuContent.appendTo($parent);
                            $menuContent.find('li.divider').filter(':last').remove();
                        }

                        $menu.attr("data-toggle", "dropdown").attr('data-hover', 'dropdown').addClass('dropdown-toggle');
                        $parent.addClass('dropdown');

                        $(document).triggerHandler('update', $parent);
                    }
                }
            });

            this.$element.on('click.module.mu.menu', '[data-toggle="menu"]', function(e) {
                var $this = $(this);
                var mcode = $this.attr('_mcode') || $this.attr('mcode');
                var href = $this.attr('data-href');
                var instance = that.findMenuByCode(mcode); //origin

                if ($this.is('a')) e.preventDefault();

                var module = this;
                var event = $.Event(NBMenu.DEFAULTS.events.clickMenu, {
                    relatedTarget: that.element,
                    target: module,
                    mcode: mcode,
                    href: href,
                    instance: instance
                });
                that.$element.trigger(event);

                if (event.isDefaultPrevented()) return;

                href = $this.attr('data-href');
                if ($.isFunction(decodeURIComponent)) {
                    href = decodeURIComponent(href);
                }

                var url = utils.getAbsoluteUrl(href, that.$element.getContextPath());
                url = url + (url.indexOf('?') > -1 ? '&' : '?') + '_=' + (new Date()).valueOf();
                window.location.href = url;
            });
        },
        populate: function() {
            var that = this;
            var purl = this.options.url ;

            $.ajax({
                url: purl,
                cache:true,
                data: this.options.param,
                dataType: this.options.dataType,
                type: this.options.method,
                success: function(data) {
                    var e;

                    if (data != null && data.error != null) {
                        e = $.Event(NBMenu.DEFAULTS.events.populateError, {
                            "data": data
                        });
                        that.$element.trigger(e);
                    } else if (data.length) {
                        that.constructTree(data);

                        e = $.Event(NBMenu.DEFAULTS.events.populateSuccess, {
                            "data": data
                        });
                        that.$element.trigger(e);
                    }
                },
                error: function(data) {
                    var e = $.Event(NBMenu.DEFAULTS.events.populateError, {
                        "data": data
                    });
                    that.$element.trigger(e);
                }
            });
        },
        findMenuByCode: function(code) {
            return code && this.nodes[code];
        },
        _destroy: function() {

        }
    };

    /* MAINMENU PLUGIN DEFINITION
     * ======================= */

    var old = $.fn.nbMenu;

    $.fn.nbMenu = function(options) {

        // slice arguments to leave only arguments after function name.
        var args = Array.prototype.slice.call(arguments, 1);

        // Cache any plugin method call, to make it possible to return a value
        var results;

        this.each(function() {
            var element = this,
                $element = $(element),
                pluginKey = 'mu.nbMenu',
                instance = $.data(element, pluginKey)


            // if there's no plugin instance for this element, create a new one, calling its "init" method, if it exists.
            if (!instance) {
                instance = $.data(element, pluginKey, new NBMenu(element, options));
                if (instance && typeof NBMenu.prototype['_init'] === 'function')
                    NBMenu.prototype['_init'].apply(instance, [element, options]);
            }

            // if we have an instance, and as long as the first argument (options) is a valid string value, tries to call a method from this instance.
            if (instance && typeof options === 'string' && options[0] !== '_' && options !== 'init') {

                var methodName = (options == 'destroy' ? '_destroy' : options);
                if (typeof NBMenu.prototype[methodName] === 'function')
                    results = NBMenu.prototype[methodName].apply(instance, args);

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy')
                    $.data(element, pluginKey, null);
            }
        });

        // If the earlier cached method gives a value back, return the resulting value, otherwise return this to preserve chainability.
        return results !== undefined ? results : this;
    };

    $.fn.nbMenu.Constructor = NBMenu;


    /* MAINMENU NO CONFLICT
     * ================= */

    $.fn.nbMenu.noConflict = function() {
        $.fn.nbMenu = old;
        return this;
    };


    /* MAINMENU DATA-API
     * ============== */
    $(document).on('ready update', function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[rel=nbMenu]').each(function(index, el) {
            var $this = $(this);
            if (!$this.data('mu.nbMenu')) {
                $(this).nbMenu();
            }
        });
    });

})(JSON || {}, Utils || {}, jQuery, window, document);
;/** ========================================================================
 * Mower: popover.mower.js - v1.0.0
 *
 * Apply popover on document ready.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function($, base, window, document, undefined) {

    'use strict';

    // private functions & variables

    // Apply popover to all elements with the rel="popover" attribute
    // ===================================
    $(document).on('ready update',function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[rel=popover]').each(function(index, el) {
            var $this = $(this);

            if (!$this.data('bs.popover')) {

                var container = $this.data('container') || 'body';
                var placement = $this.data('placement') || 'top';

                $this.popover({
                    'container': container,
                    'placement': placement
                });
            }
        });
    });
}(jQuery, Base || {}, window, document));
;/** ========================================================================
 * Mower: tab.mower.js - v1.0.0
 *
 *  bootstrap-tab support ajax capabilities
 *
 * Dependencies :
 *                bootstrap tab
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function($, window, document, undefined) {

    'use strict';

    // AJAXTAB CLASS DEFINITION
    // ====================

    var ATab = function(element, options) {
        this.$element = $(element);
        this.options = options;
    };

    ATab.VERSION = '3.2.0'

    ATab.DEFAULTS = {
        prefix : 'atab', //prefix of tab content id
        cache  : true
    };

    ATab.prototype._init = function(element, options) {
        var $element = $(element);
        this.options = $.extend({}, ATab.DEFAULTS, $element.data(), typeof options == 'object' && options);

        this.ConstructTabContent();
    }

    ATab.prototype.ConstructTabContent = function() {
        var tabCont = this.$element.next("div.tab-content");
        if (tabCont.length === 0) {
            var tabContent = [
                '<div class="tab-content">',
                '</div>'
            ].join('');

            this.$element.parent().append(tabContent);
            tabCont = this.$element.next("div.tab-content");
        }

        var that = this;
        this.$element.find(" li > a ").filter('[data-toggle="atab"]').each(function(idx, el) {
            var $el = $(el);
            var $target = tabCont.children().filter($el.attr("data-target"));

            if ($target.length === 0) {
                var target = that.options.prefix + "-content" + '-' + idx;
                var tabPane = [
                    '<div class="tab-pane" id="',
                    target,
                    '">',
                    '</div>'
                ].join("");

                tabCont.append(tabPane);

                //set data-target
                target = "#" + target;
                $el.attr("data-target", target);
            }
        });
    };

    /**
     * [dynamic add tab and show]
     * @param  {[string]} title :name show in tab
     * @param  {[string]} href  :remote url
     * @return {[type]}
     */
    ATab.prototype.add = function(title, href) {
        // tab panel,convert to jQuery object in order to next 
        // called will get the new appending context,as following show function call. 
        var $tab = $([
            '<li><a href="',
            href,
            '" role="tab" data-toggle="atab" >',
            title,
            '</a></li>'
        ].join(""));

        this.$element.append($tab);

        this.ConstructTabContent();

        this.show($tab.children('a')); //default show
    };

    ATab.prototype.show = function(_relatedTarget) {
        var $tab = $(_relatedTarget),
            href = $tab.attr('data-href') || $tab.attr("href"),
            $target = this.$element.next("div.tab-content").children($tab.attr("data-target")),
            showTab = function() {
                $tab.tab('show');
            },
            loading = function(callback) {
                $.get(href, function(data, statusText, jqXHR) {
                    $target.html(data);
                    callback && callback();
                });
            };

        if (!$tab.data('bs.tab') || !this.options.cache) {

            $target.empty();

            loading(showTab);
        } else {
            showTab();
        }
    };


    // AJAXTAB PLUGIN DEFINITION
    // =====================

    function Plugin(options) {
        // slice arguments to leave only arguments after function name.
        var args = Array.prototype.slice.call(arguments, 1);

        // Cache any plugin method call, to make it possible to return a value
        var results;

        this.each(function() {
            var element = this,
                $element  = $(element),
                pluginKey = 'mu.atab',
                instance  = $.data(element, pluginKey)


            // if there's no plugin instance for this element, create a new one, calling its "init" method, if it exists.
            if (!instance) {
                instance = $.data(element, pluginKey, new ATab(element, options));
                if (instance && typeof ATab.prototype['_init'] === 'function')
                    ATab.prototype['_init'].apply(instance, [element, options]);
            }

            // if we have an instance, and as long as the first argument (options) is a valid string value, tries to call a method from this instance.
            if (instance && typeof options === 'string' && options[0] !== '_' && options !== 'init') {

                var methodName = (options == 'destroy' ? '_destroy' : options);
                if (typeof ATab.prototype[methodName] === 'function')
                    results = ATab.prototype[methodName].apply(instance, args);

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy') {
                    $.data(element, pluginKey, null);
                }
            }
        });

        // If the earlier cached method gives a value back, return the resulting value, otherwise return this to preserve chainability.
        return results !== undefined ? results : this;
    }

    var old = $.fn.atab

    $.fn.atab = Plugin
    $.fn.atab.Constructor = ATab


    // AJAXTAB NO CONFLICT
    // ===============

    $.fn.atab.noConflict = function() {
        $.fn.atab = old
        return this
    }


    // AJAXTAB DATA-API
    // ============


    $(document)
    // trigger exsited a element loading page via jquery ajax
    .on('click.mu.atab.data-api', '[data-toggle^="atab"]', function(e) {
        var $this = $(this);

        if ($this.is('a')) e.preventDefault()

        Plugin.call($(this).closest('ul'), 'show', this);
    })
    // add a element tab dynamic and loading page via jquery ajax
    .on('click.mu.atab.data-api', '[data-toggle^="ntab"]', function(e) {
        var $this = $(this);
        var title = $this.attr('data-title');
        var href  =  $this.attr('data-href') || $this.attr('href');
        href      = (href && href.replace(/.*(?=#[^\s]+$)/, '')); // strip for ie7
        var $target = $($this.attr('data-target'));
        var option = $.extend({}, $target.data(), $this.data());

        if ($this.is('a')) e.preventDefault()

        Plugin
            .call($target, option)
            .call("add", title, href)
            .one('hide', function() {
                $this.is(':visible') && $this.focus()
            })
    }).on('ready', function(event) {
        var $li = $('[data-toggle^="atab"]').parent('li.active').eq(0);

        var activate = function(li) {
            $(li).removeClass('active'); // bootstrap tab will set active after showing auto
            Plugin.call($(li).closest('ul'), 'show', $(li).find('[data-toggle^="atab"]'));
        };

        $li.length && activate($li[0]);
    });

})(jQuery, window, document);

;/** ========================================================================
 * Mower: tooltip.mower.js - v1.0.0
 *
 * apply tooltip on document ready.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

;
(function($, base, window, document, undefined) {

    'use strict';

    // private functions & variables

    // Apply tooltip to all elements with the rel="tooltip" attribute
    // ===================================

    $(document).on('ready update', function(event, updatedFragment) {
        /* Act on the event */
        var $root = $(updatedFragment || 'html');

        $root.find('[rel=tooltip]').each(function(index, el) {
            var $this = $(this);

            if (!$this.data('bs.tooltip')) {

                var container = $this.data('container') || 'body';

                $(this).tooltip({
                    'container': container
                });
            }
        });
    });
}(jQuery, Base || {}, window, document));
;/** ========================================================================
 * Mower: validator.mower.js - v1.0.0
 *
 * apply validate on document ready.
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

(function($, utils, base, window, document, undefined) {

    'use strict';

    // Prepare the events
    var FORM_ERROR_EVENT = 'error.form.bv',
        FORM_SUCCESS_EVENT = 'success.form.bv',
        FORM_SUBMIT_SVENT = 'submit.bv',
        POP_BREADCRUMB_EVENT = 'pop.mu.breadcrumb';


    $.fn.ajaxValidSubmit = function(options) {
        var $form = $(this);

        $form
            .off(FORM_SUCCESS_EVENT)
            .off(FORM_ERROR_EVENT)
            .on(FORM_SUCCESS_EVENT, options, doFormSuccess)
            .on(FORM_ERROR_EVENT, options, doFormError);

        $form.triggerHandler(FORM_SUBMIT_SVENT);

        return this;
    };

    function doFormSuccess(e) {
        var $form = $(e.target),
            options = e.data;

        $form.ajaxSubmit({
            success: function(data) {
                if (data.success) {
                    utils.executeFunction(options.success, data);
                } else {

                    if(options.errorContainer && typeof window.AlertBox != 'undefined' && data.exceptionMessage)
                        AlertBox.error(data.exceptionMessage,{'container':data.errorContainer});

                    var $formValidator = $form.data('bootstrapValidator');
                    if ($formValidator.length) {
                        $(data.validateErrors).each(function() {
                            $formValidator
                                .updateMessage(this.element, 'blank', this.message)
                                .updateStatus(this.element, 'INVALID', 'blank');
                        });
                    }

                    utils.executeFunction(options.error, data);
                }
            }
        });
    }

    function doFormError(e) {}



    // private functions & variables
    var SELECTOR = '[rel="validate-form"]';

    // Apply tooltip to all elements with the rel="validate-form" attribute
    // ===================================
    $(document)
        .on('ready update', function(event, updatedFragment) {
            /* Act on the event */
            var $root = $(updatedFragment || 'html');

            $root.find(SELECTOR).each(function(index, el) {
                var $this = $(this);

                if (!$this.data('bootstrapValidator')) {
                    $this.bootstrapValidator({
                        excluded: [':disabled'],
                        message: '请输入合法的数值',
                        feedbackIcons: {
                            valid: 'fa fa-check',
                            invalid: 'fa fa-times',
                            validating: 'fa fa-refresh',
                            required: 'required'
                        }
                    });
                }

                $this.on('updateValidate',function(event){
                    $this.find('[name], [data-bv-field]')
                        .each(function() {
                            $this.bootstrapValidator('addField',$(this).attr('data-bv-field') || $(this).attr('name'));
                        });
                });
            });
        });

}(jQuery, Utils || {}, Base || {}, window, document));
;(function(root, factory) {

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

    if (!window.bootbox) throw new Error('ModalBox requires bootbox.js');

    if (!$.fn.slimScroll) throw new Error('ModalBox requires slimScroll.js');

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

    var templates = {
        dialog: "<div class='bootbox modal' tabindex='-1' role='dialog' aria-hidden='true'>" +
            "<div class='modal-dialog'>" +
            "<div class='modal-content'>" +
            "<div class='modal-body'><div class='bootbox-body'></div></div>" +
            "</div>" +
            "</div>" +
            "</div>",
        header: "<div class='modal-header'>" +
            "<h4 class='modal-title'></h4>" +
            "</div>",
        footer: "<div class='modal-footer'></div>"
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

        $modal.addClass(options.cssClass)
            .toggleClass('modal-md', options.size === 'md')
            .toggleClass('modal-sm', options.size === 'sm')
            .toggleClass('modal-lg', options.size === 'lg')
            .toggleClass('modal-loading', true);
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
                if (options.height && options.height !== 'auto') {

                    $dialog.css('height', options.height);

                    if (options.type === 'iframe') {
                        $body.css('height', $dialog.height() - $header.outerHeight());
                    } else {
                        $body.slimScroll({
                            height: $dialog.height() - $header.outerHeight()
                        });
                    }
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

                            frame$.extend({
                                closeModal: window.closeModal
                            });
                        } else {
                            readyToShow();
                        }
                    } catch (e) {
                        readyToShow();
                    }
                };
            } else {
                $.get(options.url, function(data) {
                    try {
                        var $html = $(data);

                        //update version
                        var version = $html.filter('meta');
                        if (version.exists()) {
                            $('meta[name=version]', document).attr('content', version.attr('content'));
                        }

                        var exclude = ':not(meta)';
                        //update content
                        $($.parseHTML(data)).filter(exclude).each(function() {
                            var $data = $(this);
                            if ($data.hasClass('modal-dialog')) {
                                $dialog.replaceWith($data);
                            } else if ($data.hasClass('modal-content')) {
                                $dialog.find('.modal-content').replaceWith($data);
                            } else if ($data.hasClass('modal-title')) {
                                $dialog.find('.modal-title').replaceWith($data);
                            } else if ($data.hasClass('modal-body')) {
                                $dialog.find('.modal-body').replaceWith($data);
                            } else {
                                $body.wrapInner($data);
                            }
                        });

                        //reinit document ready function in the new fragment 
                        $(document).triggerHandler('update', $modal[0]);

                        //update javascript 
                        $html.filter('script').each(function() {
                            var $script = $(this);
                            $modal.append($script);
                        });
                    } catch (e) {
                        $body.wrapInner(data);
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


    $(document).on('click.' + NAME + '.data-api', '[data-toggle="modalbox"]', function(e) {
        var $this = $(this);
        exports.ajaxDialog($.extend({}, $this.data()));

        if ($this.is('a')) {
            e.preventDefault();
        }
    });

    return exports;
}));
;/** ========================================================================
 * Mower: messagebox.mower.js - v1.0.0
 *
 *  messagebox show message alter window alert with status,ie:success,warning and so on.
 *
 * Dependencies :
 *                toastr plugin
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

var MessageBox = (function($, toastr) {

    var DEFAULTS = {
        "closeButton": true,
        "debug": false,
        "positionClass": "toast-top-center",
        "onclick": null,
        "showDuration": "1000",
        "hideDuration": "1000",
        "timeOut": "2000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };

    return {
        init: function() {
            toastr.options = $.extend({}, toastr.options, DEFAULTS);
        },
        success: function(message, title, options) {
            toastr.success(message, title, options);
        },
        warning: function(message, title, options) {
            toastr.warning(message, title, options);
        },
        info: function(message, title, options) {
            toastr.info(message, title, options);
        },
        error: function(message, title, options) {
            toastr.error(message, title, options);
        }
    };

}(jQuery, toastr || {}));

jQuery(function() {
    MessageBox.init();
});
