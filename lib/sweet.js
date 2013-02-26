/*
  Copyright (C) 2012 Tim Disney <tim@disnet.me>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

	function rlog(obj){
	    rlogaux(obj+"", obj, 0, 9000);
	}

	function rlogaux (fieldName, obj, n, limit){
	    console.log("Field "+fieldName+" Nesting level "+n);
	    console.log(obj);
	    console.log("\n");
	    if(n < limit){
		for(x in obj){
		    if(typeof(obj[x]) === 'object'){
			rlogaux(x, obj[x], n+1, limit);
		    }
		}
	    }
	}

/*var mapTokenRangesZ = function(a){
	    var tok = a;
	    console.log(tok);
	    if(tok.hasOwnProperty("range")
	       && tok.hasOwnProperty("loc")){
		console.log("Range: "); console.log(tok.range);
		console.log("Loc: "); console.log(tok.loc);
	    }
	    else {
		console.log("MISSINGMISSINGMISSINGMISSINGMISSINGMISSING");
		console.log(a);
		console.log("MISSINGMISSINGMISSINGMISSINGMISSINGMISSING");
	    }
	    if(tok.hasOwnProperty("inner")){
		_.map(tok.inner, function(a){ mapTokenRanges(a) });
	    }
	}
*/

(function (root, factory) {
    if (typeof exports === 'object') {
        // CommonJS
        var parser = require("./parser");
        var expander = require("./expander");
        var codegen = require("escodegen");
	var esprima = require("esprima");

        factory(exports, esprima, parser, expander, codegen);

        // Alow require('./example') for an example.sjs file.
        require.extensions['.sjs'] = function(module, filename) {
            var content = require('fs').readFileSync(filename, 'utf8');
            module._compile(codegen.generate(exports.parse(content)), filename);
        };
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports', './parser', './expander', './escodegen'], factory);
    } else {
        // Browser globals
        factory((root.sweet = {}), root.parser, root.expander, root.codegen);
    }
}(this, function (exports, esprima, parser, expander, codegen) {

    // (Str, {}) -> AST
    exports.parse = function parse(code, options) {
        var program, toString;

        toString = String;
        if (typeof code !== 'string' && !(code instanceof String)) {
            code = toString(code);
        }
        
        var source = code;

        if (source.length > 0) {
            if (typeof source[0] === 'undefined') {
                // Try first to convert to a string. This is good as fast path
                // for old IE which understands string indexing for string
                // literals only and not for string object.
                if (code instanceof String) {
                    source = code.valueOf();
                }

                // Force accessing the characters via an array.
                if (typeof source[0] === 'undefined') {
                    source = stringToArray(code);
                }
            }
        }


        var readTree = parser.read(source, {range: true, loc: true, tokens: true, comment: true});
	var comments = readTree[ readTree.length - 1];
	readTree = Array().slice.call(readTree, 0, readTree.length - 1);
	
	
	//console.log(_.map(readTree, function(a){ mapTokenRanges(a) }));
	//JavascriptIsEasilyCrashed({z: WillThisGetEvaluatedFirst}); 
	//console.log(comments);
	//console.log("===========================================");
	//rlog(readTree);
	//console.log("===========================================");
	console.log("==================Expander========================");
        var expanded = expander.expand(readTree); 
	//rlog(expanded);
	console.log("=================Flatten==========================");
        var flattened = expander.flatten(expanded);
	//rlog(flattened);
	console.log("===========================================");
        var ast = parser.parse(flattened);
	//rlog(ast);
	//console.log(_.map(ast, function(a){ mapTokenRanges(a) }));
	console.log("===========================================");
	ast.comments = comments;
        return ast;
    };
    
    exports.compile = function compile(code, options) {
	var ast = exports.parse(code, {comment: true, tokens: true, loc: true
				       ,range: true} );
	console.log("====888=====");
	ast.range = [0, code.length];
	console.log(ast);
	//JavascriptIsEasilyCrashed({z: WillThisGetEvaluatedFirst});
	console.log("===AST Deep=====");
	rlogaux("", ast, 0, 7);
	//console.log(_.map(ast.body[0].declarations, function(a){ mapTokenRanges(a) }));
	ast = codegen.attachComments(ast, ast.comments, ast.body[0].body); //[0].declarations);
	//rlog(ast.comments);
	var r = codegen.generate(ast, {comment: true
			//	       , sourceMap:"test.sjs"
			//	       , sourceMapWithCode: "truthy"
				      });
	/*var tree = esprima.parse(code, { range: true, token: true, comment: true });
	tree = escodegen.attachComments(tree, tree.comments, tree.tokens);
	var output = escodegen.generate(tree);*/


	r2 = "var a = 'bam';//Foo\nvar a = 'bam';//Foo\nvar a = 'bam';//Foo\n";
	var ast2 = esprima.parse(r2, {comment: true, tokens: true, loc: true, range: true});
	console.log("==2==========+++++++++++++++++=============");
	console.log(ast2.range);
	//console.log(ast2.tokens);
	ast2 = codegen.attachComments(ast2, ast2.comments, ast2.tokens);
	console.log("============+++++++++++++++++=============");
	rlog(ast2);
	var r3 = codegen.generate(ast2, {comment: true, sourceMap: "Rawr.js"});
	console.log("============+++++++++++++++++=============");
	console.log(r3);
	console.log("=========================");
	
	return r;
    }
}));
