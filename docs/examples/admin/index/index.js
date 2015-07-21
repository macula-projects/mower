$(document).ready(function() {

	$('#addForm').attachBCHandler({
		'page': function(){
			return "examples/admin/index/form.html";
		}
	});

    App.init();
});