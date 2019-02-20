var fs = require('fs');

var map;
var drawingManager;
var selectedShape = null;
var prevShape = null;
var prevZoom = 0;
var flightPathLines = [];

const flightDiffAmount = .0008;

document.getElementById("rectangle-button").addEventListener("click", function() {

    deletePrevShape();

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

    deletePrevShape();

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

// document.getElementById("generate-flight").addEventListener("click", generateFlightPath);

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 44.5646, lng: -123.2620},
        zoom: 14
    });

    drawingManager = new google.maps.drawing.DrawingManager();

    google.maps.event.addListener(map, 'zoom_changed', function() {
        console.log(map.getZoom());
        
        let zoom = map.getZoom();

        if ((prevZoom == 16 && map.getZoom() == 15)
            || (prevZoom == 15 && map.getZoom() == 16)) {
                recalculateFlightPath();
            }

        prevZoom = zoom;
    })
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
    console.log("polygon complete");
    let newShape = event.overlay;

    drawingManager.setDrawingMode(null);
    drawingManager.setOptions({
        drawingControl: false
    });

    google.maps.event.addListener(newShape, 'click', function() {
        setSelection(newShape);
    });
    google.maps.event.addListener(newShape, 'dragend', recalculateFlightPath);

    selectedShape = newShape;
    prevShape = newShape;
    generateFlightPath();
};

function recalculateFlightPath(event) {
    deleteFlightPath();
    generateFlightPath();
}

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

function deletePrevShape() {
    if (prevShape) {
        prevShape.setMap(null);
        if (flightPathLines.length > 0) {
            deleteFlightPath();
        }
    }
}

function deleteFlightPath() {
    var line;
    for (;flightPathLines.length;) {
        var line = flightPathLines.pop();
        line.setMap(null);
    }
    flightPathLines = [];
}

function calcIterAmount(northWest, southEast) {

    // zoom level >= 17 can see actual flight path
    // zoom level < 17 should see
    if (map.getZoom() > 15) {
        return flightDiffAmount;
    } else {
        var latDiff = Math.abs(northWest.lat - southEast.lat)
        var lngDiff = Math.abs(northWest.lng - southEast.lng)

        var total = (latDiff > lngDiff) ? latDiff : lngDiff;

        if (total < flightDiffAmount ||
            latDiff < total / 10 ||
            lngDiff < total / 10) {
            return null;
        }

        return total / 10;
    }
}

function generateFlightPath() {
    if (prevShape) {
        let northWest = {
            lat: prevShape.getBounds().getNorthEast().lat(),
            lng: prevShape.getBounds().getSouthWest().lng() 
        };
        let southEast = {
            lat: prevShape.getBounds().getSouthWest().lat(),
            lng: prevShape.getBounds().getNorthEast().lng()
        };

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

        for (var i = northWest.lat - diff; i > southEast.lat; i -= diff) {
            if (right) {
                for (var j = northWest.lng + diff; j < southEast.lng; j += diff) {
                    if (prevCoord) {
                        flightPathLines.push(new google.maps.Polyline({
                            path: [prevCoord, {lat: i, lng: j}],
                            icons: [{
                                icon: lineSymbol,
                                offset: '100%'
                            }],
                            map: map,
                            editable: false
                        }));
                    }
                    prevCoord = {lat: i, lng: j};
                }
            }
            else {
                for (var j = southEast.lng - diff; j > northWest.lng; j -= diff) {
                    if (prevCoord) {
                        flightPathLines.push(new google.maps.Polyline({
                            path: [prevCoord, {lat: i, lng: j}],
                            icons: [{
                                icon: lineSymbol,
                                offset: '100%'
                            }],
                            map: map,
                            editable: false
                        }));
                    }
                    prevCoord = {lat: i, lng: j};
                }
            }

            right = !right;
        }
    }

    pathGenerated = true;

    try {
        fs.writeFileSync('flight_planner.txt', "Hello World\n", 'utf-8'); 
    }
    catch(e) {
        alert('Failed to save the file !');
    }
}