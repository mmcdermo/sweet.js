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

	//store first source mapping for later
	var sourceMap0 = fix.tokensToMappings(expanded);
	
	var ast = parser.parse(expanded, undefined, {tokens: true, range: true}, comments);
	
	ast = codegen.attachComments(ast, comments, ast.tokens);

	/** Some magic with sourcemaps goes here **/
	/*var map1 = fix.convertSourceMap(sourceMap.SourceMapGenerator
				    , "aFileName.sjs"
				    , sourceMap0);
	var map2 = fix.convertSourceMap(sourceMap.SourceMapGenerator
				    , "aFileName.sjs"
				    , ast.sourceMap);

	var m1g = new sourceMap.SourceMapGenerator(new sourceMap.SourceMapConsumer(map1));
	var composed = m1g.applySourceMap(new sourceMap.SourceMapConsumer(map1));
	ast.sourceMap = composed;*/

        return ast;
    };
    
    exports.compile = function compile(code, options) {
      return codegen.generate(exports.parse(code, options));
    }
}));
