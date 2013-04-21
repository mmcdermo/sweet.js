requirejs.config({
    shim: {
        'underscore': {
            exports: '_'
        }
    }
});

require(["sweet","./parser", "./expander"
	 , "./source-map/source-map-generator"], function(sweet, parser, expander, sourceMap) {
    var read = parser.read;
    var expand = expander.expand;
    var flatten = expander.flatten;
    console.log(sourceMap);

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

	//TODO: call the function that makes this a src map
	var almost_a_src_map = tokensToMappings(res);
	console.log("Almost");
	console.log(almost_a_src_map);
	
	SourceMapGenerator = sourceMap.SourceMapGenerator;
	var z = convertSourceMap("aFileName.sjs", almost_a_src_map);
	console.log("Converted");
	console.log(z);

        document.getElementById("out").innerHTML = res.join("\n");
    };
});

//attempts to repair range information
function sir_fix_alot() {
    var loc = 0;
    var lineNumber = 0;
    var col = 0;
    var newlineTokens = ["{", "}", ";"];

    function copyOld(obj) {
	//range
	if (obj.token.range === undefined) {
	    obj.token.old_range = undefined;
	    obj.token.range = new Array(2);
	}
	else {
	    obj.token.old_range = obj.token.range.slice();
	}
	
	//line number
	obj.token.old_lineNumber = obj.token.lineNumber;

	//line start
	obj.token.old_lineStart = obj.token.lineStart;
    }

    //Takes in a token and modifies its line number/col and range information
    return function (obj) {
	copyOld(obj); //copys old information for mapping reasons


	//write new location information to token
	obj.token.range[0] = loc;
	obj.token.lineStart = col;
	obj.token.lineNumber = lineNumber;
	if (obj.token.value !== undefined) {
	    loc += obj.token.value.length;
	    col += obj.token.value.length;
	}
	obj.token.range[1] = loc;
	loc += 1;
	col += 1;

	//should the token cause a newline to occur
	if (newlineTokens.indexOf(obj.token.value) !== -1) {
	    col = 0;
	    lineNumber += 1;
	}
    };

}

//this will hopefully turn the token array into the array format you want for convertSourceMap
function tokensToMappings(objs) {
    return objs.map(function(obj) {
	var nc = [0,0];
	if(obj.token.value !== undefined)
	    nc = [obj.token.lineStart
		  , obj.token.lineStart + obj.token.value.length]	    
	return { origLine: obj.token.old_lineNumber
	       , newLine:  obj.token.lineNumber
	       , origCols: obj.token.old_range
	       , newCols:  nc
               , origObj:  obj
	       , range:    obj.token.range};
    });
}

/* 
 Convert a source map of the format
 [{origLine: 0, newLine : 0, origCols: [0,2], newCols: [0,42], range: [0, 42]
          , {origLine: ..... }]
 to a mozilla source-map
 This requires line & col information rather than range information.
 This also means that we need to fix up line & column information.
*/

function convertSourceMap(fileName, m){
    var s = new SourceMapGenerator({file : fileName});
    for(k in m){
	s.addMapping({
	    source : fileName
	    ,name : ""
	    ,original : { 
		line: m[k].origLine,
		column : m[k].origCols[0]
	    },
	    generated : {
		line: m[k].newLine,
		column: m[k].newCols[0]
	    }
	});
    }

    return s;
}

function composeSourceMaps(m1, m2){
    return m1;
}
