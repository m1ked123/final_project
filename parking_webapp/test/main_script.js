(function() {
	"use strict";

	var icons = {
		PARKING_GARAGE: "assets/map_icons/parkinggarage.png",
		E_PARKING: "assets/map_icons/parking.png",
		PARKING_METER: "assets/map_icons/parkingmeter.png",
		USER_LOCATION: "assets/map_icons/pin.png",
		PROGRESS_SPINNER: "assets/notification_icons/progress_spinner.gif",
		ERROR: "assets/notification_icons/notice.png",
		PARKING_METER_FREE: "assets/map_icons/parking-meter-free.png",
		PARKING_METER_PAID: "assets/map_icons/parking-meter-paid.png",
		PARKING_METER_NODATA: "assets/map_icons/parking-meter-nodata.png"
	}

	var WEEKDAYS = ["mon", "tues", "wed", "thurs", "fri", 
		"monday", "tuesday", "wednesday", "thursday", "friday"];

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

	var baseGeocodingUrl = "https://maps.googleapis.com/maps/api/" +
		"geocode/json?address=";

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

		var nearbyButton = document.getElementById("searchNearby");
		nearbyButton.onclick = highlightNearby;

		var showPricesButton = document.getElementById("showPrices");
		showPricesButton.onclick = updatePaystationMarkers;

		addTimeIntervals();
	};

	// Release resources when the page unloads.
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

	// Initializes the map and the data  from which the web page is sourced.
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

		addLegend();
	}

	// Updates the pay station markers based on their pay rates at
	// the given day and time that the user defines on the page. The
	// pay stations must be loaded on the map before this can happen.
	function updatePaystationMarkers() {
		if (displayedPayStations.length > 0) {
			var showPricesButton = document.getElementById("showPrices");
			showPricesButton.disabled = true;
			var daysCombobox = document.getElementById("days");
			var timesCombobox = document.getElementById("times");
			var selectedDay = daysCombobox.value;
			var selectedTime = parseInt(timesCombobox.value);
			showSpinner("showPricesSpinner");
			var timer = window.setInterval(function() {
				updatePaystationIcons(timer, selectedDay, selectedTime)
			}, 5);
		} else {
			alert("The pay stations must be loaded on the map before" +
				" we can do that.");
		}
	}

	var index = 0;

	// Updates each of the icons for the pay markers that exist on the
	// map based on the rate for parking at the pay station at the
	// given day and time.
	function updatePaystationIcons(timer, selectedDay, selectedTime) {
		if (displayedPayStations.length > index) {
			var payStation = displayedPayStations[index];
			payStation.marker.setMap(null);
			if (isWeekday(selectedDay)) {
				var weekDayStart1 = payStation.attributes.WKD_START1;
				if (weekDayStart1) {
					weekDayStart1 = minTo24Hrs(weekDayStart1);
				}
				var weekDayEnd1 = payStation.attributes.WKD_END1;
				if (weekDayEnd1) {
					weekDayEnd1 = minTo24Hrs(weekDayEnd1);
				}
				var weekDayStart2 = payStation.attributes.WKD_START2;
				if (weekDayStart2) {
					weekDayStart2 = minTo24Hrs(weekDayStart2);
				}
				var weekDayEnd2 = payStation.attributes.WKD_END2;
				if (weekDayEnd2) {
					weekDayEnd2 = minTo24Hrs(weekDayEnd2);
				}
				var weekDayStart3 = payStation.attributes.WKD_START3;
				if (weekDayStart3) {
					weekDayStart3 = minTo24Hrs(weekDayStart3);
				}
				var weekDayEnd3 = payStation.attributes.WKD_END3;
				if (weekDayEnd3) {
					weekDayEnd3 = minTo24Hrs(weekDayEnd3);
				}
				var weekDayHours = [weekDayStart1, weekDayEnd1, weekDayStart2, weekDayEnd2, weekDayStart3, weekDayEnd3];
				var weekDayRates = [payStation.attributes.WKD_RATE1, payStation.attributes.WKD_RATE2, payStation.attributes.WKD_RATE3];
				var rate = 0;
				var parkingRate = 0;
				if (payStation.attributes.CURRENT_STATUS && payStation.attributes.CURRENT_STATUS === "INSVC") {
					for (var i = 0; i < weekDayHours.length; i += 2) {
						if (weekDayHours[i] && weekDayHours[i + 1] && selectedTime >= weekDayHours[i] && selectedTime < weekDayHours[i + 1]) {
							parkingRate = weekDayRates[rate];
							break;
						}
						rate++;
					}
					if (parkingRate > 0) {
						payStation.marker.icon = icons.PARKING_METER_PAID;
					} else if (parkingRate === 0) {
						payStation.marker.icon = icons.PARKING_METER_FREE;
					}
				} else {
					payStation.marker.icon = icons.PARKING_METER_NODATA;
				}
			} else if (selectedDay.toLowerCase() == "sat") {
				var satStart1 = payStation.attributes.SAT_START1;
				if (satStart1) {
					satStart1 = minTo24Hrs(satStart1);
				}
				var satEnd1 = payStation.attributes.SAT_END1;
				if (satEnd1) {
					satEnd1 = minTo24Hrs(satEnd1);
				}
				var satStart2 = payStation.attributes.SAT_START2;
				if (satStart2) {
					satStart2 = minTo24Hrs(satStart2);
				}
				var satEnd2 = payStation.attributes.SAT_END2;
				if (satEnd2) {
					satEnd2 = minTo24Hrs(satEnd2);
				}
				var satStart3 = payStation.attributes.SAT_START3;
				if (satStart3) {
					satStart3 = minTo24Hrs(satStart3);
				}
				var satEnd3 = payStation.attributes.SAT_END3;
				if (satEnd3) {
					satEnd3 = minTo24Hrs(satEnd3);
				}
				var satHours = [satStart1, satEnd1, satStart2, satEnd2, satStart3, satEnd3];
				var satRates = [payStation.attributes.SAT_RATE1, payStation.attributes.SAT_RATE2, payStation.attributes.SAT_RATE3];
				var rate = 0;
				var parkingRate = 0;
				if (payStation.attributes.CURRENT_STATUS && payStation.attributes.CURRENT_STATUS === "INSVC") {
					for (var i = 0; i < satHours.length; i += 2) {
						if (satHours[i] && satHours[i + 1] && selectedTime > satHours[i] && selectedTime < satHours[i + 1]) {
							parkingRate = satRates[rate];
						}
						rate++;
					}
					if (parkingRate > 0) {
						payStation.marker.icon = icons.PARKING_METER_PAID;
					} else if (parkingRate === 0) {
						payStation.marker.icon = icons.PARKING_METER_FREE;
					}
				} else {
					payStation.marker.icon = icons.PARKING_METER_NODATA;
				}
			} else {
				var sunStart1 = payStation.attributes.SUN_START1;
				if (sunStart1) {
					sunStart1 = minTo24Hrs(sunStart1);
				}
				var sunEnd1 = payStation.attributes.SUN_END1;
				if (sunEnd1) {
					sunEnd1 = minTo24Hrs(sunEnd1);
				}
				var sunStart2 = payStation.attributes.SUN_START2;
				if (sunStart2) {
					sunStart2 = minTo24Hrs(sunStart2);
				}
				var sunEnd2 = payStation.attributes.SUN_END2;
				if (sunEnd2) {
					sunEnd2 = minTo24Hrs(sunEnd2);
				}
				var sunStart3 = payStation.attributes.SUN_START3;
				if (sunStart3) {
					sunStart3 = minTo24Hrs(sunStart3);
				}
				var sunEnd3 = payStation.attributes.SUN_END3;
				if (sunEnd3) {
					sunEnd3 = minTo24Hrs(sunEnd3);
				}
				var sunHours = [sunStart1, sunEnd1, sunStart2, sunEnd2, sunStart3, sunEnd3];
				var sunRates = [payStation.attributes.SUN_RATE1, payStation.attributes.SUN_RATE2, payStation.attributes.SUN_RATE3];
				var rate = 0;
				var parkingRate = 0;
				if (payStation.attributes.CURRENT_STATUS && payStation.attributes.CURRENT_STATUS === "INSVC") {
					for (var i = 0; i < sunHours.length; i += 2) {
						if (sunHours[i] && sunHours[i + 1] && selectedTime > sunHours[i] && selectedTime < sunHours[i + 1]) {
							parkingRate = sunRates[rate];
						}
						rate++;
					}
					if (parkingRate > 0) {
						payStation.marker.icon = icons.PARKING_METER_PAID;
					} else if (parkingRate === 0) {
						payStation.marker.icon = icons.PARKING_METER_FREE;
					}
				} else {
					payStation.marker.icon = icons.PARKING_METER_NODATA;
				}
			}
			payStation.marker.setMap(outputMap);
			index++;
		} else {
			window.clearInterval(timer);
			var showPricesButton = document.getElementById("showPrices");
			showPricesButton.disabled = false;
			hideImage("showPricesSpinner");
			index = 0;
		}
	}

	/****************************************************************
	 * LOCATION SERVICES
	 * 
	 * This is a region of code that is dedicated to functions that
	 * process the user's location of the location that is entered
	 * in the location textbox on tthe webpage.
	 ***************************************************************/

	// Highlights the nearby parking locations that are displayed on
	// the map by drawing a circle around a given location. This
	// location can either be user defined in a textbox or it can be
	// retrieved by geolocation services that are provided by the
	// user's browser.
	function highlightNearby() {
		var userLocationRadioButton = document.getElementById("customAddress");
		var addressRedioButton = document.getElementById("geolocation");
		if (userLocationRadioButton.checked) {
			geocodeAddress();
		} else {
			tryGeolocation();
		}
	}

	// Geocodes the address that is defined in the address textbox 
	// on the main meb page. This function makes an AJAX request to
	// the Google Geocoding Web Service.
	function geocodeAddress() {
		var address = document.getElementById("addr").value;
		var geocodeEndpoint = baseGeocodingUrl + encodeURIComponent(address);
		var ajaxRequest = new XMLHttpRequest();
		ajaxRequest.onload = processLocation;
		ajaxRequest.onerror = ajaxFailure;
		ajaxRequest.open("GET", geocodeEndpoint, true);
		ajaxRequest.send();
	}

	// The callback function for the AJAX request that is used to
	// geocode the location that is entered in the address textbox
	function processLocation() {
		var radius = parseInt(document.getElementById("radius").value);
		var jsonResponse = JSON.parse(this.responseText);
		var latitude = jsonResponse.results[0].geometry.location.lat;
		var longitude = jsonResponse.results[0].geometry.location.lng;
		var position = { lat: latitude, lng: longitude };
		addLocationMarker(position, icons.USER_LOCATION);
		outputMap.setCenter(position);
		outputMap.setZoom(18);
		drawCircle(radius, position);
	}

	// Attempts to get the user's current location by accessing the
	// browser's geolocation services. If these services are not
	// accessible (either because the browser does not support them
	// or the user denies the request) a default location is used.
	function tryGeolocation() {
		var radius = parseFloat(document.getElementById("radius").value);
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				var pos = {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				};

				outputMap.setCenter(pos);
				addLocationMarker(pos, icons.USER_LOCATION);
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

	// Handles the case where the user denys access to his/her
	// geolocation or the browser does not support the functionality
	function handleLocationError(browserHasGeolocation, pos, circleRadius) {
		outputMap.setCenter(pos);
		addLocationMarker(pos, icons.USER_LOCATION);
		if (circleRadius) {
			drawCircle(circleRadius, pos);
		}
		outputMap.setZoom(18);
	}

	// Adds a marker to the main map for the web page centered on
	// the given location with the given icon image. The marker is
	// singleton meaning that there can only ever be one of these
	// on the map at a given time.
	function addLocationMarker(pointPosition, image) {
		if (locationMarker) {
			locationMarker.setPosition(pointPosition);
		} else {
			locationMarker = new google.maps.Marker({
				position: pointPosition,
				icon: image,
				map: outputMap
			});
		}
	}

	// Draws a circle of the given radius in meters around the given
	// position. There can only ever be one of these circles on the 
	// main map for the web page.
	function drawCircle(circRadius, pos) {
		var new_radius = convertToMeters(circRadius);
		if (userLocationCircle) {
			userLocationCircle.setPosition(pos);
			userLocationCircle.setRadius(new_radius);
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

	/****************************************************************
	 * UTILS
	 * 
	 * This region of code contains a number of utility functions
	 * that can be used and reused by most major functions that 
	 * perform less specialized functionality.
	 ***************************************************************/
	
	// Adds the legend to the map.
	function addLegend() {
		var legend = document.createElement("div");
		legend.id = "legend";
		
		var legendHeader = document.createElement("h1");
		legendHeader.innerHTML = "LEGEND";
		legend.appendChild(legendHeader); 

		var eParkDiv = document.createElement("div");
		var eParkingIconImage = document.createElement("img");
		eParkingIconImage.src = icons.E_PARKING;
		eParkDiv.appendChild(eParkingIconImage);
		eParkDiv.innerHTML += "E-Parking Garage/Lot";
		legend.appendChild(eParkDiv);
		
		var garageDiv = document.createElement("div");
		var garageIconImage = document.createElement("img");
		garageIconImage.src = icons.PARKING_GARAGE;
		garageDiv.appendChild(garageIconImage);
		garageDiv.innerHTML += "Parking Garage/Lot";
		legend.appendChild(garageDiv);

		var meterDiv = document.createElement("div");
		var meterHeader = document.createElement("h2");
		meterHeader.innerHTML = "Parking Meters";
		meterDiv.appendChild(meterHeader);

		var meterIconList = document.createElement("ul");

		var meterIconItem = document.createElement("li");
		var defaultMeterIconImage = document.createElement("img");
		var iconLabel = document.createElement("p");
		defaultMeterIconImage.alt = "default meter icon";
		defaultMeterIconImage.src = icons.PARKING_METER;
		iconLabel.appendChild(defaultMeterIconImage);
		iconLabel.innerHTML += "Default Meter";
		meterIconItem.appendChild(iconLabel);
		meterIconList.appendChild(meterIconItem);

		var meterIconItem = document.createElement("li");
		var freeMeterIconImage = document.createElement("img");
		var iconLabel = document.createElement("p");
		freeMeterIconImage.alt = "free meter icon";
		freeMeterIconImage.src = icons.PARKING_METER_FREE;
		iconLabel.appendChild(freeMeterIconImage);
		iconLabel.innerHTML += "Free Parking";
		meterIconItem.appendChild(iconLabel);
		meterIconList.appendChild(meterIconItem);

		var meterIconItem = document.createElement("li");
		var paidMeterIconImage = document.createElement("img");
		var iconLabel = document.createElement("p");
		paidMeterIconImage.alt = "paid meter icon";
		paidMeterIconImage.src = icons.PARKING_METER_PAID;
		iconLabel.appendChild(paidMeterIconImage);
		iconLabel.innerHTML += "Paid Parking";
		meterIconItem.appendChild(iconLabel);
		meterIconList.appendChild(meterIconItem);

		var meterIconItem = document.createElement("li");
		var outsvrMeterIconImage = document.createElement("img");
		var iconLabel = document.createElement("p");
		outsvrMeterIconImage.alt = "out of service meter icon";
		outsvrMeterIconImage.src = icons.PARKING_METER_NODATA;
		iconLabel.appendChild(outsvrMeterIconImage);
		iconLabel.innerHTML += "Meter Out of Service";
		meterIconItem.appendChild(iconLabel);
		meterIconList.appendChild(meterIconItem);

		meterDiv.appendChild(meterIconList);

		legend.appendChild(meterDiv);
		var locDiv = document.createElement("div");
		var userLocIconImage = document.createElement("img");
		userLocIconImage.src = icons.USER_LOCATION;
		locDiv.appendChild(userLocIconImage);
		locDiv.innerHTML += "Target Location";
		legend.appendChild(locDiv);
		
		var legendLocation = google.maps.ControlPosition.RIGHT_TOP;
		outputMap.controls[legendLocation].push(legend);
	}

	// Converts the given number from minutes to 24 hour time format.
	function minTo24Hrs(mins) {
		var min = mins;
		var totalTime = 0;
		totalTime = min % 60;
		min = Math.floor(min / 60);
		totalTime += min % 60 * 100;
		return totalTime;
	}

	// Gets whether or not the given day is a weekday. Returns true
	// if it is, false otherwise.
	function isWeekday(day) {
		for (var i = 0; i < WEEKDAYS.length; i++) {
			if (day.toLowerCase() === WEEKDAYS[i].toLowerCase()) {
				return true;
			}
		}
		return false;
	}

	// Converts the given number from the units in which it is defined
	// to meters.
	function convertToMeters(in_num) {
		var combo_num = document.getElementById("in_unit");
		var in_unit = combo_num.value;
		var meter_out = in_num;
		if (in_unit === units.MILES) {
			meter_out = in_num / conv_fact.mi_to_m;
		}
		if (in_unit === units.FEET) {
			meter_out = in_num / conv_fact.ft_to_m;
		}
		if (in_unit === units.KILOMETERS) {
			meter_out = in_num / conv_fact.km_to_m;
		}
		return meter_out;
	}

	// Adds the given flyout/info window to the given map marker. Also
	// associates the flyout to the marker's click event. Only one
	// info window is allowed to appear on the map at a given time.
	function addFlyout(flyout, marker) {
		marker.addListener('click', function() {
			flyout.open(outputMap, marker);
			if (currInfoWindow) {
				currInfoWindow.close();
			}
			currInfoWindow = flyout;
		});
	}

	// Shows a progress spinner at the given location that is defined
	// by the given DOM id. This id should be for an img object.
	function showSpinner(targetSpinnerId) {
		var spinner = document.getElementById(targetSpinnerId);
		spinner.src = icons.PROGRESS_SPINNER;
	}

	// Shows a notification/error icon at the given location that is
	// defined by the given DOM id. This id should be for an img 
	// object.
	function showError(targetSpinnerId) {
		var spinner = document.getElementById(targetSpinnerId);
		spinner.src = icons.ERROR;
	}


	// Clears the given image element of its connected image source.
	function hideImage(targetId) {
		var imgElement = document.getElementById(targetId);
		imgElement.src = "";
	}

	// A function that handles AJAX failure. This function does not
	// handle AJAX errors very robustly, but it will notify the user
	// that an error occured and what error that was.
	function ajaxFailure() {
		alert("Something went wrong!");
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
				if (e.data.code) {
					alert(e.data.message + ".\ncode: " + e.data.code +
					"\nPlease refresh the page and try again later.");
					showError("lotProgressSpinner");
				} else {
					tempGarages = e.data;
					var garageTimer = window.setInterval(function() {
						constructGarages(garageTimer);
					}, 5);
				}
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
			var garageAsset = {
				marker: garageMarker,
				attributes: currGarage.attributes
			}
			nondisplayedGarages.push(garageAsset);
		} else {
			window.clearInterval(garageTimer);
			var garageLotCheckbox = document.getElementById("parkingGarages");
			if (garageLotCheckbox.checked) {
				garageTimer = window.setInterval(function() {
					addGaragesToMap(garageTimer);
				}, 5);
			} else {
				hideImage("lotProgressSpinner");
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
			garage.marker.setMap(outputMap);
			displayedGarages.push(garage);
		} else {
			hideImage("lotProgressSpinner");
			var garageLotCheckbox = document.getElementById("parkingGarages");
			garageLotCheckbox.disabled = false;
			window.clearInterval(garageTimer);
		}
	}

	function removeGaragesFromMap(garageTimer) {
		if (displayedGarages.length > 0) {
			var garage = displayedGarages.pop();
			garage.marker.setMap(null);
			nondisplayedGarages.push(garage);
		} else {
			hideImage("lotProgressSpinner");
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
				if (e.data.code) {
					alert(e.data.message + ".\ncode: " + e.data.code +
					"\nPlease refresh the page and try again later.");
					showError("payStationProgress");
				} else {
					tempPayStations = e.data;
					var payStationTimer = window.setInterval(function() {
						constructPayStations(payStationTimer);
					}, 5);
				}
				payStationWorker.terminate();
			}
		}
	}

	function constructPayStations(payStationTimer) {
		if (tempPayStations.length > 0) {
			var station = tempPayStations.pop();
			var stationMarker = new google.maps.Marker({
				position: station.position,
				icon: icons.PARKING_METER
			});
			var stationAsset = {
				marker: stationMarker,
				attributes: station.attributes
			}
			var infowindow = new google.maps.InfoWindow({
				content: buildPayStationFlyout(station)
			});
			addFlyout(infowindow, stationMarker);
			nondisplayedPayStations.push(stationAsset);
		} else {
			var payStationCheckbox = document.getElementById("payStations");
			if (payStationCheckbox.checked) {
				payStationTimer = window.setInterval(function() {
					addPayStationsToMap(payStationTimer);
				}, 5);
			} else {
				hideImage("payStationProgress");
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
			station.marker.setMap(outputMap);
			displayedPayStations.push(station);
		} else {
			hideImage("payStationProgress");
			var payStationCheckbox = document.getElementById("payStations");
			payStationCheckbox.disabled = false;
			window.clearInterval(payStationTimer);
		}
	}

	function removePayStationsFromMap(payStationTimer) {
		if (displayedPayStations.length > 0) {
			var station = displayedPayStations.pop();
			station.marker.setMap(null);
			nondisplayedPayStations.push(station);
		} else {
			hideImage("payStationProgress");
			var payStationCheckbox = document.getElementById("payStations");
			payStationCheckbox.disabled = false;
			window.clearInterval(payStationTimer);
		}
	}

	function buildPayStationFlyout(station) {
		var attributes = station.attributes;
		var content = "<div id=\"content\">";
		if (attributes.CURRENT_STATUS && attributes.CURRENT_STATUS === "INSVC") {
			content += "<h1>Hours</h1>";
			if (attributes.START_TIME_WKD || attributes.START_TIME_SAT || attributes.START_TIME_SUN) {
				content += "<ul>";
				if (attributes.START_TIME_WKD && attributes.END_TIME_WKD) {
					content += "<li>Weekday Hours: " + attributes.START_TIME_WKD + " - " + attributes.END_TIME_WKD + "</li>";
				} else {
					content += "<li>Free</li>";
				}
				if (attributes.START_TIME_SAT && attributes.END_TIME_SAT) {
					content += "<li>Saturday Hours: " + attributes.START_TIME_SAT + " - " + attributes.END_TIME_SAT + "</li>";
				} else {
					content += "<li>Free</li>";
				}
				if (attributes.START_TIME_SUN && attributes.END_TIME_SUN) {
					content += "<li>Sunday Hours: " + attributes.START_TIME_SUN + " - " + attributes.END_TIME_SUN + "</li>";
				} else {
					content += "<li>Free</li>";
				}
				content += "</ul>";
			}
			if (attributes.PEAK_HOUR) {
				content += "<h2>Peak Hours</h2>";
				content += "<ul><li>" + attributes.PEAK_HOUR + "</li></ul>";
			}
			content += "<h2>Weekday Rates</h2>";
			content += "<ul>";
			if (attributes.WKD_RATE1 || attributes.WKD_RATE2 || attributes.WKD_RATE3) {

				var tod = "AM"
				if (attributes.WKD_RATE1) {
					var wkdStart1 = Math.ceil(attributes.WKD_START1 / 60);
					var wkdEnd1 = Math.ceil(attributes.WKD_END1 / 60);
					if (wkdStart1 > 12) {
						wkdStart1 = wkdStart1 % 12;
						tod = "PM";
					}
					var startString = wkdStart1 + ":00" + tod;
					tod = "AM";
					if (wkdEnd1 > 12) {
						wkdEnd1 = wkdEnd1 % 12;
						tod = "PM";
					}
					var endString = wkdEnd1 + ":00" + tod;
					content += "<li>Between " + startString + " and " + endString + ": $" + attributes.WKD_RATE1 + "</li>";
				}
				if (attributes.WKD_RATE2) {
					tod = "AM"
					var wkdStart2 = Math.ceil(attributes.WKD_START2 / 60);
					var wkdEnd2 = Math.ceil(attributes.WKD_END2 / 60);
					if (wkdStart2 > 12) {
						wkdStart2 = wkdStart2 % 12;
						tod = "PM";
					}
					var startString = wkdStart2 + ":00" + tod;
					tod = "AM";
					if (wkdEnd2 > 12) {
						wkdEnd2 = wkdEnd2 % 12;
						tod = "PM";
					}
					var endString = wkdEnd2 + ":00" + tod;
					content += "<li>Between " + startString + " and " + endString + ": $" + attributes.WKD_RATE2 + "</li>";
				}
				if (attributes.WKD_RATE3) {
					tod = "AM"
					var wkdStart3 = Math.ceil(attributes.WKD_START3 / 60);
					var wkdEnd3 = Math.ceil(attributes.WKD_END3 / 60);
					if (wkdStart3 > 12) {
						wkdStart3 = wkdStart3 % 12;
						tod = "PM";
					}
					var startString = wkdStart3 + ":00" + tod;

					tod = "AM";
					if (wkdEnd3 > 12) {
						wkdEnd3 = wkdEnd3 % 12;
						tod = "PM";
					}
					var endString = wkdEnd3 + ":00" + tod;

					content += "<li>Between " + startString + " and " + endString + ": $" + attributes.WKD_RATE3 + "</li>";
				}
			} else {
				content += "<li>Parking is free all day!</li>";
			}
			content += "</ul>";
			content += "<h2>Saturday Rates</h2>";
			content += "<ul>";
			if (attributes.SAT_RATE1 || attributes.SAT_RATE2 || attributes.SAT_RATE3) {

				var tod = "AM"
				if (attributes.SAT_RATE1) {
					var satStart1 = Math.ceil(attributes.SAT_START1 / 60);
					var satEnd1 = Math.ceil(attributes.SAT_END1 / 60);
					if (satStart1 > 12) {
						satStart1 = satStart1 % 12;
						tod = "PM";
					}
					var startString = satStart1 + ":00" + tod;
					tod = "AM";
					if (wkdEnd1 > 12) {
						satEnd1 = satEnd1 % 12;
						tod = "PM";
					}
					var endString = satEnd1 + ":00" + tod;
					content += "<li>Between " + startString + " and " + endString + ": $" + attributes.SAT_RATE1 + "</li>";
				}
				if (attributes.SAT_RATE2) {
					tod = "AM"
					var satStart2 = Math.ceil(attributes.SAT_START2 / 60);
					var satEnd2 = Math.ceil(attributes.SAT_END2 / 60);
					if (satStart2 > 12) {
						satStart2 = satStart2 % 12;
						tod = "PM";
					}
					var startString = satStart2 + ":00" + tod;
					tod = "AM";
					if (satEnd2 > 12) {
						satEnd2 = satEnd2 % 12;
						tod = "PM";
					}
					var endString = satEnd2 + ":00" + tod;
					content += "<li>Between " + startString + " and " + endString + ": $" + attributes.SAT_RATE2 + "</li>";
				}
				if (attributes.SAT_RATE3) {
					tod = "AM"
					var satStart3 = Math.ceil(attributes.SAT_START3 / 60);
					var satEnd3 = Math.ceil(attributes.SAT_END3 / 60);
					if (satStart3 > 12) {
						satStart3 = satStart3 % 12;
						tod = "PM";
					}
					var startString = satStart3 + ":00" + tod;

					tod = "AM";
					if (satEnd3 > 12) {
						satEnd3 = satEnd3 % 12;
						tod = "PM";
					}
					var endString = satEnd3 + ":00" + tod;

					content += "<li>Between " + startString + " and " + endString + ": $" + attributes.SAT_RATE3 + "</li>";
				}
			} else {
				content += "<li>Parking is free all day!</li>";
			}
			content += "</ul>";
			content += "<h2>Sunday Rates</h2>";
			content += "<ul>";
			if (attributes.SUN_RATE1 || attributes.SUN_RATE2 || attributes.SUN_RATE3) {
				var tod = "AM"
				if (attributes.SUN_RATE1) {
					var satStart1 = Math.ceil(attributes.SAT_START1 / 60);
					var satEnd1 = Math.ceil(attributes.SAT_END1 / 60);
					if (satStart1 > 12) {
						satStart1 = satStart1 % 12;
						tod = "PM";
					}
					var startString = satStart1 + ":00" + tod;
					tod = "AM";
					if (wkdEnd1 > 12) {
						satEnd1 = satEnd1 % 12;
						tod = "PM";
					}
					var endString = satEnd1 + ":00" + tod;
					content += "<li>Between " + startString + " and " + endString + ": $" + attributes.SAT_RATE1 + "</li>";
				}
				if (attributes.SUN_RATE2) {
					tod = "AM"
					var satStart2 = Math.ceil(attributes.SAT_START2 / 60);
					var satEnd2 = Math.ceil(attributes.SAT_END2 / 60);
					if (satStart2 > 12) {
						satStart2 = satStart2 % 12;
						tod = "PM";
					}
					var startString = satStart2 + ":00" + tod;
					tod = "AM";
					if (satEnd2 > 12) {
						satEnd2 = satEnd2 % 12;
						tod = "PM";
					}
					var endString = satEnd2 + ":00" + tod;
					content += "<li>Between " + startString + " and " + endString + ": $" + attributes.SAT_RATE2 + "</li>";
				}
				if (attributes.SUN_RATE3) {
					tod = "AM"
					var satStart3 = Math.ceil(attributes.SAT_START3 / 60);
					var satEnd3 = Math.ceil(attributes.SAT_END3 / 60);
					if (satStart3 > 12) {
						satStart3 = satStart3 % 12;
						tod = "PM";
					}
					var startString = satStart3 + ":00" + tod;

					tod = "AM";
					if (satEnd3 > 12) {
						satEnd3 = satEnd3 % 12;
						tod = "PM";
					}
					var endString = satEnd3 + ":00" + tod;

					content += "<li>Between " + startString + " and " + endString + ": $" + attributes.SAT_RATE3 + "</li>";
				}
			} else {
				content += "<li>Parking is free all day!</li>";
			}
			content += "</ul>";
		} else {
			content += "<h1>Meter Currently Out of Service</h1>";
		}
		content += "</div>";
		return content;
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
				if (e.data.code) {
					alert(e.data.message + ".\ncode: " + e.data.code +
					"\nPlease refresh the page and try again later.");
					showError("rpzProgressSpinner");
				} else {
					tempRpzs = e.data;
					var rpzTimer = window.setInterval(function() {
						constructRpzs(rpzTimer);
					}, 5);
				}
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
				hideImage("rpzProgressSpinner");
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
			hideImage("rpzProgressSpinner");
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
			hideImage("rpzProgressSpinner");
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
				if (e.data.code) {
					alert(e.data.message + ".\ncode: " + e.data.code +
					"\nPlease refresh the page and try again later.");
					showError("curbProgressSpinner");
				} else {
					tempCurbspaces = e.data;
					var curbspaceTimer = window.setInterval(function() {
						constructCubspaces(curbspaceTimer);
					}, 5);
				}
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
				hideImage("curbProgressSpinner");
			}
		}
	}

	function addCurbspacesToMap(curbspaceTimer) {
		if (nondisplayedCurbspaces.length > 0) {
			var curbspace = nondisplayedCurbspaces.pop();
			curbspace.setMap(outputMap);
			displayedCurbspaces.push(curbspace);
		} else {
			hideImage("curbProgressSpinner");
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
			hideImage("curbProgressSpinner");
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

	/****************************************************************
	 * DYNAMIC BROWSER FUNCTIONS
	 * 
	 * This area defines functions that manipulalte DOM objects that
	 * exist on the web page. 
	 ***************************************************************/

	// Opens or closes the informational footer that appears at the
	// bottom of the web page.
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

	// Shows the sidebar overlay when the page is in "mobile" view
	function showMenu() {
		document.getElementById("sidebar").style.width = "100%";
	}

	// Hides the sidebar overlay when the page is in "mobile" view
	function closeMenu() {
		document.getElementById("sidebar").style.width = "";
	}

	// Adds the time options to the web page by creating new options
	// that represent time intervals that are 15 minutes a part
	// starting at 12:00 AM and ending at 11:45 PM.
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
})();