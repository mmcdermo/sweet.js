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
	
	//I guess I'll do this...
	Array.prototype.map = function(fn) {
	    var r = [];
	    var l = this.length;
	    for(i=0;i<l;i++)
	    {
		r.push(fn(this[i]));
	    }
	    return r;  
	};


	console.log(res);

	var fixer = sir_fix_alot();	
	res = res.map(fixer);

        console.log(res);

        document.getElementById("out").innerHTML = res.join("\n");
    };
});



function sir_fix_alot() {
    var current_loc = 0;

    return function (object) {
	object.token.old_range = object.token.range; //save the old range for mapping purposes
	if (object.token.range === undefined) {      //tokens generated by macro expansion have no old range
	    object.token.range = new Array(2);
	}
	object.token.range[0] = current_loc;         //replace starting spot with current location
	if (object.token.value !== undefined) {
	    current_loc += object.token.value.length;    //adjust current location by size of token
	}
	else {
	    console.log("EOF token, I think.");
	}
	object.token.range[1] = current_loc;         //set ending spot to current location
	current_loc += 1;
	return object;

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
}
