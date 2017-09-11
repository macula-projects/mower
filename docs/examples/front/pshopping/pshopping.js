var Index = (function($) {

    // private functions & variables
    var onFavoriteClick = function(href) {
        alert("want to favorite href:" + href);
    };

    // public functions
    return {
        //main function
        init: function() {
            this.initMainMenu();
        },
        initMainMenu: function() {
            $("#main-menu").on("clickMenu.mu.mainMenu", function(event) {
                // alert(event.mid +"[ name: " +event.instance.name + " ] " + "[ heaf :" + event.href + "]");
                // var purl = href + (href.indexOf('?') > -1 ? '&' : '?') + 'mid=' + mid + '&_=' + (new Date()).valueOf();
                // window.location= purl;
                // 
                event.preventDefault();

                var purl = 'index.html?' + 'title=' + event.instance.name + '&_=' + (new Date()).valueOf();
                window.location = purl;
            });
        }
    };
}(jQuery));

$(document).ready(function() {
    Index.init();
});