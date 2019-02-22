var tableDataArray = [];

var map;


document.getElementById("generate-flight").addEventListener("click", function () {
    if (prevShape) {
        let bounds = selectedShape.getBounds().getNorthEast();

        new google.maps.Marker({position:bounds, map:map});
        new google.maps.Marker({position:selectedShape.getBounds().getSouthWest(), map:map})

        console.log(bounds);
    }
    
});

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 44.5646, lng: -123.2620},
        zoom: 14
    });


    var polymapData = new Array();
    var heatmapData = new Array();
    addToArrays(polymapData,heatmapData,44.572,-123.237,0.5,0); //(polymap,heatmap, lat, lng, heatmap weight of datapoint, bearing)
    addToArrays(polymapData,heatmapData,44.582,-123.277,0.3,30); //bearing is degrees where North(0), East(90), South(180), West(270)
    addToArrays(polymapData,heatmapData,44.592,-123.227,0.7,110);
    addToArrays(polymapData,heatmapData,44.542,-123.257,3,180);


    //initialize polyline overlay
    var dataPoints = new google.maps.Polyline({
        path: polymapData,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });
    dataPoints.setMap(map);

    //initialize heatmap overlay
    var heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData
    });

    heatmap.set('opacity', heatmap.get('opacity') ? null : 0.5); //opacity 0.5
    heatmap.set('radius', heatmap.get('radius') ? null : 50); //overall radius
    heatmap.setMap(map);
};

function addToArrays(poly,heat,lat,lng,w,b) { //add datapoints to arrays
    poly.push(new google.maps.LatLng(lat, lng)); //general path
    heat.push({location: new google.maps.LatLng(lat, lng), weight: w}); //heatmap data

    //generate bearing line from datapoint, bearing is North(0), East(90), South(180), West(270)
    var lineLength = 0.03; //generalized variable for length of bearing
    var bLat = lat + lineLength *Math.sin((-b + 90) * Math.PI / 180); //y
    var bLng = lng + lineLength *Math.cos((-b + 90) * Math.PI / 180); //x
    var bearingArray = new Array();
    bearingArray.push(new google.maps.LatLng(lat, lng));
    bearingArray.push(new google.maps.LatLng(bLat, bLng));

    var bearingLine = new google.maps.Polyline({ //bearing lines per point
        path: bearingArray,
        geodesic: true,
        strokeColor: '#0000FF',
        strokeOpacity: 1.0,
        strokeWeight: 1
    });
    bearingLine.setMap(map);  //bearing overlay per point
}


function convertData() { //convert html to array
    $("table#cartGrid tr").each(function() { //myTableArray[1][3] // Fourth td of the second tablerow
        var arrayOfThisRow = [];
        var tableData = $(this).find('td');
        if (tableData.length > 0) {
            tableData.each(function() { arrayOfThisRow.push($(this).text()); });
            tableDataArray.push(arrayOfThisRow);
        }
    });
}

//to do: add triangulation method
