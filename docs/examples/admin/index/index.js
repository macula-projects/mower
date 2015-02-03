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
            this.initBreadCrumb();
        },
        initBreadCrumb: function() {
            $("#main-menu").on('complete.mu.compMenu', function(event) {
                /* Act on the event */
                
                var  defaultVal = QueryString.title ? QueryString.title : '商品库存管理';

                $(".breadcrumb").find('li.active').empty().append('<i class="fa fa-home home"></i>'+ decodeURIComponent(defaultVal));
            });
        },
        initMainMenu: function() {
            

            // $("#main-menu").compMenu({
            //     'url': "../../assets/ajax/data/menu.txt"
            // });

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

InitiateSideMenu();

function InitiateSideMenu() {

    //Sidebar Toggler
    $(".sidebar-toggler").on('click', function () {
        $("#sidebar").toggleClass("hide");
        $(".sidebar-toggler").toggleClass("active");
        return false;
    });
    //End Sidebar Toggler

    //Sidebar Collapse
    var b = $("#sidebar").hasClass("menu-compact");
    $("#sidebar-collapse").on('click', function () {
        if (!$('#sidebar').is(':visible'))
            $("#sidebar").toggleClass("hide");
        $("#sidebar").toggleClass("menu-compact");
        $(".sidebar-collapse").toggleClass("active");
        b = $("#sidebar").hasClass("menu-compact");

        if ($(".sidebar-menu").closest("div").hasClass("slimScrollDiv")) {
            $(".sidebar-menu").slimScroll({ destroy: true });
            $(".sidebar-menu").attr('style', '');
        }
        if (b) {
            $(".open > .submenu")
                .removeClass("open");
        } else {
            if ($('.page-sidebar').hasClass('sidebar-fixed')) {
                var position = (readCookie("rtl-support") || location.pathname == "/index-rtl-fa.html" || location.pathname == "/index-rtl-ar.html") ? 'right' : 'left';
                $('.sidebar-menu').slimscroll({
                    height: 'auto',
                    position: position,
                    size: '3px',
                    color: themeprimary
                });
            }
        }
        //Slim Scroll Handle



    });
    //End Sidebar Collapse


    //Sidebar Menu Handle
    $(".sidebar-menu").on('click', function (e) {
        var menuLink = $(e.target).closest("a");
        if (!menuLink || menuLink.length == 0)
            return;
        if (!menuLink.hasClass("menu-dropdown")) {
            if (b && menuLink.get(0).parentNode.parentNode == this) {
                var menuText = menuLink.find(".menu-text").get(0);
                if (e.target != menuText && !$.contains(menuText, e.target)) {
                    return false;
                }
            }
            return;
        }
        var submenu = menuLink.next().get(0);
        if (!$(submenu).is(":visible")) {
            var c = $(submenu.parentNode).closest("ul");
            if (b && c.hasClass("sidebar-menu"))
                return;
            c.find("> .open > .submenu")
                .each(function () {
                    if (this != submenu && !$(this.parentNode).hasClass("active"))
                        $(this).slideUp(200).parent().removeClass("open");
                });
        }
        if (b && $(submenu.parentNode.parentNode).hasClass("sidebar-menu"))
            return false;
        $(submenu).slideToggle(200).parent().toggleClass("open");
        return false;
    });
    //End Sidebar Menu Handle
}

$(document).ready(function() {

    Index.init();

});

