requirejs.config({
    shim: {
        'underscore': {
            exports: '_'
        }
    }
});

require(["sweet","./parser", "./expander"
	 , "./source-map/source-map-generator"
	 , "./source-map/source-map-consumer"], function(sweet, parser, expander, sourceMapG, sourceMapC) {
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

	var readRes = read(code, {comment: true});
	var comments = readRes[readRes.length - 1];
	readRes = readRes.splice(0, readRes.length - 1);

	console.log("Comments: ");
	console.log(comments);
        var res = expand(readRes);
        // var result = expander.enforest(parser.read(code));
        // var result = expander.expandf(parser.read(code));
        //console.log(parser.parse(res));

//	res.map(printSyntax);

	console.log(res);
	var fix = sir_fix_alot(comments);
	res.map(fix.fixer);

	console.log("Comments: ");
	console.log(fix.retrieveComments());

	var almost_a_src_map = tokensToMappings(res);
	console.log("Almost");
	console.log(almost_a_src_map);
	
	var z = convertSourceMap(sourceMapG.SourceMapGenerator, "aFileName.sjs", almost_a_src_map);
	console.log("Converted");
	console.log(z);
	
	var b = composeSourceMaps(sourceMapG.SourceMapGenerator
				  ,sourceMapC.SourceMapConsumer
				  , z, z);
	console.log("Composed");
	console.log(b);

        document.getElementById("out").innerHTML = res.join("\n");
    };
});

//attempts to repair range information
function sir_fix_alot(comments) {
    var loc = 0;
    var lineNumber = 0;
    var col = 0;
    var newlineTokens = ["{", "}", ";"];
    var unprocessedComments = comments;
    var comments = [];

    function copyOld(obj) {
	//range
	if (obj.token.range === undefined) {
	    obj.token.old_range = undefined;
	    obj.token.range = new Array(2);
	}
	else {
	    obj.token.old_range = obj.token.range.slice();
	}
	obj.token.range = new Array(2); //this is super dumb and we should just fix the root problem
	
	//line number
	obj.token.old_lineNumber = obj.token.lineNumber;

	//line start
	obj.token.old_lineStart = obj.token.lineStart;
    }

    var lastOldLine = -1;
    var lastOldCol = 0;
    var lastOldRangeEnd = 0;

    //Re-generate old lineStart information from range information.
    // will maintain gaps in range (whitespace) & make the line
    // numbers start @ 0.
    // Currently broken. TODO.
    function fixOldLineCol(obj){
	if(obj.token.old_range === undefined
	  || obj.token.value === undefined) return;
	if(obj.token.old_lineNumber != lastOldLine){
	    lastOldCol = 0;
	    lastOldLine += 1;
	}
	
	var d = 0;
	if(lastOldRangeEnd != 0)
	    d = obj.token.old_range[0] - lastOldRangeEnd;
	
	/*console.log("d is "+d);
	console.log(lastOldCol);
	console.log(lastOldRangeEnd);
	console.log(obj);*/
	if(d < 0){ /*console.log("d<0"); console.log(obj);*/  d = 0; }
	
	obj.token.old_lineStart = d + lastOldCol;
	obj.token.old_lineNumber = lastOldLine;

	lastOldCol      = obj.token.old_lineStart + obj.token.value.length;
	//lastOldRangeEnd = obj.token.old_range[1];
    }

    //need this named now so we can call it on comments
    function fixer (obj) {
	copyOld(obj); //copys old information for mapping reasons

	//See if a comment fits here - if it does, fix it appropriately.
	if(unprocessedComments.length && 
	   unprocessedComments[0].range[0] < obj.token.range[0]){
	    var upc = unprocessedComments[0];
	    upc.token = upc; //compatability for copyOld
	    unprocessedComments = unprocessedComments.slice(1, unprocessedComments.length);
	    fixer(upc);
	    comments.push(upc);
	}

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

	//TODO:
	//fixOldLineCol(obj);
    }
    return {
	//Return comments from closure
	retrieveComments : function() { return comments; }
	//Takes in a token and modifies its line number/col and range information
	, fixer : fixer
    };
}

//this will hopefully turn the token array into the array format you want for convertSourceMap
function tokensToMappings(objs) {
    return objs.map(function(obj) {
	var oc = [0,0];
	var nc = [0,0];
	if(obj.token.value !== undefined){
	    if(obj.token.old_lineStart !== undefined){
		oc = [obj.token.old_lineStart
		      , obj.token.old_lineStart + obj.token.value.length]
	    }
	    nc = [obj.token.lineStart
		  , obj.token.lineStart + obj.token.value.length]	    
	}
	return { origLine: obj.token.old_lineNumber
	       , newLine:  obj.token.lineNumber
	       , origCols: oc
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

function convertSourceMap(SourceMapGenerator, fileName, m){
    var s = new SourceMapGenerator({file : fileName});
    m.map(function(obj){
	if(obj.origCols !== undefined && obj.origLine !== undefined){
	    var z = {
		source : fileName
		,name : "Something"
		,original : { 
		    line: 1 + obj.origLine,
		    column : obj.origCols[0]
		},
		generated : {
		    line: 1 + obj.newLine,
		    column: obj.newCols[0]
		}
	    };
	    s.addMapping(z);
	    return z;
	}
	else { 
	    console.log("Undefined orig info");
	    console.log(obj);
	    return undefined; 
	}
    });
    return s.toJSON();
}

function composeSourceMaps(SourceMapGenerator, SourceMapConsumer, m1, m2){
    var r = new SourceMapGenerator({file : m1.file});
    var m1c = new SourceMapConsumer(m2);
    var m2c = new SourceMapConsumer(m2);
    
    m2c.eachMapping(function(mapping){
	var o = m1c.originalPositionFor({ line: mapping.originalLine
					  , column: mapping.originalColumn});
	var x = {
	    source : m1.file
	    ,name : o.name || "Something"
	    ,original : o 
	    ,generated : { line: mapping.generatedLine
			   ,column: mapping.generatedColumn }
	};
	r.addMapping(x);
    });
    return r.toJSON();
}
