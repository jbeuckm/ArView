### An Alloy Widget for Augmented Reality inspired by... ###
[ParmaVision: A sample Titanium AR App](https://github.com/jeffbonnes/parmavision) by Jeff Bonnes

The purpose of this "port" is to create an Alloy Widget and keep working on the functionality of Jeff's Titanium AR example.

## Main Differences ##

* Alloy widget vs. pure Titanium (increasingly Alloy at least)

* Jeff wrapped 360 degrees with a series of overlay views that had the AR tags placed on them. This widget uses one overlay view and moves AR tags within that one view.

* Jeff's example used a static list of POIs near Melbourne. This example loads a Google Places list of POIs near Minneapolis or San Francisco (device or simulator respectively).


## Usage ##

```javascript
	var arWin = require('/alloy').createWidget('ArView', null, {
		pois : pois,
		overlay : $.overlay,
		maxDistance : 500, //in m
		initialLocation: loc
	}).getView();
```

   * `pois' is an array of objects representing places to be tagged in the view.
   * `overlay' is a view, possibly a title view, etc. that will sit on top of the ArView.
   
## Example App ##

To run the example app, you need to replace the Google Places API Key with your key.

1. Head over to [Google's API Console](https://code.google.com/apis/console/) and create a new App. Enable the Places API and copy your new API key.

2. In app/alloy.js, enter your API key for the variable `Alloy.Globals.googleApiKey`
