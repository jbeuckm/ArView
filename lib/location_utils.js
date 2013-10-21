
var d2rFactor = Math.PI / 180;

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
	return val * d2rFactor;
}
function radians2Degrees(val) {
	return val / d2rFactor;
}

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
	
	if (!loc1.latitude || (typeof loc1.latitude != "number")) {
		throw(new Error("error reading loc1.latitude"));
	}
	if (!loc1.longitude || (typeof loc1.longitude != "number")) {
		throw(new Error("error reading loc1.longitude"));
	}
	if (!loc2.latitude || (typeof loc2.latitude != "number")) {
		throw(new Error("error reading loc2.latitude"));
	}
	if (!loc2.longitude || (typeof loc2.longitude != "number")) {
		throw(new Error("error reading loc2.longitude"));
	}

	var dLat = degrees2Radians(loc2.latitude - loc1.latitude);
	var dLon = degrees2Radians(loc2.longitude - loc1.longitude);

	var R = 6371;	// Radius of the earth in km
	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(degrees2Radians(loc1.latitude)) * Math.cos(degrees2Radians(loc2.latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	// Distance in m
	return R * c * 1000;
};

exports.metersToMiles = function(m) {
	return m * .000621371;
};

exports.neatUSfromMeters = function(m) {
	var miles = exports.metersToMiles(m);
	
	if (miles < .01) {
		return Math.floor(miles * 5280) + "ft";
	}
	if (miles < .5) {
		return Math.floor(miles * 1760) + "yd";
	}
	
	return miles.toFixed(1) + "mi";
};


exports.findAngularDistance = findAngularDistance;
exports.calculateDistance = calculateDistance;
exports.calculateBearing = calculateBearing;
exports.degrees2Radians = degrees2Radians;
exports.radians2Degrees = radians2Degrees;
