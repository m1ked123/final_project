(function() {
	"use strict";

	var payStationsEndpoint = "http://gisrevprxy.seattle.gov/" +
		"ArcGIS/rest/services/SDOT_EXT/DSG_datasharing/MapServer/54/" +
		"query?f=pjson&outfields=*&outSR=4326&returnTrueCurves=true&where=1%3D1";

	var resultOffset = "&resultOffset=";
	var maxResults = "&resultRecordCount=";

	var payStationPoints = [];

	onmessage = function(e) {
		getPayStations();
		postMessage(payStationPoints);
		payStationPoints = null;
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
			ajaxRequest.open("GET", requestEndpoint, false);
			ajaxRequest.send();
			offset += max;
			recordCount -= max;
		}
	}

	function createPayStationsPoints() {
		var response = JSON.parse(this.responseText).features;
		for (var i = 0; i < response.length; i++) {
			var payStation = response[i];
			var payStationPoint = null;
			if (!isNaN(payStation.geometry.y) && !isNaN(payStation.geometry.x)) {
				var pointPos = {
					lat: payStation.geometry.y,
					lng: payStation.geometry.x
				};
				payStationPoint = {
					position: pointPos,
					attributes: payStation.attributes
				}
				payStationPoints.push(payStationPoint);
			}
		}
	}
	
	function ajaxFailure() {
        alert("oops!");
    }

})();