(function() {
    "use strict";

    var PARKING_GARAGE_ENDPOINT = "http://gisrevprxy.seattle.gov/" +
        "ArcGIS/rest/services/SDOT_EXT/DSG_datasharing/MapServer/0/" +
        "query?";

    var FORMAT = "&f=pjson";
    var WHERE = "&where=1%3D1";
    var OUTPUT_FIELDS = "&outfields=*";
    var OUTPUT_SPATIAL_REFERENCE = "&outSR=4326";
    var GET_COUNT = "&returnCountOnly=true";
    var GET_GEOMETRY = "&returnGeometry=true";

    var assetCount = 0;

    var parkingGaragePoints = [];

    onmessage = function(e) {
        getGarageLocations();
        getAssetCount();
        postMessage(parkingGaragePoints);
        parkingGaragePoints = null;
    }

    function getAssetCount() {
        var ajaxRequest = new XMLHttpRequest();
        var requestEndpoint = PARKING_GARAGE_ENDPOINT + FORMAT + WHERE + GET_COUNT;
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

    function getGarageLocations() {
        var ajaxRequest = new XMLHttpRequest();
        var requestEndpoint = PARKING_GARAGE_ENDPOINT + FORMAT + WHERE + OUTPUT_FIELDS + OUTPUT_SPATIAL_REFERENCE + GET_GEOMETRY;
        ajaxRequest.onload = createParkingGaragePoints;
        ajaxRequest.onerror = ajaxFailure;
        ajaxRequest.open("GET", requestEndpoint, false);
        ajaxRequest.send();
    }

    function createParkingGaragePoints() {
        var responseError = JSON.parse(this.responseText).error;
        if (!responseError) {
            var response = JSON.parse(this.responseText).features;
            for (var i = 0; i < response.length; i++) {
                var lotGarage = response[i];
                var pointPos = {
                    lat: lotGarage.geometry.y,
                    lng: lotGarage.geometry.x
                };
                var garageLot = {
                    position: pointPos,
                    attributes: lotGarage.attributes
                }
                parkingGaragePoints.push(garageLot);
            }
        } else {
            var errorCode = null;
            var errorMessage = null;
            if (responseError.code) {
                errorCode = responseError.code;
                errorMessage = responseError.message;
            } else {
                errorCode = responseError;
                errorMessage = "Something went wrong!";
            }
            postMessage({
                error: true,
                message: errorMessage,
                code: errorCode
            });
        }
    }

    function ajaxFailure() {
        console.log("oops!");
    }

})();