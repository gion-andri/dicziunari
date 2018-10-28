console.log('initializing queries...');

var sqlQueries = {
    getCountSqlQuery: function () {
        return '' +
            'select count(1) as myCount ' +
            'from dictionary_idx ' +
            'where dictionary_idx match ? ';
    },

    getItemsSqlQuery: function () {
        var query = '' +
            'select c.original, c.translation, ' +
            'c.direction, c.weight ' +
            'from dictionary_content c, dictionary_idx idx ' +
            'where idx.dictionary_idx match ? ' +
            'and idx.rowid = c.id ' + 
            'order by c.weight, length(translation), c.line_csv ' +
            'limit ? offset ?';
        return query;
    },

    getFtsQuery: function (query) {
        var escapedQuery = query.replace(/"/g, "");
        escapedQuery = escapedQuery.split('*').join('"*"');
        return 'keywords: "' + escapedQuery + '"';
    }
};

console.log('queries initialized.');