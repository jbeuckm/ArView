/**
 * Wrap the logic around adding/removing listeners to the accelerometer
 * 
 */

var callback;

function accelerometerCallback(e) {
	if (callback) {
		callback(e);
	}
}

function androidPause(e) {
	Ti.API.info("removing accelerometer callback on pause");
	Ti.Accelerometer.removeEventListener('update', accelerometerCallback);
}
function androidResume(e) {
	Ti.API.info("adding accelerometer callback on resume");
	Ti.Accelerometer.addEventListener('update', accelerometerCallback);
}

exports.start = function() {		
	if (Ti.Platform.model === 'Simulator' || Ti.Platform.model.indexOf('sdk') !== -1) {
		Ti.API.error('Accelerometer does not work on a virtual device');
	} else {
		Ti.Accelerometer.addEventListener('update', accelerometerCallback);
		if (Ti.Platform.name === 'android') {
			Ti.Android.currentActivity.addEventListener('pause', androidPause);
			Ti.Android.currentActivity.addEventListener('resume', androidResume);
		}
	}
};	
	
exports.destroy = function() {
	Ti.Accelerometer.removeEventListener('update', accelerometerCallback);
	if (Ti.Platform.name === 'android') {
		Ti.Android.currentActivity.removeEventListener('pause', androidPause);
		Ti.Android.currentActivity.removeEventListener('resume', androidResume);
	}
	callback = null;
};
	
exports.setupCallback = function(_callback) {
	callback = _callback;
};

	
