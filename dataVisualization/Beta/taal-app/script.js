var tableDataArray = [];

var map;
var heatmap;


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

    //insert data initialization function here via push
    var polymapData = new Array();
    var heatmapData = new Array();
    addToArrays(polymapData,heatmapData,44.572,-123.237,0.5); //(polymap,heatmap, lat, lng, weight of heatmap)
    addToArrays(polymapData,heatmapData,44.582,-123.277,0.3);
    addToArrays(polymapData,heatmapData,44.592,-123.227,0.7);
    addToArrays(polymapData,heatmapData,44.542,-123.257,3);

    

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
    heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData
    });

    heatmap.set('opacity', heatmap.get('opacity') ? null : 0.5); //opacity 0.5
    heatmap.set('radius', heatmap.get('radius') ? null : 50); //overall radius
    heatmap.setMap(map);

    //need to add bearing layer
};

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

function addToArrays(poly,heat,lat,lng,w) { //add datapoints to arrays
    poly.push(new google.maps.LatLng(lat, lng));
    heat.push({location: new google.maps.LatLng(lat, lng), weight: w});
}

