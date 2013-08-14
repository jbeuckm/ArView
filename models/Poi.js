
exports.definition = {
	
	config: {
		columns: {
			id: "TEXT",

			title: "TEXT",
			subtitle: "TEXT",
			image: "TEXT",
			rating: "NUMBER",

			vicinity: "TEXT",
			latitude: "NUMBER",
			longitude: "NUMBER"
		},
		defaults: {
			latitude: 0,
			longitude: 0
		},
		adapter: {
			type: "properties",
			collection_name: "Pois"
		}
	},		

	extendModel: function(Model) {		
		_.extend(Model.prototype, {
			idAttribute: 'id'
		});
		
		return Model;
	},
	
    extendCollection: function(Collection) {        
        _.extend(Collection.prototype, {

        });
 
        return Collection;
    }		
}

