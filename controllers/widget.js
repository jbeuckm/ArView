var args = arguments[0] || {};

var isAndroid = Ti.Platform.osname == 'android';

var screenWidth = Ti.Platform.displayCaps.platformWidth;
var screenHeight = Ti.Platform.displayCaps.platformHeight;

var halfScreenHeight = screenHeight / 2;
var halfScreenWidth = screenWidth / 2;

var overlay = $.overlay;
overlay.height = screenHeight;
overlay.width = screenWidth;
$.arContainer.height = screenHeight;
$.arContainer.width = screenWidth;


var MIN_Y = Math.floor(screenHeight / 6);
var MAX_Y = Math.floor(screenHeight / 4 * 3);
var DELTA_Y = MAX_Y - MIN_Y;

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
var viewAngle; // from 0 (looking straight up) to PI (looking straight down)

function accelerationHandler(e) {
	viewAngle = Math.atan2(e.y, e.z);
	yOffset = stability * yOffset + volatility * (halfScreenHeight * (viewAngle + PI_2));
	
	updatePoiViews();
}
var acc = require(WPATH('accelerometer'));
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
		overlay : overlay,
		transform: cameraTransform
	});
}



var deviceLocation = null;
var deviceBearing = 1;


var arContainer = $.arContainer;
var headingLabel = $.headingLabel;
var radar = $.radarView;

if (args.overlay) {
	overlay.add(args.overlay);
}



// iPhone camera sees about 30 degrees left to right
var FIELD_OF_VIEW_HORIZONTAL = 30;

var maxRange = 1000;

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


if (args.initialLocation) {
	deviceLocation = args.initialLocation;
}

function assignPOIs(_pois) {

	pois = _pois;

	attachArViewsToPois(pois);

	addPoiViews();
	createRadarBlips();	

	if (deviceLocation && deviceBearing) {
		updateRelativePositions();
	}
}

if (args.pois) {
	
//	Widget.Collections.Poi.reset(args.pois);
//Ti.API.debug(Widget.Collections.Poi);
	
	assignPOIs(args.pois);
}

function poiClick(e) {
	Ti.API.info(e);
}


/**
 * Device has indicated a new location
 * @param {Object} e
 */
function locationCallback(e) {
Ti.API.info('locationCallback()');
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
	headingLabel.text = Math.floor(deviceBearing) + "\xB0";

	// point the radar view
	radar.transform = Ti.UI.create2DMatrix().rotate(-1 * deviceBearing);
	
	updatePoiViews();
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

			poi.distance = calculateDistance(deviceLocation, poi);
			
			// this would ideally be more of a databinding event
			poi.controller.setDistance(Math.floor(poi.distance)+'m');
			
			if (maxRange && (poi.distance <= maxRange) ) {
				
				maxPoiDistance = Math.max(maxPoiDistance, poi.distance);
				minPoiDistance = Math.min(minPoiDistance, poi.distance);
				
				poi.inRange = true;
				poi.bearing = calculateBearing(deviceLocation, poi);
				
				positionRadarBlip(poi);

			} 
			else {
				// don't show pois that are beyond maxDistance
				poi.inRange = false;
			}
		}
		else {
			// don't show pois that don't have views
			poi.inRange = false;
		}
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

var limitLeft = -halfScreenWidth - 100;
var limitRight = +halfScreenWidth + 100;

var lowY = screenHeight/2 * .8;
var highY = -screenHeight/2 * .8;
var yRange = highY - lowY;

function updatePoiViews() {

	for (i=0, l=pois.length; i<l; i++) {

		var poi = pois[i];

		if (poi.inRange) {

			poi.blip.visible = true;

			var horizontalPositionInScene = projectBearingIntoScene(poi.bearing);

			if ((horizontalPositionInScene > limitLeft) && (horizontalPositionInScene < limitRight)) {
				poi.view.visible = true;

				// Apply the transform
				var transform = Ti.UI.create2DMatrix();

				var distanceRank = (poi.distance - minPoiDistance) / poiDistanceRange;

				var y = lowY + distanceRank * yRange + yOffset;
				// this translation is from the center of the screen
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

		// add to blip to the radar
		// The Radar Blips ....
		poi.blip = require('/alloy').createWidget('ArView', 'blip', {}).getView();

		positionRadarBlip(poi);		
		
		radar.add(poi.blip);
	}
}


function positionRadarBlip(poi) {

	var rad = degrees2Radians(poi.bearing);

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
function projectBearingIntoScene(poiBearing) {
	var delta = findAngularDistance(poiBearing, deviceBearing);
	return delta * screenWidth / FIELD_OF_VIEW_HORIZONTAL;
}


/**
 * Finds the separation between angles theta1 and theta2 (in degrees)
 */
function findAngularDistance(theta1, theta2) {
	var a = theta1 - theta2;
	if (a > 180) a -= 360;
	if (a < -180) a += 360;
	return a;
}

function degrees2Radians(val) {
	return val * Math.PI / 180;
};

/**
 * Which direction to get from point1 to point2?
 * @param {Object} point1
 * @param {Object} point2
 */
function calculateBearing(point1, point2) {
	var lat1 = degrees2Radians(point1.latitude);
	var lat2 = degrees2Radians(point2.latitude);
	var dlng = degrees2Radians((point2.longitude - point1.longitude));
	var y = Math.sin(dlng) * Math.cos(lat2);
	var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dlng);
	var brng = Math.atan2(y, x);
	return ((brng * (180 / Math.PI)) + 360) % 360;
};

/**
 * Find geo-distance betwixt two locations on earth's surface
 * @param {Object} loc1
 * @param {Object} loc2
 */
function calculateDistance(loc1, loc2) {
	var R = 6371;	// Radius of the earth in km
	var dLat = (degrees2Radians(loc2.latitude - loc1.latitude));
	// Javascript functions in radians
	var dLon = (degrees2Radians(loc2.longitude - loc1.longitude));
	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(degrees2Radians(loc1.latitude)) * Math.cos(degrees2Radians(loc2.latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	// Distance in m
	return R * c * 1000;
};



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


exports.findAngularDistance = findAngularDistance;
exports.calculateDistance = calculateDistance;
exports.calculateBearing = calculateBearing;
exports.degrees2Radians = degrees2Radians;
exports.closeAndDestroy = closeAndDestroy;


