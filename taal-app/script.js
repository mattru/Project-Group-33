console.log("In script.js")

var map;
var drawingManager;
var selectedShape = null;

document.getElementById("map").addEventListener("", function(event) {
    alert(event);
});

document.getElementById("rectangle_button").addEventListener("click", function(event) {
    //Setting options for the Drawing Tool. In our case, enabling Polygon shape.
		drawingManager.setOptions({
			drawingMode : google.maps.drawing.OverlayType.RECTANGLE,
			drawingControl : true,
			drawingControlOptions : {
				position : google.maps.ControlPosition.TOP_CENTER,
				drawingModes : [ google.maps.drawing.OverlayType.RECTANGLE ]
			},
			rectangleOptions : {
				strokeColor : '#6c6c6c',
				strokeWeight : 3.5,
				fillColor : '#926239',
				fillOpacity : 0.6,
                editable: true,
              draggable: true
            }
		});
		// Loading the drawing Tool in the Map.
		drawingManager.setMap(map);
});

document.getElementById("circle_button").addEventListener("click", function(event) {
    //Setting options for the Drawing Tool. In our case, enabling Polygon shape.
		drawingManager.setOptions({
			drawingMode : google.maps.drawing.OverlayType.CIRCLE,
			drawingControl : true,
			drawingControlOptions : {
				position : google.maps.ControlPosition.TOP_CENTER,
				drawingModes : [ google.maps.drawing.OverlayType.CIRCLE ]
			},
			circleOptions : {
				strokeColor : '#6c6c6c',
				strokeWeight : 3.5,
				fillColor : '#926239',
				fillOpacity : 0.6,
                editable: true,
              draggable: true
            }
		});
		// Loading the drawing Tool in the Map.
		drawingManager.setMap(map);
});

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 44.5646, lng: -123.2620},
        zoom: 14
    });

    drawingManager = new google.maps.drawing.DrawingManager();

    google.maps.event.addListener(drawingManager, 'overlaycomplete', completeRectangle);

    google.maps.event.addListener(map, 'click', clearSelection);

};

function completeRectangle(event) {
    console.log(event);

    let newShape = event.overlay;

    google.maps.event.addListener(newShape, 'click', function() {
        setSelection(newShape);
      });

    drawingManager.setDrawingMode(null);
    drawingManager.setOptions({
        drawingControl: false
    });

    selectedShape = newShape;
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


