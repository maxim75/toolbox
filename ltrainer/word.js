(function() {
	"use strict";

	var ltrainer = window.ltrainer = window.ltrainer || {};

	ltrainer.Word = function(str) { 
		var self = this;

		self.str = str; 

		self.note = ko.computed(function() {
			var dictEntry = ltrainer.dictLookup(self.str, ltrainer.lang());
			return dictEntry ? dictEntry.note : null;
		});

		self.className = ko.computed(function() {
			return self.note() ? "word dict" : "word" ;
		});
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