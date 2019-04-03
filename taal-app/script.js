var fs = require('fs');

var map;
var drawingManager;
var selectedShape = null;
var mapShape = null;
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

    try {
        // proof it works, extremely slow. is being optimized.
        fs.unlink('flight_path.plan', (err) => {
            if (err) throw err;
            console.log('flight_path.plan was deleted');
        });
        WritePLAN(flightPath, testMarkerLat, testMarkerLng);
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
                unsetFlightPath(prevZoom);
                generateFlightPath(zoom, map)
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
    google.maps.event.addListener(newShape, 'dragend', function() {
        recalculateFlightPath(map.getZoom())
    });

    selectedShape = newShape;
    mapShape = newShape;
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
        unsetFlightPath(map.getZoom());
    }
    flightMap.clear();
}

// unsetFlightPath clears a flightPath from the map
// so it is no longer visible
function unsetFlightPath(zoom) {
    if (testMarker) {
        testMarker.setMap(null);
    }

    diff = calcIterAmount(zoom)
    let flightPath = flightMap.get(diff)
    if (flightPath == undefined) {
        console.log("flight path not found")
        return;
    }
    for (let i = 0; i < flightPath.length ; i++) {
        flightPath[i].setMap(null);
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

function WritePLAN(flightPath, testMarkerLat, testMarkerLng) {
    let doJumpId = 1;
    //open global brackets and declare filetype
    fs.appendFileSync('flight_path.plan', '{\n', 'utf-8')
    fs.appendFileSync('flight_path.plan', '\t\"fileType\": \"Plan\",\n', 'utf-8');
    //declare geofence, currently no geofences
    fs.appendFileSync('flight_path.plan', '\t\"geoFence\": {\n', 'utf-8');
    fs.appendFileSync('flight_path.plan', '\t\t\"circles\": [],\n', 'utf-8');
    fs.appendFileSync('flight_path.plan', '\t\t\"polygons\": [],\n', 'utf-8');
    fs.appendFileSync('flight_path.plan', '\t\t\"version\": 2\n', 'utf-8');
    fs.appendFileSync('flight_path.plan', '\t},\n', 'utf-8');//close geoFence section
    //declare the ground station
    fs.appendFileSync('flight_path.plan', '\t\"groundStation\": \"QGroundControl\",\n', 'utf-8');
    //declare mission, will include most of the flightpath information
    fs.appendFileSync('flight_path.plan', '\t\"mission\": {\n', 'utf-8');
    fs.appendFileSync('flight_path.plan', '\t\t\"cruiseSpeed\": 15,\n', 'utf-8');
    fs.appendFileSync('flight_path.plan', '\t\t\"firmwareType\": 12,\n', 'utf-8');
    fs.appendFileSync('flight_path.plan', '\t\t\"hoverSpeed\": 5,\n', 'utf-8');
    //declare items section
    fs.appendFileSync('flight_path.plan', '\t\t\"items\": [\n', 'utf-8');
    let header = '\t\t\t\t';
    //first item (camera related, may not need)
    fs.appendFileSync('flight_path.plan', '\t\t\t{\n', 'utf-8');
    let params = ['0', '2', 'null', 'null', 'null', 'null', 'null'];
    doJumpId = writeSimpleItem(true, 530, doJumpId, 2, params, header);
    fs.appendFileSync('flight_path.plan', '\t\t\t},\n', 'utf-8');//end first item
    //second item (survey item)
    fs.appendFileSync('flight_path.plan', '\t\t\t{\n', 'utf-8');

    doJumpId = writeComplexItem(flightPath, doJumpId, header);

    fs.appendFileSync('flight_path.plan', '\t\t\t},\n', 'utf-8');//end second item
    //third item (return to launch)
    fs.appendFileSync('flight_path.plan', '\t\t\t{\n', 'utf-8');
    params = ['0', '0', '0', '0', '0', '0', '0'];
    doJumpId = writeSimpleItem(true, 20, doJumpId, 2, params, header);
    fs.appendFileSync('flight_path.plan', '\t\t\t}\n', 'utf-8');//end third item

    fs.appendFileSync('flight_path.plan', '\t\t],\n', 'utf-8');//close items section

    //declare planned home position //not used for flight, vehicle should return to launch point.
    fs.appendFileSync('flight_path.plan', '\t\t\"plannedHomePosition\": [\n', 'utf-8');
    fs.appendFileSync('flight_path.plan', ('\t\t\t' + testMarkerLat + ',\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', ('\t\t\t' + testMarkerLng + ',\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', '\t\t\t100\n', 'utf-8'); //default 100 meter altitude
    fs.appendFileSync('flight_path.plan', '\t\t],\n', 'utf-8');//close home position pair
    //declare vehicle type and mission version
    fs.appendFileSync('flight_path.plan', '\t\t\"vehicleType\": 2,\n', 'utf-8');
    fs.appendFileSync('flight_path.plan', '\t\t\"version\": 2\n', 'utf-8');
    fs.appendFileSync('flight_path.plan', '\t},\n', 'utf-8');//end mission section
    //declare rally points, currently no rally points
    fs.appendFileSync('flight_path.plan', '\t\"rallyPoints\": {\n', 'utf-8');
    fs.appendFileSync('flight_path.plan', '\t\t\"points\": [],\n', 'utf-8');
    fs.appendFileSync('flight_path.plan', '\t\t\"version\": 2\n', 'utf-8');
    fs.appendFileSync('flight_path.plan', '\t},\n', 'utf-8');//close rallyPoint section
    //declare version and close global brackets
    fs.appendFileSync('flight_path.plan', '\t\"version\": 1\n', 'utf-8');
    fs.appendFileSync('flight_path.plan', '}', 'utf-8');
}

function writeSimpleItem(autoContinue, command, doJumpId, frame, params, header) {
    fs.appendFileSync('flight_path.plan', (header + '\"autoContinue\": ' + autoContinue + ',\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\"command\": ' + command + ',\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\"doJumpId\": ' + doJumpId + ',\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\"frame\": ' + frame + ',\n'), 'utf-8');
    //start params section
    fs.appendFileSync('flight_path.plan', (header + '\"params\": [\n'), 'utf-8');
    let header2 = header + '\t';
    for (let i = 0; i < params.length; i++) {//loop through parameters and print them
        if (i == (params.length - 1)) {//don't include ',' in last param entry
            fs.appendFileSync('flight_path.plan', (header2 + params[i] + '\n'), 'utf-8');
        }
        else {
            fs.appendFileSync('flight_path.plan', (header2 + params[i] + ',\n'), 'utf-8');
        }
    }
    fs.appendFileSync('flight_path.plan', (header + '],\n'), 'utf-8');//close params section

    fs.appendFileSync('flight_path.plan', (header + '\"type\": \"SimpleItem\"\n'), 'utf-8');
    return doJumpId + 1;
}

function writeComplexItem(flightPath, doJumpId, header) {
    fs.appendFileSync('flight_path.plan', (header + '\"TransectStyleComplexItem\": {\n'), 'utf-8');
    //CameraCalc
    fs.appendFileSync('flight_path.plan', (header + '\t\"CameraCalc\": {\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t\t\"AdjustedFootprintFrontal\": 0,\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t\t\"AdjustedFootprintSide\": 10,\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t\t\"CameraName\": \"Manual (no camera specs)\",\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t\t\"DistanceToSurface\": 50,\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t\t\"DistanceToSurfaceRelative\": true,\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t\t\"version\": 1\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t},\n'), 'utf-8');

    fs.appendFileSync('flight_path.plan', (header + '\t\"CameraShots\": 0,\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t\"CameraTriggerInTurnAround\": false,\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t\"FollowTerrain\": false,\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t\"HoverAndCapture\": false,\n'), 'utf-8');
    //Items
    doJumpId = writeItems(flightPath, header, doJumpId);
    fs.appendFileSync('flight_path.plan', (header + '\t\"Refly90Degrees\": false,\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t\"TurnAroundDistance\": 0,\n'), 'utf-8');
    //VisualTransectPoints
    writeVisualPoints(flightPath, header);
    fs.appendFileSync('flight_path.plan', (header + '\t\"version\": 1\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '},\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\"angle\": 90,\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\"complexItemType\": \"survey\",\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\"entryLocation\": 0,\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\"flyAlternateTransects\": false,\n'), 'utf-8');
    //polygon
    fs.appendFileSync('flight_path.plan', (header + '\"polygon\": [\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t[\n'), 'utf-8');
    //northwest
    fs.appendFileSync('flight_path.plan', (header + '\t\t' + mapShape.getBounds().getNorthEast().lat() + ',\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t\t' + mapShape.getBounds().getSouthWest().lng() + '\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t],\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t[\n'), 'utf-8');
    //northeast
    fs.appendFileSync('flight_path.plan', (header + '\t\t' + mapShape.getBounds().getNorthEast().lat() + ',\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t\t' + mapShape.getBounds().getNorthEast().lng() + '\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t],\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t[\n'), 'utf-8');
    //southeast
    fs.appendFileSync('flight_path.plan', (header + '\t\t' + mapShape.getBounds().getSouthWest().lat() + ',\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t\t' + mapShape.getBounds().getNorthEast().lng() + '\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t],\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t[\n'), 'utf-8');
    //southwest
    fs.appendFileSync('flight_path.plan', (header + '\t\t' + mapShape.getBounds().getSouthWest().lat() + ',\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t\t' + mapShape.getBounds().getSouthWest().lng() + '\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\t]\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '],\n'), 'utf-8');

    fs.appendFileSync('flight_path.plan', (header + '\"splitConcavePolygons\": false,\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\"type\": \"ComplexItem\",\n'), 'utf-8');
    fs.appendFileSync('flight_path.plan', (header + '\"version\": 5\n'), 'utf-8');
    return doJumpId;
}

function writeItems(flightPath, header, doJumpId) {
    let size = flightPath.length;
    fs.appendFileSync('flight_path.plan', (header + '\t\"Items\": [\n'), 'utf-8');

    for (let i = 0; i < size; i++) {
        let lat = flightPath[i].getPath().getArray()[0].lat();
        let lng = flightPath[i].getPath().getArray()[0].lng();
        let parameters = ['0', '0', '0', 'null', lat, lng, '100'];
        fs.appendFileSync('flight_path.plan', (header + '\t\t{\n'), 'utf-8');
        doJumpId = writeSimpleItem(true, 16, doJumpId, 3, parameters, header + '\t\t');
        fs.appendFileSync('flight_path.plan', (header + '\t\t},\n'), 'utf-8');
        if (i == size - 1) {
            lat = flightPath[i].getPath().getArray()[1].lat();
            lng = flightPath[i].getPath().getArray()[1].lng();
            let parameters = ['0', '0', '0', 'null', lat, lng, '100'];
            fs.appendFileSync('flight_path.plan', (header + '\t\t{\n'), 'utf-8');
            doJumpId = writeSimpleItem(true, 16, doJumpId, 3, parameters, header + '\t\t');
            fs.appendFileSync('flight_path.plan', (header + '\t\t}\n'), 'utf-8');
        }
    }
    fs.appendFileSync('flight_path.plan', (header + '\t],\n'), 'utf-8');
    return doJumpId;
}

function writeVisualPoints(flightPath, header) {
    let size = flightPath.length;
    fs.appendFileSync('flight_path.plan', (header + '\t\"VisualTransectPoints\": [\n'), 'utf-8');
    for (let i = 0; i < size; i++) {
        fs.appendFileSync('flight_path.plan', (header + '\t\t[\n'), 'utf-8');
        fs.appendFileSync('flight_path.plan', (header + '\t\t\t' + flightPath[i].getPath().getArray()[0].lat() + ',\n'), 'utf-8');
        fs.appendFileSync('flight_path.plan', (header + '\t\t\t' + flightPath[i].getPath().getArray()[0].lng() + '\n'), 'utf-8');
        fs.appendFileSync('flight_path.plan', (header + '\t\t],\n'), 'utf-8');
        if (i == size - 1) {
            fs.appendFileSync('flight_path.plan', (header + '\t\t[\n'), 'utf-8');
            fs.appendFileSync('flight_path.plan', (header + '\t\t\t' + flightPath[i].getPath().getArray()[1].lat() + ',\n'), 'utf-8');
            fs.appendFileSync('flight_path.plan', (header + '\t\t\t' + flightPath[i].getPath().getArray()[1].lng() + '\n'), 'utf-8');
            fs.appendFileSync('flight_path.plan', (header + '\t\t]\n'), 'utf-8');
        }
    }
    fs.appendFileSync('flight_path.plan', (header + '\t],\n'), 'utf-8');
}