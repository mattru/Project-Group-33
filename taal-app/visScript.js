//To Do: Add html error messages if not all files are added or aren't .csv files
//****** Fix median function... guess: lat lng coordinates different than cartesian coordinate system */
/*var sync = JSON.parse(sessionStorage.getItem('syncDATA'));
var varsyncDATA = new Array();
if (sync != null) {
    varsyncDATA = sync; //CSV Array of arrays
    console.log(syncDATA);
}*/
sync = JSON.parse(sessionStorage.getItem('syncDATA'));
// if (gps != null && sdr != null && sync != null) {
//var syncDATA = new Array();
if (sync != null) {
  // gpsDATA = gps;
  // console.log(gpsDATA);
  // sdrDATA = sdr;
  // console.log(sdrDATA);
  // sync();
  syncDATA = sync; //CSV Array of arrays
  //console.log(syncDATA);
}

var dataArray1 = new Array(); var dataArray2 = new Array(); var dataArray3 = new Array(); //data arrays for storing imported intensity,lat,lng
var freqArray = new Array(); //filler for different frequencies each with their own dataArray + frequency number
var allBearings = new Array(); var allError1 = new Array(); var allError2 = new Array();
var loadmap; var heatmap; var dataPoints; var avgMarker;
var mapCenter = { lat: 44.5646, lng: -123.2620 }; var mapZoom = 14; var mapType;
var typeFlag = 0; var max1 = 0;
var tLines = 1; var tOpacity = 1; var tRadius = 1; var lineLength = 0.5;

function toggleLines() { //toggle bearing line visibility
    tLines++;
    if (tLines > 1) {
        tLines = 0;
    }
    generate();
}

function toggleOpacity() { //heatmap visibility
    tOpacity++;
    if (tOpacity > 1) {
        tOpacity = 0;
    }
    generate();
}

function changeRadius() { //heatmap radius scaling
    tRadius++;
    if (tRadius >= 4) {
        tRadius = 1;
    }
    generate();
}

function localBegin() { //use local data
    if (typeof syncDATA == 'undefined')
    {
        return alert("Error: Data has not been converted yet.");
    }
    typeFlag = 0;
    dataArray1 = []; dataArray2 = []; dataArray3 = []; max1 = 0; //clear previous global values
    for (var i = 1; i < syncDATA.length; i++) {
            dataArray1.push({ intensity: parseFloat(syncDATA[i][2]), lat: parseFloat(syncDATA[i][3]), lng: parseFloat(syncDATA[i][4])});
            if (dataArray1.length == 1) //find minimum
                localMin = dataArray1[0].intensity;
            localMin = Math.min(dataArray1[dataArray1.length - 1].intensity, localMin);
        }
    if (dataArray1.length == 0) //find minimum
        return alert("Error, length of generated data is 0.");
    var temp = 0;
    for (var i = 0; i < dataArray1.length; i++) { //convert into intensity
        temp = dataArray1[i].intensity + Math.abs(localMin);
        max1 = Math.max(max1,temp);
        dataArray1[i].intensity = temp;
    }
    generate();
}

function begin1() { //single file upload
    typeFlag = 0;
    dataArray1 = []; dataArray2 = []; dataArray3 = []; max1 = 0; //clear previous global values
    var file = document.getElementById('u1').files[0];
    var freqFilter = document.getElementById('f1').value;

    var reader = new FileReader();
    reader.onload = function (progressEvent) {
        // Entire file
        //console.log(this.result);
        // By lines
        var allTextLines = this.result.split('\n');
        var lines = [];
        for (var i = 0; i < allTextLines.length; i++) {
            var data = allTextLines[i].split(';');
            var tarr = [];
            for (var j = 0; j < data.length; j++) {
                tarr.push(data[j]);
            }
            lines.push(tarr);
        }
        //console.log((lines[1].toString()).split(',')[2]); //second row, third column
        //find frequency specific intensity while finding local minimum intensity
        var localMin = 0;
        for (var i = 1; i < lines.length; i++) {
            if (isNaN((lines[i].toString()).split(',')[1])||isNaN(parseFloat((lines[i].toString()).split(',')[2]))||isNaN(parseFloat((lines[i].toString()).split(',')[3]))||isNaN(parseFloat((lines[i].toString()).split(',')[4])))
                return alert("Error: Invalid .csv column format.");
            if ((lines[i].toString()).split(',')[1] == freqFilter) { //default 150.671875
                dataArray1.push({ intensity: parseFloat((lines[i].toString()).split(',')[2]), lat: parseFloat((lines[i].toString()).split(',')[3]), lng: parseFloat((lines[i].toString()).split(',')[4]) });
                if (dataArray1.length == 1) //find minimum
                    localMin = dataArray1[0].intensity;
                localMin = Math.min(dataArray1[dataArray1.length - 1].intensity, localMin);
            }
        }
        if (dataArray1.length == 0)
            return alert("Error: No data found on frequency: " + freqFilter + "\nTry a more precise or exact number.");
        var temp = 0;
        for (var i = 0; i < dataArray1.length; i++) { //convert into intensity
            temp = dataArray1[i].intensity + Math.abs(localMin);
            max1 = Math.max(max1,temp);
            dataArray1[i].intensity = temp;
        }
        generate();
    };
    reader.readAsText(file);
}

function begin3() { //three file upload
    typeFlag = 1;
    dataArray1 = []; dataArray2 = []; dataArray3 = [];
    var file1 = document.getElementById('u2').files[0];
    var file2 = document.getElementById('u3').files[0];
    var file3 = document.getElementById('u4').files[0];
    var freqFilter = document.getElementById('f2').value;

    var reader1 = new FileReader(); var reader2 = new FileReader(); var reader3 = new FileReader();
    reader1.onload = function (progressEvent) {
        // Entire file
        //console.log(this.result);
        // By lines
        var allTextLines = this.result.split('\n');
        var lines = [];
        for (var i = 0; i < allTextLines.length; i++) {
            var data = allTextLines[i].split(';');
            var tarr = [];
            for (var j = 0; j < data.length; j++) {
                tarr.push(data[j]);
            }
            lines.push(tarr);
        }
        //console.log((lines[1].toString()).split(',')[2]); //second row, third column
        //find frequency specific intensity while finding local minimum intensity
        var localMin = 0;
        for (var i = 1; i < lines.length; i++) {
            if (isNaN((lines[i].toString()).split(',')[1])||isNaN(parseFloat((lines[i].toString()).split(',')[2]))||isNaN(parseFloat((lines[i].toString()).split(',')[3]))||isNaN(parseFloat((lines[i].toString()).split(',')[4])))
                return alert("File 1: Invalid .csv column format.");
            if ((lines[i].toString()).split(',')[1] == freqFilter) { //default 150.671875
                dataArray1.push({ intensity: parseFloat((lines[i].toString()).split(',')[2]), lat: parseFloat((lines[i].toString()).split(',')[3]), lng: parseFloat((lines[i].toString()).split(',')[4]) });
                if (dataArray1.length == 1) //find minimum
                    localMin = dataArray1[0].intensity;
                localMin = Math.min(dataArray1[dataArray1.length - 1].intensity, localMin);
            }
        }
        if (dataArray1.length == 0)
            return alert("No data found on frequency: " + freqFilter + " for .csv file 1.\n");
        for (var i = 0; i < dataArray1.length; i++) //convert into intensity
            dataArray1[i].intensity = dataArray1[i].intensity + Math.abs(localMin);
        //generate();
    };

    reader2.onload = function (progressEvent) {
        // Entire file
        //console.log(this.result);
        // By lines
        var allTextLines = this.result.split('\n');
        var lines = [];
        for (var i = 0; i < allTextLines.length; i++) {
            var data = allTextLines[i].split(';');
            var tarr = [];
            for (var j = 0; j < data.length; j++) {
                tarr.push(data[j]);
            }
            lines.push(tarr);
        }
        //console.log((lines[1].toString()).split(',')[2]); //second row, third column
        //find frequency specific intensity while finding local minimum intensity
        var localMin = 0;
        for (var i = 1; i < lines.length; i++) {
            if (isNaN((lines[i].toString()).split(',')[1])||isNaN(parseFloat((lines[i].toString()).split(',')[2]))||isNaN(parseFloat((lines[i].toString()).split(',')[3]))||isNaN(parseFloat((lines[i].toString()).split(',')[4])))
                return alert("File 2: Invalid .csv column format.");
            if ((lines[i].toString()).split(',')[1] == freqFilter) { //default 150.671875
                dataArray2.push({ intensity: parseFloat((lines[i].toString()).split(',')[2]), lat: parseFloat((lines[i].toString()).split(',')[3]), lng: parseFloat((lines[i].toString()).split(',')[4]) });
                if (dataArray2.length == 1) //find minimum
                    localMin = dataArray2[0].intensity;
                localMin = Math.min(dataArray2[dataArray2.length - 1].intensity, localMin);
            }
        }
        if (dataArray2.length == 0)
            return alert("No data found on frequency: " + freqFilter + " for .csv file 2.\n", freqFilter);
        for (var i = 0; i < dataArray2.length; i++) //convert into intensity
            dataArray2[i].intensity = dataArray2[i].intensity + Math.abs(localMin);
        //generate();
    };

    reader3.onload = function (progressEvent) {
        // Entire file
        //console.log(this.result);
        // By lines
        var allTextLines = this.result.split('\n');
        var lines = [];
        for (var i = 0; i < allTextLines.length; i++) {
            var data = allTextLines[i].split(';');
            var tarr = [];
            for (var j = 0; j < data.length; j++) {
                tarr.push(data[j]);
            }
            lines.push(tarr);
        }
        //console.log((lines[1].toString()).split(',')[2]); //second row, third column
        //find frequency specific intensity while finding local minimum intensity
        var localMin = 0;
        for (var i = 1; i < lines.length; i++) {
            if (isNaN((lines[i].toString()).split(',')[1])||isNaN(parseFloat((lines[i].toString()).split(',')[2]))||isNaN(parseFloat((lines[i].toString()).split(',')[3]))||isNaN(parseFloat((lines[i].toString()).split(',')[4])))
                return alert("File 3: Invalid .csv column format.");
            if ((lines[i].toString()).split(',')[1] == freqFilter) { //default 150.671875
                dataArray3.push({ intensity: parseFloat((lines[i].toString()).split(',')[2]), lat: parseFloat((lines[i].toString()).split(',')[3]), lng: parseFloat((lines[i].toString()).split(',')[4]) });
                if (dataArray3.length == 1) //find minimum
                    localMin = dataArray3[0].intensity;
                localMin = Math.min(dataArray3[dataArray3.length - 1].intensity, localMin);
            }
        }
        if (dataArray3.length == 0)
            return alert("No data found on frequency: " + freqFilter + " for .csv file 3.\n");
        for (var i = 0; i < dataArray3.length; i++) //convert into intensity
            dataArray3[i].intensity = dataArray3[i].intensity + Math.abs(localMin);
        if (dataArray1.length != dataArray2.length || dataArray2.length != dataArray3.length || dataArray3.length != dataArray1.length)
            return alert("Error: Data file lengths do not match.");
        generate();
    };

    reader1.readAsText(file1);
    reader2.readAsText(file2);
    reader3.readAsText(file3);
}

//*************** BEGIN ****************/
function initMap() { //initialize map overlays
    loadMap = new google.maps.Map(document.getElementById('map'), {
        center: mapCenter,
        zoom: mapZoom,
        mapTypeId: mapType
    });
    heatmap = new google.maps.visualization.HeatmapLayer();
    dataPoints = new google.maps.Polyline({
        geodesic: true,
        icons: [{icon: {path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW}, offset:'50%', repeat: '20px'}], //repeat --> freezes program if .csv data is incorrect
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });
    avgMarker = new google.maps.Marker({
        title: "Average Location"
    });
    dataPoints.setMap(loadMap);
    heatmap.setMap(loadMap);
    avgMarker.setMap(loadMap);
}
function generate() {
    /*mapCenter = loadMap.getCenter();
    mapZoom = loadMap.getZoom();
    mapType = loadMap.getMapTypeId();
    loadMap.setCenter(mapCenter);
    loadMap.setZoom(mapZoom);
    loadMap.setMapTypeId(mapType);
    loadMap = new google.maps.Map(document.getElementById('map'), {
        center: mapCenter,
        zoom: mapZoom,
        mapTypeId: mapType
    });*/
    var polymapData = new Array(); //array of positional data
    var heatmapData = new Array(); //array of heatmap data, may be removed in future
    var bearingArray = new Array(); //array of bearing lines starting from second datapoint taken
    var intersectionData = new Array(); //array of intersection points

    //wipe previous bearings
    if (allBearings.length > 0){
        for (i = 0; i < allBearings.length; i++)
        {
            allBearings[i].setMap(null);  //bearing overlay per point
            allError1[i].setMap(null);
            allError2[i].setMap(null);
        }
        allBearings = []; allError1 = []; allError2 = []; //cleanup previous bearing lines
    }

    //actual values
    if (typeFlag == 0) //single receiver
    {
        for (i = 0; i < dataArray1.length; i++) {
            singleArrayConversion(polymapData, heatmapData, dataArray1[i].lat, dataArray1[i].lng, dataArray1[i].intensity);
        }
        averageData(dataArray1);
    }
    else //three receivers
    {
        var reducedLength = Math.min(Math.min(dataArray1.length,dataArray2.length),dataArray3.length);
        for (i = 0; i < reducedLength; i++) //!!!!!!!!!!!need to change if data of each file vaires in length!!!!!!!!!!
        {
            addToArrays(polymapData, bearingArray, dataArray1[i].lat, dataArray1[i].lng, dataArray1[i].intensity, dataArray2[i].intensity, dataArray3[i].intensity);
        }
        
        calculateHeatData(bearingArray, heatmapData, intersectionData); //(array of bearings,heatmap)
        if (intersectionData.length > 0) {
            averageData(intersectionData);
            //medianData(intersectionData);
        }

        if (tLines == 1 && allBearings.length > 0)
        {
            for (i = 0; i < allBearings.length; i++)
            {
                allBearings[i].setMap(loadMap);  //bearing overlay per point
                allError1[i].setMap(loadMap);
                allError2[i].setMap(loadMap);
            }
        }
    }

    //initialize polyline overlay
    dataPoints.setPath(polymapData);

    //initialize heatmap overlay
    heatmap.setData(heatmapData);
    
    var radiusSize = tRadius * 50;
    if (tOpacity == 1)
    {
        heatmap.setOptions({
            //dissipating: true,
            radius: radiusSize,
            opacity: 0.5
        });
    }
    else
    {
        heatmap.setOptions({
            radius: radiusSize,
            opacity: 0
        });
    }
    polymapData = []; heatmapData = []; bearingArray = []; intersectionData = []; //manual deallocation
}

function singleArrayConversion(poly, heat, lat, lng, intensity) { //add datapoints for single receiver
    poly.push(new google.maps.LatLng(lat, lng));
    var scaledIntensity = intensity + 0.001 / max1;//intensity proportional to dataset intensity (0 - 1 scale)
    heat.push({ location: new google.maps.LatLng(lat, lng), weight: scaledIntensity });
}

function addToArrays(poly, bear, lat, lng, frontF, backRF, backLF) { //add datapoints to position and bearing arrays for three receivers
    poly.push(new google.maps.LatLng(lat, lng)); //general path

    if (poly.length > 1) //generate bearing line from datapoint + previous datapoint
    {
        //!!!!!!Improvement: change lineLength to be calculated from receiver intensity instead of constant!!!!!!!!
        //var lineLength = 0.5; //~~~~~constant to control length of bearing line, higher values = more error due to spherical earth~~~~~~
        var absAngle = findAbsoluteBearing(frontF, backRF, backLF, poly[poly.length - 2], poly[poly.length - 1]); //radians

        //Find Bearing Line, !!!!!!!!!!!!may need incorporate exclusion if all three intensities are the same!!!!!!!!!!!!
        var bLat = lat + lineLength * Math.sin(absAngle); //y
        var bLng = lng + lineLength * Math.cos(absAngle); //x
        bear.push({ x1: lng, y1: lat, x2: bLng, y2: bLat }); //add bearing line to array of bearing lines for intersection calculation later
        
        if (tLines == 1)
        {
            //Form bearing line
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

            //store polylines
            allBearings.push(bearingLine);
            allError1.push(errorLine1);
            allError2.push(errorLine2);

            tempArray = [];
            eArray1 = [];
            eArray2 = [];
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
                var impact = lineLength / Math.min(distance(intersect, bearA[i]), distance(intersect, bearA[j])); //find line with minimum distance from intersection
                heat.push({ location: new google.maps.LatLng(intersect.y, intersect.x), weight: 0.5 }); //!!!may need to calibrate weight to number of points!!!
                interData.push({ lat: intersect.y, lng: intersect.x, intensity: impact });
            }
        }
    }
}

//find the weighted average of intersection data and plot it, or regular receiver data
function averageData(interArray) {
    var xNumer = 0; //mw :weighted average of x where summation(mw/w)
    var yNumer = 0; //weighted average of y
    var denom = 0;
    for (i = 0; i < interArray.length; i++) {
        xNumer = xNumer + interArray[i].intensity * interArray[i].lng;
        yNumer = yNumer + interArray[i].intensity * interArray[i].lat;
        denom = denom + interArray[i].intensity;
    }
    var averageIntersection = new google.maps.LatLng(yNumer / denom, xNumer / denom); //data point of where average intersection is displayed
    //console.log(interArray[1].intensity);
    //initialize average point display
    avgMarker.setOptions({
        position: averageIntersection
    });
    loadMap.setOptions({
        center: averageIntersection
    });
}

function medianData(interArray) { //take median intersection point of dataset, O(nlogn)
    //sorted intersection coordinates
    var sortedX = mergeSort(interArray.map(a => a.lng));
    var sortedY = mergeSort(interArray.map(a => a.lat));
    var lSumX = []; var lSumY = [];//lefthand residual sum
    var rSumX = []; var rSumY = [];//righthand residual sum
    var totalSumX = []; var totalSumY = []; //residual sum of sorted array
    lSumX[0] = 0; lSumY[0] = 0; rSumX[interArray.length - 1] = 0; rSumY[interArray.length - 1] = 0;
    for (i = 1; i < interArray.length; i++) //lefthand sum for each point
    {
        lSumX[i] = (sortedX[i] - sortedX[i - 1]) * i;
        lSumX[i] += lSumX[i - 1];
        lSumY[i] = (sortedY[i] - sortedY[i - 1]) * i;
        lSumY[i] += lSumY[i - 1];
    };

    for (i = interArray.length - 2; i >= 0; i--) //righthand sum for each point
    {
        rSumX[i] = (sortedX[i + 1] - sortedX[i]) * (interArray.length - (i + 1));
        rSumX[i] += rSumX[i + 1];
        rSumY[i] = (sortedY[i + 1] - sortedY[i]) * (interArray.length - (i + 1));
        rSumY[i] += rSumY[i + 1];
    };
    for (i = 0; i < interArray.length; i++) {
        totalSumX[i] = lSumX[i] + rSumX[i];
        totalSumY[i] = lSumY[i] + rSumY[i];
    }
    var minCost = totalSumX[0] + totalSumY[0];
    var minIter = 0;
    for (i = 1; i < interArray.length; i++) {
        cost = totalSumX[i] + totalSumY[i];
        if (cost < minCost) {
            minCost = totalSumX[i] + totalSumY[i];
            minIter = i;
        }
    }

    var medianIntersection = new google.maps.LatLng(sortedY[minIter], sortedX[minIter]);
    //initialize median point display
    //console.log(sortedX[minIter]);
    var medMarker = new google.maps.Marker({
        position: medianIntersection,
        title: "Median Location"
    });
    medMarker.setMap(loadMap);
}

// credits to Alexander Kondov for mergesort algorithm function
function mergeSort(arr) {
    if (arr.length === 1) {
        // return once we hit an array with a single item
        return arr
    }

    const middle = Math.floor(arr.length / 2) // get the middle item of the array rounded down
    const left = arr.slice(0, middle) // items on the left side
    const right = arr.slice(middle) // items on the right side

    return merge(
        mergeSort(left),
        mergeSort(right)
    )
}

// compare the arrays item by item and return the concatenated result
function merge(left, right) {
    let result = []
    let indexLeft = 0
    let indexRight = 0

    while (indexLeft < left.length && indexRight < right.length) {
        if (left[indexLeft] < right[indexRight]) {
            result.push(left[indexLeft])
            indexLeft++
        } else {
            result.push(right[indexRight])
            indexRight++
        }
    }

    return result.concat(left.slice(indexLeft)).concat(right.slice(indexRight))
}

//credits to Paul Bourke for intersection point algorithm function
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
