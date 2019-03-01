var tableDataArray = [];
var map;


function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 44.5646, lng: -123.2620},
        zoom: 14
    });
    

    var polymapData = new Array(); //array of positional data
    var heatmapData = new Array(); //array of heatmap data, may be removed in future
    var bearingArray = new Array(); //array of bearing lines starting from second datapoint taken

    //******To do: 
    //*****         add data import function here
    //*****         add error lines (magic no. 1.96)
    //*****         add function to take average of intersections after data has been processed
    //*****         add function to manage multiple frequencies' data
    //*****         add test function that accepts absolute bearing data rather than three receiver intensities

    //import data values: (n items)
    //temporary testing values
    addToArrays(0,polymapData,heatmapData,bearingArray,44.572,-123.237,0.5,0,0,0); //(iteration,polymap,heatmap, lat, lng, heatmap weight of datapoint, frontIntensity,backRInt,backLInt)
    addToArrays(1,polymapData,heatmapData,bearingArray,44.582,-123.257,0.3,0,0,2); 
    addToArrays(2,polymapData,heatmapData,bearingArray,44.592,-123.227,0.7,300,0,0);
    addToArrays(3,polymapData,heatmapData,bearingArray,44.542,-123.257,3,0,0,300);

    //data processing to triangulation:
    //calculateHeatData(bearingArray.length,heatmapData); //(n bearings,heatmap)
    


    //debug:
    //console.log(findAbsoluteBearing(0,1,1,polymapData[0],polymapData[1])); //(front, backright, backleft, previousPt, currentPt)
    /*console.log(line_intersect(bearingArray[0].x1,bearingArray[0].y1,bearingArray[0].x2,bearingArray[0].y2,
        bearingArray[1].x1,bearingArray[1].y1,bearingArray[1].x2,bearingArray[1].y2));*/
    console.log(line_intersect(bearingArray[0].x1,bearingArray[0].y1,bearingArray[0].x2,bearingArray[0].y2,
        bearingArray[2].x1,bearingArray[2].y1,bearingArray[2].x2,bearingArray[2].y2));

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

    heatmap.set('opacity', heatmap.get('opacity') ? null : 0.5); //opacity 0.5 ****constants, might need to manipulate****
    heatmap.set('radius', heatmap.get('radius') ? null : 50); //overall radius
    heatmap.setMap(map);
};

function addToArrays(n,poly,heat,bear,lat,lng,w,frontF,backRF,backLF) { //add datapoints to arrays: poly and heat
    poly.push(new google.maps.LatLng(lat, lng)); //general path
    heat.push({location: new google.maps.LatLng(lat, lng), weight: w}); //heatmap data

    if (n != 0) //generate bearing line from datapoint + previous datapoint
    {
        //!!!!!!Improvement: change lineLength to be calculated from receiver intensity instead of constant!!!!!!!!
        var lineLength = 1; //~~~~~constant to control length of bearing line, higher values = more error due to spherical earth~~~~~~
        var absAngle = findAbsoluteBearing(frontF,backRF,backLF,poly[n-1],poly[n]); //radians
        var bLat = lat + lineLength * Math.sin(absAngle); //y
        var bLng = lng + lineLength * Math.cos(absAngle); //x

        bear.push({x1: lng, y1: lat, x2: bLng, y2: bLat});

        var tempArray = new Array();
        tempArray.push(new google.maps.LatLng(lat, lng));
        tempArray.push(new google.maps.LatLng(bLat, bLng));

        var bearingLine = new google.maps.Polyline({ //bearing lines per point
            path: tempArray,
            geodesic: true,
            strokeColor: '#0000FF',
            strokeOpacity: 1.0,
            strokeWeight: 1
        });
        bearingLine.setMap(map);  //bearing overlay per point
    }
}

//possibility: remove current heatmap setup. Add heatmap datapoint for every intersection of bearing lines, regardless of weight.

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
/*
function calculateHeatData(n,heat) {
    
    for (i=0; i < n; i++)
    {
        for (j=0; j < n; j++)
        line_intersect(bearingArray[0].x1,bearingArray[0].y1,bearingArray[0].x2,bearingArray[0].y2,
            bearingArray[2].x1,bearingArray[2].y1,bearingArray[2].x2,bearingArray[2].y2);


        heat.push({location: new google.maps.LatLng(), weight: 0.5});
    }
}*/


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

function line_intersect(x1,y1,x2,y2,x3,y3,x4,y4) //credits to Paul Bourke for intersection point
{
    var ua,ub,denom = (y4-y3)*(x2-x1)-(x4-x3)*(y2-y1);
    if (denom == 0)
        return null;
    ua = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3))/denom;
    ub = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3))/denom;
    return {
        x: x1+ua * (x2-x1),
        y: y1+ub * (y2-y1),
        seg1: ua >= 0 && ua <= 1,
        seg2: ub >= 0 && ub <= 1
    };
}