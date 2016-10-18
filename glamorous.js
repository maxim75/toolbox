

var list = [];
var current = null;

$("a[target='_blank']").each(function(idx, el) { 

	var url = $(el).attr("href");

	if(/^\/\//.exec(url)) {
		if(current && current.usage.length > 0) list.push(current);
		current = { name: url, usage: [] };
		
	}
	else
	{
		if(current) current.usage.push(url)
	}

	
});

if(current && current.usage.length > 0) list.push(current);

// sort
list = list.sort(function(a, b) { return a.name < b.name ? -1 : 1; });

var text = "";
list.forEach(function(x) { 
	text += "======= " + decodeURIComponent(x.name) + "\n";
	x.usage.forEach(function(y) {
		text += decodeURIComponent(y) + "\n";
	});

	text += "\n";
})



$("body").prepend($("<textarea style='position: absolute; width: 100%; height: 100%; background-color: #eee; z-index: 10000'>").text(text));