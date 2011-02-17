/* Author: Scott Hyndman */

$(function() {
	// menu fade-in
	// $("nav").removeClass("visuallyhidden").hide().delay(1000).fadeIn(1000);
	$("nav").removeClass("visuallyhidden"); //! DEBUG
	
	// navigation
	var lastNav = null;
	$("nav a").click(function(evt) {
		if (lastNav) {
			lastNav.removeClass("selected");
			$("#" + lastNav.data("page")).hide();
		} else {
			$("#intro").hide();
		}
		var nav = lastNav = $(this).addClass("selected");
		$("#" + nav.data("page")).show();
		
		return false;
	});
});
