var fs = require("fs");

var sweet = require("./sweet.js");

var argv = require("optimist")
            .usage("Usage: sjs [options] path/to/file.js")
            .demand(1)
            .alias('s', 'sourcemap')
            .describe('s', 'Generate a sourcemap')
            .boolean('s')
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
    console.out(argv);
    var infile = argv._[0];
    var outfile = argv.output;
    var comments = argv.nocomment;
    var sourcemap = argv.sourcemap;
    var watch = argv.watch;
    var file = fs.readFileSync(infile, "utf8");

	if (watch && outfile){
		fs.watch(infile, function(){
			file = fs.readFileSync(infile, "utf8");
			try {
				fs.writeFileSync(outfile, sweet.compile(file), "utf8");
			} catch (e) {
				console.log(e);
			}
		});
	} else if(outfile) {
       fs.writeFileSync(outfile, sweet.compile(file), "utf8");
    } else {
        console.log(sweet.compile(file));
    }
};
