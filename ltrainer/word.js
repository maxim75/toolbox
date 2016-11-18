(function() {
	"use strict";

	var ltrainer = window.ltrainer = window.ltrainer || {};

	var palette = function (min, max) {
	    var d = (max-min)/7;
	    return d3.scaleThreshold()
	        .range(['#ffffe0','#ffd59b','#ffa474','#f47461','#db4551','#b81b34','#8b0000'])
	        .domain([min+1*d,min+2*d,min+3*d,min+4*d,min+5*d,min+6*d,min+7*d]);
	};

	console.log("ZZZZ", palette(0, 30000));

	ltrainer.Word = function(str) { 
		var self = this;

		self.str = str;
		self.freqIdx = ko.observable();

		self.note = ko.computed(function() {
			var dictEntry = ltrainer.dictLookup(self.str, ltrainer.lang());
			return dictEntry ? dictEntry.note : null;
		});

		self.className = ko.computed(function() {
			return self.note() ? "word dict" : "word" ;
		});

		self.freqColor = ko.computed(function() {
			return palette(0, 30000)(30000-self.freqIdx());
		});

		ltrainer.freq.lookup(self.str).done(function(x) { x ? self.freqIdx(x[1]) : 10000000000 })
	};

	ltrainer.Word.create = function(value) {
		var word = new ltrainer.Word(value.str);
		return word;
	};


	

	ltrainer.Word.prototype.getValue = function() {
		return { 
			type: "Word",
			str: this.str 
		};
	};

	ltrainer.Word.prototype.onClick = function() {
		pubsub.publish("word-click", [ this.str ]);
	};
})();