console.log('initializing queries...');

var sqlQueries = {
    getCountSqlQuery: function () {
        return '' +
            'select count(1) as myCount ' +
            'from rumgr_idx ' +
            'where rumgr_idx match ? ';
    },

    getItemsSqlQuery: function () {
        var query = '' +
            'select c.lemma, c.translation, ' +
            'c.direction, c.weight ' +
            'from rumgr c, rumgr_idx idx ' +
            'where rumgr_idx match ? ' +
            'and idx.id = c.id ' +
            'order by c.weight, length(translation) ' +
            'limit ? offset ?';
        return query;
    },

    getFtsQuery: function (query) {
        var escapedQuery = query.replace(/"/g, "");
        escapedQuery = escapedQuery.split('*').join('"*"');
        return 'keyword: "' + escapedQuery + '"';
    }
};

console.log('queries initialized.');
