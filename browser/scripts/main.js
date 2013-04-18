requirejs.config({
    shim: {
        'underscore': {
            exports: '_'
        }
    }
});

require(["sweet","./parser", "./expander"], function(sweet, parser, expander) {
    var read = parser.read;
    var expand = expander.expand;
    var flatten = expander.flatten;

    window.read = parser.read;
    window.expand = expander.expand;
    window.parse = parser.parse;
    window.resolve = expander.resolve;

    window.code = document.getElementById("sweetjs").text;

    window.run = function() {

        var code = document.getElementById("sweetjs").text;
        // var res = sweet.compile(code);
        var res = (expand(read(code)));
        // var result = expander.enforest(parser.read(code));
        // var result = expander.expandf(parser.read(code));
        //console.log(parser.parse(res));

//	res.map(printSyntax);

	var fixer = sir_fix_alot();
	res.map(fixer);

	console.log(res);

        document.getElementById("out").innerHTML = res.join("\n");
    };
});

//attempts to repair range information
function sir_fix_alot() {
    var current_loc = 0;
    var line_number = 0;
    var col = 0;

    return function (obj) {
	if (obj.token.range === undefined) {
	    obj.token.old_range = undefined;
	    obj.token.range = new Array(2);
	}
	
	obj.token.range[0] = current_loc;
	if (obj.token.value !== undefined) {
	    current_loc += obj.token.value.length;
	}
	obj.token.range[1] = current_loc;
	current_loc += 1;
    };

}

/* 
 Convert a source map of the format
 { "0" : [{origLine: 0, newLine : 0, origCols: [0,2], newCols: [0,42], range: [0, 42]
          , {origLine: ..... }] }
 to a mozilla source-map
 This requires line & col information rather than range information.
 This also means that we need to fix up line & column information.
*/

function convertSourceMap(fileName, m){
    var s = new SourceMapGenerator({file : fileName});
    for(lineN in m){
	for(k in m[lineN]){
	    s.addMapping({
		source : fileName
		,name : ""
		,original : { 
		    line: m[lineN][k].origLine,
		    column : m[lineN][k].origCols[0]
		},
		generated : {
		    line: m[lineN][k].newLine,
		    column: m[lineN][k].newCols[0]
		}
	    });
	}
    }
    return s;
}

