var DetailsTable = (function($) {

    'use strict';

    // private functions & variables
    var onFavoriteClick = function(href) {
        alert("want to favorite href:" + href);
    };


    // public functions
    return {

        //main function
        init: function() {
            this.initMainMenu();
            this.initBreadCrumb();
        },
        initBreadCrumb: function() {
            $("#main-menu").on('complete.mu.mainMenu', function(event) {
                /* Act on the event */
                var menuItem = $(this).mainMenu("findMenuById", QueryString.mid);

                // menuItem && $(".breadcrumb")
                //                 .breadcrumb({
                //                     divider: '<i class="fa fa-angle-right"></i>',
                //                     favoriteClick: onFavoriteClick
                //                 })
                //                 .breadcrumb("push", menuItem.name, menuItem.uri)
                //                 

                menuItem && $(".breadcrumb")
                    .breadcrumb({
                        divider: '<i class="fa fa-angle-right"></i>',
                        favoriteClick: onFavoriteClick
                    })
                    .breadcrumb("push", menuItem.name, 'table.html')
            });
        },
        initMainMenu: function() {
            $("#main-menu").mainMenu({
                'url': "../assets/ajax/data/menu.txt"
            });

            $("#main-menu").on("clickMenu.mu.mainMenu", function(event) {
                // alert(event.mid +"[ name: " +event.instance.name + " ] " + "[ heaf :" + event.href + "]");
                // var purl = href + (href.indexOf('?') > -1 ? '&' : '?') + 'mid=' + mid + '&_=' + (new Date()).valueOf();
                // window.location= purl;

                var purl = 'details-table.html?' + 'mid=' + event.mid + '&_=' + (new Date()).valueOf();
                window.location = purl;
            });
        }
    };
}(jQuery));

$(document).ready(function() {
    DetailsTable.init();
});
