"use strict";

(function() {
    var outputMap = null;
    var parkingGarageEndpoint = "https://data.seattle.gov/resource/3neb-8edu.json";
    var baseGeocodingUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=";
    
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
            flyout.open(outputMap, marker);
        });
    }
    
    function ajaxFailure() {
        alert("oops!");
    }
    
    function buildFlyoutText(facility) {
        var content = "<div id=\"content\">";
        if (facility.dea_facility_address) {
            content += "<h1>" + facility.dea_facility_address + "</h1>";
        }
        if (facility.webname) {
            content += "<h2>" + facility.webname + "</h2>"
        }
        /*
            <ul>
                <li>Available Lots: 5 out of 10</li>
                <!--
                    If there is a "vacant" property,
                        put Available Lots: "vacant" out of "dea_stalls"
                    Otherwise
                        put Occupancy: "dea_stalls"
                 -->
                 <li>"fac_type"</li>
                 <h3>Hours</h3>
                 <li>HRS_MONFRI</li>
                 <li>HRS_SAT</li>
                 <li>HRS_SUN</li>
                 <h3>Parking Rate</h3>
                 <li>RTE_1HR</li>
                 <li>RTE_2HR</li>
                 <li>RTE_3HR</li>
                 <li>RTE_ALLDAY</li>
            </ul>
		</div>
        */
        return content;
    }
})();