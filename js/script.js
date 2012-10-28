/* Author: Scott Hyndman */

$(function() {
  // menu fade-in

  var menuLbl = $("#menu-label");
  var pageTitle = $("#page-title");
  var topNavLinks = $("#top-nav-links");

  /**
   * Begins the show menu animation.
   */
  var showMenu = function() {
    completeMenuAnimation();
    pageTitle.fadeTo(100, 0);
    menuLbl.fadeOut(100);
    topNavLinks.delay(100).fadeIn(300);
  };

  /**
   * Begins the hide menu animation.
   */
  var hideMenu = function() {
    completeMenuAnimation();
    topNavLinks.fadeOut(200);
    menuLbl.delay(300).fadeIn(100);
    pageTitle.delay(300).fadeTo(100, 1);
  };

  /**
   * This prevents wrapping on the nav links by early completing animation.
   */
  var completeMenuAnimation = function() {
    pageTitle.stop(true, true);
    topNavLinks.stop(true, true);
    menuLbl.stop(true, true);
  };

  $("#top-nav").hover(showMenu, hideMenu);

  $("body").on("click", "#sidebar nav a.header", function() {
    $("." + $(this).data("group") + "-group").fadeToggle();
  });

  // navigation

  var curGalleryInfo = null;
  var inPhotos = false;
  var curPageInfoPath = null;

  /**
   * Performs faux navigation to the supplied path.
   *
   * This method is a bit long and gross. Refactor target.
   */
  var selectPage = function(pagePath) {
    hidePrevPage();

    if (pagePath.charAt(pagePath.length - 1) == '/')
      pagePath = pagePath.substring(0, pagePath.length - 1);

    inPhotos = false;

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
      else if (pageInfo["galleries"]) {
        pageInfo = pageInfo.galleries[part];
        curGalleryInfo = getGalleryInfo(pageInfo);
      }
      else if (pageInfo["photos"]) {
        inPhotos = true;
        curGalleryInfo = getGalleryInfo(pageInfo, part);
        pageInfo = pageInfo.photos[part];
      }

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
        var sidebar = preparePageSidebar(pageInfo, pagePath, pageInfoPath);
        pageDiv.css('min-height', sidebar.height() + 'px');

        //! this isn't very smart -- we should have a single child concept
        if (pageInfo["defaultHtml"]) {
          pageDiv.empty().append(pageInfo["defaultHtml"]);
        }
        else if (pageInfo["photos"]) {
          pageDiv.empty().append(getGalleryContent(pageInfo, pagePath));
          positionGalleryNav(pageDiv);
        }
        else if (pageInfo["fullSrc"]) {
          pageDiv.empty().append(getPhotoContent(pageInfo, pagePath));
        }
      }
    }

    curPageInfoPath = pageInfoPath;
  };

  /**
   * Returns an object representing the current gallery and position
   */
  var getGalleryInfo = function(galleryInfo, curPhotoName) {
    return { gallery: galleryInfo, curPhoto: curPhotoName };
  };

  /**
   * Prepares and shows the sidebar for the supplied pageInfo
   */
  var preparePageSidebar = function(pageInfo, pagePath, pageInfoPath) {
    var sidebar = $("#sidebar");

    if (!inPhotos && !pageInfo["sidebar"] && !pageInfo.sidebarHtml) {
      sidebar.addClass("hidden");
      return sidebar;
    }

    // set the sidebar's title
    $("#page-title").html(getPageTitle(pageInfo, pageInfoPath));

    // set the sidebar's content
    var content;

    switch (pageInfo["sidebar"]) {
    case "galleries":
      content = $(getGalleriesNav(pageInfo, pagePath));
      prepareGalleries(pageInfo)
      break;
    case "html":
    default:
      content = $('<div>');
      content.append(pageInfo.sidebarHtml || '&nbsp;');
      break;
    }

    // Generate gallery navigation

    var isGallery = pageInfo.photos !== undefined;
    if (inPhotos || isGallery) {
      var templateHtml = $('#gallery-nav-tmpl').html();
      content.append($(_.template(templateHtml, {
        sectionAnchor: pageInfoPath[0].id,
        sectionTitle: getPageTitle(pageInfoPath[0]),
        mode: inPhotos ? 'photo' : 'gallery'
      })));

      content.find(".gallery-nav .photo-prev").click(showPreviousPhoto);
      content.find(".gallery-nav .photo-next").click(showNextPhoto);
      content.find(".gallery-nav .next-gal").click(showNextGallery);
      content.find(".gallery-nav .back-to-gallery").click(showGallery);
    }

    sidebar.find(".content").empty().append(content);
    sidebar.removeClass("hidden");

    return sidebar;
  };

  /** Gets the page title of the supplied pageInfo */
  var getPageTitle = function(pageInfo, pageInfoPath, isNav) {
    var pageIdParts = pageInfo.id.split(":"); // for grouped galleries
    return pageInfo["title"] == undefined
      ? isNav ? pageIdParts[pageIdParts.length - 1] : pageIdParts.join(" - ")
      : pageInfo.title == "$use_parent"
        ? getPageTitle(pageInfoPath[pageInfoPath.length - 2]) //! bug here if two $use_parents
        : pageInfo.title;
  };

  /**
   * Gets the nav node for the pageInfo's children
   */
  var getGalleriesNav = function(pageInfo, pagePath) {
    var navParent = $("<nav>", { class: "main-nav" });
    var first = true;
    var extraProps;
    var group = "";

    for (var childId in pageInfo.galleries) {
      var childPageInfo = pageInfo.galleries[childId];
      childPageInfo.id = childId; //! Not really the right place for this

      var groupAndId = childId.split(":");

      if (groupAndId.length == 2) {
        if (group != groupAndId[0]) { // insert a group header
          group = groupAndId[0];
          extraProps = {
            class: 'grouped ' + group + '-group',
            style: 'display: none'
          };

          var groupLink = $("<a>", { text: group, class: 'header', 'data-group': group })
          if (childPageInfo.hoverImgSrc) {
            groupLink.hover(
              _.bind(onChildNavOver, null, childPageInfo, pageInfo),
              $.noop);
          }
          navParent.append(groupLink);
        }
      } else {
        extraProps = {};
      }

      var navLink = $("<a>", _.extend({
        href: childPageInfo.href ? childPageInfo.href : "#" + pagePath + "/" + childId,
        text: getPageTitle(childPageInfo, null, true),
      }, extraProps));

      // custom CSS class
      if (childPageInfo.navCssClass != undefined) {
        navLink.addClass(childPageInfo.navCssClass);
      }

      // If we have a hover img, set it up to show on rollover
      if (childPageInfo.hoverImgSrc) {
        navLink.hover(
          _.bind(onChildNavOver, null, childPageInfo, pageInfo),
          $.noop);
      }

      navParent.append(navLink);
      first = false;
    }

    return navParent;
  };

  /**
   * Gets jQuery wrapped gallery master content
   */
  var getGalleryContent = function(pageInfo, pagePath) {
    var thumbContainer = $("<div>", {
      "class": "gallery"
    });

    for (var childId in pageInfo.photos) {
      var photo = pageInfo.photos[childId];
      photo.id = childId;

      var photoLink = $("<a>", {
        href: "#" + pagePath + "/" + childId
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

  /**
   * Handles the mouseover event on a child navigation element
   */
  var onChildNavOver = function(pageInfo, parentInfo, evt) {
    $("#" + parentInfo.id).empty().append(pageInfo.hoverImg);
  };

  /**
   * Prepares the children for display. This may preload images.
   */
  var prepareGalleries = function(pageInfo) {
    for (var childId in pageInfo.galleries) {
      var childPageInfo = pageInfo.galleries[childId];

      // no hover image or we're already preload{ing,ed}
      if (!childPageInfo["hoverImgSrc"] || childPageInfo["hoverImg"])
        continue;

      var img = $("<img>", {
        src: childPageInfo.hoverImgSrc,
        "class": "gallery-full"
      });
      childPageInfo.hoverImg = $("<a>", {
        href: "#" + pageInfo.id + "/" + childId
      }).append(img);
    }
  };

  /**
   * Gets jQuery wrapped DOM elements for a photo page.
   */
  var getPhotoContent = function(pageInfo, pagePath) {
    var photo = $("<img>", {
      src: pageInfo.fullSrc,
      "class": "gallery-full"
    });

    photo.load(function() {
      // set timeout required to get width and height. not immediately available. we have
      // to wait until the image has been placed in the page.
      _.defer(function() {
        positionGalleryNav(photo);
      });
    });

    return photo;
  };

  var positionGalleryNav = function(relativeTo) {
    $(".gallery-nav").css("top", relativeTo.height() - 78).show();
  };

  /**
   * Performs all necessary visual cleanup page to remove traces of the previously shown page
   */
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

  // initialize history management
  $.history.init(function(hash) {
    selectPage(hash == "" ? "intro" : hash);
  }, { unescape: ",/" });

  /**
   * Shows the next photo.
   */
  function showNextPhoto() {
    var path = _.pluck(curPageInfoPath.slice(0, curPageInfoPath.length - 1), "id").join("/");
    path += "/" + getNextPhotoId();

    window.location.hash = path;

    return false;
  };

  /**
   * Shows the previous photo.
   */
  function showPreviousPhoto() {
    var path = _.pluck(curPageInfoPath.slice(0, curPageInfoPath.length - 1), "id").join("/");
    path += "/" + getPreviousPhotoId();

    window.location.hash = path;

    return false;
  };

  /**
   * Shows the next gallery.
   */
  function showNextGallery() {
    var nextKey = getNextHashKey(
      curPageInfoPath[0].galleries,
      curGalleryInfo.gallery.id,
      function(key, val) {
        return val.photos !== undefined;
      });
    location.hash = curPageInfoPath[0].id + "/" + nextKey;

    return false;
  };

  /**
   * Shows the gallery the current photo belongs to.
   */
  function showGallery() {
    if (!inPhotos)
      return false;

    var path = _.pluck(curPageInfoPath.slice(0, curPageInfoPath.length - 1), "id").join("/");
    window.location.hash = path;

    return false;
  }

  /**
   * Gets the key before curKey, as found in hash
   */
  var getPreviousHashKey = function(hash, curKey) {
    var lastKey;
    for (var key in hash) {
      if (curKey == key && lastKey != undefined)
        return lastKey;

      lastKey = key;
    }

    return lastKey;
  };

  /**
   * Gets the key after curKey, as found in hash
   */
  var getNextHashKey = function(hash, curKey, cond) {
    var firstKey;
    var returnNext = false;
    cond = cond || function(key, val) {
      return true;
    };

    for (var key in hash) {
      if (returnNext && cond(key, hash[key]))
        return key;

      if (key == curKey)
        returnNext = true;
      if (firstKey == undefined)
        firstKey = key;
    }

    return firstKey;
  };

  /**
   * Gets the identifier of the previous photo in the current gallery
   *
   * This is a function statement so it is available higher up
   */
  var getPreviousPhotoId = function() {
    return getPreviousHashKey(curGalleryInfo.gallery.photos,
      curPageInfoPath[curPageInfoPath.length - 1].id);
  };

  /** Gets the identifier of the next photo in the current gallery */
  var getNextPhotoId = function() {
    return getNextHashKey(curGalleryInfo.gallery.photos,
      curPageInfoPath[curPageInfoPath.length - 1].id);
  };

  // keyboard navigation

  $(document).keydown(function(evt) {
    if (!inPhotos) return true;
    switch (evt.which) {
    case 37:
      showPreviousPhoto();
      return false;
    case 39:
      showNextPhoto();
      return false;
    case 27:
      showGallery();
      return false;
    }

    return true; // default behaviour if we haven't taken over
  });
});
