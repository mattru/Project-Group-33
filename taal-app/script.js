const fs = require('fs');
const stream = require('stream');

var map;
var drawingManager;
var selectedShape = null;
var mapShape = null;
var shapeDiff = null;
var prevZoom = 0;
var flightMap = new Map;
var testMarker = null;

const flightDiffAmount = .0012;

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
        //remove old file before writing new plan.
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

        for (let i = northWest.lat - diff/2; i > southEast.lat; i -= diff/2) {
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

function WritePLAN(flightPath, PHomeLat, PHomeLng) {
    const readable = new stream.Readable();
    let fname = 'flight_path.plan';
    const writeable = fs.createWriteStream(fname);
    readable._read = () => { };
    readable.pipe(writeable);
    writeable.on('unpipe', (e) => {
        writeable.end();
    });
    writeable.on('error', (e) => {
        writeable.end();
    });

    var doJumpId = [1];
    let header = '\t\t\t\t';
    let params = ['0', '2', 'null', 'null', 'null', 'null', 'null'];

    //start building strings for file write
    //open global brackets and declare filetype
    readable.push('{\n' + '\t\"fileType\": \"Plan\",\n');
    //declare geofence, currently no geofences
    readable.push('\t\"geoFence\": {\n');
    readable.push('\t\t\"circles\": [],\n');
    readable.push('\t\t\"polygons\": [],\n');
    readable.push('\t\t\"version\": 2\n');
    readable.push('\t},\n');//close geoFence section
    //declare the ground station
    readable.push('\t\"groundStation\": \"QGroundControl\",\n');
    //declare mission, will include most of the flightpath information
    readable.push('\t\"mission\": {\n');
    readable.push('\t\t\"cruiseSpeed\": 15,\n');
    readable.push('\t\t\"firmwareType\": 12,\n');
    readable.push('\t\t\"hoverSpeed\": 5,\n');
    //declare mission items section
    readable.push('\t\t\"items\": [\n');
    //first mission item
    readable.push('\t\t\t{\n' + SimpleItem(true, 530, doJumpId, 2, params, header) + '\t\t\t},\n');
    readable.push(('\t\t\t{\n' + header + '\"TransectStyleComplexItem\": {\n')); //start second item (complex item)
    //CameraCalc of complex item
    readable.push((header + '\t\"CameraCalc\": {\n'));
    readable.push((header + '\t\t\"AdjustedFootprintFrontal\": 0,\n'));
    readable.push((header + '\t\t\"AdjustedFootprintSide\": 50,\n'));
    readable.push((header + '\t\t\"CameraName\": \"Manual (no camera specs)\",\n'));
    readable.push((header + '\t\t\"DistanceToSurface\": 50,\n'));
    readable.push((header + '\t\t\"DistanceToSurfaceRelative\": true,\n'));
    readable.push((header + '\t\t\"version\": 1\n'));
    readable.push((header + '\t},\n'));
    readable.push((header + '\t\"CameraShots\": 0,\n'));
    readable.push((header + '\t\"CameraTriggerInTurnAround\": false,\n'));
    readable.push((header + '\t\"FollowTerrain\": false,\n'));
    readable.push((header + '\t\"HoverAndCapture\": false,\n'));
    writeComplexItem(flightPath, doJumpId, header, readable); //body of complex item
    readable.push('\t\t\t},\n');//end complex item
    //third item (return to launch)
    params = ['0', '0', '0', '0', '0', '0', '0'];
    readable.push('\t\t\t{\n' + SimpleItem(true, 20, doJumpId, 2, params, header) + '\t\t\t}\n');//end third item
    readable.push('\t\t],\n');//close items section
    //declare planned home position //not used for flight, vehicle should return to launch point.
    readable.push('\t\t\"plannedHomePosition\": [\n');
    readable.push(('\t\t\t' + PHomeLat + ',\n') + ('\t\t\t' + PHomeLng + ',\n'));
    readable.push('\t\t\t100\n' + '\t\t],\n'); //default 100 meter altitude
    //declare vehicle type(2 = multi rotor) and mission version
    readable.push('\t\t\"vehicleType\": 2,\n' + '\t\t\"version\": 2\n' + '\t},\n');//end mission section
    //declare rally points, currently no rally points
    readable.push('\t\"rallyPoints\": {\n' + '\t\t\"points\": [],\n' + '\t\t\"version\": 2\n' + '\t},\n');
    //declare version and close global brackets
    readable.push('\t\"version\": 1\n' + '}');
    readable.push(null);
}

function SimpleItem(autoContinue, command, doJumpId, frame, params, header) {
    let ID = doJumpId[0];
    let str = (header + '\"autoContinue\": ' + autoContinue + ',\n');
    str += (header + '\"command\": ' + command + ',\n');
    str += (header + '\"doJumpId\": ' + ID + ',\n');
    str += (header + '\"frame\": ' + frame + ',\n');
    //start params section
    str += (header + '\"params\": [\n');
    let header2 = header + '\t';
    for (let i = 0; i < params.length; i++) {//loop through parameters and print them
        if (i == (params.length - 1)) {//don't include ',' in last param entry
            str += (header2 + params[i] + '\n');
        }
        else {
            str += (header2 + params[i] + ',\n');
        }
    }
    str += (header + '],\n');//close params section

    str += (header + '\"type\": \"SimpleItem\"\n');
    doJumpId[0] = ID + 1;
    return str;
}

function writeComplexItem(flightPath, doJumpId, header, readable) {
    //Items and visual points
    let VP_str = (header + '\t\"Refly90Degrees\": false,\n');
    VP_str += (header + '\t\"TurnAroundDistance\": 0,\n');
    VP_str += ItemsPoints(flightPath, header, doJumpId, readable);
    readable.push(VP_str);

    //ending of complex item
    readable.push((header + '\t\"version\": 1\n') + (header + '},\n'));
    readable.push(header + '\"angle\": 90,\n');
    readable.push(header + '\"complexItemType\": \"survey\",\n');
    readable.push(header + '\"entryLocation\": 0,\n');
    readable.push(header + '\"flyAlternateTransects\": false,\n');

    //polygon
    readable.push(header + '\"polygon\": [\n');
    readable.push(header + '\t[\n');
    //northwest
    readable.push(header + '\t\t' + mapShape.getBounds().getNorthEast().lat() + ',\n');
    readable.push(header + '\t\t' + mapShape.getBounds().getSouthWest().lng() + '\n');
    readable.push(header + '\t],\n');
    readable.push(header + '\t[\n');
    //northeast
    readable.push(header + '\t\t' + mapShape.getBounds().getNorthEast().lat() + ',\n');
    readable.push(header + '\t\t' + mapShape.getBounds().getNorthEast().lng() + '\n');
    readable.push(header + '\t],\n');
    readable.push(header + '\t[\n');
    //southeast
    readable.push(header + '\t\t' + mapShape.getBounds().getSouthWest().lat() + ',\n');
    readable.push(header + '\t\t' + mapShape.getBounds().getNorthEast().lng() + '\n');
    readable.push(header + '\t],\n');
    readable.push(header + '\t[\n');
    //southwest
    readable.push(header + '\t\t' + mapShape.getBounds().getSouthWest().lat() + ',\n');
    readable.push(header + '\t\t' + mapShape.getBounds().getSouthWest().lng() + '\n');
    readable.push(header + '\t]\n');
    readable.push(header + '],\n');

    readable.push(header + '\"splitConcavePolygons\": false,\n');
    readable.push(header + '\"type\": \"ComplexItem\",\n');
    readable.push(header + '\"version\": 5\n');
}

function ItemsPoints(flightPath, header, doJumpId, readable) {
    let size = flightPath.length;
    readable.push(header + '\t\"Items\": [\n');
    let VP_str = (header + '\t\"VisualTransectPoints\": [\n');

    for (let i = 0; i < size; i++) {
        let lat = flightPath[i].getPath().getArray()[0].lat();
        let lng = flightPath[i].getPath().getArray()[0].lng();
        let parameters = ['0', '0', '0', 'null', lat, lng, '100'];
        readable.push((header + '\t\t{\n') + SimpleItem(true, 16, doJumpId, 3, parameters, header + '\t\t') + (header + '\t\t},\n'));
        VP_str += (header + '\t\t[\n') + (header + '\t\t\t' + lat + ',\n') + (header + '\t\t\t' + lng + '\n') + (header + '\t\t],\n');
        if (i == size - 1) {
            lat = flightPath[i].getPath().getArray()[1].lat();
            lng = flightPath[i].getPath().getArray()[1].lng();
            let parameters = ['0', '0', '0', 'null', lat, lng, '100'];
            readable.push((header + '\t\t{\n') + SimpleItem(true, 16, doJumpId, 3, parameters, header + '\t\t') + (header + '\t\t}\n'));
            VP_str += (header + '\t\t[\n') + (header + '\t\t\t' + lat + ',\n') + (header + '\t\t\t' + lng + '\n') + (header + '\t\t]\n');
        }
    }
    readable.push(header + '\t],\n');
    VP_str += (header + '\t],\n');
    return VP_str;
}
