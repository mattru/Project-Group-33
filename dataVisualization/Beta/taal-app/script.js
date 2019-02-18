var tableDataArray = [];
var heatMapData = [];

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

    //insert data initialization function here
    heatmapData = [ //example data points
        {location: new google.maps.LatLng(44.782, -123.447), weight: 0.5},
        new google.maps.LatLng(44.782, -123.445),
        {location: new google.maps.LatLng(44.782, -123.443), weight: 2},
        {location: new google.maps.LatLng(44.782, -123.441), weight: 3},
        {location: new google.maps.LatLng(44.782, -123.439), weight: 2},
        new google.maps.LatLng(44.782, -123.437),
        {location: new google.maps.LatLng(44.782, -123.435), weight: 0.5},
      
        {location: new google.maps.LatLng(44.785, -123.447), weight: 3},
        {location: new google.maps.LatLng(44.785, -123.445), weight: 2},
        new google.maps.LatLng(44.785, -123.443),
        {location: new google.maps.LatLng(44.785, -123.441), weight: 0.5},
        new google.maps.LatLng(44.785, -123.439),
        {location: new google.maps.LatLng(44.785, -123.437), weight: 2},
        {location: new google.maps.LatLng(44.785, -123.435), weight: 3}
    ];
    
    heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData
    });

    heatmap.setMap(map);
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

