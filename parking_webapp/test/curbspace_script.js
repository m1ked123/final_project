(function() {
    "use strict";

    var colors = {
        TIME_LIMITED: "#4c5cd9",
        PAID: "#00a884",
        UNRESTRICTED: "#b2b2b2",
        CAR_SHARE: "#005ce6",
        BIKE: "#8400a8",
        BUS: "#a87000",
        DISABLED: "#e600a9",
        GOVERNMENT: "#000000",
        LOAD: "#e69800",
        RESTRICTED: "#e6e600",
        NO_PARKING: "#ff0000"
    }

    var curbSpaceEndpoint = "http://gisrevprxy.seattle.gov/" +
        "ArcGIS/rest/services/SDOT_EXT/DSG_datasharing/MapServer/27/" +
        "query?f=pjson&outfields=*&outSR=4326&returnTrueCurves=true&where=1%3D1";

    var resultOffset = "&resultOffset=";
    var maxResults = "&resultRecordCount=";

    var curbSpacePolylines = [];

    onmessage = function(e) {
        getCurbspaces();
        postMessage(curbSpacePolylines);
        curbSpacePolylines = null;
    }

    function getCurbspaces() {
        var max = 1000;
        var offset = 0;
        var recordCount = 50279;
        while (recordCount > 0) {
            var offsetParam = resultOffset + offset;
            var maxRecordsParam = maxResults + max;
            var requestEndpoint = curbSpaceEndpoint + offsetParam + maxRecordsParam;
            var ajaxRequest = new XMLHttpRequest();
            ajaxRequest.onload = createCurbSpacePolylines;
            ajaxRequest.onerror = ajaxFailure;
            ajaxRequest.open("GET", requestEndpoint, false);
            ajaxRequest.send();
            offset += max;
            recordCount -= max;
        }
    }

    function createCurbSpacePolylines() {
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
                var curbSpace = response.pop();
                var category = curbSpace.attributes.CATEGORY;
                var curbSpacePath = curbSpace.geometry.paths;
                addPath(curbSpacePath, category);
            }
        } else {
            console.log("something went wrong: " + responseError.code);
        }
    }

    function addPath(pathCoords, cat) {
        var color = colors.NO_PARKING;
        if (cat === "TL") {
            color = colors.TIME_LIMITED;
        } else if (cat === "PAID") {
            color = colors.PAID;
        } else if (cat === "UNR") {
            color = colors.UNRESTRICTED;
        } else if (cat === "CS" || cat === "CARPOOL") {
            color = colors.CAR_SHARE;
        } else if (cat === "BIKE") {
            color = colors.BIKE;
        } else if (cat === "BUS") {
            color = colors.BUS;
        } else if (cat === "DP") {
            color = colors.DISABLED;
        } else if (cat === "GOVT") {
            color = colors.GOVERNMENT;
        } else if (cat === "ZONE" || cat === "LOAD") {
            color = colors.LOAD;
        } else if (cat === "RPZ") {
            color = colors.RESTRICTED;
        }
        var spacePath = {
            "path": pathCoords,
            "geodesic": true,
            "strokeOpacity": 1.0,
            "strokeWeight": 2,
            "strokeColor": color
        };
        curbSpacePolylines.push(spacePath);
    }

    function ajaxFailure() {
        alert("oops!");
    }
})();