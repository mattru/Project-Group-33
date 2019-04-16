## The Autonomous Animal Locator

The Autonomous Animal Locator, or TAAL, project is an endeavor to simplify the process for gathering data about animals out in the field. Typically, a GPS device with a large battery is fixed to animals so that they can be monitored consistently from any remote location; however, these devices have too large a footprint to be attached to small animals like the marbled murrelet. The solution to this problem is to instead use VHF transmitters, which send their location over a several second interval out in all directions and have a much smaller overall footprint.

This project includes software that when combined with the appropriate hardware, is capable of detecting and tracking animals equipped with VHF transmitters.

### Installation Guide

There are two components to this project: The raspberry Pi and the electron desktop app.

For information on how to configure the raspberry Pi, see [RasPiReadMe](RasPiReadMe.md).

To build the electron app on any desktop environment - Windows or Linux - change to the taal-app directory and view the [README](taal-app/README.md)

### User Guide

##### Electron

To use the electron app, first you need to orient yourself to the three main pages of the application - FlightPlan, Data, and Track. You will see this pages as buttons on the left-hand sidebar.

###### FlightPlan

FlightPlan is responsible for planning a flight and exporting that plan to a format accepted by QGroundControl. To create a flight plan, first select the square tool and drag on the map. This will generate a set of lines depending on your zoom level, showing the actual flight path when zoomed in enough. The intention for this flight planning tool is for planning large flights, and so works best large, city-scale sized flights.

###### Data

At the request of the client, a data page was added so that a researcher may view the data separate from tracking them. You may input either the recorded VHF data in .csv format or the corresponding GPS data in .nmea. This is where you can combine the two file formats into a single file containing the GPS location of the plane at each recorded timestamp.

###### Track

In the page, you are able to visually display .csv files created from the Data page. If the Data page currently has a combined data file, you can choose to display the data immediately using the "Create map using stored data" button. Otherwise, you may upload .csv files consisting of the format: 5 columns containing UTC time, frequency, db level, latitude, and longitude respectively. You may choose to upload a single .csv file or three .csv files depending on how many receivers were used during data collection. A drop-down select menu allows you to set which receiver format you used. After pressing either of the create map buttons, a graphical display shall be loaded in to illustrate the data. The levels of intensity are displayed using heatmaps, where the red areas represent the highest level of influence. The flightpath data is illustrated in red lines. The average location is displayed by a marker. If using a 3-receiver dataset, bearing lines are displayed in blue while error lines are displayed in green. Buttons on the sidebar enable you to toggle the different features of the map to your preference. In the case that nothing appears, double-check to ensure the .csv file is correctly formatted, zoom out to find the marker position, and fiddle with the display buttons until the data shows up.
