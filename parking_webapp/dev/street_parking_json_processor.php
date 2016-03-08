<?php
    $url = $_GET["targetUrl"];
    header("Content-type: application/json");
    $resultOffset = "&resultOffset=";
    $maxResults = "&resultRecordCount=";
    $remaining = 50279;
    $offset = 0;
    $maxNum = 1000;
    $jsonString = "";
    $outputData = array();
    $features = array();
   
    
    while ($remaining > 0) {  
        $endpoint = $url.$resultOffset.$offset.$maxResults.$maxNum;
        $jsondata = json_decode(utf8_encode(get_url($endpoint)), true);
        foreach ($jsondata["features"] as $feature) {
            foreach ($feature["geometry"].paths as $vertex) {
            $outData = array(
                "CATEGORY" => $feature["attributes".CATEGORY],
                "GEOMETRY" => array (
                    
                )
            );
            $outputData[] = $outData;
        }
        $remaining -= $maxNum;
        $offset += $maxNum;
    }
    
    print json_encode($outputData);

    function get_url($url) {
        $ch = curl_init();
        
        if($ch === false)
        {
            die('Failed to create curl object');
        }
        
        $timeout = 5;
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
        $data = curl_exec($ch);
        
        curl_close($ch);
        
        return $data;
    }
?>