(function () {
  var hrefString, pageNameWithoutSlash, pageName;
  var mySearchParams = new URLSearchParams(window.location.search);
  var utmCampaign = mySearchParams.get("utm_campaign");
  var utmMedium = mySearchParams.get("utm_medium");
  var utmContent = mySearchParams.get("utm_content");
  var utmSource = mySearchParams.get("utm_source");
  var errorTrackUrl = "https://us-central1-recharge-webhooks.cloudfunctions.net/br-pixel-errors-v2";
  var trackedError = false;
  var referrer = 'noDocumentReferrer';
  var linkSelector = "a[href*='brandramp.com']";
  var brandRampLinks = document.querySelectorAll(linkSelector);
  if (brandRampLinks.length == 0) {
    return;
  }
  var validSourceList = ["facebook", "googleads", "bing", "test-source"]
  var utms = [utmCampaign, utmMedium, utmContent, utmSource];
  if (document.referrer !== '' && document.referrer != location.host) {
    referrer = document.referrer;
  }
  try {
    linkOperations();
    validateUTM();
  } catch (e) {
    trackError(e);
  }
  logger();
  function linkOperations() {
    for (var i = 0; i < brandRampLinks.length; i++) {
      hrefString = brandRampLinks[i].href.toString();
      pageNameWithoutSlash = location.pathname.replace(/^\/|\/$/g, "");
      pageName = pageNameWithoutSlash.replace(/[^A-Za-z0-9]+/gi, '-');
      hrefString = hrefString
        + (hrefString.includes("?") ? "&" : "?")
        + "traffic_source=" + encodeURIComponent(referrer)
        + "&host_name=" + encodeURIComponent(location.host)
        + "&lander=" + encodeURIComponent(location.pathname)
        + "&creative_id=" + pageName
        + (location.search ? ("&" + location.search.substring(1)) : "");
      brandRampLinks[i].href = hrefString;
    }
  }
  function detectBrowser() {
    var userAgent = navigator.userAgent;
    var browserName;
    if (userAgent.match(/chrome|chromium|crios/i)) {
      browserName = "Chrome";
    } else if (userAgent.match(/firefox|fxios/i)) {
      browserName = "Firefox";
    } else if (userAgent.match(/safari/i)) {
      browserName = "Safari";
    } else if (userAgent.match(/opr\//i)) {
      browserName = "Opera";
    } else if (userAgent.match(/edg/i)) {
      browserName = "Edge";
    } else if (userAgent.match(/android/i)) {
      browserName = "Android";
    } else if (userAgent.match(/iphone/i)) {
      browserName = "iPhone";
    } else {
      browserName = "Unknown";
    }
    return browserName;
  } 
  function trackError(error) {
    var dataError = {
      hostname: window.location.href,
      referrer: document.referrer,
      browser: detectBrowser(),
      operating_system: navigator.platform,
      device: window.matchMedia('only screen and (max-width: 768px)').matches ? "mobile" : "desktop",
      utm_source: utmSource,
      utm_campaign: utmCampaign,
      utm_medium: utmMedium,
      utm_content: utmContent,
      stack_info_error: (error && error.stack ? error.stack : "")
    };
    var data = {
      "event": error,
      "timestamp": new Date().getTime() / 1000,
      "data": dataError
    };
    var xhrError = new XMLHttpRequest();
    xhrError.open("POST", errorTrackUrl);
    xhrError.setRequestHeader("Content-Type", "application/json");
    xhrError.send(JSON.stringify(data));
    trackedError = true;
  }
  function validateUTM() {
    const isEmpty = function (param) {
      return param == null && param == "";
    };
    var missingUtms = utms.every(isEmpty);
    if (missingUtms) throw "Missing UTMs";
    var hasValidSource = validSourceList.includes(utmSource);
    if(!hasValidSource) throw "Invalid utm_source: " + utmSource;
  } 
  function logger() {
    var utmCount = ((utmCampaign != null ? 1 : 0) + (utmMedium != null ? 1 : 0) + (utmContent != null ? 1 : 0));
    var linkCount = utmCount > 0 ? brandRampLinks.length : 0;
    console.log("", "====================================== \n",
      "BrandRamp Pixel loaded successfully. \n",
      "Pixel version: v5 \n",
      "Load time: " + (new Date()).toUTCString() + " \n",
      "Links updated: " + linkCount + " \n",
      "UTMs passed: " + utmCount + " \n",
      "UTM source: " + utmSource + "\n",
      "Error logged: " + trackedError + "\n",
      "======================================");
  }
})()
