const fs = require('fs');
const { chain }  = require('stream-chain');
const  {parser } = require('stream-json');
const { pick }   = require('stream-json/filters/Pick');
const { ignore } = require('stream-json/filters/Ignore');
const { streamArray } = require('stream-json/streamers/StreamArray');
const Database = require('better-sqlite3');
const { EBADF } = require('constants');

const DB_NAME = 'build/dicziunari.db';
const TABLE_RUMGR = 'rumgr';
const TABLE_RUMGR_IDX = 'rumgr_idx';
const FILE_PATH = 'data/rumantschgrischun_data_json.json';
const finalDirectory = '../app/www/';

let processedEntries = 0;
const columnList = [
    { colName: 'id',                 colType: 'INTEGER PRIMARY KEY' },
    { colName: 'lemma',              colType: 'TEXT' },
    { colName: 'translation',        colType: 'TEXT' },
    { colName: 'direction',          colType: 'TEXT' },
    { colName: 'weight',             colType: 'INTEGER' },

    // conj
    { colName: 'infinitiv',          colType: 'TEXT' },
    { colName: 'preschentsing1',     colType: 'TEXT' },
    { colName: 'preschentsing2',     colType: 'TEXT' },
    { colName: 'preschentsing3',     colType: 'TEXT' },
    { colName: 'preschentplural1',   colType: 'TEXT' },
    { colName: 'preschentplural2',   colType: 'TEXT' },
    { colName: 'preschentplural3',   colType: 'TEXT' },
    { colName: 'imperfectsing1',     colType: 'TEXT' },
    { colName: 'imperfectsing2',     colType: 'TEXT' },
    { colName: 'imperfectsing3',     colType: 'TEXT' },
    { colName: 'imperfectplural1',   colType: 'TEXT' },
    { colName: 'imperfectplural2',   colType: 'TEXT' },
    { colName: 'imperfectplural3',   colType: 'TEXT' },
    { colName: 'participperfectfs',  colType: 'TEXT' },
    { colName: 'participperfectms',  colType: 'TEXT' },
    { colName: 'participperfectfp',  colType: 'TEXT' },
    { colName: 'participperfectmp',  colType: 'TEXT' },
    { colName: 'futursing1',         colType: 'TEXT' },
    { colName: 'futursing2',         colType: 'TEXT' },
    { colName: 'futursing3',         colType: 'TEXT' },
    { colName: 'futurplural1',       colType: 'TEXT' },
    { colName: 'futurplural2',       colType: 'TEXT' },
    { colName: 'futurplural3',       colType: 'TEXT' },
    { colName: 'conjunctivsing1',    colType: 'TEXT' },
    { colName: 'conjunctivsing2',    colType: 'TEXT' },
    { colName: 'conjunctivsing3',    colType: 'TEXT' },
    { colName: 'conjunctivplural1',  colType: 'TEXT' },
    { colName: 'conjunctivplural2',  colType: 'TEXT' },
    { colName: 'conjunctivplural3',  colType: 'TEXT' },
    { colName: 'cundizionalsing1',   colType: 'TEXT' },
    { colName: 'cundizionalsing2',   colType: 'TEXT' },
    { colName: 'cundizionalsing3',   colType: 'TEXT' },
    { colName: 'cundizionalplural1', colType: 'TEXT' },
    { colName: 'cundizionalplural2', colType: 'TEXT' },
    { colName: 'cundizionalplural3', colType: 'TEXT' },
    { colName: 'imperativ1',         colType: 'TEXT' },
    { colName: 'imperativ2',         colType: 'TEXT' },
    { colName: 'gerundium',          colType: 'TEXT' },
];

let db;
let insertStatementLemma;
let insertStatementIdx;
let id = 1;

function prepareAndClendDb() {
    db = new Database(DB_NAME);

    //speedup for sqlite inserts
    //as seen on http://blog.quibb.org/2010/08/fast-bulk-inserts-into-sqlite/
    db.pragma("synchronous=OFF");
    db.pragma("count_changes=OFF");
    db.pragma("journal_mode=MEMORY");
    db.pragma("temp_store=MEMORY");

    db.exec("DROP TABLE IF EXISTS " + TABLE_RUMGR + ";");
    db.exec("DROP TABLE IF EXISTS " + TABLE_RUMGR_IDX + ";")

    // create used columns
    const columnDef = columnList.map(column => column.colName + ' ' + column.colType).join(", ");
    db.exec("CREATE TABLE " + TABLE_RUMGR + "(" + columnDef + ");");
    db.exec("CREATE VIRTUAL TABLE " + TABLE_RUMGR_IDX + " using fts5(id, keyword);");

    // create prepared statement to add each lemma
    insertStatementLemma = db.prepare(
        "INSERT INTO " + TABLE_RUMGR + " ("+ columnList.map(col => col.colName).join(", ")+") " + 
        "VALUES (" + Array.from(columnList).map(column => "$"+column.colName).join(", ")+");");
    insertStatementIdx = db.prepare("INSERT INTO " + TABLE_RUMGR_IDX + " (id, keyword) VALUES (?, ?);");

    // start transation
    db.exec("BEGIN TRANSACTION;");

}

function createPipeline(filePath) {
    return chain([
        fs.createReadStream(filePath),
        parser(),
        //pick(),
        streamArray(),
        data => {
            return data.value;
          }
    ]);
}

// This function can be used to handle each lemma to check if all columns exported from the json are found
function searchColumnNames(lemma) {
    ++processedEntries;

    for(let property in lemma) {
        if (!columnList.includes(property)) {
            console.error("Colum '" + property + "' missing");
            throw new Error("Column missing!");
        }
    }

    if (processedEntries % 1000 === 0) {
        console.log('Processed ' + processedEntries + ' lemmas');
    }
}

function handleLemma(lemma) {
    //console.log(lemma);

    // filter empty objects
    if (!Object.keys(lemma).length || !lemma.DStichwort || !lemma.RStichwort) {
        return;
    }

    var origin = expand(lemma.DStichwort);
    var translation = expand(lemma.RStichwort);

    var binds = {};
    columnList.forEach(column => binds[column.colName] = lemma[column.colName]);

    binds['id'] = id;
    binds['lemma'] = lemma.DStichwort + box(lemma.DGenus, ' [', ']');
    binds['translation'] = lemma.RStichwort + box(lemma.RGenus, ' [', ']');
    binds['direction'] = 'de_rm-rumgr';
    binds['weight'] = prio(lemma.DStichwort, lemma.DSubsemantik, lemma.DGenus);
    insertStatementLemma.run(binds);
    insertStatementIdx.run(id, origin);
    id++;

    binds['id'] = id;
    binds['lemma'] = lemma.RStichwort + box(lemma.RGenus, ' [', ']');
    binds['translation'] = lemma.DStichwort + box(lemma.DGenus, ' [', ']');
    binds['direction'] = 'rm-rumgr_de';
    binds['weight'] = prio(lemma.RStichwort, lemma.RSubsemantik, lemma.RGenus);
    insertStatementLemma.run(binds);
    insertStatementIdx.run(id, translation);
    id++;

    ++processedEntries;
    if (processedEntries % 1000 === 0) {
        console.log('Processed ' + processedEntries + ' lemmas');
    }
}

function finalizeDb() {
    console.log('Processed ' + processedEntries + ' lemmas');
    console.log('file ended');

    db.exec("COMMIT TRANSACTION;");
    db.close();

    console.log('Copy DB File to App resources...');
    if (!fs.existsSync(finalDirectory)){
        fs.mkdirSync(finalDirectory);
    }
    fs.copyFile('build/dicziunari.db', finalDirectory + 'dicziunari.db', (err) => {
        if (err) throw err;
        console.log('Copied database to final directory');
      });

    console.log('Conversion ended');
}

function configurePipeline(pipeline) {
    pipeline.on('data', (data) => {
        handleLemma(data);
        // searchColumnNames(data);
    });

    pipeline.on('end', () => {
        finalizeDb();
        console.timeEnd('duration');
    });
}

var regexWritings = /(\w+)(?:\(([a-z]+)(?:,-([a-z]+))?\))/g;

function expand(plaid) {
    var bracketStart = plaid.indexOf('(');
    if (bracketStart > 0) {
        var bracketEnd = plaid.lastIndexOf(')');
        if (bracketEnd < bracketStart) {
            console.log('encountered expression with strange brackets: ' + plaid);
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

function box(value, prefix, suffix) {
    return value? prefix + value + suffix: '';
}

function prio(stichwort, subsemantik, genus) {
    return stichwort.length*4 + (subsemantik === null? 0: 1) + (genus === null? 0: 2);
}

module.exports = {
    main: function () {
        console.log('Start converting JSON file...');
        console.time('duration');

        prepareAndClendDb();

        const pipeline = createPipeline(FILE_PATH);
        configurePipeline(pipeline);
    }
}