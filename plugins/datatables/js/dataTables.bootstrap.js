/*! DataTables Bootstrap 3 integration
 * ©2011-2014 SpryMedia Ltd - datatables.net/license
 */

/**
 * DataTables integration for Bootstrap 3. This requires Bootstrap 3 and
 * DataTables 1.10 or newer.
 *
 * This file sets the defaults and adds options to DataTables to style its
 * controls using Bootstrap. See http://datatables.net/manual/styling/bootstrap
 * for further information.
 */
(function(window, document, undefined){

var factory = function( $, DataTable ) {
"use strict";


/* Set the defaults for DataTables initialisation */
$.extend( true, DataTable.defaults, {
	"sDom": "<'dt-top-row'>r<'dt-wrapper table-responsive't>" +
		"<'dt-row dt-bottom-row'<'row'<'col-xs-12  col-sm-1'l><'col-xs-12 col-sm-8'p><'col-xs-12 col-sm-3'i>>>",
	"oLanguage": {
		"sLengthMenu": "_MENU_",
		"oPaginate": {
			"sFirst": "首页",
			"sPrevious": "上一页",
			"sNext": "下一页",
			"sLast": "最后一页"
		},
		"sInfo": "显示记录从_START_到_END_，总数 _TOTAL_ 条"
	},
	"pagingType": "full_numbers",
	renderer: 'bootstrap'
} );


/* Default class modification */
$.extend( DataTable.ext.classes, {
	sWrapper:      "dataTables_wrapper form-inline dt-bootstrap",
	sFilterInput:  "form-control input-sm",
	sLengthSelect: "form-control input-sm"
} );


/* Bootstrap paging button renderer */
DataTable.ext.renderer.pageButton.bootstrap = function ( settings, host, idx, buttons, page, pages ) {
	var api     = new DataTable.Api( settings );
	var classes = settings.oClasses;
	var lang    = settings.oLanguage.oPaginate;
	var btnDisplay, btnClass, counter=0;

	var attach = function( container, buttons ) {
		var i, ien, node, button;
		var clickHandler = function ( e ) {
			e.preventDefault();
			
			//hide tooltip before redraw
			var $target = $(e.currentTarget);
			$target.find('a').tooltip('hide');

			if ( !$(e.currentTarget).hasClass('disabled') ) {
				api.page( e.data.action ).draw( 'page' );
			}
		};

		for ( i=0, ien=buttons.length ; i<ien ; i++ ) {
			button = buttons[i];

			if ( $.isArray( button ) ) {
				attach( container, button );
			}
			else {
				btnDisplay = '';
				btnClass = '';

				switch ( button ) {
					case 'ellipsis':
						btnDisplay = '<a href="#">&hellip;</a>';
						btnClass = 'disabled';
						break;

					case 'first':
						btnDisplay = '<a href="#" data-toggle="tooltip" rel="tooltip" data-original-title="' + lang.sFirst + '"><i class="fa fa-step-backward"></i></a>';
						btnClass = button + (page > 0 ?
							'' : ' disabled');

						break;

					case 'previous':
						btnDisplay = '<a href="#" data-toggle="tooltip" rel="tooltip" data-original-title="' + lang.sPrevious + '"><i class="fa fa-backward"></i></a>';
						btnClass = button + (page > 0 ?
							'' : ' disabled');
						break;

					case 'next':
						btnDisplay = '<a href="#" data-toggle="tooltip" rel="tooltip" data-original-title="' + lang.sNext + '"><i class="fa fa-forward"></i></a>';
						btnClass = button + (page < pages - 1 ?
							'' : ' disabled');
						break;

					case 'last':
						btnDisplay = '<a href="#" id="toolsss" data-toggle="tooltip" rel="tooltip" data-original-title="' + lang.sLast + '"><i class="fa fa-step-forward"></i></a>';
						btnClass = button + (page < pages - 1 ?
							'' : ' disabled');
						break;

					default:
						btnDisplay = '<a href="#">' + (button + 1) + '</a>';
						btnClass = page === button ?
							'active' : '';
						break;
				}

				if ( btnDisplay ) {
					node = $('<li>', {
							'class': classes.sPageButton+' '+btnClass,
							'id': idx === 0 && typeof button === 'string' ?
								settings.sTableId +'_'+ button :
								null
						} )
						.append( $(btnDisplay).attr({
								'href': '#',
								'aria-controls': settings.sTableId,
								'data-dt-idx': counter,
								'tabindex': settings.iTabIndex
							})
						)
						.appendTo( container );
						
					node.find('a').tooltip({
						placement: "bottom",
						container: "body",
						delay: {
							show: 500,
							hide: 100
						}
					});


					settings.oApi._fnBindAction(
						node, {action: button}, clickHandler
					);

					counter++;
				}
			}
		}
	};

	// IE9 throws an 'unknown error' if document.activeElement is used
	// inside an iframe or frame. 
	var activeEl;

	try {
		// Because this approach is destroying and recreating the paging
		// elements, focus is lost on the select button which is bad for
		// accessibility. So we want to restore focus once the draw has
		// completed
		activeEl = $(host).find(document.activeElement).data('dt-idx');
	}
	catch (e) {}

	attach(
		$(host).empty().html('<ul class="pagination"/>').children('ul'),
		buttons
	);

	if ( activeEl ) {
		$(host).find( '[data-dt-idx='+activeEl+']' ).focus();
	}
};


/*
 * TableTools Bootstrap compatibility
 * Required TableTools 2.1+
 */
if ( DataTable.TableTools ) {
	// Set the classes that TableTools uses to something suitable for Bootstrap
	$.extend( true, DataTable.TableTools.classes, {
		"container": "DTTT btn-group",
		"buttons": {
			"normal": "btn btn-default",
			"disabled": "disabled"
		},
		"collection": {
			"container": "DTTT_dropdown dropdown-menu",
			"buttons": {
				"normal": "",
				"disabled": "disabled"
			}
		},
		"print": {
			"info": "DTTT_print_info"
		},
		"select": {
			"row": "active"
		}
	} );

	// Have the collection use a bootstrap compatible drop down
	$.extend( true, DataTable.TableTools.DEFAULTS.oTags, {
		"collection": {
			"container": "ul",
			"button": "li",
			"liner": "a"
		}
	} );
}

}; // /factory


// Define as an AMD module if possible
if ( typeof define === 'function' && define.amd ) {
	define( ['jquery', 'datatables'], factory );
}
else if ( typeof exports === 'object' ) {
    // Node/CommonJS
    factory( require('jquery'), require('datatables') );
}
else if ( jQuery ) {
	// Otherwise simply initialise as normal, stopping multiple evaluation
	factory( jQuery, jQuery.fn.dataTable );
}


})(window, document);

