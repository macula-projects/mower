var InlineTable = (function($) {

    // public functions
    return {
        //main function
        init: function() {
            this.initTable();
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
    App.init();
    InlineTable.init();
});
