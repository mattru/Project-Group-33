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
    var heatmapData = new Array();
    heatmapData.push(new google.maps.LatLng(44.572, -123.237)); //example data points, heatmap stays same though
    heatmapData.push(new google.maps.LatLng(44.582, -123.277));
    heatmapData.push(new google.maps.LatLng(44.592, -123.227));
    heatmapData.push(new google.maps.LatLng(44.542, -123.257));
    
    var dataPoints = new google.maps.Polyline({
        path: heatmapData,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
      });

    heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData
    });

    heatmap.setMap(map);
    dataPoints.setMap(map);

    //need to add bearing layer
};

function convertData() { //convert html to array
    $("table#cartGrid tr").each(function() {
        var arrayOfThisRow = [];
        var tableData = $(this).find('td');
        if (tableData.length > 0) {
            tableData.each(function() { arrayOfThisRow.push($(this).text()); });
            tableDataArray.push(arrayOfThisRow);
        }
    });
}

