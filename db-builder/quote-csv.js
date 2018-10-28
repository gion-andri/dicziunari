var fs = require('fs');
var through = require('through2');
var quoteQuotes = function(buffer, _, next) {
    this.push(buffer.toString().replace(/\"/g, "\"\"").replace(/(\\N)/g, ""));
    next();
};
fs.createReadStream(process.argv[2], {encoding: "latin1"})
    .pipe(through(quoteQuotes))
    .pipe(process.stdout);
