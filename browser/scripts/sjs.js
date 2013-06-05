var fs = require("fs");

var sweet = require("./sweet.js");

var argv = require("optimist")
            .usage("Usage: sjs [options] path/to/file.js")
            .demand(1)
            .alias('s', 'sourcemap')
            .describe('s', 'Generate a sourcemap')
            .string('s')
            .alias('c', 'nocomment')
            .describe('c', 'Disables the output of comments')
            .boolean('c')
            .alias('o', 'output')
            .describe('o', 'Output file path')
            .alias('watch', 'w')
            .describe('watch', 'watch a file')
            .boolean('watch')
            .argv;


exports.run = function() {
    var infile = argv._[0];
    var outfile = argv.output;
    var comments = argv.nocomment;
    var sourcemap = argv.sourcemap;
    var watch = argv.watch;
    var file = fs.readFileSync(infile, "utf8");

    function sourceMapComment(file){ return "\n //@ sourceMappingURL=" + file; }
    function writeFiles(input){
	try {
	    if(sourcemap){
		var o = sweet.compile(file, {sourceMap : sourcemap
					     ,inFile : infile
					     ,outFile : outfile});
		o.map.file = outfile;
		fs.writeFileSync(sourcemap, JSON.stringify(o.map), "utf8");
		fs.writeFileSync(outfile, o.code + sourceMapComment(sourcemap), "utf8");
	    }
	    else fs.writeFileSync(outfile, sweet.compile(file), "utf8");
	} catch (e) {
	    console.log(e);
	}
    }
    
    if (watch && outfile){
	fs.watch(infile, function(){
	    file = fs.readFileSync(infile, "utf8");
	    writeFiles(file);
	});
    } else if(outfile) {
	writeFiles(file);
    } else {
        console.log(sweet.compile(file));
    }
};
