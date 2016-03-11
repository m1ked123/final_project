(function() {
	"use strict";

	var icons = {
		PARKING_GARAGE: "assets/map_icons/parkinggarage.png",
		PARKING_METER: "assets/map_icons/parkingmeter.png",
		USER_LOCATION: "assets/map_icons/pin.png"
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

	var parkingGarageEndpoint = "http://gisrevprxy.seattle.gov/" +
		"ArcGIS/rest/services/SDOT_EXT/DSG_datasharing/MapServer/0/" +
		"query?f=pjson&where=1%3D1&outfields=*&outSR=4326";

	var payStationsEndpoint = "http://gisrevprxy.seattle.gov/" +
		"ArcGIS/rest/services/SDOT_EXT/DSG_datasharing/MapServer/54/" +
		"query?f=pjson&outfields=*&outSR=4326&where=1%3D1";

	var baseGeocodingUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=";

	var resultOffset = "&resultOffset=";
	var maxResults = "&resultRecordCount=";

	var currInfoWindow = null;
	var parkingGaragePoints = [];
	var curbSpacePolylines = [];
	var payStationPoints = [];

	var locationMarker = null;

	var userLocationCircle = null;

	var tempPolylines = [];

	var index = 0;
	var timer = null;

	window.onload = function() {
		var script = document.createElement("script");
		script.src = "https://maps.googleapis.com/maps/api/js";
		script.async = true;
		script.defer = true;
		script.onload = initMap;
		document.head.appendChild(script);

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

		var streetParkingCheckbox = document.getElementById("streetParking");
		streetParkingCheckbox.disabled = true;

		var garageLotCheckbox = document.getElementById("parkingGarages");
		garageLotCheckbox.onchange = toggleParkingGarages;

		var payStationCheckbox = document.getElementById("payStations");
		payStationCheckbox.onchange = togglePayStations;

		var testButton = document.getElementById("test");
		testButton.onclick = loadCurbspaces;

		var timerTestButton = document.getElementById("timerTest");
		timerTestButton.onclick = testTimer;
	};

	window.onunload = function() {
		outputMap = null;
		currInfoWindow = null;
		locationMarker = null;
		userLocationCircle = null;
		parkingGaragePoints = [];
		curbSpacePolylines = [];
		payStationPoints = [];
		icons = null;
		units = null;
		conv_fact = null;
	}

	var num = 0;
	function testTimer() {
		console.log(num);
		var timer = window.setInterval(runTest, 10);
		if (num == 100000) {
			window.clearInterval(timer);
			console.log("done");
			console.log(num);
		}
	}


	function runTest() {
		if (num % 1000 === 0) {
			console.log(num);
		}
		num++;
	}

	function loadCurbspaces() {
		if (window.Worker) {
			var curbspaceWorker = new Worker("curbspace_script.js");
			showSpinner("curbProgressSpinner");
			curbspaceWorker.postMessage("go");
			curbspaceWorker.onmessage = function(e) {
				tempPolylines = e.data;
				timer = window.setInterval(constructPolylines, 300);
				curbspaceWorker.terminate();
			}
		}
	}

	function constructPolylines() {
		if (index == tempPolylines.length) {
			window.clearInterval(timer);
			tempPolylines = [];
			var streetParkingCheckbox = document.getElementById("streetParking");
			streetParkingCheckbox.disabled = false;
			streetParkingCheckbox.onchange = toggleStreetParking;
			if (streetParkingCheckbox.checked) {
				timer = window.setInterval(addPolylinesToMap, 300);
			} else {
				hideSpinner("curbProgressSpinner");
			}
		} else {
			var start = index;
			index += 1000;
			for (var i = start; i < index; i++) {
				if (i < tempPolylines.length) {
					var spacePath = new google.maps.Polyline({
						path: tempPolylines[i].path,
						geodesic: tempPolylines[i].geodesic,
						strokeOpacity: tempPolylines[i].strokeOpacity,
						strokeWeight: tempPolylines[i].strokeWeight,
						strokeColor: tempPolylines[i].strokeColor
					});
					curbSpacePolylines.push(spacePath);
				} else {
					index = 0;
					window.clearInterval(timer);
					tempPolylines = [];
					var streetParkingCheckbox = document.getElementById("streetParking");
					streetParkingCheckbox.disabled = false;
					streetParkingCheckbox.onchange = toggleStreetParking;
					if (streetParkingCheckbox.checked) {
						timer = window.setInterval(addPolylinesToMap, 300);
					} else {
						hideSpinner("curbProgressSpinner");
					}
					break;
				}
			}
		}
	}

	function showSpinner(targetSpinnerId) {
		var spinner = document.getElementById(targetSpinnerId);
		spinner.src = "assets/progress_spinner.gif";
	}

	function hideSpinner(targetSpinnerId) {
		var spinner = document.getElementById(targetSpinnerId);
		spinner.src = "";
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

	function initMap() {
		var seattleLatLong = { lat: 47.59978, lng: -122.3346 };
		outputMap = new google.maps.Map(document.getElementById("map"), {
			zoom: 16,
			center: seattleLatLong
		});
		// getCurbspaces();
		getGarageLocations();
		//getPayStations();
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

	function addPolylinesToMap() {
		if (index == curbSpacePolylines.length) {
			hideSpinner("curbProgressSpinner");
			console.log("done");
			window.clearInterval(timer);
		} else {
			var start = index;
			index += 1000;
			for (var i = start; i < index; i++) {
				if (i < curbSpacePolylines.length) {
					curbSpacePolylines[i].setMap(outputMap);
				} else {
					hideSpinner("curbProgressSpinner");
					index = 0;
					window.clearInterval(timer);
					break;
				}
			}
		}
	}

	function removePolylinesFromMap() {
		if (index == curbSpacePolylines.length) {
			hideSpinner("curbProgressSpinner");
			window.clearInterval(timer);
		} else {
			var start = index;
			index += 1000;
			for (var i = start; i < index; i++) {
				if (i < curbSpacePolylines.length) {
					curbSpacePolylines[i].setMap(null);
				} else {
					hideSpinner("curbProgressSpinner");
					index = 0;
					window.clearInterval(timer);
					break;
				}
			}
		}
	}

	function toggleStreetParking() {
		if (this.checked) {
			showSpinner("curbProgressSpinner");
			timer = window.setInterval(addPolylinesToMap, 300);
		} else {
			showSpinner("curbProgressSpinner");
			timer = window.setInterval(removePolylinesFromMap, 300);
		}
	}

	function togglePayStations() {
		if (this.checked) {

			addAssetsToMap(payStationPoints);
		} else {
			removeAssetsFromMap(payStationPoints);
		}
	}

	function toggleParkingGarages() {
		if (this.checked) {
			addAssetsToMap(parkingGaragePoints);
		} else {
			removeAssetsFromMap(parkingGaragePoints);
		}
	}

	function getPayStations() {
		var max = 1000;
		var offset = 0;
		var recordCount = 1997;
		while (recordCount > 0) {
			var offsetParam = resultOffset + offset;
			var maxRecordsParam = maxResults + max;
			var requestEndpoint = payStationsEndpoint + offsetParam + maxRecordsParam;
			var ajaxRequest = new XMLHttpRequest();
			ajaxRequest.onload = createPayStationsPoints;
			ajaxRequest.onerror = ajaxFailure;
			ajaxRequest.open("GET", requestEndpoint, true);
			ajaxRequest.send();
			offset += max;
			recordCount -= max;
		}
	}

	function createPayStationsPoints() {
		var response = JSON.parse(this.responseText).features;
		for (var i = 0; i < response.length; i++) {
			var payStation = response[i];
			var stationLat = payStation.geometry.y;
			var stationLng = payStation.geometry.x;
			if (!isNaN(stationLat) && !isNaN(stationLng)) {
				var pointPos = {
					lat: stationLat,
					lng: stationLng
				};

				addMarker(pointPos, null, icons.PARKING_METER, payStationPoints);
			}
		}

		var payStationCheckbox = document.getElementById("payStations");

		if (payStationCheckbox.checked) {
			addAssetsToMap(payStationPoints);
		}

	}

	function ajaxFailure() {
		alert("oops!");
	}

	function getGarageLocations() {
		var ajaxRequest = new XMLHttpRequest();
		ajaxRequest.onload = createParkingGaragePoints;
		ajaxRequest.onerror = ajaxFailure;
		ajaxRequest.open("GET", parkingGarageEndpoint, true);
		ajaxRequest.send();
	}

	function createParkingGaragePoints() {
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
				content: buildParkingGarageFlyout(lotGarage)
			});
			addMarker(pointPos, infowindow, icons.PARKING_GARAGE, parkingGaragePoints);
		}

		var garageLotCheckbox = document.getElementById("parkingGarages");

		if (garageLotCheckbox.checked) {
			addAssetsToMap(parkingGaragePoints);
		}

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
})();