/* Author: Scott Hyndman */

$(function() {
  // menu fade-in
  //$("nav").delay(200).fadeIn(1000);
  $("nav").show(); //! DEBUG
  
  // navigation
  curPageInfoPath = null;
  var selectPage = function(pagePath) {
    log("navigating, page=" + pagePath)
    
    hidePrevPage();
    
    if (pagePath.charAt(pagePath.length - 1) == '/') 
      pagePath = pagePath.substring(0, pagePath.length - 1);
  
    var parts = pagePath.split("/");
    var pageInfoPath = [];
    var pageInfo = null;
    
    var len = parts.length;
    for (var i = 0; i < len; i++) {
      var part = parts[i];
      var pageDiv = pageDiv == undefined ? $("#" + part) : pageDiv;
      var isLast = i + 1 == len;

      // get the part's page info
      if (pageInfo == null) pageInfo = tcp.siteContent[part];
      else if (pageInfo["galleries"]) pageInfo = pageInfo.galleries[part];

      // inject the id for future reference
      pageInfo.id = part;
      
      // record it as part of the path
      pageInfoPath.push(pageInfo);
      
      // mark its nav link as selected
      if (pageInfo["navLink"])
        $("#" + pageInfo["navLink"]).addClass("selected");
      
      // show it
      pageDiv.removeClass("hidden");
      
      // prepare the sidebar if applicable (only last page in path gets a sidebar)
      if (isLast) {
        preparePageSidebar(pageInfo, pagePath);
        
        if (pageInfo["defaultHtml"]) {
          pageDiv.empty().append(pageInfo["defaultHtml"]);
        } 
        else if (pageInfo["photos"]) {
          pageDiv.empty().append(getGalleryContent(pageInfo, pagePath));
        }
      }
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
    case "galleries":
      content = getGalleriesNav(pageInfo, pagePath);
      prepareGalleries(pageInfo)
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
  var getGalleriesNav = function(pageInfo, pagePath) {
    var navParent = $("<nav>");
    for (var childId in pageInfo.galleries) {
      var childPageInfo = pageInfo.galleries[childId];
      childPageInfo.id = childId; //! Not really the right place for this
      
      var navLink = $("<a>", {
        href: "#" + pagePath + "/" + childId,
        text: getPageTitle(childPageInfo)
      });
      navLink.hover(
        _.bind(onChildNavOver, null, childPageInfo, pageInfo),
        $.noop);        
      navParent.append(navLink);
    }
    
    return navParent;
  };
  
  /** Gets the gallery master content */
  var getGalleryContent = function(pageInfo, pagePath) {
    var thumbContainer = $("<div>");
    
    var len = pageInfo.photos.length;
    for (var i = 0; i < len; i++) {
      var photo = pageInfo.photos[i];

      
      var photoLink = $("<a>", {
        href: "#" + pagePath + "/" + getPhotoBaseName(photo)
      });
      
      photoLink.append($("<img>", {
        src: photo.thumbSrc,
        "class": "gallery-thumb",
        width: "140px",
        height: "140px"
      }));
      
      thumbContainer.append(photoLink);
    }
    
    return thumbContainer;
  };
  
  var getPhotoBaseName = function(photoInfo) {
    var src = photoInfo.fullSrc;
    var baseName = src.substr(src.lastIndexOf("/") + 1);
    return baseName.substr(0, baseName.indexOf("."));
  };
  
  /** Handles the mouseover event on a child navigation element */
  var onChildNavOver = function(pageInfo, parentInfo, evt) {
    $("#" + parentInfo.id).empty().append(pageInfo.hoverImg);
  };
  
  /** Prepares the children for display. This may preload images. */
  var prepareGalleries = function(pageInfo) {
    for (var childId in pageInfo.galleries) {
      var childPageInfo = pageInfo.galleries[childId];
      
      // no hover image or we're already preload{ing,ed}
      if (!childPageInfo["hoverImgSrc"] || childPageInfo["hoverImg"])
        continue;
      
      childPageInfo.hoverImg = $("<img>", {
        src: childPageInfo.hoverImgSrc,
        "class": "cover"
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
