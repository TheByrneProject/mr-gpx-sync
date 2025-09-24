# mr-gpx-sync
A library and app used to sync a gpx track recorded alongside a video.

This project is a refactor from a previous version of a gpx syncer.  In active development and will flush out a full
readme and video tutorial once further along.
See <https://mrgpxsync.com> for the current live version.

# Usage
First open the GPX file by clicking on the top left button.  This will load the GPX file and display the track on the map.
Next, open the video in the menu on the left middle of the screen.  This will load the video and display the controls.  The
video will automatically seek to the first point in the GPX file.  You can then play the video and it will automatically
seek to the next point in the GPX file.  You can also manually seek to a point in the video by clicking on the map or
the chart.  The chart will display the pace of the track and the elevation.

# Development
The project is structured into a library and an app.  The library contains most of the fundamental building blocks for
the application, but is intended to be used in other applications and laid out as desired.
The mr-gpx-sync-app is a application that is hosted at <https://mrgpxsync.com> and is the primary user interface for the
library.  It is intended to be a standalone application that can be used to test and demo the library.

# Building
To run locally, in npm scripts, run 'build:lib', then 'start' to launch the app at localhost:4200.
