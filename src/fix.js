(function (root, factory) {
    if (typeof exports === 'object') {
        // CommonJS
        factory(exports, require("escodegen"), require("source-map"));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports', 'escodegen', 'source-map'], factory);
    } else {
        // Browser globals
        factory((root.expander = {}), root._, root.parser);
    }
}(this, function (exports, codegen, sourceMap) {
    Object.prototype.clone = function() {
	var newObj = (this instanceof Array) ? [] : {};
	for (i in this) {
	    if (i == 'clone') continue;
	    if (this[i] && typeof this[i] == "object") {
		newObj[i] = this[i].clone();
	    } else newObj[i] = this[i]
	} return newObj;
    };

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
	    obj.token.range = [0,0]; //this is super dumb and we should just fix the root problem
	    
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
	    obj.token.old_lineStart = Math.max(d,0) + lastOldCol;
	    obj.token.old_lineNumber = lastOldLine;

	    lastOldCol      = obj.token.old_lineStart + obj.token.value.length;
	    if(d < 0) lastOldRangeEnd = lastOldRangeEnd + obj.token.value.length;
	    else lastOldRangeEnd = obj.token.old_range[1];
	}

	//need this named now so we can call it on comments
	function fixer (obj) {
	    copyOld(obj); //copys old information for mapping reasons

	    //See if a comment fits here - if it does, fix it appropriately.
	    while(unprocessedComments.length && obj.token.old_range !== undefined
		  && unprocessedComments[0].range[0] < obj.token.old_range[0]){
		var upc = unprocessedComments[0];
		upc.token = upc.clone(); //compatability for copyOld
		unprocessedComments = unprocessedComments.slice(1, unprocessedComments.length);
		fixer(upc);
		upc.range = upc.token.range;
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

	    fixOldLineCol(obj);
	}
	return {
	    //Return comments from closure
	    retrieveComments : function() { 
		if(unprocessedComments.length){ //Comments from end of file
		    unprocessedComments.map(function(obj){
			obj.token = obj.clone(); //compatability for copyOld
			fixer(obj);
			comments.push(obj);
		    });
		}
		return comments;
	    }
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
    exports.fixer = sir_fix_alot;
    exports.tokensToMappings = tokensToMappings;
    exports.convertSourceMap = convertSourceMap;
    exports.composeSourceMaps = composeSourceMaps;
}));
