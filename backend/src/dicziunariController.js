module.exports = function(app, db, url, sqlQueries){
 
    console.log("Registering endpoint: /api/dicziunari");
 
    app.get('/api/dicziunari', function(req, res){
        let urlParam = url.parse(req.url, true).query;
        let query = urlParam.query;
        let page = urlParam.page? Number(urlParam.page): 0;
        let myCount = 0;
        let self = this;
        if (!query) {
            res.end();
            return;
        }
        console.time("query " + query);
        var sqlquery = sqlQueries.getItemsSqlQuery();
        db.serialize(() => {
            if (page === 0) {
                db.get(
                    sqlQueries.getCountSqlQuery()
                , [sqlQueries.getFtsQuery(query)]
                , function(err, row) {
                    if (err) {
                        console.log("unable to count: " + err);
                    }
                    self.myCount = row.myCount;
                    console.log("mycount set to " + self.myCount);
                });
            }
            db.all(
                sqlQueries.getItemsSqlQuery(),
                [sqlQueries.getFtsQuery(query), 20, page*20]
            , function(err, rows) {
                if (err) {
                    console.error('db error: ' + err);
                    res.json(err);
                } else {
                    res.json({count: self.myCount, items: rows});
                    console.timeEnd("query " + query);
                }
            });
        });
    });
};
