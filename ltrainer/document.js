(function() {
	"use strict";

	var ltrainer = window.ltrainer = window.ltrainer || {};

	ltrainer.Document = function(str) { 
		var self = this;

		self.contents = ko.observableArray();
		
	};

	ltrainer.Document.prototype.load = function(data) {
		var contents = _(data.contents).map(function(x) { return ltrainer.Sentence.create(x); }).value();
		this.contents(contents);
	};

	ltrainer.Document.prototype.getValue = function() {
		return { 
			type: "Document",
			contents: _(this.contents()).map(function(x) { return x.getValue(x); }).value()
		};
	};


})();