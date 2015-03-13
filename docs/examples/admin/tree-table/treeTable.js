var TreeTable = (function($) {

    'use strict';

    // private functions & variables
    var onFavoriteClick = function(href) {
        alert("want to favorite href:" + href);
    };

    // public functions
    return {

        //main function
        init: function() {
            $('#dt_basic').dataTable({
                "ajax": "../../../assets/ajax/data/tree_arrays_data.txt",
                "ordering": false,
                "paging": false,
                "columnDefs": [{
                    "targets": [0],
                    "visible": false
                }, {
                    "targets": [1],
                    "visible": false
                }],
                "createdRow": function(row, data, index) {

                    var idAttrName = "data-tt-id";

                    var pIdAttrName = "data-tt-parent-id";

                    var $row = $(row).attr(idAttrName, data[0]);

                    if (data[1]) $row.attr(pIdAttrName, data[1]);

                },
                "initComplete": function() {

                    $("#dt_basic").treetable({
                        expandable: true
                    });
                }
            });

            // Highlight selected row
            $("#dt_basic tbody").on("mousedown", "tr", function() {

                $(".selected").not(this).removeClass("selected");

                $(this).toggleClass("selected");
            });

        }
    };
}(jQuery));

$(document).ready(function() {
    App.init();
    TreeTable.init();
});
