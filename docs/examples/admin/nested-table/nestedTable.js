var NestedTable = (function($) {

    'use strict';

    // private functions & variables
    function fnFormatDetails(table_id, html) {
        var sOut = "<table class=\"table table-striped table-bordered table-hover\" id=\"exampleTable_" + table_id + "\">";
        sOut += html;
        sOut += "</table>";
        return sOut;
    }


    // public functions
    return {

        //main function
        init: function() {
            this.bindClickOnNestTable();
        },
        bindClickOnNestTable: function() {
            // you would probably be using templates here
            var iTableCounter = 1;
            // Add event listener for opening and closing details
            // caution: maybe as this init before parent table ,in order to disable click event 
            $('#example').on('click', 'tbody td.details-control', function() {
                var tr = $(this).parents('tr');
                var $pTable = $("#example").DataTable(), row = $pTable.row(tr);

                if (row.child.isShown()) {
                    tr.removeClass('details');

                    // This row is already open - close it
                    row.child.hide();
                } else {
                    tr.addClass('details');

                    // Open this row
                    row.child(fnFormatDetails(iTableCounter, $("#detailsTable").html())).show();
                    var oInnerTable = $("#exampleTable_" + iTableCounter).dataTable({
                        "ajax": {
                            "url": "../../../assets/ajax/data/arrays_custom_prop.txt",
                            "dataSrc": "demo"
                        },
                        "ordering": true
                    });
                    iTableCounter = iTableCounter + 1;
                }
            });
        }
    };
}(jQuery));

$(document).ready(function() {
    App.init();//init menu 
    NestedTable.init();
});