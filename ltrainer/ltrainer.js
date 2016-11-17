		// https://glosbe.com/gapi/translate?from=pol&dest=rus&format=json&phrase=moc&pretty=true

		// https://glosbe.com/gapi/translate?from=deu&dest=eng&format=json&phrase=Morgen&pretty=true

		(function() {
			"use strict";


			// https://pl.wiktionary.org/w/index.php?search=praca
			// http://sjp.pwn.pl/szukaj/zzaby%20(.html
			// http://translate.google.com/translate?js=n&sl=auto&tl=destination_language&text=encoded_phrase

			// https://www.dict.cc/?s=horen
			// https://www.lingvolive.com/en-us/translate/de-ru/horen

			// image to text OCR
			// http://www.to-text.net/

			var ltrainer = window.ltrainer = window.ltrainer || {};

			ltrainer.StoredValue = function(key, defaultValue) {
				var observable = ko.observable();
				return new ko.computed({ 
					read: function() {
						observable();
						return localStorage[key] || defaultValue;
					}, 
					write: function(value) {
						localStorage[key] = value;
						observable(value);
					} 
				});
			};

			ltrainer.lang = new ltrainer.StoredValue("lang", "de");
			ltrainer.targetLang = new ltrainer.StoredValue("targetLang", "ru"); 
			ltrainer.googleApiKey = new ltrainer.StoredValue("googleApiKey", null); 

			window.glosbeCall = function(sourceLang, targetLang, str) {
				var dfd = new $.Deferred();

				var url = "https://crossorigin.me/https://glosbe.com/gapi/translate?" + $.param({
					from: sourceLang,
					dest: targetLang,
					format: "json",
					phrase: str,
					pretty: "true"
				});
				$.ajax({
					url: url
				}).done(function(result) {
					dfd.resolve(result);
				});

				return dfd;
			};

			window.parseGlosbeCallResponse = function(r) {
				var result = [];
				//console.log("r", r.tuc);
				r.tuc.forEach(function(x) { 
					if(x.meanings) {
						x.meanings.forEach(function(y) {
							//console.log("y", y);
							result.push({ language: y.language, text: y.text, type: "meaning" });
						});
					}
					if(x.phrase) {
						result.push({ language: x.phrase.language, text: x.phrase.text, type: "phrase" });
						//console.log(x.phrase);
					}
					
				});
				return result;
			};

			ltrainer.getGtLink = function(sourceLang, targetLang, str) {
				if(str === undefined)
					return function(str) { return getGtLink(sourceLang, targetLang, str); };

				return "https://translate.google.com/?" + $.param({
					sl: sourceLang,
					tl: targetLang,
					text: str
				});
			};

			var refLinks = {
				"de": [
					{ title: "dict.cc", func: function(str) { return "https://www.dict.cc/?" + $.param({ s: str }) } },
					{ title: "lingvolive", func: function(str) { return "https://www.lingvolive.com/en-us/translate/de-ru/" + encodeURI(str) } },
					{ title: "wiktionary", func: function(str) { return "https://de.wiktionary.org/w/index.php?" + $.param({ search: str }) } },
					{ title: "collins", func: function(str) { return "http://www.collinsdictionary.com/dictionary/german-english/" + encodeURI(str) } },
				],
				"pl": [
					{ title: "sjp", func: function(str) { return "http://sjp.pwn.pl/szukaj/" + encodeURI(str) + ".html" } },
					{ title: "wiktionary", func: function(str) { return "https://pl.wiktionary.org/w/index.php?" + $.param({ search: str }) } }
				]
			};

			var Dict = function() {
				var self = this;

				self.key = "DICT";
				self.dict = {};
				self.updated = ko.observable();

				self.toString = function() {
					return _(self.dict).entries().map(x => { return x[0]+","+x[1].note;  }).join("\n");
				};

				self.loadFromString = function(dictStr) {
					self.dict = {};

					if(dictStr)	{
						dictStr.split("\n").forEach(x => { 
							var pair = x.split(","); 
							var key = pair[0].split(":");
							self.add(key[1], key[0], pair[1]);
						});
					}

					self.updated(new Date().getTime());
				};

				self.saveToLocalStorage = function() {
					localStorage[self.key] = self.toString();
				};

				self.loadFromLocalStorage = function() {
					var dictStr = localStorage[self.key];

					self.dict = {};

					if(dictStr)	{
						self.loadFromString(dictStr);
					}

					self.updated(new Date().getTime());
				};

				self.getKey = function(str, lang) {
					return lang + ":" + str.toLowerCase();
				};

				self.add = function(str, lang, note) {
					self.dict[self.getKey(str, lang)] = new DictWord(note);
					self.updated(new Date().getTime());
					self.saveToLocalStorage();
				};

				self.delete = function(str, lang) {
					delete self.dict[self.getKey(str, lang)];
					self.updated(new Date().getTime());
					self.saveToLocalStorage();
				};

				self.lookup = function(str, lang) {
					return self.dict[self.getKey(str, lang)];
				};
			};

			var DictWord = function(note)  {
				this.note = note;
			};

			var spSt = function(x) {
				var arr = x.reduce(function(x, y) { 
					x[x.length-1].push(y); 
					if(y instanceof ltrainer.PMark && _([".", "?", "!"]).includes(y.str)) { 
						x.push([]); 
					}
					return x }, [[]]
				);

				var result = arr.map(function(x) { 
					var st = new ltrainer.Sentence(); 
					st.items(x);
					return st;
				});

				return result;
			};

			var stats = function(contents) {
				var result = {};

				_(contents).each(function(x) { 
					if(x instanceof ltrainer.Word) {
						if(!result[x.str]) result[x.str] = 0;
						result[x.str] += 1;
					}
				});

				return result;
			};	

			window.dict = new Dict();
			//window.dict.loadFromLocalStorage();

			var download = function (filename, text) {
				var element = document.createElement('a');
				element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
				element.setAttribute('download', filename);
				element.style.display = 'none';
				document.body.appendChild(element);
				element.click();
				document.body.removeChild(element);
			};

			var Vm = function() {
				var self = this;

				self.dict = window.dict;
				self.dictWord = ko.observable();
				self.note = ko.observable();

				self.googleDriveFileId = ko.observable();
				self.googleDriveFileName = ko.observable();
				self.googleDriveDictFileId = ko.observable();
				self.googleDriveDictFileName = ko.observable();

				self.storedDocument = new ltrainer.StoredValue("storedDocument", null); 

				self.langList = [ "cz", "de", "pl", "ru", "en", "uk" ];

				self.dictFilter = ko.observable("");

	 			self.textareaValue = ko.observable();

				self.document = new ltrainer.Document();
				self.stats = ko.observableArray();
				self.translations = ko.observableArray();
				self.gdrive = new ltrainer.gdrive();

				self.onGoogleAuthenticateClick = function() {
					self.gdrive.authenticateUser();
				};

				self.onFileClick = function(file) {
					self.gdrive.getFile(file.id).done(function(response) {
						self.document.load(JSON.parse(response.body));
						self.googleDriveFileId(file.id);
						self.googleDriveFileName(file.name);
					});
				};

				self.onDictFileClick = function(file) {
					self.gdrive.getFile(file.id).done(function(response) {
						self.dict.loadFromString(response.body);
						self.googleDriveDictFileId(file.id);
						self.googleDriveDictFileName(file.name);
					});
				};

				self.fileList = ko.observableArray();

				self.gdrive.isAuthenticated.subscribe(function() {
					if(self.gdrive.isAuthenticated()) {
						self.gdrive.getFileList().done(function(response) {
							self.fileList(response);
						});
					}
				});

				self.getDocumentAsString = function() {
					return JSON.stringify(self.document.getValue());
				};

				self.saveDocument = function() {
					var docContents = self.getDocumentAsString();
					self.storedDocument(docContents);

					if(self.googleDriveFileId())
					{
						self.gdrive.updateFile(self.googleDriveFileId(), "application/json", docContents);
					}
					else
					{
						self.gdrive.createFile("ltrainer_document.json", "application/json", docContents).done(function(x) {
							self.googleDriveFileId(x.id);
							self.googleDriveFileName(x.name);
						});
					}
				};

				self.downloadDocument = function() {
					download("ltrainer_document.json", self.getDocumentAsString());
				};

				self.onTextSubmit = function() {
					var contents = spSt(ltrainer.Sentence.ParseString(self.textareaValue()));

					_(contents).map(function(x) {
						self.document.contents.push(x);
					}).value();

					self.textareaValue("");
				};

				self.stats = ko.computed(function() {
					var s = stats(self.document.contents());

					return _(s).toPairs().sortBy(function(x) { return -x[1] }).value();
				});

				self.contentsView = ko.computed(function() {
					var updated = self.dict.updated();
					return self.document.contents();
				});

				self.contentsToString = function() {
					var strings = _(self.contents()).map(function(x) { return x.toString(); });
					return strings.join(" ");

				}

				self.dictView = ko.computed(function() {
					var updated = self.dict.updated();
					var lang = ltrainer.lang()

					return _(self.dict.dict)
						.toPairs()
						.sortBy(function(x) { return x[0] })
						.filter(function(x) { return x[0].split(":")[0] === lang && (!self.dictFilter() || x[0].split(":")[1].indexOf(self.dictFilter()) !== -1); })
						.map(function(x) { return [ x[0].split(":")[1], x[1] ] })
						.value();
				});

				self.addToDict = function(str, note) {
					self.dict.add(str, ltrainer.lang(), note);
				};

				self.onEditWordSubmit = function() {
					self.addToDict(self.dictWord(), self.note());
					$("#edit-word-modal").modal('hide');
				};

				self.onDownloadClick = function() {
					download("dict.txt", self.dict.toString());
				};

				self.clearDocument = function() {
					self.document.clear();
				};

				self.onFileInputChange = function(vm, e) {
					var fileReader = new FileReader();

					fileReader.onload = function(e) { 		  		
						var fileContents = e.target.result;

						try {

							var jsonDoc = JSON.parse(fileContents);
							self.document.load(jsonDoc);
						}
						catch(err) {
							self.dict.loadFromString(fileContents);
						}
					};

					fileReader.readAsText(e.target.files[0]);
				};

				self.refLinks = function(str) {
					return _(refLinks[ltrainer.lang()]).map(function(x) { return { title: x.title, url: x.func(str) }; }).value();
				};

				self.dictWord.subscribe(function() {
					self.translations([]);
				});


				self.loadingInProgress = ko.observable(false);

				self.lookupButtonText = ko.pureComputed(function() {
					return self.loadingInProgress() ? 'Loading' : 'Lookup';
				});

				self.onLookupClick = function() {
					self.loadingInProgress(true);
					glosbeCall(ltrainer.lang(), ltrainer.targetLang(), self.dictWord()).done(function(x) { 
						self.translations(parseGlosbeCallResponse(x)); 
					}).always(function() {
						self.loadingInProgress(false);
					});
				};

				self.onTranslationClick = function(e, str) {
					self.note(str);
					e.preventDefault();
				};

				self.onSaveDictToGDrive = function() {
					var dictString = self.dict.toString();

					if(self.googleDriveDictFileId())
					{
						self.gdrive.updateFile(self.googleDriveDictFileId(), "text/plain", dictString);
					}
					else
					{
						self.gdrive.createFile("ltrainer_dict.txt", "text/plain", dictString).done(function(x) {
							self.googleDriveDictFileId(x.id);
							self.googleDriveDictFileName(x.name);
						});
					}
				};

				pubsub.subscribe("word-click", function(str) {
					self.dictWord(str);
					var dictWord = self.dict.lookup(str, ltrainer.lang());
					self.note(dictWord ? dictWord.note : "");
					$("#edit-word-modal").modal("show");
				});

				pubsub.subscribe("dict-remove", function(str) {
					self.dict.delete(str, ltrainer.lang());
				});

				// var storedDocument = self.storedDocument();
				// if(storedDocument) {
				// 	self.document.load(JSON.parse(storedDocument));
				// };


				//self.document.contents(spSt(ltrainer.Sentence.ParseString(localStorage["contents"] || "")));
			};

		var lang = function(str, lang) {
				var updated = self.dict.updated();
				return window.viewModel ? ltrainer.lang() : "de";
			};

		ltrainer.dictLookup = function(str, lang) {
				var updated = self.dict.updated();
				return window.dict.lookup(str, lang);
			};

		window.Vm = Vm;

		window.spSt = spSt;
		window.lang = lang;
})();