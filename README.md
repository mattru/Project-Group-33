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

In the page, you are able to upload the file from the previous section. You may either choose to use a single receiver or three receivers, and depending on which you choose the application will allow you to upload one or three .csv files.
