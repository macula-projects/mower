//do something
var Form = (function($) {

    function cancelCallback() {
        return 'cancel';
    }


    function confirmCallback() {
        return 'ok';
    }

    return {
        init: function() {
            $('#saveForm').on('click',function(e){
                var $button  = $(this);
                // $('#form_sample_1').ajaxValidSubmit({
                //     success: function(data) {
                //         MessageBox.success('保存成功');

                //          //TODO

                //         $button.trigger(POP_BREADCRUMB_EVENT);
                //     },
                //     error: function() {

                //     }
                // });
                $button.trigger('pop.mu.breadcrumb');
            });

            this.initTagsSelect();
            //this.initTagsInput();
        },
        initTagsSelect: function() {
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

            var elt = $('#tagsinput');
            elt.tagsselect({
                itemValue: 'value',
                itemText: 'text',
                dropdownquery: {
                    displayKey: 'text',
                    source: cities
                }
            });
        },
        initTagsInput: function() {
            var elt1 = $('#tagsinput1');
            elt1.tagsinput({
                amodal: {
                    url: 'ajax_modal.html',
                    header: 'Title',
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
        },
        processFormSave: function(dtd) {　　
            var tasks = function() {
                dtd.resolve();
            };

            setTimeout(tasks, 500);
        }
    };
}(jQuery));

jQuery(function() {

    Form.init();

});
