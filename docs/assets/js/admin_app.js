var App = (function($, utils, window, document, undefined) {

    var resBreakpointMd = utils.getResponsiveBreakpoint('md');

    // private functions & variables
    var resizeHeaderMenu = function() {
        var $menu = $('.header-menu > .navbar-nav');
        var $menuItems;

        if (utils.getViewPort().width < resBreakpointMd) {
            $menuItems = $menu.children('li:not(.dropdown)');
            $menu.children('li.dropdown').find('ul.dropdown-menu').prepend($menuItems.attr('data-basic', true));
        } else {
            var $li = $menu.children('li.dropdown').find('ul.dropdown-menu > li');
            $menuItems = $li.filter(function() {
                return $(this).attr("data-basic") === 'true';
            });

            $menu.prepend($menuItems.removeAttr('data-basic'));
        }

        var $dropdownMenu = $menu.children('li.dropdown'),
            $active = $dropdownMenu.find('li.active'),
            $caret = $dropdownMenu.find('span.caret');

        $dropdownMenu.removeClass('active');

        if (!$active.length) {
            $dropdownMenu.find('.dropdown-toggle').html($dropdownMenu.find('li:first a').text()).append(' ').append($caret);
        } else {
            $dropdownMenu.addClass('active');
            $dropdownMenu.find('.dropdown-toggle').html($active.children('a').text()).append(' ').append($caret);
        }
    };

    var loading = function() {
        /*Loading*/
        $(window)
            .load(function() {
                setTimeout(function() {
                    $('.loading-container')
                        .addClass('loading-inactive');
                }, 1000);
            });
    };


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

            loading();

            this.initMainMenu();
            this.initBreadCrumb();
            this.initSidebarMenu();

            utils.addResizeHandler(resizeHeaderMenu);
            resizeHeaderMenu();

            //Handle RTL SUpport for Changer CheckBox
            $("#skin-changer li a").click(function() {
                createCookie("current-skin", $(this).attr('rel'), 10);
                window.location.reload();
            });
        },
        initBreadCrumb: function() {
            $(".sidebar-menu").on('complete.mu.sidebarMenu', function(event) {
                /* Act on the event */
                var defaultVal = QueryString.title ? QueryString.title : $(this).find('a[data-toggle="menu"]').filter(':first').text(),
                    mcode = QueryString.mcode ? QueryString.mcode : $(this).find('a[data-toggle="menu"]').filter(':first').attr('mcode'),
                    page = $(this).find('a[data-toggle="menu"][mcode="' + mcode + '"]').attr('data-href');

                // $(".breadcrumb").find('li.active').empty().append('<i class="fa fa-home home"></i><span>' + decodeURIComponent(defaultVal) + '</span>');

                $(".breadcrumb").breadcrumb("push", decodeURIComponent(defaultVal), page);
            });
        },
        initMainMenu: function() {

            var rcode = $.cookie ? $.cookie('rcode') : QueryString.rcode,
                mcode = $.cookie ? $.cookie('mcode') : QueryString.mcode,
                selectedMenu = rcode ? $('.header-menu li:not(.dropdown) a[mcode="' + rcode + '"]') : $('.header-menu li:not(.dropdown):first a');

            if (!rcode) {
                rcode = selectedMenu.attr('mcode');
            }

            $(".sidebar-menu").sidebarMenu({
                'url': "assets/ajax/data/admin_menu.txt",
                "populate": false
            }).sidebarMenu('populate', rcode, mcode);


            selectedMenu.closest('li').addClass('active').siblings().removeClass('active');

            //change text if click dropdown-menu's a 
            var $parent = selectedMenu.closest('ul.dropdown-menu');
            if ($parent.length) {
                $parent.parent().addClass('active').siblings().removeClass('active');

                var $caret = $parent.parent().find('span.caret');
                $parent.parent().find('.dropdown-toggle').html(selectedMenu.text()).append(' ').append($caret);
            } else {
                selectedMenu.closest('li').siblings('.dropdown').find('li').removeClass('active');
            }

            //handle menu click event and redirect url
            $('.header-menu').on('click', 'li:not(.dropdown) > a', function(event) {
                event.preventDefault();


                var $this = $(this),
                    rcode = $this.attr('mcode');

                var purl = window.location.href;
                var i = purl.indexOf("?");
                purl = purl.substring(0, i);

                if ($.cookie) {
                    $.cookie('rcode', rcode);
                    $.cookie('mcode', mcode);
                } else {
                    purl = purl + (purl.indexOf('?') > -1 ? '&' : '?') + 'rcode=' + rcode;
                }

                window.location = purl;
            });
        },
        initSidebarMenu: function() {

            //Sidebar Toggler
            $(".sidebar-toggler").on('click', function() {
                $("#sidebar").toggleClass("hide");
                $("body").toggleClass("mu-sidebar-closed");
                $(".sidebar-toggler").toggleClass("active");
                return false;
            });
            //End Sidebar Toggler

            //Sidebar Collapse
            var b = $("#sidebar").hasClass("menu-compact");
            $("#sidebar-collapse").on('click', function() {
                if (!$('#sidebar').is(':visible')) {
                    $("body").toggleClass("mu-sidebar-closed");
                    $("#sidebar").toggleClass("hide");
                }

                $("#sidebar").toggleClass("menu-compact");
                $('body').toggleClass("mu-sidebar-compact");
                $(".sidebar-collapse").toggleClass("active");
                b = $("#sidebar").hasClass("menu-compact");

                if ($(".sidebar-menu").closest("div").hasClass("slimScrollDiv")) {
                    $(".sidebar-menu").slimScroll({
                        destroy: true
                    });
                    $(".sidebar-menu").attr('style', '');
                }
                if (b) {
                    $(".open > .submenu")
                        .removeClass("open");
                } else {
                    if ($('.mu-sidebar').hasClass('sidebar-fixed')) {
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

            var that = this;
            $(".sidebar-menu").on("clickMenu.mu.sidebarMenu", function(event) {
                event.preventDefault();

                //scripts as below traffic default implement in sidebarMenu plugin
                var title = event.instance.name,
                    openMode = event.instance.attributes.openMode || 'normal',
                    rcode = event.rcode,
                    mcode = event.mcode,
                    href = event.href;


                switch (openMode) {
                    case '_blank':
                    case 'blank':
                    {
                       var host = window.location.host,
                           isRemote = host.indexOf('macula.top');

                       if (isRemote >= 0) {
                           host = host + '/mower';
                       }

                       host = ('http://' + host + '/' + href);
                       window.location.href = host;
                       break; 
                   }
                    default:
                        {
                            var purl = window.location.href,
                                i = purl.indexOf("?"),
                                purl = purl.substring(0, i),
                                purl = purl + '?title=' + title + '&_=' + (new Date()).valueOf();

                            if ($.cookie) {
                                $.cookie('rcode', rcode);
                                $.cookie('mcode', mcode);
                            } else {
                                purl = purl + (purl.indexOf('?') > -1 ? '&' : '?') + 'rcode=' + rcode + '&mcode=' + mcode;
                            }
                            window.location.href = purl;
                            break;
                        }
                }
            });
        }
    };
}(jQuery, Utils, window, document));

$(document).ready(function() {
    App.init();
});
