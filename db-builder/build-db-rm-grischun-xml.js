var sqlite3 = require('better-sqlite3');
var xmlStreamer = require('xml-streamer');
var fs = require('fs');

console.time("duration");
var db = new sqlite3('dicziunari.db');


var stmt;
var nCols;
var nElements = 0;
var colNames = [
    'DGrammatik',
    'DStichwort',
    'DGenus',
    'DSubsemantik',
    'Bearbeitungshinweis',
    'redirect_a',
    'RStichwort',
    'RGrammatik',
    'RGenus',
    'RSubsemantik',
    'redirect_b'];
setupDb(colNames);

var parser = new xmlStreamer({resourcePath: '/entries/LemmaVersion/fields'});
parser.on('data', function(data){
    if (data && data.entry){
        var binds = {};
        colNames.forEach(col => binds[col] = null);
        data.entry.forEach(e => {
            binds[e.key[0]._] = e.value[0]._;
        });
        stmt.run(binds);
        nElements++;
        if (nElements % 10000 === 0) 
            console.log(nElements);
    }
  });
// Catch any error
parser.on('error', function(err){
    console.log(err);
    finalize();
  });
parser.on('end', finalize);

function setupDb(cols) {
    nCols = cols.length;
    //speedup for sqlite inserts
    //as seen on http://blog.quibb.org/2010/08/fast-bulk-inserts-into-sqlite/
    db.pragma("synchronous=OFF");
    db.pragma("count_changes=OFF");
    db.pragma("journal_mode=MEMORY");
    db.pragma("temp_store=MEMORY");
    db.exec("DROP TABLE IF EXISTS rm_grischun_xml;");
    var columnDef = Array.from(cols).map(col => col + " TEXT").join(", ");
    db.exec("CREATE TABLE rm_grischun_xml(" +columnDef + ");");
    stmt = db.prepare(
        "INSERT INTO rm_grischun_xml ("+cols.join(", ")+") " + 
        "VALUES ("+Array.from(cols).map(col => "$"+col).join(", ")+");");
    db.exec("BEGIN TRANSACTION;");
};

 function finalize() {
    console.log("processed " + nElements + " lines. Committing...");
    db.exec("COMMIT;");
    console.log("committed");
    db.close();
    console.timeEnd("duration");
};

fs.createReadStream('rumantschgrischun_data_xml.xml')
  .pipe(parser);
