(function() {
	"use strict";

	// ftp://ftp.unicode.org/Public/MAPPINGS/VENDORS/MICSFT/WINDOWS/CP1251.TXT

	var ce = window.ce = window.ce || {};

	ce.Vm = function() {
		var self = this;

		self.selectedEncoding = ko.observable();

		self.encodings = [
			{ id: "WIN1250", title: "Windows 1250" },
			{ id: "WIN1251", title: "Windows 1251" }
		];

		self.decodeUtf8 = function(str) {
			return decodeURIComponent(escape(str));
		}

		self.encodeUtf8 = function(str) {
			return unescape(encodeURIComponent(str));
		}

		self.onFileInputChange = function(vm, e) {

			var fileReader = new FileReader();

			var fileName = e.target.files[0].name;

			fileReader.onload = function(e) { 		  		
				var fileContents = e.target.result;
				//console.log(fileContents);
				window.fileContents = fileContents;
				var bufView = new Uint8Array(fileContents);
				//window.bufView  =bufView;
				//console.log("bufView", bufView.length);
				var str = String.fromCharCode.apply(null, bufView);
				console.log("str", str);

				self.loadMappingFile(self.selectedEncoding() + ".TXT").done(function(mapfile) {
					var map = self.parseMappingFile(mapfile);
					var convertedArray = self.convertWithMap(str, map);
					var convertedStr = String.fromCharCode.apply(null, convertedArray);

					console.log(e.target);
					maxk.download(fileName, convertedStr);

				});
			};

			fileReader.readAsArrayBuffer(e.target.files[0]);
		};

		self.convertWithMap = function(str, map) {
			var result = [];
			_(str).map(function(char) {
				var code = char.charCodeAt(0);
				result.push(map[code] ? map[code] : code);
			}).value();
			return result;
		};

		self.parseMappingFile = function(mappingFile) {
			var map = {};
			var lines = mappingFile.split("\n");
			var captureValuesRegExp = new RegExp("^0x([0-9A-F]{2}).+0x([0-9A-F]{4})");
			_(lines).map(function(line) {
				var captureResult = captureValuesRegExp.exec(line);
				if(captureResult) {
					var originalCode = parseInt(captureResult[1], 16);
					var targetCode = parseInt(captureResult[2], 16);
					//console.log(originalCode, targetCode);
					map[originalCode] = targetCode;
				}
				
			}).value();

			return map;
		};

		self.loadMappingFile = function(filename) {
			var dfd = new $.Deferred();
			$.ajax({ url: "convert-encoding/" + filename, type: "GET" }).done(function(response) {
				dfd.resolve(response);
			});
			return dfd;
		}

		console.log("HHH");
	};
})();
