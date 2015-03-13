var Form = (function($) {

    // private functions & variables


    // public functions
    return {
        //main function
        init: function() {
            this.initTab();
            this.validateForm();
        },
        initTab: function() {
            $('.nav-tabs')
                .atab()
                .atab('add', '动态新增', './basic.html');
        },
        validateForm: function() {
            $('.mu-panel').on('click', '[data-form-action="save"]', function(event) {
                /* Act on the event */
                $('#form_sample_1').bootstrapValidator('validate');

                var valid = $('#form_sample_1').data('bootstrapValidator').isValid();

                if (valid) {
                    $("#alert").toggle(false);
                } else {
                    $("#alert").toggle(true);
                }
            });
        }
    }
}(jQuery));

$(document).ready(function() {
    App.init();
    Form.init();
});