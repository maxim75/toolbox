
// http://www.geonames.org/export/wikipedia-webservice.html
// http://api.geonames.org/findNearbyWikipediaJSON?lat=47&lng=9&username=demo&lang=de
var findNearbyWikipedia = function(lat, lng, username, lang) {

	var dfd = $.Deferred();

	var params = {
		"username": username,
		"lat": lat, 
		"lng": lng,
		"lang": lang,
		"radius": 20
	};

	$.ajax("http://api.geonames.org/findNearbyWikipediaJSON?" + $.param(params))
	.done(function(response) {

		//console.log("F", response.features);
		dfd.resolve(response);
	});

	return dfd; 
};



var reverseGeocode = function(lat, lng, apiKey) {

	var dfd = $.Deferred();

	var params = {
		"api_key": apiKey,
		"point.lat": lat, 
		"point.lon": lng
	};

	$.ajax("https://search.mapzen.com/v1/reverse?" + $.param(params))
	.done(function(response) {

		//console.log("F", response.features);
		dfd.resolve(response);
	});

	return dfd; 
};

var escapeWikimediaName = function(name) {
	return encodeURI(name.replace(" ", "_"));
};

var getCommonsUrl = function(name) {
	return "https://commons.wikimedia.org/wiki/" + escapeWikimediaName(name);
};

var getNearbyCommonsPhotos = function(lat, lng, radius) {

	var dfd = $.Deferred();

	var params = { 
		format: "json",
		action: "query",
		list: "geosearch",
		gsprimary: "all",
		gsnamespace: "6",
		gsradius: radius,
		gscoord: lat + "|" + lng,
		gslimit: 100
	};

	var url = "https://commons.wikimedia.org/w/api.php?" + $.param(params);
	$.ajax({ 
		url: url,
		jsonp: "callback",
		dataType: "jsonp"

	}).done(function(r) {
		dfd.resolve(r.query.geosearch);
	});

	return dfd;
};

var getCommonsCategoriesForTitles = function(titles) {

	var dfd = $.Deferred();

	var params = { 
		format: "json",
		action: "query",
		prop: "categories|contributors",
		titles: titles.join("|")	
	};

	var url = "https://commons.wikimedia.org/w/api.php?" + $.param(params);
	$.ajax({ 
		url: url,
		jsonp: "callback",
		dataType: "jsonp"
	}).done(function(r) {

		var categories = [];
		var contributors = [];
		var pages = {};

		_(r.query.pages).map(function(x) { _(x.categories).map(function(y) { categories.push(y.title) }) });
		_(r.query.pages).map(function(x) { _(x.contributors).map(function(y) { contributors.push(y.name) }) });

		_(r.query.pages).map(function(x, pageId) { 
			pages[x.title] = {
				categories: _(x.categories).map(function(y) { return y.title; }),
				contributors: _(x.contributors).map(function(y) { return y.name; }),
			};
		});

		dfd.resolve({categories: categories, contributors: contributors, pages: pages });
	});

	return dfd;
};

var getCommonsCategories = function(lat, lng, limit) {

	var dfd = $.Deferred();

	var params = { 
		q: "claim[373] and around[625," + lat + "," + lng + "," + limit + "]",
		props: "373,625"
	};

	var url = "http://wdq.wmflabs.org/api?" + $.param(params);
	$.ajax({ 
		url: url,
		jsonp: "callback",
		dataType: "jsonp"
	}).done(function(r) {
		var result = _(r.props["373"]).map(function(x) { return x[2] });
		dfd.resolve(result);
	});

	return dfd;
};

ko.observableArray.fn.pushAll = function(valuesToPush) {
    var underlyingArray = this();
    this.valueWillMutate();
    ko.utils.arrayPushAll(underlyingArray, valuesToPush);
    this.valueHasMutated();
    return this;  //optional
};

var Vm = function() {
	var self = this;

		self.reverseGeocode = ko.observable();
		self.wikipediaArticles = ko.observableArray();
	self.tags = ko.observableArray();
	self.categories = ko.observableArray();
	self.contributors = ko.observableArray();
	self.fileCategories = ko.observableArray();
	self.files = ko.observableArray();
	self.fileProperties = ko.observable();
	self.latlng = ko.observable();
	self.map = L.map('map');

	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(self.map);


	self.getGeolink = function(id) {
		return ko.computed(function() {
			if(!self.latlng()) return null;
			return geolink.getLink(id, {lat: self.latlng().lat, lng:  self.latlng().lng, zoom: 17} );
		});
	};

	self.chunk = function (array, chunkSize) {
        // http://stackoverflow.com/questions/8495687/split-array-into-chunks
        var R = [];
        for (var i = 0; i < array.length; i += chunkSize)
            R.push(array.slice(i, i + chunkSize));
        return R;
    };

	self.readFile = function(file) {

		exif = new ExifReader();
		exif.load(file);
		exif.deleteTag('MakerNote');

		// Output the tags on the page.
		tags = exif.getAllTags();
		return tags;

	};

	self.onFileChange = function(vm, e) {

		var files, reader;

    	files = event.target.files;
    	reader = new FileReader();

    	reader.onload = function (event) {

	    	var tags = self.readFile(event.target.result);
	    	self.tags(_.pairs(tags));

	    	if(tags["GPSLatitude"] && tags["GPSLongitude"]) {
	    		self.latlng({ 
		    		lat: tags["GPSLatitude"].description * (tags["GPSLatitudeRef"].value == "S" ? -1 : 1),
		    		lng: tags["GPSLongitude"].description * (tags["GPSLongitudeRef"].value == "W" ? -1 : 1)
		    	});
	    	}
	    	else
	    	{
	    		self.latlng(null);
	    	}
	    };

	    // We only need the start of the file for the Exif info.
	    reader.readAsArrayBuffer(files[0].slice(0, 128 * 1024));
	};

	self.groupArray = function(arr) {
		return _(arr)
			.chain()
			.countBy()
			.map(function(value, key) { return { value: key, count: value  }; })
			.sortBy(function(x) { return -x.count })
			.value();
	};
	
	self.listCategories = function(title) {

		return self.fileProperties()[title] 
			? self.fileProperties()[title]['categories']
			: [];
	};

	self.listContributors = function(title) {

		return self.fileProperties()[title] 
			? self.fileProperties()[title]['contributors']
			: [];
	};

	self.getReverseGeocode = function() {
		reverseGeocode(self.latlng().lat, self.latlng().lng, "search-TFuxM-I")
		.done(function(response) {
			self.reverseGeocode(response);
		});
	};

	self.showMap = function() {

		var pos = [self.latlng().lat, self.latlng().lng];
		var map = self.map.setView(pos, 16);

		
		L.marker(pos).addTo(self.map);//.bindPopup("here").openPopup();
	};

	self.latlng.subscribe(function() {

		self.fileProperties({});
		self.fileCategories.removeAll();
		self.contributors.removeAll();
		self.reverseGeocode(null);

		if(!self.latlng()) return;

		self.showMap();

		self.getReverseGeocode();

		getCommonsCategories(self.latlng().lat, self.latlng().lng, 3).done(function(categories) {
			self.categories(categories);
		});

		getNearbyCommonsPhotos(self.latlng().lat, self.latlng().lng, 2000).done(function(files) {
			self.files(files);


			var fileNames = _(files).map(function(x) { return x.title; });

			var fileNameChunks = self.chunk(fileNames, 1);

			_(fileNameChunks).map(function(fileNameChunk) {

				getCommonsCategoriesForTitles(fileNameChunk).done(function(r){

					self.fileCategories.pushAll(r.categories);
					self.contributors.pushAll(r.contributors);

					_(r.pages).map(function(x, y) {
						self.fileProperties()[y] = x;
					});
					
					self.fileProperties.notifySubscribers();
				});
			});
		});

		self.wikipediaArticles.removeAll();

		_(["en", "uk", "pl"]).map(function(lang) {
			findNearbyWikipedia(self.latlng().lat, self.latlng().lng, "maxim75", lang).done(function(result) { 
				self.wikipediaArticles.pushAll(result.geonames);
			});
		});
		
	});
};

var vm = new Vm();
ko.applyBindings(vm, $("body")[0]);