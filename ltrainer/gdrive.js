(function() {
	"use strict";

	var ltrainer = window.ltrainer = window.ltrainer || {};

	var newGuid = function() {
	    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
	        return v.toString(16);
	    });
	};

	ltrainer.gdrive = function(config) {
		var self = this;

		self.isAuthenticated = ko.observable();

		config = { 
			"client_id": '704967068556-hbc0ud09j3hp3ednnamcn4krgo9ofjod.apps.googleusercontent.com',
			"scopes": [ "https://www.googleapis.com/auth/drive.file" ]
		};

		var funcName = newGuid();

		self.handleAuthResult = function(authResult) {
			console.log("AAAA", arguments);
			self.isAuthenticated(authResult && !authResult.error);
		};

		self.authorize = function(immediate, func) {
			gapi.auth.authorize({ "client_id": config.client_id, scope: config.scopes.join(' '), immediate: immediate}, func);
		};

		self.authenticateUser = function() {
			self.authorize(false, self.handleAuthResult);
		};

		window[funcName] = function() {
			self.authorize(true, self.handleAuthResult);
		};

		$.getScript("https://apis.google.com/js/client.js?" + $.param({ "onload": funcName }));
	};

})();