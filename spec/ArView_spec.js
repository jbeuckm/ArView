
describe("ArView Tests", function() {

	var Alloy = require("alloy");
	var widget = Alloy.createWidget("ArView");
	var view = widget.getView();

	describe("can generate a usable ArView widget", function() {

		it("can create the widget", function() {
		
			var tester = Alloy.createWidget("ArView");
			expect(tester).not.toEqual(null);
			
		});
		
		it("can calculate the distance between two locations", function(){
			var loc1 = {
				latitude: -90 + 180 * Math.random(),
				longitude: -90 + 180 * Math.random()
			};
			var loc2 = {
				latitude: -90 + 180 * Math.random(),
				longitude: -90 + 180 * Math.random()
			};
			
			var d = widget.calculateDistance(loc1, loc2);
			expect(d).not.toBeLessThan(0);
		});

	});
	
}); 