function convertLineIntoArray(pathArray) {
    var tempArray = new Array();
    for (i = 0; i < pathArray.length; i++) {
        tempArray.push({ lat: pathArray[i].latLngs.j[0].j[0].lat, lng: pathArray[i].latLngs.j[0].j[0].lng });
    }
    return tempArray;
}

var freqArray = new Array(); //filler for different frequencies each with their own dataArray + frequency number
var dataArray = convertLineIntoArray(path); //imported data array
var map; var mapCenter = { lat: 44.5646, lng: -123.2620 }; var mapZoom = 14; var mapType;
var swapNum = 0;
var tLines = 1; var tOpacity = 1; var tRadius = 1;
//function initFreqArray(arrayNumber){ //****** clarification with team ******/
//already done?
//}

function toggleLines() {
    mapCenter = loadMap.getCenter();
    mapZoom = loadMap.getZoom();
    mapType = loadMap.getMapTypeId();
    tLines++;
    if (tLines > 1) {
        tLines = 0;
    }
    generate();
}

function toggleOpacity() {
    mapCenter = loadMap.getCenter();
    mapZoom = loadMap.getZoom();
    mapType = loadMap.getMapTypeId();
    tOpacity++;
    if (tOpacity > 1) {
        tOpacity = 0;
    }
    generate();
}

function changeRadius() {
    mapCenter = loadMap.getCenter();
    mapZoom = loadMap.getZoom();
    mapType = loadMap.getMapTypeId();
    tRadius++;
    if (tRadius >= 4) {
        tRadius = 1;
    }
    generate();
}

function toggleMap() {
    mapCenter = loadMap.getCenter();
    mapZoom = loadMap.getZoom();
    mapType = loadMap.getMapTypeId();
    swapNum++;
    if (swapNum >= 1) {
        swapNum = 0;
    }
    generate();
}
function initMap() { //default map is first in freqArray
    generate();
}
function generate() {
    loadMap = new google.maps.Map(document.getElementById('map'), {
        center: mapCenter,
        zoom: mapZoom,
        mapTypeId: mapType
    });
    var polymapData = new Array(); //array of positional data
    var heatmapData = new Array(); //array of heatmap data, may be removed in future
    var bearingArray = new Array(); //array of bearing lines starting from second datapoint taken
    var intersectionData = new Array(); //array of intersection points
    //******To do: 
    //*****         add data import function
    //*****         add function to manage multiple frequencies' data (may need to encapsulate current data arrays into function)
    //*****         fix zooming and heatmap issue
    //*****         add customization options to show/hide each feature
    //*****         add frequency swap button to html

    //actual values
    /*for (i = 0; i < dataArray.length; i++)
    {
      addToArrays(polymapData,bearingArray,dataArray[i].lat,dataArray[i].lng,dataArray[i].bearF,dataArray[i].bearR,dataArray[i].bearL);
    }*/

    //import data values: (n items)
    //temporary testing values
    /*if (swapNum == 1)
    {
      addToArrays(polymapData,bearingArray,44.572,-123.237,0,0,0); //(polymap output, bearing output, lat, lng, frontIntensity,backRInt,backLInt)
      addToArrays(polymapData,bearingArray,44.582,-123.257,0,0,2); 
      addToArrays(polymapData,bearingArray,44.592,-123.227,0,300,0);
      addToArrays(polymapData,bearingArray,44.542,-123.257,0,0,300);
      addToArrays(polymapData,bearingArray,44.532,-123.257,0,0,300);
    }
    else
    {
      addToArrays(polymapData,bearingArray,44.552,-123.217,0,0,0); //(polymap output, bearing output, lat, lng, frontIntensity,backRInt,backLInt)
      addToArrays(polymapData,bearingArray,44.532,-123.217,0,0,2); 
      addToArrays(polymapData,bearingArray,44.512,-123.227,0,300,0);
      addToArrays(polymapData,bearingArray,44.522,-123.347,0,0,300);
      addToArrays(polymapData,bearingArray,44.532,-123.257,0,0,300);
    }*/

    //Actual
    for (i = 0; i < dataArray.length; i++) {
        testAddToArrays(polymapData, bearingArray, dataArray[i].lat, dataArray[i].lng);
    }

    //debug:
    /*testAddToArraysAbs(polymapData,bearingArray,44.572,-123.237,90);
    testAddToArraysAbs(polymapData,bearingArray,44.582,-123.257,45); 
    testAddToArraysAbs(polymapData,bearingArray,44.592,-123.227,120);
    testAddToArraysAbs(polymapData,bearingArray,44.602,-123.227,180);*/

    //data processing to triangulation:
    calculateHeatData(bearingArray, heatmapData, intersectionData); //(array of bearings,heatmap)
    if (intersectionData.length != 0) {
        averageData(intersectionData);
        //medianData(intersectionData); expensive
    }

    //debug:
    //console.log(findAbsoluteBearing(0,1,1,polymapData[0],polymapData[1])); //(front, backright, backleft, previousPt, currentPt)
    /*console.log(line_intersect(bearingArray[0].x1,bearingArray[0].y1,bearingArray[0].x2,bearingArray[0].y2,
      bearingArray[1].x1,bearingArray[1].y1,bearingArray[1].x2,bearingArray[1].y2));*/
    /*console.log(line_intersect(bearingArray[0].x1,bearingArray[0].y1,bearingArray[0].x2,bearingArray[0].y2,
      bearingArray[2].x1,bearingArray[2].y1,bearingArray[2].x2,bearingArray[2].y2));*/

    //initialize polyline overlay
    var dataPoints = new google.maps.Polyline({
        path: polymapData,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });
    dataPoints.setMap(loadMap);

    //initialize heatmap overlay
    var heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData
    });

    var radiusSize = tRadius * 50;
    heatmap.setOptions({
        //dissipating: true,
        radius: radiusSize,
        opacity: 0.5
    });
    if (tOpacity == 1)
        heatmap.setMap(loadMap);
    //heatmap.set('opacity', heatmap.get('opacity') ? null : 0.5); //opacity 0.5 ****constants, might need to manipulate****
    //heatmap.set('radius', heatmap.get('radius') ? null : 50); //overall radius
    /*google.maps.event.addListener(map, 'zoom_changed', function () {
      heatmap.setOptions(radius: map.getZoom());
    });*/
    map = loadMap; //initialize first map
}

function addToArrays(poly, bear, lat, lng, frontF, backRF, backLF) { //add datapoints to position and bearing arrays
    poly.push(new google.maps.LatLng(lat, lng)); //general path

    if (poly.length > 1) //generate bearing line from datapoint + previous datapoint
    {
        //!!!!!!Improvement: change lineLength to be calculated from receiver intensity instead of constant!!!!!!!!
        var lineLength = 0.1; //~~~~~constant to control length of bearing line, higher values = more error due to spherical earth~~~~~~
        var absAngle = findAbsoluteBearing(frontF, backRF, backLF, poly[poly.length - 2], poly[poly.length - 1]); //radians

        //Find Bearing Line
        var bLat = lat + lineLength * Math.sin(absAngle); //y
        var bLng = lng + lineLength * Math.cos(absAngle); //x
        bear.push({ x1: lng, y1: lat, x2: bLng, y2: bLat }); //add bearing line to array of bearing lines for intersection calculation later
        //form bearing line
        var tempArray = new Array();
        tempArray.push(new google.maps.LatLng(lat, lng));
        tempArray.push(new google.maps.LatLng(bLat, bLng));

        //Find Error Lines
        var eConst = 1.96; //error line degree constant
        var eLat1 = lat + lineLength * Math.sin(absAngle + eConst * Math.PI / 180);
        var eLat2 = lat + lineLength * Math.sin(absAngle - eConst * Math.PI / 180);
        var eLng1 = lng + lineLength * Math.cos(absAngle + eConst * Math.PI / 180);
        var eLng2 = lng + lineLength * Math.cos(absAngle - eConst * Math.PI / 180);

        //form error lines
        var eArray1 = new Array(); //error line 1
        var eArray2 = new Array(); //error line 2
        eArray1.push(new google.maps.LatLng(lat, lng));
        eArray1.push(new google.maps.LatLng(eLat1, eLng1));
        eArray2.push(new google.maps.LatLng(lat, lng));
        eArray2.push(new google.maps.LatLng(eLat2, eLng2));

        //polyline setup
        var bearingLine = new google.maps.Polyline({ //bearing line
            path: tempArray,
            geodesic: true,
            strokeColor: '#0000FF',
            strokeOpacity: 0.3,
            strokeWeight: 1
        });
        var errorLine1 = new google.maps.Polyline({ //first error line
            path: eArray1,
            geodesic: true,
            strokeColor: '#00FF00',
            strokeOpacity: 1.0,
            strokeWeight: 1
        });
        var errorLine2 = new google.maps.Polyline({ //second error line
            path: eArray2,
            geodesic: true,
            strokeColor: '#00FF00',
            strokeOpacity: 1.0,
            strokeWeight: 1
        });

        //render
        if (tLines == 1) {
            bearingLine.setMap(loadMap);  //bearing overlay per point
            errorLine1.setMap(loadMap);
            errorLine2.setMap(loadMap);
        }
    }
}

//insert intensities from 3 recievers, calculate bearing based off of previous point
function findAbsoluteBearing(frontF, backRF, backLF, prevPoint, curPoint) { //float,float,float,arrayitem[n-1],arrayitem[n]
    //~~~~~~~~change angles if the physical position of receivers is not an equilateral triangle (currently angles are ccw)~~~~~~~~
    var frontAngle = 0 * Math.PI / 180; //            F
    var backRAngle = 240 * Math.PI / 180; //         / \
    var backLAngle = 120 * Math.PI / 180; //        L---R

    //will need a way to deal with bearing when drone is above transmitter 
    var relativeBearing = Math.atan2((frontF * Math.sin(frontAngle) + backRF * Math.sin(backRAngle) + backLF * Math.sin(backLAngle)), (frontF * Math.cos(frontAngle) + backRF * Math.cos(backRAngle) + backLF * Math.cos(backLAngle)));
    var absoluteDirection = Math.atan2((curPoint.lat() - prevPoint.lat()), (curPoint.lng() - prevPoint.lng()));

    return (absoluteDirection + relativeBearing); //radians
    //debug:
    //return (absoluteDirection + relativeBearing)*180/Math.PI;
    //return relativeBearing*180/Math.PI;
    //return absoluteDirection*180/Math.PI;
};

function calculateHeatData(bearA, heat, interData) { //find all intersections between bearing lines in O(n^2) time
    for (i = 0; i < bearA.length - 1; i++) //i = one item
    {
        for (j = i + 1; j < bearA.length; j++) //j = another item
        {
            var intersect = line_intersect(bearA[i].x1, bearA[i].y1, bearA[i].x2, bearA[i].y2,
                bearA[j].x1, bearA[j].y1, bearA[j].x2, bearA[j].y2);
            if (intersect != false) {
                var impact = Math.min(distance(intersect, bearA[i]), distance(intersect, bearA[j])); //find line with minimum distance from intersection
                heat.push({ location: new google.maps.LatLng(intersect.y, intersect.x), weight: 0.5 }); //!!!may need to calibrate weight to number of points!!!
                interData.push({ y: intersect.y, x: intersect.x, weight: impact });
            }
        }
    }
}

//find the weighted average of intersection data and plot it
function averageData(interArray) {
    var xNumer = 0; //mw :weighted average of x where summation(mw/w)
    var yNumer = 0; //weighted average of y
    var denom = 0; //w
    for (i = 0; i < interArray.length; i++) {
        xNumer = xNumer + interArray[i].weight * interArray[i].x;
        yNumer = yNumer + interArray[i].weight * interArray[i].y;
        denom = denom + interArray[i].weight;
    }
    var averageIntersection = new google.maps.LatLng(yNumer / denom, xNumer / denom); //data point of where average intersection is displayed
    //console.log(interArray[1].weight);
    //initialize average point display
    var avgMarker = new google.maps.Marker({
        position: averageIntersection,
        title: "Average Location"
    });
    avgMarker.setMap(loadMap);
}

function medianData(interArray) { //take median intersection point of dataset, O(n^2)
    var lineSums = new Array(); //array containing sum of distances per point
    var totalSum = 0; //total the sum of distances for a particular point i
    //find sum of all distances per point
    for (i = 0; i < interArray.length; i++) // i = point of interest
    {
        for (j = 0; j < interArray.length; j++) // j = 2nd point of triangle
        {
            if (i != j) {
                totalSum = totalSum + pointDistance(interArray[i], interArray[j]);
            }
        }
        lineSums.push({ point: i, sum: (totalSum) });
        totalSum = 0;
    }
    var min = lineSums[0].sum; //minimum sum of triangles
    var minIndex = lineSums[0].point; //which point has the minimum triangle sum
    for (i = 1; i < lineSums.length; i++) { //find point with minimum triangle sum
        if (lineSums[i].sum < min) {
            min = lineSums[i].sum;
            minIndex = lineSums[i].point; //update to new point
        }
    }

    var medianIntersection = new google.maps.LatLng(interArray[minIndex].y, interArray[minIndex].x);
    //initialize median point display
    var medMarker = new google.maps.Marker({
        position: medianIntersection,
        title: "Median Location"
    });
    medMarker.setMap(loadMap);
}

//credits to Paul Bourke for intersection point algorithm
//line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
//Determine the intersection point of two line segments
//Returns false if the lines don't intersect
function line_intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    //Check if none of the lines are of length 0
    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
        return false
    }
    denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

    //Lines are parallel
    if (denominator === 0) {
        return false
    }
    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

    //intersection must be within scope of lines
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
        return false
    }

    //Return a object with the x and y coordinates of the intersection
    let x = x1 + ua * (x2 - x1)
    let y = y1 + ua * (y2 - y1)
    return { x, y }
}

//calculate distance between two point arrays
function distance(intersectA, bearA) {
    var a = intersectA.x - bearA.x1; //a = x1 - x2;
    var b = intersectA.y - bearA.y1; //b = y1 - y2;
    return Math.sqrt(a * a + b * b);
}

function pointDistance(intersectA, intersectB) {
    var a = intersectA.x - intersectB.x; //a = x1 - x2;
    var b = intersectA.y - intersectB.y; //b = y1 - y2;
    return Math.sqrt(a * a + b * b);
}

//filler*****************************
function convertData() { //convert html to array
    $("table#cartGrid tr").each(function () { //myTableArray[1][3] // Fourth td of the second tablerow
        var arrayOfThisRow = [];
        var tableData = $(this).find('td');
        if (tableData.length > 0) {
            tableData.each(function () { arrayOfThisRow.push($(this).text()); });
            tableDataArray.push(arrayOfThisRow);
        }
    });
}

function testAddToArraysAbs(poly, bear, lat, lng, abs) { //add datapoints to position and bearing arrays from absolute bearing (degrees from unit circle)
    poly.push(new google.maps.LatLng(lat, lng)); //general path

    if (poly.length > 1) //generate bearing line from datapoint + previous datapoint
    {
        //!!!!!!Improvement: change lineLength to be calculated from receiver intensity instead of constant!!!!!!!!
        var lineLength = 0.1; //~~~~~constant to control length of bearing line, higher values = more error due to spherical earth~~~~~~
        var absAngle = abs * Math.PI / 180; //radians

        //Find Bearing Line
        var bLat = lat + lineLength * Math.sin(absAngle); //y
        var bLng = lng + lineLength * Math.cos(absAngle); //x
        bear.push({ x1: lng, y1: lat, x2: bLng, y2: bLat }); //add bearing line to array of bearing lines for intersection calculation later
        //form bearing line
        var tempArray = new Array();
        tempArray.push(new google.maps.LatLng(lat, lng));
        tempArray.push(new google.maps.LatLng(bLat, bLng));

        //Find Error Lines
        var eConst = 1.96; //error line degree constant
        var eLat1 = lat + lineLength * Math.sin(absAngle + eConst * Math.PI / 180);
        var eLat2 = lat + lineLength * Math.sin(absAngle - eConst * Math.PI / 180);
        var eLng1 = lng + lineLength * Math.cos(absAngle + eConst * Math.PI / 180);
        var eLng2 = lng + lineLength * Math.cos(absAngle - eConst * Math.PI / 180);

        //form error lines
        var eArray1 = new Array(); //error line 1
        var eArray2 = new Array(); //error line 2
        eArray1.push(new google.maps.LatLng(lat, lng));
        eArray1.push(new google.maps.LatLng(eLat1, eLng1));
        eArray2.push(new google.maps.LatLng(lat, lng));
        eArray2.push(new google.maps.LatLng(eLat2, eLng2));

        //polyline setup
        var bearingLine = new google.maps.Polyline({ //bearing line
            path: tempArray,
            geodesic: true,
            strokeColor: '#0000FF',
            strokeOpacity: 0.3,
            strokeWeight: 1
        });
        var errorLine1 = new google.maps.Polyline({ //first error line
            path: eArray1,
            geodesic: true,
            strokeColor: '#00FF00',
            strokeOpacity: 1.0,
            strokeWeight: 1
        });
        var errorLine2 = new google.maps.Polyline({ //second error line
            path: eArray2,
            geodesic: true,
            strokeColor: '#00FF00',
            strokeOpacity: 1.0,
            strokeWeight: 1
        });

        //render
        if (tLines == 1) {
            bearingLine.setMap(loadMap);  //bearing overlay per point
            errorLine1.setMap(loadMap);
            errorLine2.setMap(loadMap);
        }
    }
}

function testFindAbsoluteBearing(prevPointLat, prevPointLng, curPoint) {
    var absoluteDirection = Math.atan2((curPoint.latLngs.j[0].j[0].lat - prevPointLat), (curPoint.latLngs.j[0].j[0].lng - prevPointLng));
    return absoluteDirection; //radians
};

function testAddToArrays(poly, bear, lat, lng) { //add datapoints to position and bearing arrays
    poly.push(new google.maps.LatLng(lat, lng)); //general path

    if (poly.length > 1) //generate bearing line from datapoint + previous datapoint
    {
        //!!!!!!Improvement: change lineLength to be calculated from receiver intensity instead of constant!!!!!!!!
        var lineLength = 0.01; //~~~~~constant to control length of bearing line, higher values = more error due to spherical earth~~~~~~
        var absAngle = testFindAbsoluteBearing(lat, lng, middlePoint); //radians

        //Find Bearing Line
        var bLat = lat + lineLength * Math.sin(absAngle); //y
        var bLng = lng + lineLength * Math.cos(absAngle); //x
        bear.push({ x1: lng, y1: lat, x2: bLng, y2: bLat }); //add bearing line to array of bearing lines for intersection calculation later
        //form bearing line
        var tempArray = new Array();
        tempArray.push(new google.maps.LatLng(lat, lng));
        tempArray.push(new google.maps.LatLng(bLat, bLng));

        //Find Error Lines
        var eConst = 1.96; //error line degree constant
        var eLat1 = lat + lineLength * Math.sin(absAngle + eConst * Math.PI / 180);
        var eLat2 = lat + lineLength * Math.sin(absAngle - eConst * Math.PI / 180);
        var eLng1 = lng + lineLength * Math.cos(absAngle + eConst * Math.PI / 180);
        var eLng2 = lng + lineLength * Math.cos(absAngle - eConst * Math.PI / 180);

        //form error lines
        var eArray1 = new Array(); //error line 1
        var eArray2 = new Array(); //error line 2
        eArray1.push(new google.maps.LatLng(lat, lng));
        eArray1.push(new google.maps.LatLng(eLat1, eLng1));
        eArray2.push(new google.maps.LatLng(lat, lng));
        eArray2.push(new google.maps.LatLng(eLat2, eLng2));

        //polyline setup
        var bearingLine = new google.maps.Polyline({ //bearing line
            path: tempArray,
            geodesic: true,
            strokeColor: '#0000FF',
            strokeOpacity: 0.3,
            strokeWeight: 1
        });
        var errorLine1 = new google.maps.Polyline({ //first error line
            path: eArray1,
            geodesic: true,
            strokeColor: '#00FF00',
            strokeOpacity: 1.0,
            strokeWeight: 1
        });
        var errorLine2 = new google.maps.Polyline({ //second error line
            path: eArray2,
            geodesic: true,
            strokeColor: '#00FF00',
            strokeOpacity: 1.0,
            strokeWeight: 1
        });

        //render
        if (tLines == 1) {
            bearingLine.setMap(loadMap);  //bearing overlay per point
            //errorLine1.setMap(loadMap);
            //errorLine2.setMap(loadMap);
        }
    }
}

