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
			self.isAuthenticated(authResult && !authResult.error);
		};

		self.authorize = function(immediate, func) {
			gapi.auth.authorize({ "client_id": config.client_id, scope: config.scopes.join(' '), immediate: immediate}, func);
		};

		self.authenticateUser = function() {
			self.authorize(false, self.handleAuthResult);
		};

		self.driveApiLoad = function() {
			var dfd = new $.Deferred();
			gapi.client.load('drive', 'v3', function() { dfd.resolve(); });
			return dfd;
		};

		//https://developers.google.com/drive/v3/reference/files/update

		var utf8_to_b64 = function(str) {
			return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
				return String.fromCharCode('0x' + p1);
			}));
		};

		self.createFile = function(fileName, contentType, contents) {
			var dfd = new $.Deferred();

			const boundary = '-------314159265358979323846';
			const delimiter = "\r\n--" + boundary + "\r\n";
			const close_delim = "\r\n--" + boundary + "--";

			var contentType = contentType || 'application/octet-stream';

			var metadata = {
				'title': fileName
			};

			var base64Data = utf8_to_b64(contents);
			var multipartRequestBody =
			delimiter +
			'Content-Type: application/json\r\n\r\n' +
			JSON.stringify(metadata) +
			delimiter +
			'Content-Type: ' + contentType + '\r\n' +
			'Content-Transfer-Encoding: base64\r\n' +
			'\r\n' +
			base64Data +
			close_delim;

			var requestParams = {
			'path': '/upload/drive/v2/files',
			'method': 'POST',
			'params': {'uploadType': 'multipart'},
			'headers': {
			'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
			},
			'body': multipartRequestBody};

			var request = gapi.client.request(requestParams);


			request.execute(function(x) { dfd.resolve(x); });

			return dfd;

		};

		self.updateFile = function(fileId, contentType, contents) {
			var dfd = new $.Deferred();

			const boundary = '-------314159265358979323846';
			const delimiter = "\r\n--" + boundary + "\r\n";
			const close_delim = "\r\n--" + boundary + "--";

			var contentType = contentType || 'application/octet-stream';

			var metadata = {
				
			};

			var base64Data = utf8_to_b64(contents);
			var multipartRequestBody =
			
			delimiter +
			'Content-Type: ' + contentType + '\r\n' +
			'Content-Transfer-Encoding: base64\r\n' +
			'\r\n' +
			base64Data +
			close_delim;

			var requestParams = {
			'path': '/upload/drive/v2/files/' + fileId,
			'method': 'PUT',
			'params': {'uploadType': 'media'},
			'headers': {
			'Content-Type': contentType + '; boundary="' + boundary + '"'
			},
			'body': contents};

			var request = gapi.client.request(requestParams);

			request.execute(function(x) { dfd.resolve(x); });

			return dfd;

		};

		self.getFile = function(id) {
			var dfd = new $.Deferred();

			self.driveApiLoad().done(function() {
				gapi.client.drive.files.get({ fileId: id, alt: 'media' })
				.then(function (response) {
					dfd.resolve(response);
				});
			});

        	return dfd;
		};

		self.getFileList = function() {
			var dfd = new $.Deferred();

			self.driveApiLoad().done(function() {

				var request = gapi.client.drive.files.list({});

				request.execute(function(response) {
					var files = _(response.files)
						.map(function(x) { 
							//console.log(x);
							return { id: x.id, name: x.name, mimeType: x.mimeType, kind: x.kind } 
						})
						.value();
					dfd.resolve(files);
				});
				
			});

			return dfd;
		};

		window[funcName] = function() {
			self.authorize(true, self.handleAuthResult);
		};

		$.getScript("https://apis.google.com/js/client.js?" + $.param({ "onload": funcName }));
	};

})();


// https://content.googleapis.com/drive/v3/files/0B9xR_fDRpdVeMlFsT18ySEtxVDg?uploadType=media&body=!!!!!!!!!!!!!!!!!!&alt=json
// https://content.googleapis.com/upload/drive/v3/files/0B9xR_fDRpdVeMlFsT18ySEtxVDg?uploadType=media&body=!!!!!!!!!!!!!!!!!!&alt=json