"use strict";

(function() {
    var icons = {
        PARKING_ICON: "assets/road_transportation_icons/parkinggarage.png"
    }
    var outputMap = null;
    var parkingGarageEndpoint = "http://gisrevprxy.seattle.gov/" +
        "ArcGIS/rest/services/SDOT_EXT/DSG_datasharing/MapServer/0/" +
        "query?f=pjson&where=1%3D1&outfields=*&outSR=4326";
    var baseGeocodingUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=";
    var currInfoWindow = null;
    
	window.onload = function() {
		var script = document.createElement("script");
        script.src = "https://maps.googleapis.com/maps/api/js";
        script.async = true;
        script.defer = true;
        script.onload = initMap;
        document.head.appendChild(script);
        
        var geocodeAddr = document.getElementById("geocodeAddr");
        geocodeAddr.onclick = geocodeAddress;
	};
    
    function geocodeAddress() {
        var address = document.getElementById("addr").value;
        baseGeocodingUrl += address;
        var ajaxRequest = new XMLHttpRequest();
		ajaxRequest.onload = processLocation;
		ajaxRequest.onerror = ajaxFailure;
		ajaxRequest.open("GET", baseGeocodingUrl, true);
		ajaxRequest.send();
    }
    
    function processLocation() {
        var jsonResponse = JSON.parse(this.responseText);
        var latitude = jsonResponse.results[0].geometry.location.lat;
        var longitude = jsonResponse.results[0].geometry.location.lng;
        var position = {lat: latitude, lng: longitude};
        addMarker(position, "", "");
        outputMap.setCenter(position);
        outputMap.setZoom(18);
    }
    
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
		ajaxRequest.open("GET", parkingGarageEndpoint, true);
		ajaxRequest.send();
    }
    
    function addLocations() {
        var response = JSON.parse(this.responseText).features;
        for (var i = 0; i < response.length; i++) {
            var lotGarage = response[i];
            var lotLat = lotGarage.geometry.y;
            var lotLng = lotGarage.geometry.x;
            var pointPos = {
                lat: lotLat,
                lng: lotLng
            };
            var infowindow = new google.maps.InfoWindow({
                content: buildFlyoutText(lotGarage)
            });
            addMarker(pointPos, infowindow, icons.PARKING_ICON);
        }
    }
    
    function addMarker(pointPosition, flyout, image) {
        var marker = new google.maps.Marker({
            position: pointPosition,
            map: outputMap,
            icon: image
        });
        marker.addListener('click', function() {
            marker.flyout
            flyout.open(outputMap, marker);
            if (currInfoWindow) {
                currInfoWindow.close();
            }
            currInfoWindow = flyout;
        });
    }
    
    function ajaxFailure() {
        alert("oops!");
    }
    
    function buildFlyoutText(facility) {
        var attributes = facility.attributes;
        var content = "<div id=\"content\">";
        var level = 1;
        var heading = "<h" + level + ">";
        var closeHeading = "</h" + level + ">";
        if (attributes.FAC_NAME) {
            content += heading + attributes.FAC_NAME + closeHeading;
            level++;
        }
        if (attributes.DEA_FACILITY_ADDRESS) {
            heading = "<h" + level + ">";
            closeHeading = "</h" + level + ">";
            content += heading + attributes.DEA_FACILITY_ADDRESS + closeHeading;
            level++;
        }
        if (attributes.WEBNAME) {
            heading = "<h" + level + ">";
            closeHeading = "</h" + level + ">";
            content += heading + attributes.WEBNAME + closeHeading;
            level++;
        }
        if (attributes.FAC_TYPE) {
            content += "<p><strong>Lot type</strong>: " + 
                attributes.FAC_TYPE + "</p>";
        }
        if (attributes.OP_WEB) {
            content += "<p><strong>Web Site</strong>: <a href=\"" +
                attributes.OP_WEB + "\">" + attributes.OP_WEB + "</a></p>";
        }
        heading = "<h" + level + ">";
        closeHeading = "</h" + level + ">";
        content += heading + "Occupancy" + closeHeading;
        level++;
        if (attributes.VACANT && attributes.DEA_STALLS) {
            content += "<p>Available Lots: " + attributes.VACANT + 
                " out of " + attributes.DEA_STALLS + 
                " spaces available</p>";
        } else if (attributes.DEA_STALLS) {
            content += "<p>Max Occupancy: " + attributes.DEA_STALLS +
                " spaces</p>";
        }
        content += heading + "Operating Hours" + closeHeading ;
        content += "<ul>";
        
        // TODO: parking hours into array
        if (attributes.HRS_MONFRI) {
            content += "<li>Monday - Friday: " + attributes.HRS_MONFRI + 
                "</li>";
        }
        if (attributes.HRS_SAT) {
            content += "<li>Saturday: " + attributes.HRS_SAT + 
                "</li>";
        }
        if (attributes.HRS_SUN) {
            content += "<li>Sunday: " + attributes.HRS_SUN + 
                "</li>";
        }
        content += "</ul>";
        content += heading + "Parking Rates" + closeHeading ;
        content += "<ul>";
        
        // TODO: parking rates into array
        if (attributes.RTE_1HR) {
            if (attributes.RTE_1HR === "Permit only") {
                content += "<li>One Hour: " + attributes.RTE_1HR + "</li>";
            } else {
                content += "<li>One Hour: $" + attributes.RTE_1HR + "</li>";
            }
        }
        if (attributes.RTE_2HR) {
            if (attributes.RTE_2HR === "Permit only") {
                content += "<li>Two Hours: " + attributes.RTE_2HR + "</li>";
            } else {
                content += "<li>Two Hours: $" + attributes.RTE_2HR + "</li>";
            }
        }
        if (attributes.RTE_3HR) {
            if (attributes.RTE_3HR === "Permit only") {
                content += "<li>Three Hours: " + attributes.RTE_3HR + "</li>";
            } else {
                content += "<li>Three Hours: $" + attributes.RTE_3HR + "</li>";
            }
        }
        if (attributes.RTE_ALLDAY) {
            if (attributes.RTE_ALLDAY === "Permit only") {
                content += "<li>All Day: " + attributes.RTE_ALLDAY + "</li>";
            } else {
                content += "<li>All Day: $" + attributes.RTE_ALLDAY + "</li>";
            }
        }
        content += "</ul>";
        content += "</div>";
        return content;
    }
})();