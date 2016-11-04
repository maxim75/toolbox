(function() {
	"use strict";

	var ltrainer = window.ltrainer = window.ltrainer || {};

	ltrainer.PMark = function(str) { 
		this.str = str; 

		self.onClick = function() {};

		self.className = function() {
			return "pmark";
		};

		self.note = ko.computed(function() {
			return null;
		});
	};

	ltrainer.PMark.prototype.getValue = function() {
		return { 
			type: "PMark",
			str: this.str 
		};
	};

	ltrainer.PMark.create = function(value) {
		var pmark = new ltrainer.PMark(value.str);
		return pmark;
	};
			
})();