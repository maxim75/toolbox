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

			var getGtLink = function(sourceLang, targetLang, str) {
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
					{ title: "wiktionary", func: function(str) { return "https://de.wiktionary.org/w/index.php?" + $.param({ search: str }) } }
				],
				"pl": [
					{ title: "sjp", func: function(str) { return "http://sjp.pwn.pl/szukaj/" + encodeURI(str) + ".html" } },
					{ title: "wiktionary", func: function(str) { return "https://pl.wiktionary.org/w/index.php?" + $.param({ search: str }) } }
				]
			};

			// ["a", "b", ".", "c", ".", "z"].reduce(function(x, y) { 
			// 	console.log(x, y);   
			// 	x[x.length-1].push(y); 
			// 	if(y === ".") x.push([]); 
			// 	return x }, [[]]
			// );

			var St = function() {
				var self = this;

				self.items = ko.observableArray();

				self.toString = function() {
					return _(self.items())
						.reduce(function(x, y) { 
							var space = ((y instanceof Word) && x !== "") ? " " : "";
							return (x + space + y.str);
						}, "");
				};

				self.gtLink = ko.computed(function() {
					return getGtLink("de", "en", self.toString());
				});
			};

			var Word = function(str) { 
				var self = this;

				self.str = str; 

				self.onClick = function() {
					pubsub.publish("word-click", [ self.str ]);
				};

				self.note = ko.computed(function() {
					var dictEntry = dictLookup(self.str, lang());
					return dictEntry ? dictEntry.note : null;
				});

				self.className = ko.computed(function() {
					return self.note() ? "word dict" : "word" ;
				});
			};
			
			var PMark = function(str) { 
				this.str = str; 

				self.onClick = function() {
					console.log("Click");
					$('#modal').modal({
					  keyboard: false
					})
					$('#modal').modal('show');
				};

				self.className = function() {
					return "pmark";
				};

				self.note = ko.computed(function() {
					return null;
				});
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

			var sp = function(str) {
				var buffer = "";
				var result = [];
				var pmarks = ".,?!;:\"'()\n";

				for(var i=0; i<str.length; i++)
				{
					var char = str[i];
					if(char === " ") {
						if(buffer) result.push(new Word(buffer));
						buffer = "";
					}
					else if(pmarks.indexOf(char) != -1)
					{
						if(buffer) result.push(new Word(buffer));
						result.push(new PMark(char));
						buffer = "";
					}
					else
					{
						buffer += str[i];
					}
				}
				if(buffer) result.push(new Word(buffer));

				return result;
			};

			var spSt = function(x) {
				var arr = x.reduce(function(x, y) { 
					x[x.length-1].push(y); 
					if(y instanceof PMark && y.str === ".") { 
						x.push([]); 
					}
					return x }, [[]]
				);

				var result = arr.map(function(x) { 
					var st = new St(); 
					st.items(x);
					return st;
				});

				console.log("result", result);

				return result;
			};

			var stats = function(contents) {
				var result = {};

				_(contents).each(function(x) { 
					if(x instanceof Word) {
						if(!result[x.str]) result[x.str] = 0;
						result[x.str] += 1;
					}
				});

				return result;
			};	

			window.dict = new Dict();
			window.dict.loadFromLocalStorage();

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

				self.langList = [ "de", "pl" ];
				self.lang = ko.observable("de");
				self.dictFilter = ko.observable("");

	 			self.textareaValue = ko.observable();

				self.contents = ko.observableArray();
				self.stats = ko.observableArray();

				self.onTextSubmit = function() {
					self.contents(spSt(sp(self.textareaValue())));
					self.textareaValue("");
				};

				self.stats = ko.computed(function() {
					var s = stats(self.contents());

					return _(s).toPairs().sortBy(function(x) { return -x[1] }).value();
				});

				self.contentsView = ko.computed(function() {
					var updated = self.dict.updated();
					return self.contents();
				});

				self.dictView = ko.computed(function() {
					var updated = self.dict.updated();
					return _(self.dict.dict)
						.toPairs()
						.sortBy(function(x) { return x[0] })
						.filter(function(x) { return x[0].split(":")[0] === self.lang() && (!self.dictFilter() || x[0].split(":")[1].indexOf(self.dictFilter()) !== -1); })
						.map(function(x) { return [ x[0].split(":")[1], x[1] ] })
						.value();
				});

				self.addToDict = function(str, note) {
					self.dict.add(str, self.lang(), note);
				};

				self.onEditWordSubmit = function() {
					console.log("here", self.dictWord(), self.note());
					self.addToDict(self.dictWord(), self.note());
					$("#edit-word-modal").modal('hide');
				};

				self.onDownloadClick = function() {
					download("dict.txt", self.dict.toString());
				};

				self.onFileInputChange = function(vm, e) {
					var fileReader = new FileReader();

					fileReader.onload = function(e) { 		  		
						var fileContents = e.target.result;
						self.dict.loadFromString(fileContents);
					};

					fileReader.readAsText(e.target.files[0]);
				};

				self.refLinks = function(str) {
					return _(refLinks[self.lang()]).map(function(x) { return { title: x.title, url: x.func(str) }; }).value();
				};

				pubsub.subscribe("word-click", function(str) {
					self.dictWord(str);
					var dictWord = self.dict.lookup(str, self.lang());
					self.note(dictWord ? dictWord.note : "");
					$("#edit-word-modal").modal("show");
				});

				pubsub.subscribe("dict-remove", function(str) {
					self.dict.delete(str, self.lang());
				});
				
			};

		var lang = function(str, lang) {
				var updated = self.dict.updated();
				return window.viewModel ? window.viewModel.lang() : "de";
			};

		var dictLookup = function(str, lang) {
				var updated = self.dict.updated();
				return window.dict.lookup(str, lang);
			};



		window.Vm = Vm;
		window.PMark = PMark;
		window.sp = sp;
		window.spSt = spSt;
		window.dictLookup = dictLookup;
		window.lang = lang;
		window.getGtLink = getGtLink;
})();