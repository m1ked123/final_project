(function() {
    "use strict";
    window.onload = function() {
        initMap();
    };

    function initMap() {
        require([
            "esri/map",
            "esri/layers/FeatureLayer",
            "dojo/domReady!"
        ],
            function(
                Map,
                FeatureLayer
            ) {

                var map = new Map(document.getElementById("map"), {
                    basemap: "topo",
                    center: [-122.3346, 47.59978],
                    minScale: 5000
                });
                var featureLayer = new FeatureLayer("http://gisrevprxy.seattle.gov/ArcGIS/rest/services/SDOT_EXT/DSG_datasharing/MapServer/54");
                map.addLayer(featureLayer);
            });

    }
})();