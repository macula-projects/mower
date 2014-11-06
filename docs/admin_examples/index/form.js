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
                dtd.resolve();
            };

            setTimeout(tasks, 5000);
        }
    };
}(jQuery));

jQuery(function() {
    Form.init();
});
