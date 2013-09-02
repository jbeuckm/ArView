### An Alloy Widget for Augmented Reality inspired by... ###
[ParmaVision: A sample Titanium AR App](https://github.com/jeffbonnes/parmavision) by Jeff Bonnes

The purpose of this "port" is to create an Alloy Widget and keep working on the functionality of Jeff's Titanium AR example.

## Main Differences ##

* Alloy widget vs. pure Titanium (increasingly Alloy at least)

* Jeff wrapped 360 degrees with a series of overlay views that had the AR tags placed on them. This widget uses one overlay view and moves AR tags within that one view.


## Usage ##

```javascript
	var arWin = require('/alloy').createWidget('ArView', null, {
		pois : [],					// place description objects (see below)
		overlay : null,
		maxDistance : 50000,		// in meters
		initialLocation: {
			latitude: 44,
			longiude: -93
		},
		showDebugView: true,		// show orientation variables center screen
		staticLocation: true		// lock to the initial location
	}).getView();
```

   * `pois' is an array of objects representing places to be tagged in the view.
   
The poi description objects in the array take this form:
```javascript
	{
		title: "My Place's Name",
		image: "place_icon.png",
		latitude: place.geometry.location.lat,
		longitude: place.geometry.location.lng
	}   
```
   
   * `overlay' is a view, possibly a title view, etc. that will sit on top of the ArView.
   
## Example App ##

For an example of how to use this widget, please see [ArView-Example-App](https://github.com/jbeuckm/ArView-Example-App).
