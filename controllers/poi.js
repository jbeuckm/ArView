var args = arguments[0] || {};

$.poiView.modelId = args.id;

$.titleLabel.text = args.title;

exports.setDistance = function(d) {
	$.distanceLabel.text = d;
}

if (args.image) {
	$.poiImage.image = args.image;
}
else {
	$.poiImage.visible = false;
}


