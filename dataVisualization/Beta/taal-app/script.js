var tableDataArray = []; //filler
var map;
var pathLines = 0;
var bearingLines = 0;
var errorLines = 0;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 44.5646, lng: -123.2620},
        zoom: 14
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

    //import data values: (n items)
    //temporary testing values
    addToArrays(polymapData,bearingArray,44.572,-123.237,0,0,0); //(iteration,polymap, lat, lng, frontIntensity,backRInt,backLInt)
    addToArrays(polymapData,bearingArray,44.582,-123.257,0,0,2); 
    addToArrays(polymapData,bearingArray,44.592,-123.227,0,300,0);
    addToArrays(polymapData,bearingArray,44.542,-123.257,0,0,300);
    addToArrays(polymapData,bearingArray,44.532,-123.257,0,0,300);

    //debug:
    /*testAddToArraysAbs(polymapData,bearingArray,44.572,-123.237,90);
    testAddToArraysAbs(polymapData,bearingArray,44.582,-123.257,45); 
    testAddToArraysAbs(polymapData,bearingArray,44.592,-123.227,120);*/

    //data processing to triangulation:
    calculateHeatData(bearingArray,heatmapData,intersectionData); //(array of bearings,heatmap)
    averageData(intersectionData);
    medianData(intersectionData);

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
    dataPoints.setMap(map);

    //initialize heatmap overlay
    var heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData
    });

    heatmap.setOptions({
        //dissipating: true,
        radius: 100,
        opacity: 0.5
    });
    heatmap.setMap(map);
    //heatmap.set('opacity', heatmap.get('opacity') ? null : 0.5); //opacity 0.5 ****constants, might need to manipulate****
    //heatmap.set('radius', heatmap.get('radius') ? null : 50); //overall radius
    /*google.maps.event.addListener(map, 'zoom_changed', function () {
        heatmap.setOptions(radius: map.getZoom());
    });*/
};

function addToArrays(poly,bear,lat,lng,frontF,backRF,backLF) { //add datapoints to position and bearing arrays
    poly.push(new google.maps.LatLng(lat, lng)); //general path

    if (poly.length > 1) //generate bearing line from datapoint + previous datapoint
    {
        //!!!!!!Improvement: change lineLength to be calculated from receiver intensity instead of constant!!!!!!!!
        var lineLength = 0.1; //~~~~~constant to control length of bearing line, higher values = more error due to spherical earth~~~~~~
        var absAngle = findAbsoluteBearing(frontF,backRF,backLF,poly[poly.length-2],poly[poly.length-1]); //radians

        //Find Bearing Line
        var bLat = lat + lineLength * Math.sin(absAngle); //y
        var bLng = lng + lineLength * Math.cos(absAngle); //x
        bear.push({x1: lng, y1: lat, x2: bLng, y2: bLat}); //add bearing line to array of bearing lines for intersection calculation later
        //form bearing line
        var tempArray = new Array(); 
        tempArray.push(new google.maps.LatLng(lat, lng));
        tempArray.push(new google.maps.LatLng(bLat, bLng));
        
        //Find Error Lines
        var eConst = 1.96; //error line degree constant
        var eLat1 = lat + lineLength * Math.sin(absAngle + eConst*Math.PI/180);
        var eLat2 = lat + lineLength * Math.sin(absAngle - eConst*Math.PI/180);
        var eLng1 = lng + lineLength * Math.cos(absAngle + eConst*Math.PI/180);
        var eLng2 = lng + lineLength * Math.cos(absAngle - eConst*Math.PI/180);
        
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
            strokeOpacity: 1.0,
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
        bearingLine.setMap(map);  //bearing overlay per point
        errorLine1.setMap(map);
        errorLine2.setMap(map);
    }
}

//insert intensities from 3 recievers, calculate bearing based off of previous point
function findAbsoluteBearing(frontF,backRF,backLF,prevPoint,curPoint) { //float,float,float,arrayitem[n-1],arrayitem[n]
    //~~~~~~~~change angles if the physical position of receivers is not an equilateral triangle (currently angles are ccw)~~~~~~~~
    var frontAngle = 0*Math.PI/180; //            F
    var backRAngle = 240*Math.PI/180; //         / \
    var backLAngle = 120*Math.PI/180; //        L---R

    //will need a way to deal with bearing when drone is above transmitter 
    var relativeBearing = Math.atan2((frontF*Math.sin(frontAngle)+backRF*Math.sin(backRAngle)+backLF*Math.sin(backLAngle)),(frontF*Math.cos(frontAngle)+backRF*Math.cos(backRAngle)+backLF*Math.cos(backLAngle)));
    var absoluteDirection = Math.atan2((curPoint.lat() - prevPoint.lat()),(curPoint.lng() - prevPoint.lng()));
    
    return (absoluteDirection + relativeBearing); //radians
    //debug:
    //return (absoluteDirection + relativeBearing)*180/Math.PI;
    //return relativeBearing*180/Math.PI;
    //return absoluteDirection*180/Math.PI;
}

function calculateHeatData(bearA,heat,interData) { //find all intersections between bearing lines in O(n^2) time
    for (i=0; i < bearA.length-1; i++) //i = one item
    {
        for (j=i+1; j < bearA.length; j++) //j = another item
        {
            var intersect = line_intersect(bearA[i].x1,bearA[i].y1,bearA[i].x2,bearA[i].y2,
                bearA[j].x1,bearA[j].y1,bearA[j].x2,bearA[j].y2);

            if (intersect != false)
            {
                heat.push({location: new google.maps.LatLng(intersect.y,intersect.x), weight: 0.5}); //!!!may need to calibrate weight to number of points!!!
                interData.push({y: intersect.y,x: intersect.x});
            }
        }
    }
}

//find the average of intersection data and store it as the average value
function averageData(interArray) {
    if (interArray.length != 0)
    {
        var x = 0;
        var y = 0;
        for (i = 0; i < interArray.length; i++) 
        {
            x = x + interArray[i].x;
            y = y + interArray[i].y;
        }
        x = x / interArray.length;
        y = y / interArray.length;
        var averageIntersection = new google.maps.LatLng(y,x); //data point of where average intersection is displayed
        //initialize average point display
        var avgMarker = new google.maps.Marker({
            position: averageIntersection,
            title:"Average Location"
        });
        avgMarker.setMap(map);
    }
}
/*
function medianData(interArray) { //take median intersection of dataset
    var n = Math.round(interArray.length / 2);
    var medianIntersection = new google.maps.LatLng(interArray[n].y,interArray[n].x);
    //initialize average point display
    var avgMarker = new google.maps.Marker({
        position: medianIntersection,
        title:"Median Location"
    });
    avgMarker.setMap(map);
}*/

function medianData(interArray) { //take median intersection point of dataset, O(n^3) using Oja's simplex median
    var trisums = new Array();
    var tsum = 0;
    var triA = 0;
    //var triangles = 0; //debug
    //find sum of the area of all triangles per point
    for (i = 0; i < interArray.length; i++) // i = point of interest
    {
        for (j = 0; j < interArray.length; j++) // j = 2nd point of triangle
        {
            if (i != j)
            {
                for (k = 0; k < interArray.length; k++) // k = 3rd point of triangle
                {
                    if (i != j && j != k && k != i)
                    {
                        triA = triangle_area(interArray[i].x,interArray[i].y,interArray[j].x,interArray[j].y,interArray[k].x,interArray[k].y);
                        tsum = triA + tsum;
                        //triangles++;
                        //console.log(i,j,k);
                    }
                }
            }   
        }
        trisums.push({point:i,sum:(tsum/2)}); //double the number of areas due to repeats, divide by 2
        tsum = 0;
        //console.log("break"); //next triangle point sum
    }
    //console.log(triangles/2);
    var min = trisums[0].sum; //minimum sum of triangles
    var minIndex = trisums[0].point; //which point has the minimum triangle sum
    for (i = 1; i < trisums.length; i++) { //find point with minimum triangle sum
        if (trisums[i].sum < min) {
            min = trisums[i].sum;
            minIndex = trisums[i].point; //update to new point
        }
    }

    var medianIntersection = new google.maps.LatLng(interArray[minIndex].y,interArray[minIndex].x);
    //initialize median point display
    var medMarker = new google.maps.Marker({
        position: medianIntersection,
        title:"Median Location"
    });
    medMarker.setMap(map);
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
    return {x, y}
}

function triangle_area(x1, y1, x2, y2, x3, y3) { //area of triangle from 3 vertices
    return Math.abs(0.5*(x1*(y2-y3)+x2*(y3-y1)+x3*(y1-y2)))
}

//filler*****************************
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

function testAddToArraysAbs(poly,bear,lat,lng,abs) { //add datapoints to position and bearing arrays from absolute bearing (degrees from unit circle)
    poly.push(new google.maps.LatLng(lat, lng)); //general path

    if (poly.length > 1) //generate bearing line from datapoint + previous datapoint
    {
        //!!!!!!Improvement: change lineLength to be calculated from receiver intensity instead of constant!!!!!!!!
        var lineLength = 0.1; //~~~~~constant to control length of bearing line, higher values = more error due to spherical earth~~~~~~
        var absAngle = abs*Math.PI/180; //radians

        //Find Bearing Line
        var bLat = lat + lineLength * Math.sin(absAngle); //y
        var bLng = lng + lineLength * Math.cos(absAngle); //x
        bear.push({x1: lng, y1: lat, x2: bLng, y2: bLat}); //add bearing line to array of bearing lines for intersection calculation later
        //form bearing line
        var tempArray = new Array(); 
        tempArray.push(new google.maps.LatLng(lat, lng));
        tempArray.push(new google.maps.LatLng(bLat, bLng));
        
        //Find Error Lines
        var eConst = 1.96; //error line degree constant
        var eLat1 = lat + lineLength * Math.sin(absAngle + eConst*Math.PI/180);
        var eLat2 = lat + lineLength * Math.sin(absAngle - eConst*Math.PI/180);
        var eLng1 = lng + lineLength * Math.cos(absAngle + eConst*Math.PI/180);
        var eLng2 = lng + lineLength * Math.cos(absAngle - eConst*Math.PI/180);
        
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
            strokeOpacity: 1.0,
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
        bearingLine.setMap(map);  //bearing overlay per point
        errorLine1.setMap(map);
        errorLine2.setMap(map);
    }
}