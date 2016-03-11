(function() {
    "use strict";

    var icons = {
        PARKING_GARAGE: "assets/map_icons/parkinggarage.png",
        E_PARKING: "assets/map_icons/parking.png",
        PARKING_METER: "assets/map_icons/parkingmeter.png",
        USER_LOCATION: "assets/map_icons/pin.png",
        PROGRESS_SPINNER: "assets/progress_spinner.gif"
    }

    var units = {
        MILES: "miles",
        FEET: "feet",
        KILOMETERS: "kilometers"
    }

    var conv_fact = {
        mi_to_m: 0.000621371,
        ft_to_m: 3.2808,
        km_to_m: .001
    }

    var outputMap = null;

    var baseGeocodingUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=";

    var currInfoWindow = null;
    var locationMarker = null;
    var userLocationCircle = null;

    var tempGarages = [];
    var nondisplayedGarages = [];
    var displayedGarages = [];

    var tempPayStations = [];
    var nondisplayedPayStations = [];
    var displayedPayStations = [];

    var tempRpzs = [];
    var nondisplayedRpzs = [];
    var displayedRpzs = [];

    var tempCurbspaces = [];
    var nondisplayedCurbspaces = [];
    var displayedCurbspaces = [];

    window.onload = function() {
        var script = document.createElement("script");
        script.src = "https://maps.googleapis.com/maps/api/js";
        script.async = true;
        script.defer = true;
        script.onload = initMap;
        document.head.appendChild(script);

        var garageLotCheckbox = document.getElementById("parkingGarages");
        garageLotCheckbox.disabled = true;
        garageLotCheckbox.onclick = toggleParkingGarages;

        var payStationCheckbox = document.getElementById("payStations");
        payStationCheckbox.disabled = true;
        payStationCheckbox.onclick = togglePayStations;

        var rpzCheckbox = document.getElementById("rpzs");
        rpzCheckbox.disabled = true;
        rpzCheckbox.onclick = toggleRpzs;

        var curbspaceCheckbox = document.getElementById("streetParking");
        curbspaceCheckbox.disabled = true;
        curbspaceCheckbox.onclick = toggleCurbspaces;

        var infoButton = document.getElementById("expandButton");
        infoButton.onclick = showInfo;

        var menuButton = document.getElementById("menuButton");
        menuButton.onclick = showMenu;

        var closeButton = document.getElementById("closeButton");
        closeButton.onclick = closeMenu;

        var geocodeAddr = document.getElementById("geocodeAddr");
        geocodeAddr.onclick = geocodeAddress;

        var findMeButton = document.getElementById("geolocation");
        findMeButton.onclick = tryGeolocation;

        addTimeIntervals();
    };

    function addTimeIntervals() {
        var timeOptions = document.getElementById("times");
        var currentTime = 12;
        var hour = 0;
        var time = 0;
        var tod = "AM";
        for (var i = 0; i < 24; i++) {
            if (i >= 12) {
                tod = "PM";
            }
            for (var j = 0; j < 4; j++) {
                var option = document.createElement("option");
                var mins = (15 * j);
                time = hour + mins;
                option.innerHTML = currentTime + ":" + mins;
                if (mins === 0) {
                    option.innerHTML += "0 ";
                }
                option.innerHTML += tod;
                option.value = time;
                timeOptions.appendChild(option);
            }
            hour = (i + 1) * 100;
            if (currentTime === 12) {
                currentTime = 0;
            }
            currentTime += 1;
        }
    }

    window.onunload = function() {
        outputMap = null;
        currInfoWindow = null;
        locationMarker = null;
        userLocationCircle = null;
        icons = null;
        units = null;
        conv_fact = null;

        tempGarages = null;
        nondisplayedGarages = null;
        displayedGarages = null;

        tempPayStations = null;
        nondisplayedPayStations = null;
        displayedPayStations = null;

        tempRpzs = null;
        nondisplayedRpzs = null;
        displayedRpzs = null;

        tempCurbspaces = null;
        nondisplayedCurbspaces = null;
        displayedCurbspaces = null;

    }

    function initMap() {
        var seattleLatLong = { lat: 47.59978, lng: -122.3346 };
        outputMap = new google.maps.Map(document.getElementById("map"), {
            zoom: 16,
            center: seattleLatLong
        });
        loadParkingGarages();
        loadPayStations();
        loadRpzs();
        loadCurbspaces();
    }

    function converter(in_num) {
        var combo_num = document.getElementById("in_unit");
        var in_unit = combo_num.value;
        var meter_out = in_num;
        alert(in_unit);
        if (in_unit === units.MILES) {
            meter_out = in_num / conv_fact.mi_to_m;
        }
        if (in_unit === units.FEET) {
            meter_out = in_num / conv_fact.ft_to_m;
        }
        if (in_unit === units.KILOMETERS) {
            meter_out = in_num / conv_fact.km_to_m;
        }
        alert(meter_out);
        return meter_out;
    }


    function addFlyout(flyout, marker) {
        marker.addListener('click', function() {
            flyout.open(outputMap, marker);
            if (currInfoWindow) {
                currInfoWindow.close();
            }
            currInfoWindow = flyout;
        });
    }

    function showSpinner(targetSpinnerId) {
        var spinner = document.getElementById(targetSpinnerId);
        spinner.src = icons.PROGRESS_SPINNER;
    }

    function hideSpinner(targetSpinnerId) {
        var spinner = document.getElementById(targetSpinnerId);
        spinner.src = "";
    }

    function showInfo() {
        if (this.classList.contains("open")) {
            document.getElementById("infoFooter").style.height = "100%";
            document.getElementById("aboutText").style.visibility = "visible";
            document.getElementById("infoFooter").style.backgroundColor = "rgba(0,0,0,.9)";
            this.classList.remove("open");
            this.classList.add("close");
        } else {
            document.getElementById("infoFooter").style.height = "";
            document.getElementById("aboutText").style.visibility = "";
            document.getElementById("infoFooter").style.backgroundColor = "";
            this.classList.remove("close");
            this.classList.add("open");
        }
    }

    function showMenu() {
        document.getElementById("sidebar").style.width = "100%";
    }

    function closeMenu() {
        document.getElementById("sidebar").style.width = "";
    }


    function tryGeolocation() {
        var radius = parseFloat(document.getElementById("radius").value);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                outputMap.setCenter(pos);
                addMarker(pos, null, icons.USER_LOCATION, null);
                if (radius) {
                    drawCircle(radius, pos);
                }
                outputMap.setZoom(18);
            }, function() {
                handleLocationError(true, outputMap.getCenter(), radius);
            });
        } else {
            handleLocationError(false, outputMap.getCenter(), radius);
        };
    }

    function handleLocationError(browserHasGeolocation, pos, circleRadius) {
        outputMap.setCenter(pos);
        addMarker(pos, null, icons.USER_LOCATION, null);
        if (circleRadius) {
            drawCircle(circleRadius, pos);
        }
        outputMap.setZoom(18);
    }

    function drawCircle(circRadius, pos) {
        var new_radius = converter(circRadius);
        if (userLocationCircle) {
            userLocationCircle.setMap(null);
        }
        userLocationCircle = new google.maps.Circle({
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#FF0000",
            fillOpacity: 0.35,
            map: outputMap,
            center: pos,
            radius: new_radius
        });
    }

    function geocodeAddress() {
        var address = document.getElementById("addr").value;
        var geocodeEndpoint = baseGeocodingUrl + address;
        var ajaxRequest = new XMLHttpRequest();
        ajaxRequest.onload = processLocation;
        ajaxRequest.onerror = ajaxFailure;
        ajaxRequest.open("GET", geocodeEndpoint, true);
        ajaxRequest.send();
    }

    function processLocation() {
        var radius = parseInt(document.getElementById("radius").value);
        var jsonResponse = JSON.parse(this.responseText);
        var latitude = jsonResponse.results[0].geometry.location.lat;
        var longitude = jsonResponse.results[0].geometry.location.lng;
        var position = { lat: latitude, lng: longitude };
        addMarker(position, null, icons.USER_LOCATION, null);
        outputMap.setCenter(position);
        outputMap.setZoom(18);
        drawCircle(radius, position);
    }

    function addAssetsToMap(assetList) {
        for (var i = 0; i < assetList.length; i++) {
            assetList[i].setMap(outputMap);
        }
    }

    function removeAssetsFromMap(assetList) {
        for (var i = 0; i < assetList.length; i++) {
            assetList[i].setMap(null);
        }
        if (currInfoWindow) {
            currInfoWindow.close();
            currInfoWindow = null;
        }
    }

    function ajaxFailure() {
        alert("oops!");
    }

    function addMarker(pointPosition, flyout, image, markerList) {
        var marker = new google.maps.Marker({
            position: pointPosition,
            icon: image
        });

        if (markerList) {
            markerList.push(marker);
        } else {
            if (locationMarker) {
                locationMarker.setMap(null);
            }
            locationMarker = marker;
            locationMarker.setMap(outputMap);
        }

        if (flyout) {
            marker.addListener('click', function() {
                marker.flyout
                flyout.open(outputMap, marker);
                if (currInfoWindow) {
                    currInfoWindow.close();
                }
                currInfoWindow = flyout;
            });
        }
    }

	/****************************************************************
	 * PARKING GARAGES AND PARKING LOTS
	 * 
	 * This region of code contains all functions that are
	 * responsible for loading and managing data for locations of
	 * parking garages in the City of Seattle.
	 ***************************************************************/
    function loadParkingGarages() {
        if (window.Worker) {
            var garageWorker = new Worker("garages_script.js");
            showSpinner("lotProgressSpinner");
            garageWorker.postMessage("go");
            garageWorker.onmessage = function(e) {
                tempGarages = e.data;
                var garageTimer = window.setInterval(function() {
                    constructGarages(garageTimer);
                }, 5);
                garageWorker.terminate();
            }
        }
    }

    function constructGarages(garageTimer) {
        if (tempGarages.length > 0) {
            var currGarage = tempGarages.pop();
            var markerIcon = icons.PARKING_GARAGE;
            if (currGarage.attributes.VACANT) {
                markerIcon = icons.E_PARKING;
            }
            var infowindow = new google.maps.InfoWindow({
                content: buildParkingGarageFlyout(currGarage)
            });
            var garageMarker = new google.maps.Marker({
                position: currGarage.position,
                icon: markerIcon
            });
            addFlyout(infowindow, garageMarker);
            nondisplayedGarages.push(garageMarker);
        } else {
            window.clearInterval(garageTimer);
            var garageLotCheckbox = document.getElementById("parkingGarages");
            if (garageLotCheckbox.checked) {
                garageTimer = window.setInterval(function() {
                    addGaragesToMap(garageTimer);
                }, 5);
            } else {
                hideSpinner("lotProgressSpinner");
                garageLotCheckbox.disabled = false;
            }
        }
    }

    function toggleParkingGarages() {
        if (this.checked) {
            this.disabled = true;
            showSpinner("lotProgressSpinner");
            var garageMarkerTimer = window.setInterval(function() {
                addGaragesToMap(garageMarkerTimer);
            }, 5);

        } else {
            this.disabled = true;
            showSpinner("lotProgressSpinner");
            var garageMarkerTimer = window.setInterval(function() {
                removeGaragesFromMap(garageMarkerTimer);
            }, 5);
        }
    }

    function addGaragesToMap(garageTimer) {
        if (nondisplayedGarages.length > 0) {
            var garage = nondisplayedGarages.pop();
            garage.setMap(outputMap);
            displayedGarages.push(garage);
        } else {
            hideSpinner("lotProgressSpinner");
            var garageLotCheckbox = document.getElementById("parkingGarages");
            garageLotCheckbox.disabled = false;
            window.clearInterval(garageTimer);
        }
    }

    function removeGaragesFromMap(garageTimer) {
        if (displayedGarages.length > 0) {
            var garage = displayedGarages.pop();
            garage.setMap(null);
            nondisplayedGarages.push(garage);
        } else {
            hideSpinner("lotProgressSpinner");
            var garageLotCheckbox = document.getElementById("parkingGarages");
            garageLotCheckbox.disabled = false;
            window.clearInterval(garageTimer);
        }
    }

    function buildParkingGarageFlyout(facility) {
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
                " space(s) available</p>";
        } else if (attributes.DEA_STALLS) {
            content += "<p>Max Occupancy: " + attributes.DEA_STALLS +
                " space(s)</p>";
        }
        if (attributes.DISABLED) {
            content += "<p>Disabled Lots: " + attributes.DISABLED +
                " space(s)</p>";
        }

        if (attributes.HRS_MONFRI || attributes.HRS_SAT || attributes.HRS_SUN) {
            content += heading + "Operating Hours" + closeHeading;
            content += "<ul>";
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
        }

        if (attributes.RTE_1HR || attributes.RTE_2HR || attributes.RTE_3HR || attributes.RTE_ALLDAY) {
            content += heading + "Parking Rates" + closeHeading;
            content += "<ul>";
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
        }
        content += "</div>";
        return content;
    }

	/****************************************************************
	 * PARKING PAY STATIONS
	 * 
	 * This region of code contains all functions that are
	 * responsible for loading and managing data for the locations
	 * of parking pay stations in the City of Seattle.
	 ***************************************************************/
    function loadPayStations() {
        if (window.Worker) {
            var payStationWorker = new Worker("paystations_script.js");
            showSpinner("payStationProgress");
            payStationWorker.postMessage("go");
            payStationWorker.onmessage = function(e) {
                tempPayStations = e.data;
                var payStationTimer = window.setInterval(function() {
                    constructPayStations(payStationTimer);
                }, 5);
                payStationWorker.terminate();
            }
        }
    }

    function constructPayStations(payStationTimer) {
        if (tempPayStations.length > 0) {
            var stationMarker = new google.maps.Marker({
                position: tempPayStations.pop().position,
                icon: icons.PARKING_METER
            });
            nondisplayedPayStations.push(stationMarker);
        } else {
            var payStationCheckbox = document.getElementById("payStations");
            if (payStationCheckbox.checked) {
                payStationTimer = window.setInterval(function() {
                    addPayStationsToMap(payStationTimer);
                }, 5);
            } else {
                hideSpinner("payStationProgress");
                payStationCheckbox.disabled = false;
            }
        }
    }

    function togglePayStations() {
        if (this.checked) {
            showSpinner("payStationProgress");
            this.disabled = true;
            var payStationTimer = window.setInterval(function() {
                addPayStationsToMap(payStationTimer);
            }, 5);
        } else {
            showSpinner("payStationProgress");
            this.disabled = true;
            var payStationTimer = window.setInterval(function() {
                removePayStationsFromMap(payStationTimer);
            }, 5);
        }
    }

    function addPayStationsToMap(payStationTimer) {
        if (nondisplayedPayStations.length > 0) {
            var station = nondisplayedPayStations.pop();
            station.setMap(outputMap);
            displayedPayStations.push(station);
        } else {
            hideSpinner("payStationProgress");
            var payStationCheckbox = document.getElementById("payStations");
            payStationCheckbox.disabled = false;
            window.clearInterval(payStationTimer);
        }
    }

    function removePayStationsFromMap(payStationTimer) {
        if (displayedPayStations.length > 0) {
            var station = displayedPayStations.pop();
            station.setMap(null);
            nondisplayedPayStations.push(station);
        } else {
            hideSpinner("payStationProgress");
            var payStationCheckbox = document.getElementById("payStations");
            payStationCheckbox.disabled = false;
            window.clearInterval(payStationTimer);
        }
    }


	/***************************************************************
	* RESTRICTED PARKING ZONES (RPZs)
	* 
	* This region of code contains all functions that are
	* responsible for loading and managing data for the locations
	* of restricted parking zones in the City of Seattle.
	***************************************************************/
    function loadRpzs() {
        if (window.Worker) {
            var rpzWorker = new Worker("rpz_script.js");
            showSpinner("rpzProgressSpinner");
            rpzWorker.postMessage("go");
            rpzWorker.onmessage = function(e) {
                tempRpzs = e.data;
                var rpzTimer = window.setInterval(function() {
                    constructRpzs(rpzTimer);
                }, 5);
                rpzWorker.terminate();
            }
        }
    }

    function constructRpzs(rpzTimer) {
        if (tempRpzs.length > 0) {
            var rpzPath = tempRpzs.pop();
            var rpzPolyline = new google.maps.Polyline({
                path: rpzPath.path,
                geodesic: rpzPath.geodesic,
                strokeOpacity: rpzPath.strokeOpacity,
                strokeWeight: rpzPath.strokeWeight,
                strokeColor: rpzPath.strokeColor
            });
            nondisplayedRpzs.push(rpzPolyline);
        } else {
            var rpzCheckbox = document.getElementById("rpzs");
            if (rpzCheckbox.checked) {
                rpzTimer = window.setInterval(function() {
                    addRpzsToMap(rpzTimer);
                }, 5);
            } else {
                rpzCheckbox.disabled = false;
                hideSpinner("rpzProgressSpinner");
            }
        }
    }

    function toggleRpzs() {
        if (this.checked) {
            this.disabled = true;
            showSpinner("rpzProgressSpinner");
            var rpzTimer = window.setInterval(function() {
                addRpzsToMap(rpzTimer);
            }, 5);
        } else {
            this.disabled = true;
            showSpinner("rpzProgressSpinner");
            var rpzTimer = window.setInterval(function() {
                removeRpzsFromMap(rpzTimer);
            }, 5);
        }
    }

    function addRpzsToMap(rpzTimer) {
        if (nondisplayedRpzs.length > 0) {
            var rpz = nondisplayedRpzs.pop();
            rpz.setMap(outputMap);
            displayedRpzs.push(rpz);
        } else {
            var rpzCheckbox = document.getElementById("rpzs");
            rpzCheckbox.disabled = false;
            hideSpinner("rpzProgressSpinner");
            window.clearInterval(rpzTimer);
        }
    }

    function removeRpzsFromMap(rpzTimer) {
        if (displayedRpzs.length > 0) {
            var rpz = displayedRpzs.pop();
            rpz.setMap(null);
            nondisplayedRpzs.push(rpz);
        } else {
            var rpzCheckbox = document.getElementById("rpzs");
            rpzCheckbox.disabled = false;
            hideSpinner("rpzProgressSpinner");
            window.clearInterval(rpzTimer);
        }
    }

	/***************************************************************
	 * CURBSPACES
	 * 
	 * This region of code contains all functions that are
	 * responsible for loading and managing data for categories of
	 * different curbspaces in the City of Seattle.
	 ***************************************************************/
    function loadCurbspaces() {
        if (window.Worker) {
            var curbspaceWorker = new Worker("curbspace_script.js");
            showSpinner("curbProgressSpinner");
            curbspaceWorker.postMessage("go");
            curbspaceWorker.onmessage = function(e) {
                tempCurbspaces = e.data;
                var curbspaceTimer = window.setInterval(function() {
                    constructCubspaces(curbspaceTimer);
                }, 5);
                curbspaceWorker.terminate();
            }
        }
    }

    function constructCubspaces(curbspaceTimer) {
        if (tempCurbspaces.length > 0) {
            var curbspace = tempCurbspaces.pop();
            var spacePath = new google.maps.Polyline({
                path: curbspace.path,
                geodesic: curbspace.geodesic,
                strokeOpacity: curbspace.strokeOpacity,
                strokeWeight: curbspace.strokeWeight,
                strokeColor: curbspace.strokeColor
            });
            nondisplayedCurbspaces.push(spacePath);
        } else {
            var curbspaceCheckbox = document.getElementById("streetParking");
            if (curbspaceCheckbox.checked) {
                curbspaceTimer = window.setInterval(function() {
                    addCurbspacesToMap(curbspaceTimer);
                }, 5);
            } else {
                curbspaceCheckbox.disabled = false;
                hideSpinner("curbProgressSpinner");
            }
        }
    }

    function addCurbspacesToMap(curbspaceTimer) {
        if (nondisplayedCurbspaces.length > 0) {
            var curbspace = nondisplayedCurbspaces.pop();
            curbspace.setMap(outputMap);
            displayedCurbspaces.push(curbspace);
        } else {
            hideSpinner("curbProgressSpinner");
            var curbspaceCheckbox = document.getElementById("streetParking");
            curbspaceCheckbox.disabled = false;
            window.clearInterval(curbspaceTimer);
        }
    }

    function removePolylinesFromMap(curbspaceTimer) {
        if (displayedCurbspaces.length > 0) {
            var curbspace = displayedCurbspaces.pop();
            curbspace.setMap(null);
            nondisplayedCurbspaces.push(curbspace);
        } else {
            hideSpinner("curbProgressSpinner");
            var curbspaceCheckbox = document.getElementById("streetParking");
            curbspaceCheckbox.disabled = false;
            window.clearInterval(curbspaceTimer);
        }
    }

    function toggleCurbspaces() {
        if (this.checked) {
            this.disabled = true;
            showSpinner("curbProgressSpinner");
            var curbspaceTimer = window.setInterval(function() {
                addCurbspacesToMap(curbspaceTimer);
            }, 5);
        } else {
            this.disabled = true;
            showSpinner("curbProgressSpinner");
            var curbspaceTimer = window.setInterval(function() {
                removePolylinesFromMap(curbspaceTimer);
            }, 5);
        }
    }
})();