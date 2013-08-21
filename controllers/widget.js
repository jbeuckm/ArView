var args = arguments[0] || {};

var acc = require(WPATH('accelerometer'));
var location_utils = require(WPATH("location_utils"));


var deviceLocation = null;
var deviceBearing = 1;

var isAndroid = Ti.Platform.osname == "android";

var screenWidth = Ti.Platform.displayCaps.platformWidth;
var screenHeight = Ti.Platform.displayCaps.platformHeight;
var halfScreenHeight = screenHeight / 2;
var halfScreenWidth = screenWidth / 2;


var MAX_POI_COUNT = 25;

var limitLeft = -halfScreenHeight - 100;
var limitRight = halfScreenHeight + 100;

var lowY = halfScreenWidth * .8;
var highY = -halfScreenWidth * .8;
var yRange = highY - lowY;


$.debugOverlay.visible = false;

$.overlay.height = 1.2 * screenHeight;
$.overlay.width = 1.2 * screenHeight;
// view large enough to rotate 90deg without seeing edges
$.arContainer.height = 1.2 * screenHeight;
$.arContainer.width = 1.2 * screenHeight;

// Setup the location  properties for callbacks
Ti.Geolocation.headingFilter = 1;
Ti.Geolocation.showCalibration = false;

if (isAndroid) {
	Ti.Geolocation.Android.accuracy = Ti.Geolocation.ACCURACY_HIGH;
	Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_HIGH;
}
else {
	Ti.Geolocation.distanceFilter = 10;
	Ti.Geolocation.preferredProvider = "gps";
	Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_NEAREST_TEN_METERS;
	Ti.Geolocation.purpose = "Augmented Reality";
}

var yOffset = 0;
var stability = .6;
var volatility = 1 - stability;
var PI_2 = Math.PI/2;

var devicePitch = 0; // from 90 (looking straight up) to -90 (looking straight down)
var deviceRoll = 0;

function accelerationHandler(e) {

	devicePitch = e.z * 90;
	deviceRoll = location_utils.radians2Degrees(Math.atan2(e.y, e.x));

	$.pitchLabel.text = devicePitch.toPrecision(3);
	$.rollLabel.text = deviceRoll.toPrecision(3);
	
	yOffset = stability * yOffset + volatility * 2*devicePitch;
	
	updatePoiViews();
}
acc.setupCallback(accelerationHandler);
acc.start();


function showAR() {
	var cameraTransform = Ti.UI.create2DMatrix();
	cameraTransform = cameraTransform.scale(1);

	Ti.Geolocation.addEventListener('heading', headingCallback);
	Ti.Geolocation.addEventListener('location', locationCallback);
	Ti.Media.showCamera({
		success : function(event) {
		},
		cancel : function() {
			Ti.API.error('android user cancelled open ar view');
		},
		error : function(error) {
			Ti.API.error('unable to open camera view');
		},
		mediaTypes : [Ti.Media.MEDIA_TYPE_VIDEO, Ti.Media.MEDIA_TYPE_PHOTO],
		showControls : false,
		autohide : false,
		autofocus : "off",
		animated : false,
		overlay : $.overlay,
		transform: cameraTransform
	});
}


if (args.overlay) {
	$.overlay.add(args.overlay);
}



// iPhone camera sees about 30 degrees left to right
var FIELD_OF_VIEW_HORIZONTAL = 30;

var maxRange = 10000;

if (args.maxDistance) {
	maxRange = args.maxDistance;
}

$.win.addEventListener('open', function() {
	Ti.API.debug('AR Window Open...');
	setTimeout(showAR, 500);
});


if (args.hideCloseButton) {
	$.closeButton.visible = false;
}


deviceLocation = args.initialLocation;


function assignPOIs(_pois) {

	pois = cullDistantPois(_pois, MAX_POI_COUNT);
	
	attachArViewsToPois(pois);

	addPoiViews();
	createRadarBlips();	

	if (deviceLocation && deviceBearing) {
		updateRelativePositions();
	}
}

if (args.pois) {
	assignPOIs(args.pois);
}


function poiClick(e) {
	alert(e);
}


function cullDistantPois(_pois, MAX_COUNT) {

	for (i=0, l=_pois.length; i<l; i++) {
		var poi = _pois[i];
		var d = location_utils.calculateDistance(deviceLocation, poi);
		poi.distance = d;
	}

	if (_pois.length > MAX_COUNT) {
		_pois.sort(function(a, b){
			return a.distance - b.distance;
		});
		
		_pois = _pois.slice(0, MAX_POI_COUNT);
	}

	return _pois;
}


/**
 * Device has indicated a new location
 * @param {Object} e
 */
function locationCallback(e) {

	//default to minneapolis in the simulator
	if (Ti.Platform.model == "Simulator") {
		e.coords = {
			latitude: 44.9769873,
			longitude: -93.2681625,
			speed: 0
		};
	}

	deviceLocation = e.coords;
	
	if (!deviceLocation) {
		Ti.API.warn("location not known. Can't draw pois");
		return;
	}
	else {

		updateRelativePositions();

		for (i=0, l=pois.length; i<l; i++) {
			var poi = pois[i];
			positionRadarBlip(poi);
		}

		updatePoiViews();
	}
};


/**
 * Compass has indicated a new heading
 * 
 * @param {Object} e
 */
function headingCallback(e) {

	deviceBearing = e.heading.trueHeading;

	// REM this if you don't want the user to see their heading
	$.headingLabel.text = Math.floor(deviceBearing) + "\xB0";

	// point the radar view
	$.radarView.transform = Ti.UI.create2DMatrix().rotate(-1 * deviceBearing);
	
	updatePoiViews();
	
	Alloy.Globals.deviceBearing = deviceBearing;
}

var minPoiDistance, maxPoiDistance;
var distanceRange = 1;
var minPoiScale = .7, maxPoiScale = 1.5;
var poiScaleRange = maxPoiScale - minPoiScale;

/**
 * Calculate heading/distance of each poi from deviceLocation
 */
function updateRelativePositions() {
	
	minPoiDistance = Number.MAX_VALUE;
	maxPoiDistance = 0;

	for (i=0, l=pois.length; i<l; i++) {

		var poi = pois[i];
		
		if (poi.view) {

			poi.distance = location_utils.calculateDistance(deviceLocation, poi);
			
			// this would ideally be more of a databinding event
			poi.controller.setDistance(Math.floor(poi.distance)+'m');

			if (poi.distance <= maxRange) {
				
				maxPoiDistance = Math.max(maxPoiDistance, poi.distance);
				minPoiDistance = Math.min(minPoiDistance, poi.distance);
				
				poi.inRange = true;

				poi.bearing = location_utils.calculateBearing(deviceLocation, poi);
				
				positionRadarBlip(poi);

			} 
			else {
				// don't show pois that are beyond maxDistance
				poi.inRange = false;
			}
		}
		/*
		else {
			// don't show pois that don't have views
			poi.inRange = false;
		}
		*/
	}
	
	poiDistanceRange = maxPoiDistance - minPoiDistance;

	// Sort by Distance
	pois.sort(function(a, b) {
		return b.distance - a.distance;
	});
	
	for (i=0, l=pois.length; i<l; i++) {
		pois[i].view.zIndex = i;
	}

}


function updatePoiViews() {
	
	var gimbalTransform = Ti.UI.create2DMatrix();
	$.gimbal.transform = gimbalTransform.rotate(-deviceRoll - 90);

	for (i=0, l=pois.length; i<l; i++) {

		var poi = pois[i];

		if (poi.inRange) {

			poi.blip.visible = true;

			var horizontalPositionInScene = horizontalPositionFromBearing(poi.bearing);

			if ((horizontalPositionInScene > limitLeft) && (horizontalPositionInScene < limitRight)) {
				poi.view.visible = true;

				// Apply the transform
				var transform = Ti.UI.create2DMatrix();

				var distanceRank = (poi.distance - minPoiDistance) / poiDistanceRange;

				var y = lowY + distanceRank * yRange + yOffset;
				// this translation is from the center of the screen
Ti.API.info("positioning poi "+poi.latitude+", "+poi.longitude+" ("+poi.distance+") to "+horizontalPositionInScene+", "+y);
//				transform = transform.translate(horizontalPositionInScene, 0);
				transform = transform.translate(horizontalPositionInScene, y);


				var scale = maxPoiScale - distanceRank * poiScaleRange;
				transform = transform.scale(scale);

				poi.view.transform = transform;
				
			}
			else {
				poi.view.visible = false;
			}

		}
		else {
			poi.view.visible = false;
			poi.blip.visible = false;
		}
	}
}


function addPoiViews() {
	
	for (i=0, l=pois.length; i<l; i++) {
		var poi = pois[i];
		if (poi.view) {

			poi.view.addEventListener('click', poiClick);

			poi.view.visible = false;
			poi.inRange = true;
			
			$.arContainer.add(poi.view);
		}
	}
}


function createRadarBlips() {

	for (i=0, l=pois.length; i<l; i++) {

		var poi = pois[i];

		// The Radar Blips ....
		poi.blip = require('/alloy').createWidget('ArView', 'blip', {}).getView();
		positionRadarBlip(poi);		
		// add to blip to the radar
		$.radarView.add(poi.blip);
	}
}


function positionRadarBlip(poi) {

	var rad = location_utils.degrees2Radians(poi.bearing);

	var relativeDistance = poi.distance / (maxRange * 1.2);
	var x = (40 + (relativeDistance * 40 * Math.sin(rad)));
	var y = (40 - (relativeDistance * 40 * Math.cos(rad)));
	
	poi.blip.left = (x - 1) + "dp";
	poi.blip.top = (y - 1) + "dp";
}



/**
 * Calculate the pixel left/right position of a particular bearing, using device bearing.
 * 
 * @param {Object} poiBearing
 */
function horizontalPositionFromBearing(poiBearing) {
	var delta = location_utils.findAngularDistance(poiBearing, deviceBearing);
	return delta * screenWidth / FIELD_OF_VIEW_HORIZONTAL;
}




function attachArViewsToPois(pois) {
	
	for (var i=0; i < pois.length; i++) {
		
		var poi = pois[i];
		
		var c = require('/alloy').createWidget('ArView', 'poi', {
			id: poi.id,
			title: poi.title,
			image: poi.image
		});

		poi.controller = c;

		poi.view = c.getView();
	}
}


function closeAndDestroy() {
	acc.destroy();
	Ti.Geolocation.removeEventListener('heading', headingCallback);
	Ti.Geolocation.removeEventListener('location', locationCallback);
	if (!isAndroid) {
		Ti.Media.hideCamera();
	}
	setTimeout(function() {
		$.win.close();
	}, 500);
}


exports.closeAndDestroy = closeAndDestroy;

exports.cullDistantPois = cullDistantPois;
