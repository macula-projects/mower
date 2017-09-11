var App = (function($, utils, window, document, undefined) {

   
    // public functions
    return {
        //main function
        init: function() {

            var isLocal = window.location.href.indexOf('macula.top');
            if (isLocal != -1) {
                $.ajaxPrefilter(function(options, originalOptions, jqXHR) {
                    var extension = options.url.slice((options.url.lastIndexOf(".") - 1 >>> 0) + 2);
                    if (extension !== 'js')
                        options.url = "http://macula.top/mower" + options.url;
                });
            } else {
                $.ajaxPrefilter(function(options, originalOptions, jqXHR) {
                    var extension = options.url.slice((options.url.lastIndexOf(".") - 1 >>> 0) + 2);
                    if (extension !== 'js')
                        options.url = "http://localhost:9000" + options.url;
                });
            }
        }
    };
}(jQuery, Utils, window, document));

$(document).ready(function() {
    App.init();
});
