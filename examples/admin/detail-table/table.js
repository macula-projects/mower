var Table = (function($) {

    'use strict';



    // public functions
    return {
        //main function
        bindClickOnDetailsTable: function() {

            var $datatables = $("#example").DataTable();

            // Add event listener for opening and closing details
            $('#example tbody').on('click', 'td.details-control', function() {

                var tr = $(this).parents('tr');

                var row = $datatables.row(tr);

                if (row.child.isShown()) {
                    tr.removeClass('details');

                    // This row is already open - close it
                    row.child.hide();
                } else {
                    tr.addClass('details');
                    // Open this row
                    row.child(format(row.data())).show();
                }
            });

        }
    };

}(jQuery));

Table.bindClickOnDetailsTable();
