var sqlite3 = require('better-sqlite3');
var parse = require('csv-parse');
var fs = require('fs');

console.time("duration");
var db = new sqlite3('dicziunari.db');

function cleanse(record) {
    return record.map(colValue => {
        if (colValue === "\\N") 
            return null;
        else 
            return colValue;
        });
}

var stmt;
var nCols;
var parser = parse({
    delimiter: '\t',
    quote: false,
    columns: function(cols) {
        nCols = cols.length;
        //speedup for sqlite inserts
        //as seen on http://blog.quibb.org/2010/08/fast-bulk-inserts-into-sqlite/
        db.pragma("synchronous=OFF");
        db.pragma("count_changes=OFF");
        db.pragma("journal_mode=MEMORY");
        db.pragma("temp_store=MEMORY");
        db.exec("DROP TABLE IF EXISTS rm_grischun_csv;");
        var columnDef = Array.from(cols).map(col => col + " TEXT").join(", ");
        //build an fts5 index for full text search. sample query against this index:
        //select DStichwort, RStichwort, rank from rm_grischun_csv where rm_grischun_csv match 'RStichwort: c*' order by rstichwort, rank, dstichwort;
        db.exec("CREATE VIRTUAL TABLE rm_grischun_csv using fts5(" +cols.join(', ') + ");");
        stmt = db.prepare(
            "INSERT INTO rm_grischun_csv ("+cols.join(", ")+") " + 
            "VALUES ("+new Array(cols.length).fill("?").join(", ")+");");
        db.exec("BEGIN TRANSACTION;");
    }});
// Use the writable stream api
parser.on('readable', function(){
    var record;
    while(record = parser.read()){
        stmt.run(cleanse(record));
    }
  });
// Catch any error
parser.on('error', function(err){
    console.log(err.message);
  });
parser.on('finish', function(){
    console.log("processed " + parser.lines + " lines. Committing...");
    db.exec("COMMIT;");
    console.log("committed");
    db.close();
    console.timeEnd("duration");
  });

fs.createReadStream('rumantschgrischun_data_csv.csv', {encoding: "latin1"})
  .pipe(parser);
