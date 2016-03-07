(function () {
    "use strict";

    var icons = {
        PARKING_GARAGE: "assets/map_icons/parkinggarage.png",
        PARKING_METER: "assets/map_icons/parkingmeter.png",
        USER_LOCATION: "assets/map_icons/pin.png"
    }

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
        "query?f=pjson&outSR=4326&returnTrueCurves=true&where=1%3D1" +
        "&outFields=*";

    // var curbSpacePolylines = [];
    var outputMap = null

    window.onload = function () {
        var script = document.createElement("script");
        script.src = "https://maps.googleapis.com/maps/api/js";
        script.async = true;
        script.defer = true;
        script.onload = initMap;
        document.head.appendChild(script);
    };

    function initMap() {
        var seattleLatLong = { lat: 47.59978, lng: -122.3346 };
        outputMap = new google.maps.Map(document.getElementById("map"), {
            zoom: 16,
            center: seattleLatLong
        });
        getCurbspaces();
    }

    function getCurbspaces() {
        var processingScript = "street_parking_json_processor.php/?targetUrl=" + encodeURIComponent(curbSpaceEndpoint);
        var ajaxRequest = new XMLHttpRequest();
        ajaxRequest.onload = test;
        ajaxRequest.onerror = ajaxFailure;
        ajaxRequest.open("GET", processingScript, true);
        ajaxRequest.send();
    }
    
    function test() {
        console.log(JSON.parse(this.responseText));
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
        var spacePath = new google.maps.Polyline({
            path: pathCoords,
            geodesic: true,
            strokeOpacity: 1.0,
            strokeWeight: 4,
            strokeColor: color,
            map: outputMap
        });
    }

    function ajaxFailure() {
        alert("oops!");
    }

})();