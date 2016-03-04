"use strict";
(function() {
    var paystationsEndpoint = "http://gisrevprxy.seattle.gov/" +
        "ArcGIS/rest/services/SDOT_EXT/DSG_datasharing/MapServer/54/" +
        "query?f=pjson&where=1%3D1&outfields=*&outSR=4326";
                              
    var outputMap = null;

	window.onload = function() {
		var script = document.createElement("script");
        script.src = "https://maps.googleapis.com/maps/api/js";
        script.async = true;
        script.defer = true;
        script.onload = initMap;
        document.head.appendChild(script);
	};
    
    function initMap() {
        var seattleLatLong = { lat: 47.59978, lng: -122.3346 };
        outputMap = new google.maps.Map(document.getElementById("map"), {
            zoom: 16,
            center: seattleLatLong
        });
        makeCall();
    }
    
    function makeCall() {
        var ajaxRequest = new XMLHttpRequest();
		ajaxRequest.onload = addLocations;
		ajaxRequest.onerror = ajaxFailure;
		ajaxRequest.open("GET", paystationsEndpoint, true);
		ajaxRequest.send();
    }
    
    function addLocations() {
       var response = JSON.parse(this.responseText).features;
       for (var i = 0; i < response.length; i++) {
            var x = response[i].geometry.x;
            var y = response[i].geometry.y;
            var position = {
                lat: y,
                lng: x
            };
            addMarker(position);
       }
    }
    
    function addMarker(pointPosition) {
        var marker = new google.maps.Marker({
            position: pointPosition,
            map: outputMap
        });
    }
    
    function ajaxFailure() {
        alert("oops");
    }
})();