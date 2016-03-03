"use strict";

(function() {
    var outputMap = null;
    var parkingGarageEndpoint = "https://data.seattle.gov/resource/3neb-8edu.json";
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
        addMarker(position);
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
        var response = JSON.parse(this.responseText);
        for (var i = 0; i < response.length; i++) {
            var lotGarage = response[i];
            var lotLat = lotGarage.shape.latitude;
            var lotLng = lotGarage.shape.longitude;
            var pointPos = {
                lat: parseFloat(lotLat),
                lng: parseFloat(lotLng)
            };
            var infowindow = new google.maps.InfoWindow({
                content: buildFlyoutText(lotGarage)
            });
            addMarker(pointPos, infowindow);
        }
    }
    
    function addMarker(pointPosition, flyout) {
        var image = "";
        var marker = new google.maps.Marker({
            position: pointPosition,
            map: outputMap
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
        var content = "<div id=\"content\">";
        var level = 1;
        var heading = "<h" + level + ">";
        var closeHeading = "</h" + level + ">";
        if (facility.fac_name) {
            content += heading + facility.fac_name + closeHeading;
            level++;
        }
        if (facility.dea_facility_address) {
            heading = "<h" + level + ">";
            closeHeading = "</h" + level + ">";
            content += heading + facility.dea_facility_address + closeHeading;
            level++;
        }
        if (facility.webname) {
            heading = "<h" + level + ">";
            closeHeading = "</h" + level + ">";
            content += heading + facility.webname + closeHeading;
            level++;
        }
        if (facility.fac_type) {
            heading = "<h" + level + ">";
            closeHeading = "</h" + level + ">";
            content += heading + "Lot type: " + facility.fac_type + 
                closeHeading;
            level++;
        }
        heading = "<h" + level + ">";
        closeHeading = "</h" + level + ">";
        content += heading + "Occupancy" + closeHeading;
        level++;
        if (facility.vacant) {
            content += "<p>Available Lots: " + facility.vacant + 
                " out of " + facility.dea_stalls + 
                " spaces available</p>";
        } else {
            content += "<p>Max Occupancy: " + facility.dea_stalls +
                " spaces</p>";
        }
        content += heading + "Operating Hours" + closeHeading ;
        content += "<ul>";
        // TODO: parking hours into array
        if (facility.hrs_monfri) {
            content += "<li>Monday - Friday: " + facility.hrs_monfri + 
                "</li>";
        }
        if (facility.hrs_sat) {
            content += "<li>Saturday: " + facility.hrs_sat + 
                "</li>";
        }
        if (facility.hrs_sun) {
            content += "<li>Sunday: " + facility.hrs_sun + 
                "</li>";
        }
        content += "</ul>";
        content += heading + "Parking Rates" + closeHeading ;
        content += "<ul>";
        
        // TODO: parking rates into array
        if (facility.rte_1hr) {
            if (facility.rte_1hr === "Permit only") {
                content += "<li>One Hour: " + facility.rte_1hr + "</li>";
            } else {
                content += "<li>One Hour: $" + facility.rte_1hr + "</li>";
            }
        }
        if (facility.rte_2hr) {
            if (facility.rte_2hr === "Permit only") {
                content += "<li>Two Hours: " + facility.rte_2hr + "</li>";
            } else {
                content += "<li>Two Hours: $" + facility.rte_2hr + "</li>";
            }
        }
        if (facility.rte_3hr) {
            if (facility.rte_3hr === "Permit only") {
                content += "<li>Three Hours: " + facility.rte_3hr + "</li>";
            } else {
                content += "<li>Three Hours: $" + facility.rte_3hr + "</li>";
            }
        }
        if (facility.rte_1allday) {
            if (facility.rte_allday === "Permit only") {
                content += "<li>All Day: " + facility.rte_allday + "</li>";
            } else {
                content += "<li>All Day: $" + facility.rte_allday + "</li>";
            }
        }
        content += "</ul>";
        content += "</div>";
        return content;
    }
})();