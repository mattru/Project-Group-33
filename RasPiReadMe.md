This is a link to an image of the Raspberry Pi used on the hex copter.

https://oregonstate.box.com/s/iyu2ns13wxoyi3x356qw1z25cg20hle7

log in info: username: pi, password: Logg3r

The image can be written to a 32GB SD card using Win32Imager, which was used to create the image.

Navigate to /etc/rc.local and uncomment the two lines near the bottom (if not already),
then reboot. Those lines will start the logging on start up. 
Another file to look at is scan.sh in /etc/.

The Raspberry Pi starts logging GPS data and scanning using the rtlsdr receiver around 2 minutes after boot up.
A USB drive will need to be attached to have the data logged to it. The Pi is set to auto mount my USB drive. This may be an issue, to see the data you may need to change where the scripts store the data.
The GPS data comes from a USB GPS device that will be plugged in. I am not sure if any USB GPS will work or if it is setup specifically for the one I have.
But it is based on the uBlox M7 or M8 gps chip.

The RTLSDR script will scan freq 150-151MHz 20 times, then output the data into a csv to /media/USB1. If the sweeps are interrupted the data will not be saved. This means the Pi cannot be powered down until the script has finished. 
20 sweeps has taken me, on average, 16 minutes.
