/* Author: Scott Hyndman */

$(function() {
  // menu fade-in
  // $("nav").removeClass("visuallyhidden").hide().delay(1000).fadeIn(1000);
  $("nav").removeClass("visuallyhidden"); //! DEBUG
  
  // navigation
  curPageInfoPath = null;
  var selectPage = function(pagePath) {
    log("navigating, page=" + pagePath)
    
    hidePrevPage();
    
    var parts = pagePath.split("/");
    var pageInfoPath = [];
    var pageInfo = null;
    
    var len = parts.length;
    for (var i = 0; i < len; i++) {
      var part = parts[i];
      var isLast = i + 1 == len;

      // get the part's page info
      if (pageInfo == null) pageInfo = tcp.siteContent[part];
      else pageInfo = pageInfo.children[part];

      // inject the id for future reference
      pageInfo.id = part;
      
      // record it as part of the path
      pageInfoPath.push(pageInfo);
      
      // mark its nav link as selected
      if (pageInfo["navLink"])
        $("#" + pageInfo["navLink"]).addClass("selected");
      
      // show it
      $("#" + part).removeClass("hidden");
      
      // prepare the sidebar if applicable (only last page in path gets a sidebar)
      if (isLast)
        preparePageSidebar(pageInfo, pagePath);
    }
    
    curPageInfoPath = pageInfoPath;
  };
  
  /** Prepares and shows the sidebar for the supplied pageInfo */
  var preparePageSidebar = function(pageInfo, pagePath) {
    var sidebar = $("#sidebar");
    
    if (!pageInfo["sidebar"]) {
      sidebar.addClass("hidden");
      return;
    }
    
    // set the sidebar's title
    $("#page-title").html(getPageTitle(pageInfo));
    
    // set the sidebar's content
    var content = "";
    
    switch (pageInfo["sidebar"]) {
    case "children":
      content = getChildrenNav(pageInfo, pagePath);
      prepareChildren(pageInfo)
      break;
    case "html":
      content = pageInfo.sidebarHtml;
      break;
    }
    
    sidebar.find(".content").empty().append(content);
    
    // show the sidebar
    sidebar.removeClass("hidden");
  };
  
  /** Gets the page title of the supplied pageInfo */
  var getPageTitle = function(pageInfo) {
    return pageInfo["title"] == undefined ? pageInfo.id : pageInfo.title;
  };
  
  /** Gets the nav node for the pageInfo's children */
  var getChildrenNav = function(pageInfo, pagePath) {
    var navParent = $("<nav>");
    for (var childId in pageInfo.children) {
      var childPageInfo = pageInfo.children[childId];
      childPageInfo.id = childId; //! Not really the right place for this
      
      var navLink = $("<a>", {
        href: "#" + pagePath + "/" + childId,
        text: getPageTitle(childPageInfo)
      });
      navLink.hover(
        function(evt) {
          onChildNavOver(childPageInfo, pageInfo, evt);
        }, 
        function (evt) {
          onChildNavOut(childPageInfo, pageInfo, evt)
        });        
      navParent.append(navLink);
    }
    
    return navParent;
  };
  
  /** Handles the mouseover event on a child navigation element */
  var onChildNavOver = function(pageInfo, parentInfo, evt) {
    
  };
  
  /** Handles the mouseout event on a child navigation element */
  var onChildNavOut = function(pageInfo, parentInfo, evt) {
    
  };
  
  /** Prepares the children for display. This may preload images. */
  var prepareChildren = function(pageInfo) {
    for (var childId in pageInfo.children) {
      var childPageInfo = pageInfo.children[childId];
      
      // no hover image or we're already preload{ing,ed}
      if (!childPageInfo["hoverImgSrc"] || childPageInfo["hoverImg"])
        continue;
      
      childPageInfo.hoverImg = $("<img>", {
        src: childPageInfo.hoverImgSrc
      });
    }
  };
  
  /** Performs all necessary visual cleanup page to remove traces of the previously shown page */
  var hidePrevPage = function() {
    if (!curPageInfoPath) return;
    
    var len = curPageInfoPath.length;
    for (var i = 0; i < len; i++) {
      var pageInfo = curPageInfoPath[i];
      $("#" + pageInfo.id).addClass("hidden");
      
      if (pageInfo["navLink"])
        $("#" + pageInfo["navLink"]).removeClass("selected");
    }
  };
  
  // history management
  $.history.init(function(hash) {
    selectPage(hash == "" ? "intro" : hash);
  }, { unescape: ",/" });
  
  /*
  $(document).bind("keydown", function(evt) {
    log(evt);
  });
  */
});
