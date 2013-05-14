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


(function (root, factory) {
    if (typeof exports === 'object') {
        // CommonJS
        var parser = require("./parser");
        var expander = require("./expander");
	var fix = require("./fix");
        var codegen = require("escodegen");
	var sourceMap = require("source-map")

        factory(exports, parser, expander, fix, codegen, sourceMap);

        // Alow require('./example') for an example.sjs file.
        require.extensions['.sjs'] = function(module, filename) {
            var content = require('fs').readFileSync(filename, 'utf8');
            module._compile(codegen.generate(exports.parse(content)), filename);
        };
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports', './parser', './expander', './fix', './escodegen', 'source-map'], factory);
    } else {
        // Browser globals
        factory((root.sweet = {}), root.parser, root.expander, root.fix, root.codegen, root.sourceMap);
    }
}(this, function (exports, parser, expander, fix, codegen, sourceMap) {

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

        var readTree = parser.read(source, {comment: true});
	var comments = readTree[readTree.length - 1];
        var expanded = expander.expand(readTree.splice(0, readTree.length - 1)); 
        // var flattened = expander.flatten(expanded);

	var fixer = fix.fixer(comments);
	expanded.map(fixer.fixer);

	var sourceMap0 = fix.tokensToMappings(expanded);
	var ast = parser.parse(expanded, undefined, {tokens: true, range: true}, comments);

	if(options !== undefined && options.sourceMap !== undefined){
	    ast.loc = { start: {line : 1, column: 0}, end : {line: 1000, column: 0}};
	    ast = codegen.attachComments(ast, comments, ast.tokens);
	    var map1 = fix.convertSourceMap(sourceMap.SourceMapGenerator
					    , options.inFile
					    , sourceMap0);
	    var map2 = fix.convertSourceMap(sourceMap.SourceMapGenerator
					    , options.inFile
					    , ast.sourceMap);
	    var m1g = sourceMap.SourceMapGenerator.fromSourceMap(
		new sourceMap.SourceMapConsumer(map1));
	    sourceMap.SourceMapGenerator.prototype.applySourceMap.call(
		m1g, new sourceMap.SourceMapConsumer(map1));
	    ast.sourceMap = m1g;
	}

        return ast;
    };
    
    exports.compile = function compile(code, options) {

	var p = exports.parse(code, options);
	if(options !== undefined && options.sourceMap !== undefined){
	    var g = codegen.generate(p,{comment: true
					,sourceMap: options.outFile
					,sourceMapWithCode: true});
	    var c = new sourceMap.SourceMapConsumer(g.map.toJSON());
	    sourceMap.SourceMapGenerator.prototype.applySourceMap.call(
		p.sourceMap
		, new sourceMap.SourceMapConsumer(g.map.toJSON())
		, options.outFile);
	    g.map = p.sourceMap.toJSON();
	    return g;
	}
	else return codegen.generate(p);
    }
}));
