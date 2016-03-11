(function() {
    "use strict";

    var PAY_STATIONS_ENDPOINT = "http://gisrevprxy.seattle.gov/" +
        "ArcGIS/rest/services/SDOT_EXT/DSG_datasharing/MapServer/54/" +
        "query?";

    var FORMAT = "&f=pjson";
    var WHERE = "&where=1%3D1";
    var OUTPUT_FIELDS = "&outfields=*";
    var OUTPUT_SPATIAL_REFERENCE = "&outSR=4326";
    var GET_COUNT = "&returnCountOnly=true";
    var GET_GEOMETRY = "&returnGeometry=true";

    var resultOffset = "&resultOffset=";
    var maxResults = "&resultRecordCount=";
    var assetCount = 0;
    var payStationPoints = [];

    onmessage = function(e) {
        getPayStationCount();
        getPayStations();
        postMessage(payStationPoints);
        payStationPoints = null;
    }

    function getPayStationCount() {
        var requestEndpoint = PAY_STATIONS_ENDPOINT + WHERE + FORMAT + GET_COUNT;
        var ajaxRequest = new XMLHttpRequest();
        ajaxRequest.onload = storeCount;
        ajaxRequest.onerror = ajaxFailure;
        ajaxRequest.open("GET", requestEndpoint, false);
        ajaxRequest.send();
    }

    function storeCount() {
        var count = JSON.parse(this.responseText).count;
        if (count) {
            assetCount = count;
        }
    }

    function getPayStations() {
        var max = 1000;
        var offset = 0;
        var recordCount = assetCount;
        while (recordCount > 0) {
            var offsetParam = resultOffset + offset;
            var maxRecordsParam = maxResults + max;
            var requestEndpoint = PAY_STATIONS_ENDPOINT + offsetParam + maxRecordsParam + WHERE + FORMAT + GET_GEOMETRY + OUTPUT_SPATIAL_REFERENCE + OUTPUT_FIELDS;
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
            if (!isNaN(payStation.geometry.y) && !isNaN(payStation.geometry.x)) {
                var pointPos = {
                    lat: payStation.geometry.y,
                    lng: payStation.geometry.x
                };
                var payStationPoint = {
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