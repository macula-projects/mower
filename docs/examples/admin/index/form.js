//do something
var Form = (function($) {
    return {
        init: function() {
            $('[data-toggle="popBreadcrumb"]').on('pop.mu.breadcrumb', function(e) {

                MessageBox.info('系统发生未知异常消息!', '异常信息');

            });
        },
        processFormSave: function(dtd) {　　
            var tasks = function() {
                alert($("#tagsinput").val());
                dtd.resolve();
            };

            setTimeout(tasks, 5000);
        }
    };
}(jQuery));

jQuery(function() {
    Form.init();

    // function onOpened($e) {

    //     var width = $('.bootstrap-tagsinput').innerWidth();

    //     if ($.browser.webkit) {
    //         width = width + 1;
    //     }

    //     $('.tt-dropdown-menu').width(width);

    //     $(".tt-dropdown-menu").position({
    //         my: "left top",
    //         at: "left bottom",
    //         of: ".bootstrap-tagsinput",
    //         collision: "flipfit"
    //     });
    // }

    // // var citynames = new Bloodhound({
    // //     datumTokenizer: Bloodhound.tokenizers.obj.whitespace('company_name'),
    // //     queryTokenizer: Bloodhound.tokenizers.whitespace,
    // //     prefetch: {
    // //         url: '../../assets/ajax/data/company.json',
    // //         filter: function(list) {
    // //             return $.map(list, function(cityname) {
    // //                 return {
    // //                     name: cityname
    // //                 };
    // //             });
    // //         }
    // //     }
    // // });

    // // var stocks = new Bloodhound({
    // //     datumTokenizer: Bloodhound.tokenizers.obj.whitespace('company_name'),
    // //     queryTokenizer: Bloodhound.tokenizers.whitespace,
    // //     limit: 3,
    // //     prefetch: {
    // //         url: '../../assets/ajax/data/company.json',
    // //         filter: function(list) {
    // //             // This should not be required, but I have left it incase you still need some sort of filtering on your server response
    // //             return $.map(list, function(stock) {
    // //                 return {
    // //                     code: stock.code,
    // //                     company_name: stock.company_name
    // //                 };
    // //             });
    // //         }
    // //     }
    // // });

    // // stocks.initialize();

    // var cities = new Bloodhound({
    //     datumTokenizer: Bloodhound.tokenizers.obj.whitespace('text'),
    //     queryTokenizer: Bloodhound.tokenizers.whitespace,
    //     prefetch: '../../assets/ajax/data/company.json'
    // });
    // cities.initialize();

    // var elt = jQuery('#tagsinput');
    // // elt.tagsinput({
    // //     typeaheadjs: {
    // //         name: 'stocks',
    // //         displayKey:'company_name',
    // //         valueKey:'code',
    // //         source: stocks.ttAdapter(),
    // //         templates: {
    // //             empty: [
    // //                 '<div class="empty-message">',
    // //                 'no results found',
    // //                 '</div>'
    // //             ].join('\n'),
    // //             suggestion: function(stock) {
    // //                 return '<p><strong>' + stock.company_name + '</strong></p>';
    // //             }
    // //         }
    // //     }
    // // });

    // jQuery('#tagsinput').tagsinput();

    var cities = [{
        "value": 1,
        "text": "奥斯丁",
        "continent": "Europe"
    }, {
        "value": 2,
        "text": "伦敦",
        "continent": "Europe"
    }, {
        "value": 3,
        "text": "巴黎",
        "continent": "Europe"
    }, {
        "value": 4,
        "text": "华盛顿",
        "continent": "America"
    }, {
        "value": 5,
        "text": "墨西哥",
        "continent": "America"
    }, {
        "value": 6,
        "text": "西伯利亚",
        "continent": "America"
    }, {
        "value": 7,
        "text": "悉尼",
        "continent": "Australia"
    }, {
        "value": 8,
        "text": "渥太华",
        "continent": "Australia"
    }, {
        "value": 9,
        "text": "肯帝亚",
        "continent": "Australia"
    }, {
        "value": 10,
        "text": "北京",
        "continent": "Asia"
    }, {
        "value": 11,
        "text": "新泽西",
        "continent": "Asia"
    }];

    var elt = jQuery('#tagsinput');
    elt.tagsselect({
        itemValue: 'value',
        itemText: 'text',
        dropdownquery: {
            displayKey: 'text',
            source: cities
        }
    });

    function cancelCallback() {
        return 'cancel';
    }


    function confirmCallback() {
        return 'ok';
    }

    var elt1 = jQuery('#tagsinput1');
    elt1.tagsinput({
        amodal: {
            url: 'ajax_modal.html',
            handlers: [{
                // first button (cancel)
                "label": 'cancel',
                "callback": cancelCallback
            }, {
                // second button (confirm)
                "label": 'ok',
                "callback": confirmCallback
            }]
        }
    });

    //jQuery('#tagsinput').tagsinput();
});
