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
            'c.direction, c.weight, ' +
            'c.infinitiv, ' +
            'c.preschentsing1, c.preschentsing2, c.preschentsing3, c.preschentplural1, c.preschentplural2, c.preschentplural3, ' +
            'c.imperfectsing1, c.imperfectsing2, c.imperfectsing3, c.imperfectplural1, c.imperfectplural2, c.imperfectplural3, ' +
            'c.participperfectfs, c.participperfectms, c.participperfectfp, c.participperfectmp, ' +
            'c.futursing1, c.futursing2, c.futursing3, c.futurplural1, c.futurplural2, c.futurplural3, ' +
            'c.conjunctivsing1, c.conjunctivsing2, c.conjunctivsing3, c.conjunctivplural1, c.conjunctivplural2, c.conjunctivplural3, ' +
            'c.cundizionalsing1, c.cundizionalsing2, c.cundizionalsing3, c.cundizionalplural1, c.cundizionalplural2, c.cundizionalplural3, ' +
            'c.imperativ1, c.imperativ2, c.gerundium ' +
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
