(function() {
	"use strict";

	var ltrainer = window.ltrainer = window.ltrainer || {};

	ltrainer.Sentence = function() {
		var self = this;

		self.items = ko.observableArray();

		self.translation = ko.observable();
		self.translationEdit = ko.observable(false);

		self.toString = function() {
			return _(self.items())
				.reduce(function(x, y) { 
					var space = ((y instanceof ltrainer.Word) && x !== "") ? " " : "";
					return (x + space + y.str);
				}, "");
		};

		self.gtLink = ko.computed(function() {
			var url = ltrainer.getGtLink(ltrainer.lang(), ltrainer.targetLang(), self.toString());
			return url;
		});

		self.onTranslationKeypress = function(d,e) {
			if(e.keyCode === 13) {
				self.translationEdit(false);
			}
			return true;
		};
	};

	ltrainer.Sentence.prototype.getValue = function() {
		return { 
			items: _(this.items()).map(function(x) { return x.getValue(); }).value(),
			translation: this.translation()
		};
	};

	ltrainer.Sentence.create = function(data) {
		var sentence = new ltrainer.Sentence();

		var items = _(data.items).map(function(x) {
			switch(x.type) {
				case "Word":
					return ltrainer.Word.create(x);
				case "PMark":
					return ltrainer.PMark.create(x);
				default:
					throw "Unknown type";
			} 
		}).value();

		sentence.items(items);
		sentence.translation(data.translation);

		return sentence;
	};


	ltrainer.Sentence.ParseString = function(str) {
		var buffer = "";
		var result = [];
		var pmarks = "\u201E\u201C.,?!;:\"'()\n";

		for(var i=0; i<str.length; i++)
		{
			var char = str[i];
			if(char === " ") {
				if(buffer) result.push(new ltrainer.Word(buffer));
				buffer = "";
			}
			else if(pmarks.indexOf(char) != -1)
			{
				if(buffer) result.push(new ltrainer.Word(buffer));
				result.push(new ltrainer.PMark(char));
				buffer = "";
			}
			else
			{
				buffer += str[i];
			}
		}
		if(buffer) result.push(new ltrainer.Word(buffer));

		return result;
	};
	
})();