var Table = (function($) {

    'use strict';
    /* Formatting function for row details - modify as you need */
    function format(d) {
        // `d` is the original data object for the row
        return '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">' +
            '<tr>' +
            '<td>Full name:</td>' +
            '<td>' + d.name + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>Extension number:</td>' +
            '<td>' + d.extn + '</td>' +
            '</tr>' +
            '<tr>' +
            '<td>Extra info:</td>' +
            '<td>And any further details here (images etc)...</td>' +
            '</tr>' +
            '</table>';
    }


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
