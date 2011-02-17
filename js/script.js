/* Author: Scott Hyndman */

$(function() {
	// menu fade-in
	// $("nav").removeClass("visuallyhidden").hide().delay(1000).fadeIn(1000);
	$("nav").removeClass("visuallyhidden"); //! DEBUG
	
	// navigation
	var lastPageMap = {}; // pg classes to last pages within class
	var selectPage = function(page, cls) {
		log("selecting nav, page=" + page);
		
		var lastPage = lastPageMap[cls];
		
		if (lastPage) {
			$("nav a[data-page=" + lastPage + "]").removeClass("selected");
			$("#" + lastPage).hide();
		} else {
			$("#intro").hide();
		}

		$("nav a[data-page=" + page + "]").addClass("selected");
		$("#" + page).show();

		lastPageMap[cls] = page;
	};
	
	$("nav a").click(function() {
		jQuery.history.load($(this).data("page"));
		return false;
	});
	
	// history management
	$.history.init(function(hash) {
		if(hash != "") {
			// this loop handles multiple levels of page (eg. specific gallery under photos)
			$.each(hash.split("/"), function(index, value) {
				selectPage(value, index.toString());				
			});
		}
	},
	{ unescape: ",/" });
	
	$(document).bind("keydown", function(evt) {
		log(evt);
	});
});
