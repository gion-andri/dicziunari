var sqlite3 = require('better-sqlite3');
var parse = require('csv-parse');
var fs = require('fs');

console.time("duration");
var db = new sqlite3('../ionic-app/www/dicziunari.db');

function cleanse(record) {
    return Object.keys(record).map(key => {
        if (record[key] === "\\N") {
            record[key] = null;
        }
    });
}

function box(value, prefix, suffix) {
    return value? prefix + value + suffix: '';
}

function prio(stichwort, subsemantik, genus) {
    return 1;
}

var regexWritings = /(\w+)(?:\(([a-z]+)(?:,-([a-z]+))?\))/g;

function expand(plaid, csvRowNum) {
    var bracketStart = plaid.indexOf('(');
    if (bracketStart > 0) {
        var bracketEnd = plaid.lastIndexOf(')');
        if (bracketEnd < bracketStart) {
            console.log('encountered expression with strange brackets on csv line '+csvRowNum+': ' + plaid);
            return plaid;
        }
        var bracketPart = plaid.substring(bracketStart, bracketEnd);
        bracketPart = bracketPart.replace(/((pl|f)\W+)/g, ''); // remove 'pl.', 'f.'
        plaid = plaid.substring(0, bracketStart) + bracketPart + plaid.substring(bracketEnd);
        var matches;
        var result = '';
        var prevEnd = 0;
        while (matches = regexWritings.exec(plaid)) {
            result += plaid.substring(prevEnd, matches.index);
            result += matches[1] + ' ' + matches[1] + matches[2];
            if (matches[3]) {
                result += ' ' + matches[1] + matches[3];
            }
            prevEnd += matches.index + matches[0].length;
        }
        result += plaid.substring(prevEnd);
        plaid = result;
    }
    return plaid;
}

//speedup for sqlite inserts
//as seen on http://blog.quibb.org/2010/08/fast-bulk-inserts-into-sqlite/
db.pragma("synchronous=OFF");
db.pragma("count_changes=OFF");
db.pragma("journal_mode=MEMORY");
db.pragma("temp_store=MEMORY");

db.exec("DROP TABLE IF EXISTS dictionary_content;");
db.exec("DROP TABLE IF EXISTS dictionary_idx;");
var cols = [
    { colName: 'id',          colType: 'INTEGER PRIMARY KEY' },
    { colName: 'original',    colType: 'TEXT' },
    { colName: 'translation', colType: 'TEXT' },
    { colName: 'direction',   colType: 'TEXT' },
    { colName: 'weight',      colType: 'INTEGER' },
    { colName: 'line_csv',   colType: 'INTEGER' }];
db.exec("CREATE TABLE dictionary_content (" + 
    cols.map(col => col.colName + ' ' + col.colType).join(', ') + ");");
db.exec("CREATE VIRTUAL TABLE dictionary_idx using fts5(keywords, content = 'dictionary_content', content_rowid = 'id', columnsize=0);");

var stmt = db.prepare('INSERT INTO dictionary_content ( ' +
    cols.map(col => col.colName).join(', ') +
    ') VALUES (' + new Array(cols.length).fill("?").join(', ') + ')');
var stmtIdx = db.prepare('INSERT INTO dictionary_idx (rowId, keywords) VALUES (?, ?)');
db.exec("BEGIN TRANSACTION;");

var parser = parse({
    delimiter: '\t',
    quote: false,
    columns: true});
var csvRowNum = 1;
var id = 1;
// Use the writable stream api
parser.on('readable', function(){
    var row;
    while(row = parser.read()){
        cleanse(row);
        if (row.DStichwort && row.RStichwort) {
            var origin = expand(row.DStichwort, csvRowNum);
            stmt.run(
                id,
                row.DStichwort + box(row.DSubsemantik, ' (', ')') + box(row.DGenus, ' [', ']'),
                row.RStichwort + box(row.RSubsemantik, ' (', ')') + box(row.RGenus, ' [', ']'),
                'tu-rg', 
                row.DStichwort.length*4 + (row.DSubsemantik === null? 0: 1) + (row.RSubsemantik === null? 0: 2),
                csvRowNum);
            stmtIdx.run(id, origin);
            id++;
            var translation = expand(row.RStichwort, csvRowNum);
            if (translation.toLowerCase() !== origin.toLowerCase()) {
                stmt.run(
                    id,
                    row.RStichwort + box(row.RSubsemantik, ' (', ')') + box(row.RGenus, ' [', ']'),
                    row.DStichwort + box(row.DSubsemantik, ' (', ')') + box(row.DGenus, ' [', ']'),
                    'rg-tu', 
                    row.RStichwort.length*4 + (row.RSubsemantik === null? 0: 1) + (row.DSubsemantik === null? 0: 2),
                    csvRowNum);
                stmtIdx.run(id, translation);
                id++;
            }
        } else {
            console.log('unexpected data at csv line ' + csvRowNum + ': ' + JSON.stringify(row));
        }
        csvRowNum++;
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
