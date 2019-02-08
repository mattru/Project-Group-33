var fs = require('fs');

var map;
var drawingManager;
var selectedShape = null;
var prevShape = null;

document.getElementById("rectangle-button").addEventListener("click", function() {

    clearPrev();

    drawingManager.setOptions({
        drawingMode : google.maps.drawing.OverlayType.RECTANGLE,
        drawingControl : true,
        drawingControlOptions : {
            position : google.maps.ControlPosition.TOP_CENTER,
            drawingModes : [ google.maps.drawing.OverlayType.RECTANGLE ]
        },

    });

    drawingManager.setMap(map);
});

document.getElementById("circle-button").addEventListener("click", function() {

    clearPrev();

    drawingManager.setOptions({
        drawingMode : google.maps.drawing.OverlayType.CIRCLE,
        drawingControl : true,
        drawingControlOptions : {
            position : google.maps.ControlPosition.TOP_CENTER,
            drawingModes : [ google.maps.drawing.OverlayType.CIRCLE ]
        }
    });

    drawingManager.setMap(map);
});

document.getElementById("generate-flight").addEventListener("click", function () {
    if (prevShape) {
        let northWest = {
            lat: prevShape.getBounds().getNorthEast().lat(),
            lng: prevShape.getBounds().getSouthWest().lng() 
        };
        let southEast = {
            lat: prevShape.getBounds().getSouthWest().lat(),
            lng: prevShape.getBounds().getNorthEast().lng()
        };

        new google.maps.Marker({position:northWest, map:map});
        new google.maps.Marker({position:southEast, map:map})

        console.log("North West Lat: " + northWest.lat);
        console.log("North West Long: " + northWest.lng);

        console.log("South East Lat: " + southEast.lat);
        console.log("South East Long: " + southEast.lng);

        var right = true;
        var prevCoord = null;

        var diff = calcIterAmount(northWest, southEast); 
        if (diff == null) {
            alert("Survey area is too small! Please select a larger area.");
            return;
        }

        var lineSymbol = {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
        };

        for (var i = northWest.lat - (diff / 2); i > southEast.lat; i -= diff) {
            console.log(i);
            if (right) {
                for (var j = northWest.lng + (diff / 2); j < southEast.lng; j += diff) {
                    if (prevCoord) {
                        var line = new google.maps.Polyline({
                        path: [prevCoord, {lat: i, lng: j}],
                        icons: [{
                            icon: lineSymbol,
                            offset: '100%'
                        }],
                        map: map
                        });
                    }
                    console.log(j);
                    prevCoord = {lat: i, lng: j};
                    // new google.maps.Marker({position: prevCoord, map:map})
                }
            }
            else {
                for (var j = southEast.lng - (diff / 2); j > northWest.lng; j -= diff) {
                    if (prevCoord) {
                        var line = new google.maps.Polyline({
                        path: [prevCoord, {lat: i, lng: j}],
                        icons: [{
                            icon: lineSymbol,
                            offset: '100%'
                        }],
                        map: map
                        });
                    }
                    console.log(j);
                    prevCoord = {lat: i, lng: j};
                    // new google.maps.Marker({position: prevCoord, map:map})
                }
            }

            right = !right;
        }
    }

    



    try {
        fs.writeFileSync('flight_planner.txt', "Hello World\n", 'utf-8'); 
    }
    catch(e) {
        alert('Failed to save the file !');
    }
    
});

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 44.5646, lng: -123.2620},
        zoom: 14
    });

    drawingManager = new google.maps.drawing.DrawingManager();

    google.maps.event.addListener(drawingManager, 'overlaycomplete', completePolygon);
    google.maps.event.addListener(map, 'click', clearSelection);

    drawingManager.setOptions({
        drawingMode : google.maps.drawing.OverlayType.RECTANGLE,
        drawingControl : true,
        drawingControlOptions : {
            position : google.maps.ControlPosition.TOP_CENTER,
            drawingModes : [ google.maps.drawing.OverlayType.RECTANGLE ]
        },
        polygonOptions : {
            strokeColor : '#6c6c6c',
            strokeWeight : 3.5,
            fillColor : '#926239',
            fillOpacity : 0.6,
            editable: true,
            draggable: true
        }
    });

};

function completePolygon(event) {
    let newShape = event.overlay;

    drawingManager.setDrawingMode(null);
    drawingManager.setOptions({
        drawingControl: false
    });

    google.maps.event.addListener(newShape, 'click', function() {
        setSelection(newShape);
    });

    selectedShape = newShape;
    prevShape = newShape;
};

function setSelection(newShape) {
    console.log("Set Selection");
    clearSelection();
    newShape.setEditable(true);
    newShape.setDraggable(true);
    selectedShape = newShape;
}

function clearSelection() {
    if (selectedShape){
        selectedShape.setEditable(false);
        selectedShape.setDraggable(false);
        selectedShape = null;
    }

}

function clearPrev() {
    if (prevShape) {
        prevShape.setMap(null);
    }
}

function calcIterAmount(northWest, southEast) {
    var latDiff = Math.abs(northWest.lat - southEast.lat)
    var lngDiff = Math.abs(northWest.lng - southEast.lng)

    var total = (latDiff > lngDiff) ? latDiff : lngDiff;

    if (total < .0008 ||
        latDiff < total / 10 ||
        lngDiff < total / 10) {
        return null;
    }

    return total / 10;
}


