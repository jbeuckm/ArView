
describe("ArView Tests", function() {

    var Alloy = require("alloy");
    var widget = Alloy.createWidget("ArView", null, { pois:[] });
    var location_utils = widget.location_utils;
    var view = widget.getView();

    describe("can generate a usable ArView widget", function() {

        it("can create the widget", function() {
        
            var tester = Alloy.createWidget("ArView", null, { pois:[] });
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
            
            var d = location_utils.calculateDistance(loc1, loc2);
            expect(d).not.toBeLessThan(0);
        });

        it("can recognize colocation", function(){
            var loc1 = {
                latitude: 44,
                longitude: -93
            };
            var loc2 = {
                latitude: 44,
                longitude: -93
            };
            
            var d = location_utils.calculateDistance(loc1, loc2);
            expect(d).toBe(0);
        });

        it("can reject non-numeric values", function(){
            var loc1 = {
                latitude: 44,
                longitude: -93
            };
            var loc2 = {
                latitude: 44,
                longitude: "i am not a number"
            };
            
            function testNonNumber() {
                location_utils.calculateDistance(loc1, loc2);
            }
            expect(testNonNumber).toThrow();
        });

    });
    
}); 