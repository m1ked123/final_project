(function() {
    "use strict";

    var RPZ_ENDPOINT = "http://gisrevprxy.seattle.gov/ArcGIS/rest/" +
        "services/SDOT_EXT/PARKING/MapServer/4/query?";

    var resultOffset = "&resultOffset=";
    var maxResults = "&resultRecordCount=";
    var FORMAT = "&f=pjson";
    var WHERE = "&where=1%3D1";
    var OUTPUT_FIELDS = "&outfields=*";
    var OUTPUT_SPATIAL_REFERENCE = "&outSR=4326";
    var GET_COUNT = "&returnCountOnly=true";
    var GET_GEOMETRY = "&returnGeometry=true";

    var rpzLines = [];
    var assetCount = 0;

    onmessage = function(e) {
        getRpzCount();
        getRpzs();
        postMessage(rpzLines);
        rpzLines = null;
    }

    function getRpzCount() {
        var requestEndpoint = RPZ_ENDPOINT + WHERE + FORMAT + GET_COUNT;
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

    function getRpzs() {
        var max = 1000;
        var offset = 0;
        var recordCount = assetCount;
        while (recordCount > 0) {
            var offsetParam = resultOffset + offset;
            var maxRecordsParam = maxResults + max;
            var requestEndpoint = RPZ_ENDPOINT + offsetParam + maxRecordsParam + WHERE + FORMAT + GET_GEOMETRY + OUTPUT_SPATIAL_REFERENCE + OUTPUT_FIELDS;
            var ajaxRequest = new XMLHttpRequest();
            ajaxRequest.onload = createRpzLines;
            ajaxRequest.onerror = ajaxFailure;
            ajaxRequest.open("GET", requestEndpoint, false);
            ajaxRequest.send();
            offset += max;
            recordCount -= max;
        }
    }

    function createRpzLines() {
        var responseError = JSON.parse(this.responseText).error;
        if (!responseError) {
            var response = JSON.parse(this.responseText, function(k, v) {
                if (k === "paths") {
                    var temp = [];
                    for (var i = 0; i < v.length; i++) {
                        for (var j = 0; j < v[i].length; j++) {
                            temp.push({ lat: v[i][j][1], lng: v[i][j][0] });
                        }
                    }
                    return temp;
                } else {
                    return v;
                }
            });
            response = response.features;

            while (response.length > 0) {
                var rpz = response.pop();
                if (rpz.geometry) {
                    addPath(rpz.geometry.paths, rpz.attributes);
                }
            }
        } else {
            console.log("something went wrong: " + responseError.code);
        }
    }

    function ajaxFailure() {
        alert("oops!");
    }

    function addPath(pathCoords, dataAttributes) {
        var spacePath = {
            path: pathCoords,
            geodesic: true,
            strokeOpacity: 1.0,
            strokeWeight: 2,
            strokeColor: "#00a661",
            attributes: dataAttributes
        };
        rpzLines.push(spacePath);
    }
})();