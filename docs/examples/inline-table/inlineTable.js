var InlineTable = (function($) {

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
            this.initTable();
        },
        initBreadCrumb: function() {
            $("#main-menu").on('complete.mu.mainMenu', function(event) {
                /* Act on the event */

                var defaultVal = QueryString.title ? QueryString.title : '商品库存管理';

                $(".breadcrumb").find('li.active').empty().append('<i class="fa fa-home home"></i>' + decodeURIComponent(defaultVal));
            });
        },
        initMainMenu: function() {
            $("#main-menu").mainMenu({
                'url': "../../assets/ajax/data/menu.txt"
            });

            $("#main-menu").on("clickMenu.mu.mainMenu", function(event) {
                // alert(event.mid +"[ name: " +event.instance.name + " ] " + "[ heaf :" + event.href + "]");
                // var purl = href + (href.indexOf('?') > -1 ? '&' : '?') + 'mid=' + mid + '&_=' + (new Date()).valueOf();
                // window.location= purl;

                var purl = 'inline-table.html?' + 'mid=' + event.mid + '&_=' + (new Date()).valueOf();
                window.location = purl;
            });
        },
        initTable: function() {
                var viewModel = ko.mapping.fromJS({
                    "tableData":[]
                });

                var val = $('div.panel-body').attr('attribute');
                if(val){
                    alert("ddd");
                }

                ko.applyBindings(viewModel,$('div.panel-body')[0]);
        }
    };
}(jQuery));

$(document).ready(function() {
    InlineTable.init();
});
