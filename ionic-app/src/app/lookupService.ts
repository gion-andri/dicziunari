declare var sqlQueries; //included in index.html -> script -> dicziunari-queries.js

export class LocalDbLookupService implements LookupService {
    db: any;

    constructor() {
        this.db = (<any>window).sqlitePlugin.openDatabase({name: 'dicziunari.db', location: 'default',  createFromLocation: 1});
    }

    execSql(sql: string, params: any[]) {
        return new Promise((resolve, reject) => {
            console.log('before executeSql');
            this.db.executeSql(
            sql,
            params,
            (rs) => {
                resolve(rs);
            },
            (error) => {
                console.log('executeSql ERROR: ' + error.message + ' for sql: ' + sql + ', params: ' + params);
                reject(error);
            });
        });
    }

    fetch(query: string) {
        return this.count(query).then((countResult: any) => {
            let nResults = countResult.rows.item(0).myCount;
            if (nResults === 0) {
                return {
                    count: 0,
                    items: []
                };
            }
            return this.getEntries(query, 0).then((entries: any) => {
                let items: any[] = [];
                for(var x = 0; x < entries.rows.length; x++) {
                    items.push(entries.rows.item(x));
                }
                return {
                    count: nResults,
                    items: items
                };
            });
        });
    }

    fetchMore(query: string, offset: number) {
        return this.getEntries(query, offset)
            .then((entries: any) => {
                let items: any[] = [];
                for(var x = 0; x < entries.rows.length; x++) {
                    items.push(entries.rows.item(x));
                }
                return items;
            });
    }

    count(query: string){
        return this.execSql(
            sqlQueries.getCountSqlQuery(),
            [sqlQueries.getFtsQuery(query)]);
    }

    getEntries(query: string, page: number) {
        return this.execSql(
            sqlQueries.getItemsSqlQuery(),
            [sqlQueries.getFtsQuery(query), 20, page*20]);
    }
}

export class RemoteLookupService implements LookupService {

    fetch(query: string) {
        return this.request(query, 0).then((result: any) => {
            return {
                count: result.count,
                items: result.items
            };
        });
    }

    fetchMore(query: string, offset: number){
        return this.request(query, offset).then((result: any) => result.items);
    }

    request(query: string, page: number) {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status <300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(xhr.statusText);
                }
            }
            xhr.onerror = () => {
                reject(xhr.statusText);
            }
            xhr.overrideMimeType("application/json");
            let reqUrl = '/api/dicziunari?query='+encodeURI(query)+'&page='+page;
            xhr.open("GET", reqUrl, true); // true for asynchronous 
            xhr.send(null);
        });
    }
};

export interface LookupService {
    fetch(query: string): Promise<any>;
    fetchMore(query: string, offset: number): Promise<any>;
}