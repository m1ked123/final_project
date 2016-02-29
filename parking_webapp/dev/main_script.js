"use strict";
(function() {
    // var dataEndpoint = "https://data.seattle.gov/resource/3neb-8edu.json";
    var dataEndpoint = "https://data.seattle.gov/resource/erv6-k5zv.json";
	window.onload = function() {
		var button = document.getElementById("callEndpoint");
        button.onclick = makeCall;
	};
    
    function makeCall() {
        var ajaxRequest = new XMLHttpRequest();
		ajaxRequest.onload = outputResponse;
		ajaxRequest.onerror = ajaxFailure;
		ajaxRequest.open("GET", dataEndpoint, true);
		ajaxRequest.send();
    }
    
    function outputResponse() {
        var outputArea = document.getElementById("output");
        outputArea.innerHTML = "";
        var code = document.createElement("pre");
        code.innerHTML = this.responseText;
        outputArea.appendChild(code);
    }
    
    function ajaxFailure() { 
        alert("oops!");
    }
})();