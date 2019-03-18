function handleFiles(files) {
	// Check for the various File API support.
	if (window.FileReader) {
		// FileReader are supported.
		getAsText(files[0]);
	} else {
		alert('FileReader are not supported in this browser.');
	}
}

function getAsText(fileToRead) {
	var reader = new FileReader();
	// Handle errors load
	reader.onload = loadHandler;
	reader.onerror = errorHandler;
	// Read file into memory as UTF-8      
	reader.readAsText(fileToRead);
}

function loadHandler(event) {
	var csv = event.target.result;
	processData(csv);             
}

function processData(csv){
    var allTextLines = csv.split(/\r\n|\n/);
    var lines = [];
	
	numpeaks = 0;
	var peaks = [];

	
	//first line of csv
	console.log(allTextLines.shift().split(','));
    var keys = ["Time","Frequency","Level"];
	var c = 0;
    while (allTextLines.length) {
        var arr = allTextLines.shift().split(',');
        var obj = {};
        for(var i = 0; i < keys.length; i++){
            obj[keys[i]] = arr[i];
        }
		lines.push(obj);
		
	}

	//console.log(lines[0]["Level"]);
	
	//finds peaks
	for(var k=1;k<lines.length-1;k++){
		if((parseFloat(lines[k]["Level"]) > parseFloat(lines[k-1]["Level"])) && (parseFloat(lines[k]["Level"]) > parseFloat(lines[k+1]["Level"]))){
			//change number for decibal level you want to check over
			if(-10 < parseFloat(lines[k]["Level"])){
				peaks.push(lines[k])
				console.log(peaks[numpeaks]["Level"]);

				var result_display = document.getElementById('answer');
				result_display.innerHTML = '<h2>' + peaks[numpeaks]["Level"] + '</h2>' + document.getElementById('answer').innerHTML; // or whatever formatting

				numpeaks++;
			}
		}
	}
      console.log(numpeaks);//lines[0]["Level"]);
}

function errorHandler(evt) {
	if(evt.target.error.name == "NotReadableError") {
		alert("Canno't read file !");
	}
}
