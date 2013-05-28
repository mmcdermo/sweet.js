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
	    if(!isNaN(obj.token.range)){
		console.log("Number range");
		console.log(obj);
	    }
	    if (obj.token.range === undefined 
		|| obj.token.range === null
		|| !isNaN(obj.token.range) ) {
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

	var lastOldLine = 0;
	var lastOldCol = 0;
	var lastOldRangeEnd = 0;

	//Re-generate old lineStart information from range information.
	// will maintain gaps in range (whitespace) & make the line
	// numbers start @ 0.
	function fixOldLineCol(obj){
	    if(obj.token.value === undefined
	       || obj.token.value === null) return;

	    var safeLen = obj.token.value.toString().length;
	    if(isNaN(safeLen)){ console.log("IsNaN"); console.log(obj.token); }
	    
	    if(obj.token.old_range === undefined){
		/*console.log("Token with undefined old range");
		console.log(obj.token);*/
		obj.token.old_range = [lastOldRangeEnd + 1
				     , lastOldRangeEnd + 1 + safeLen]
	    }
	    if(obj.token.old_lineNumber === undefined){
		obj.token.old_lineNumber = lastOldLine;
	    }

	    //Case where the first token to be fixed doesn't start at zero.
	    if(lastOldRangeEnd === 0
	       && lastOldCol === 0
	       && lastOldLine === 0){
		lastOldRangeEnd = obj.token.old_range[0] - 1;
	    }

	    //Reset counters for a new line
	    if(obj.token.old_lineNumber != lastOldLine){
		lastOldCol = 0;
		lastOldLine = obj.token.old_lineNumber;
	    }
	    
	    //Preserve whitespace via range differences
	    var d = 0;
	    if(lastOldRangeEnd != 0)
		d = obj.token.old_range[0] - lastOldRangeEnd;
	    
	    obj.token.old_lineStart = Math.max(d,0) + lastOldCol;

	    lastOldCol = obj.token.old_lineStart + safeLen;
	    if(d < 0) lastOldRangeEnd = lastOldRangeEnd + safeLen;
	    else lastOldRangeEnd = obj.token.old_range[1];
	}
	
	//A function that can be mapped over tokens in an array, using
	// the info gathered in the closure to repair token location information
	function fixer (obj) {
	    copyOld(obj); //copys old information for mapping reasons

	    //See if a comment fits here - if it does, fix it appropriately.
	    if(obj.token.old_range === undefined){
		console.log("Old_range undefined!");
		console.log(obj);
		
	    }
	    while(unprocessedComments.length &&
		  ((obj.token.old_range !== undefined
		   && unprocessedComments[0].range[0] < obj.token.old_range[0])
		  || 
		  (obj.token.old_range === undefined 
		   && unprocessedComments[0].old_lineNumber === lineNumber))){
		var upc = unprocessedComments[0];
		upc.token = upc.clone(); //compatability for copyOld
		unprocessedComments = unprocessedComments.slice(1, unprocessedComments.length);
		var l = lineNumber;
		fixer(upc);

		//Comments always end up on their own lines
		if(lineNumber == l){
		    lineNumber += 1;
		    col = 0;
		}
		
		upc.range = upc.token.range;
		comments.push(upc);
	    }
	    
	    //write new location information to token
	    obj.token.range[0] = loc;
	    obj.token.lineStart = col;
	    obj.token.lineNumber = lineNumber;

	    if (obj.token.value !== undefined && obj.token.value !== null) {
		var safeLen = obj.token.value.toString().length;
		loc += safeLen;
		col += safeLen;
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
	    
	    //Fix obj.loc
	    if (obj.token.value !== undefined && obj.token.value !== null
		&& obj.token.value.length !== undefined) {
		var locLineStart = obj.token.lineStart;
		if(isNaN(locLineStart)) locLineStart = 1;
		obj.loc = {
		    start : { line: obj.token.lineNumber + 1
			      , column: locLineStart }
		    ,end : { line: obj.token.lineNumber + 1
			     , column: locLineStart + obj.token.value.length }
		}
	    }
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

    //Converts array of tokens to an intermediary source-map format
    function tokensToMappings(objs) {
	return objs.map(function(obj) {
	    var oc = [0,0];
	    var nc = [0,0];
	    if(obj.token.value !== undefined && obj.token.value !== null
	       && obj.token.value.length !== undefined
	       && obj.token.lineStart !== undefined 
	       && obj.token.lineStart){
		if(obj.token.old_lineStart !== undefined 
		   && obj.token.old_lineStart !== null
		   && !isNaN(obj.token.old_lineStart)
		   && obj.token.value.length !== undefined){
		    oc = [obj.token.old_lineStart
			  , obj.token.old_lineStart + obj.token.value.length]
		}
		nc = [obj.token.lineStart
		      , obj.token.lineStart + obj.token.value.length]	    
	    }
	    /*console.log("Mapping l_"+obj.token.old_lineNumber+" to l_"+obj.token.lineNumber+" cols:");
	    console.log(oc);
	    console.log(nc);*/

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
	    if(obj.origCols !== undefined && obj.origLine !== undefined
	       && obj.origCols[1] - obj.origCols[0] > 0){
		if(obj.origLine === 0) obj.origLine = 1;
		if(obj.newLine === 0) obj.newLine = 1;
		var z = {
		    source : fileName
		    ,name : "Something"
		    ,original : { 
			line: obj.origLine,
			column : obj.origCols[0]
		    },
		    generated : {
			line: obj.newLine,
			column: obj.newCols[0]
		    }
		};
		/*console.log("Mapping from line "+obj.origLine+" col "+obj.origCols[0]
		  + " to line "+obj.newLine+" col "+obj.newCols[0]);*/
		s.addMapping(z);
		return z;
	    }
	    else { 
		/*console.log("Undefined orig info");
		console.log(obj);*/
		return undefined; 
	    }
	});
	return s.toJSON();
    }

    exports.fixer = sir_fix_alot;
    exports.tokensToMappings = tokensToMappings;
    exports.convertSourceMap = convertSourceMap;
}));
