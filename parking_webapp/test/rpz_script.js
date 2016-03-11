(function() {
    "use strict";

    var rpzEndpoint = "http://gisrevprxy.seattle.gov/ArcGIS/rest/" +
        "services/SDOT_EXT/PARKING/MapServer/4/query?f=" +
        "pjson&where=1%3D1&outfields=*&outSR=4326";

    var resultOffset = "&resultOffset=";
    var maxResults = "&resultRecordCount=";

    var rpzLines = [];

    onmessage = function(e) {
        getRpzs();
        postMessage(rpzLines);
        rpzLines = null;
    }

    function getRpzs() {
        var max = 3308;
        var offset = 0;
        var recordCount = 1000;
        while (recordCount > 0) {
            var offsetParam = resultOffset + offset;
            var maxRecordsParam = maxResults + max;
            var requestEndpoint = rpzEndpoint + offsetParam + maxRecordsParam;
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
            "path": pathCoords,
            "geodesic": true,
            "strokeOpacity": 1.0,
            "strokeWeight": 2,
            "strokeColor":"#00a661",
            attributes: dataAttributes
        };
        rpzLines.push(spacePath);
    }

})();