var fs = require('fs');

var map;
var drawingManager;
var selectedShape = null;
var mapShape = null;
var shapeDiff = null;
var prevZoom = 0;
var flightMap = new Map;
var testMarker = null;

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

document.getElementById("download-flight").addEventListener("click", function() {
    flightPath = flightMap.get(flightDiffAmount);
    if (flightPath == undefined) {
        flightPath = generateFlightPath(16, null)
    }

    let middlePath = flightPath[Math.round(flightPath.length / 2)];
    let testMarkerLat = middlePath.getPath().getArray()[0].lat();
    let testMarkerLng = middlePath.getPath().getArray()[0].lng();

    testMarker = new google.maps.Marker({
        position: {lat: testMarkerLat, lng: testMarkerLng},
        map: map,
        title: 'Test marker for triangulation'
    });

    // save path to local storage so it can be accessed in Track page
    localStorage.setItem("flightPath", JSON.stringify(flightPath));
    localStorage.setItem("middlePath", JSON.stringify(middlePath));

    try {
        // TODO: Write to file
        // fs.writeFileSync('flight_planner.txt', flightPath[i], 'utf-8');
    }
    catch(e) {
        alert('Failed to save file: ', e);
    }

});

// initMap initializes the Google Map, as well as event handlers
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 44.5646, lng: -123.2620},
        zoom: 14
    });

    drawingManager = new google.maps.drawing.DrawingManager();

    google.maps.event.addListener(map, 'zoom_changed', function() {

        let zoom = map.getZoom();

        if ((prevZoom == 16 && map.getZoom() == 15)
            || (prevZoom == 15 && map.getZoom() == 16)) {
                diff = calcIterAmount(prevZoom);
                unsetFlightPath(diff);
                shapeDiff = calcIterAmount(map.getZoom());
                generateFlightPath(zoom, map);
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

// completePolygon handles when a polygon has finished being drawn
// on the map
function completePolygon(event) {
    let newShape = event.overlay;

    drawingManager.setDrawingMode(null);
    drawingManager.setOptions({
        drawingControl: false
    });

    google.maps.event.addListener(newShape, 'click', function() {
        setSelection(newShape);
    });
    // google.maps.event.addListener(newShape, 'dragend', function() {
    //     unsetFlightPath(map.getZoom());
    //     flightMap.clear();
    //     generateFlightPath(map.getZoom(), map);
    // });
    google.maps.event.addListener(newShape, 'bounds_changed', function() {
        console.log("bound changed");
        unsetFlightPath(shapeDiff, function() {
            shapeDiff = calcIterAmount(map.getZoom());
            flightMap.clear();
            generateFlightPath(map.getZoom(), map);
        });
    });

    mapShape = newShape;
    selectedShape = newShape;
    shapeDiff = calcIterAmount(map.getZoom());
    generateFlightPath(map.getZoom(), map);
};

// setSelection sets the current shape as selected
function setSelection(newShape) {
    clearSelection();
    newShape.setEditable(true);
    newShape.setDraggable(true);
    selectedShape = newShape;
}

// clearSelection clears the selected shape
function clearSelection() {
    if (selectedShape){
        selectedShape.setEditable(false);
        selectedShape.setDraggable(false);
        selectedShape = null;
    }
}

// deletePrevShape deletes the previous shape and all
// of the associated flight path data
function deletePrevShape() {
    if (mapShape) {
        mapShape.setMap(null);
        diff = calcIterAmount(map.getZoom());
        unsetFlightPath(diff);
    }
    flightMap.clear();
}

// unsetFlightPath clears a flightPath from the map
// so it is no longer visible
function unsetFlightPath(diff, callback) {
    if (testMarker) {
        testMarker.setMap(null);
    }

    let flightPath = flightMap.get(diff)
    if (flightPath == undefined) {
        console.log("flight path not found")
        return;
    }
    for (let i = 0; i < flightPath.length ; i++) {
        flightPath[i].setMap(null);
    }

    if (callback != null) {
        callback();
    }
}

// setFlightPath adds a flightPath as visible on the map
function setFlightPath(flightPath) {
    for (let i = 0; i < flightPath.length; i++) {
        flightPath[i].setMap(map);
    }
}

// calcIterAmount calculates what difference between flight
// path coordinates should be used when generating.
// Is affected by zoom level
function calcIterAmount(zoom) {

    let northWest = {
        lat: mapShape.getBounds().getNorthEast().lat(),
        lng: mapShape.getBounds().getSouthWest().lng()
    };
    let southEast = {
        lat: mapShape.getBounds().getSouthWest().lat(),
        lng: mapShape.getBounds().getNorthEast().lng()
    };

    // zoom level >= 16 can see actual flight path
    // zoom level < 16 should see
    if (zoom > 15) {
        return flightDiffAmount;
    } else {
        let latDiff = Math.abs(northWest.lat - southEast.lat)
        let lngDiff = Math.abs(northWest.lng - southEast.lng)

        let total = (latDiff > lngDiff) ? latDiff : lngDiff;

        if (total / 10 < flightDiffAmount) {
            return flightDiffAmount
        } else if (latDiff < total / 10 || lngDiff < total / 10) {
            return null;
        }

        return total / 10;
    }
}

// generateFlightPath takes a zoom context and generates a flight
// path onto a given context and for a certain zoom level
function generateFlightPath(zoom, context) {
    if (mapShape) {
        let northWest = {
            lat: mapShape.getBounds().getNorthEast().lat(),
            lng: mapShape.getBounds().getSouthWest().lng()
        };
        let southEast = {
            lat: mapShape.getBounds().getSouthWest().lat(),
            lng: mapShape.getBounds().getNorthEast().lng()
        };

        let right = true;
        let prevCoord = null;
        let curPath = [];

        let diff = calcIterAmount(zoom);
        if (diff == null) {
            alert("Survey area is too small! Please select a larger area.");
            return;
        }

        if (flightMap.get(diff) != undefined) {
            setFlightPath(flightMap.get(diff));
            return flightMap.get(diff);
        }
        console.log("generating flight path");

        let lineSymbol = {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
        };

        for (let i = northWest.lat - diff; i > southEast.lat; i -= diff) {
            if (right) {
                for (let j = northWest.lng + diff; j < southEast.lng; j += diff) {
                    if (prevCoord) {
                        curPath.push(new google.maps.Polyline({
                            path: [prevCoord, {lat: i, lng: j}],
                            icons: [{
                                icon: lineSymbol,
                                offset: '100%'
                            }],
                            map: context,
                            editable: false
                        }));
                    }
                    prevCoord = {lat: i, lng: j};
                }
            }
            else {
                for (let j = southEast.lng - diff; j > northWest.lng; j -= diff) {
                    if (prevCoord) {
                        curPath.push(new google.maps.Polyline({
                            path: [prevCoord, {lat: i, lng: j}],
                            icons: [{
                                icon: lineSymbol,
                                offset: '100%'
                            }],
                            map: context,
                            editable: false
                        }));
                    }
                    prevCoord = {lat: i, lng: j};
                }
            }

            right = !right;
        }

        flightMap.set(diff, curPath.slice());
        return curPath;
    }

}
