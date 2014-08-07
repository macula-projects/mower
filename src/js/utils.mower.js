/** ========================================================================
 * Mower: utill.mower.js - v1.0.0
 *
 * utility
 *
 * Copyright 2011-2014 Infinitus, Inc
 * Licensed under Apache Licence 2.0 (https://github.com/macula-projects/mower/blob/master/LICENSE)
 * ======================================================================== */

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

/** 获取介于之间的数据值 */
Number.prototype.limit = function(min, max) {
	return (this < min) ? min : (this > max ? max : this);
};

/** 匹配与字符串相同的split方法 */
Number.prototype.split = function() {
	return [this];
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

(function($, window, document, undefined) {

	$.fn
		.extend({
			/** 获取该元素所隶属的应用上下文信息 */
			getContextPath: function() {
				try {
					var closest = $(this).closest('[base]');
					if (closest != null && closest.size()) {
						return closest.attr('base') || base;
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
			updateContents: function(url, ajaxOptions, callback) {
				$(this)._privateProcessContents(url, ajaxOptions, callback, false);
			},
			replaceContents: function(url, ajaxOptions, callback) {
				$(this)._privateProcessContents(url, ajaxOptions, callback, true);
			},
			updateHtml: function(data, replace, callback) {
				var self = $(this),
					$html = $(data),
					scripts = [];
				$html.each(function() {
					var id = $(this).attr('id'),
						tagName, tagType;
					if ($.isFunction($.fn.prop)) {
						tagName = $(this).prop('tagName');
						tagType = $(this).prop('type');
					} else {
						tagName = $(this).attr('tagName');
						tagType = $(this).attr('type');
					}
					if (tagName == 'SCRIPT') {
						if (tagType == null || tagType == '' || tagType.toLowerCase().indexOf('javascript') >= 0) {
							scripts.push($(this));
						} else {
							scripts.unshift($(this));
						}
					} else if (id) {
						var existed = self.find('#' + id);
						if (existed.exists()) {
							if (replace) {
								self.find('#' + id).replaceWith($(this));
							} else {
								self.find('#' + id).html($(this).html()).attr('base', $(this).attr('base'));
							}
						} else {
							if (replace) {
								self.replaceWith($(this));
							} else {
								self.html($(this).html()).attr('base', $(this).attr('base'));
							}
						}
					}
				});
				var titlepart = $html.filter('title');
				if (titlepart.exists()) {
					document.title = titlepart.text();
				}
				for (var i = 0; i < scripts.length; i++) {
					var id = scripts[i].attr('id');
					if (id) {
						self.find('#' + id).remove();
					}
					self.append(scripts[i]);
				}
				if (callback && $.isFunction(callback)) {
					callback.apply(self, [data]);
				}
			},
			_privateProcessContents: function(url, ajaxOptions, callback, replace) {
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
						self.updateHtml(data, replace, callback);
						$(window).trigger('resize');
					}
				}, ajaxOptions || {});
				$.ajax(s);
			},
			_privateProcessContents: function(url, ajaxOptions, callback, replace) {
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
						self.updateHtml(data, replace, callback);
						$(window).trigger('resize');
					}
				}, ajaxOptions || {});
				$.ajax(s);
			},
			/** IE6的big iframe Z-index 修复 */
			bgiframe: ($.browser.msie && /msie 6\.0/i.test(navigator.userAgent) ? function(s) {
				s = $.extend({
					top: 'auto', // auto ==
					// .currentStyle.borderTopWidth
					left: 'auto', // auto ==
					// .currentStyle.borderLeftWidth
					width: 'auto', // auto == offsetWidth
					height: 'auto', // auto == offsetHeight
					opacity: true,
					src: 'javascript:false;'
				}, s);
				var prop = function(n) {
					return n && n.constructor === Number ? n + 'px' : n;
				};
				var html = '<iframe class="bgiframe" frameborder="0"tabindex="-1"src="' + s.src + '"' + 'style="display:block;position:absolute;z-index:-1;' + (s.opacity !== false ? 'filter:Alpha(Opacity=\'0\');' : '') + 'top:' + (s.top == 'auto' ? 'expression(((parseInt(this.parentNode.currentStyle.borderTopWidth)||0)*-1)+\'px\')' : prop(s.top)) + ';' + 'left:' + (s.left == 'auto' ? 'expression(((parseInt(this.parentNode.currentStyle.borderLeftWidth)||0)*-1)+\'px\')' : prop(s.left)) + ';' + 'width:' + (s.width == 'auto' ? 'expression(this.parentNode.offsetWidth+\'px\')' : prop(s.width)) + ';' + 'height:' + (s.height == 'auto' ? 'expression(this.parentNode.offsetHeight+\'px\')' : prop(s.height)) + ';' + '"/>';
				return this.each(function() {
					if ($(this).children('iframe.bgiframe').length === 0)
						this.insertBefore(document.createElement(html), this.firstChild);
				});
			} : function() {
				return this;
			})
		});

}(jQuery, window, document));

JSON = {
	useHasOwn: ({}.hasOwnProperty ? true : false),
	pad: function(n) {
		return n < 10 ? "0" + n : n;
	},
	m: {
		"\b": '\\b',
		"\t": '\\t',
		"\n": '\\n',
		"\f": '\\f',
		"\r": '\\r',
		'"': '\\"',
		"\\": '\\\\'
	},
	encodeString: function(s) {
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
	},
	encodeArray: function(o) {
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
	},
	encodeDate: function(o) {
		return '"' + o.getFullYear() + "-" + pad(o.getMonth() + 1) + "-" + pad(o.getDate()) + "T" + pad(o.getHours()) + ":" + pad(o.getMinutes()) + ":" + pad(o.getSeconds()) + '"';
	},
	encode: function(o) {
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
	},
	decode: function(json) {
		return eval("(" + json + ')');
	}
};

var Guid = (function() {
	return function (prefix) {
	  do prefix += ~~(Math.random() * 1000000)
	  while (document.getElementById(prefix))
	  return prefix
	};
})();