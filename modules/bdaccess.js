// bdaccess.js

const {Client, Pool} = require("pg");

class BDAccess {
    static #instance = null;
    static #initialized = false;

    constructor() {
        if(BDAccess.#instance) throw new Error("BDAccess already initialized.");
        else if(!BDAccess.#initialized) throw new Error("Should be called only from getInstance.");
    }

    initLocal() {
        this.client = new Client({
            database: "bgshop",
            user: "adrian",
            password: "admin",
            host: "localhost",
            port: "5432"
        });
        this.client.connect();
    }
    
    getClient() {
        if(!BDAccess.#instance) throw new Error("Not yet initialized.");
        return this.client;
    }

    static getInstance({init = "local"} = {}) {
        if(!this.#instance) {
            this.#initialized = true;
            this.#instance = new BDAccess();

            try {
                switch(init) {
                    case "local":
                        this.#instance.initLocal();
                }
            } catch(e) {
                console.log("Database error.");
            }
        }

        return this.#instance;
    }

    select({table="", fields=[], conditions_and=[]} = {}, callback, queryParams=[]) {
        let condition_where = "";
        if(conditions_and.length > 0) condition_where = `where ${conditions_and.join(" and ")} `;
        let sql = `select ${fields.join(",")} from ${table} ${condition_where}`;
        this.client.query(sql, queryParams, callback);
    }

    async selectAsync({table="", fields=[], conditions_and=[]} = {}) {
        let condition_where = "";
        if(conditions_and.length > 0) condition_where = `where ${conditions_and.join(" and ")}`;
        let sql = `select ${fields.join(",")} from ${table} ${condition_where}`;
        try {
            let res = await this.client.query(sql);
            console.log("select async: ", res);
            return res;
        } catch(e) {
            console.log(e);
            return null;
        }
    }

    insert({table="", fields={}} = {}, callback) {
        let sql =`insert into ${table}(${Object.keys(fields).join(",")}) values (${Object.values(fields).map((x) => `'${x}'`).join(",")})`;
        console.log(sql);
        this.client.query(sql, callback);
    }

    update({table="", fields={}, conditions_and=[], callback, queryParams}) {
        let updatedFields = [];
        for(let prop in fields) updatedFields.push(`${prop} = '${fields[prop]}'`);
        let condition_where = "";
        if(conditions_and.length > 0) condition_where = `where ${conditions_and.join(" and ")}`;
        let sql = `update ${table} set ${updatedFields.join(",")} ${condition_where}`;
        console.log(sql);
        this.client.query(sql, callback);
    }

    updatewParams({table="", fields=[], values=[], conditions_and=[]} = {}, callback, queryParams) {
        if(fields.length != values.length) throw new Error("Nr of fields should be equal to nr of values");
        let updatedFields = [];
        for(let i = 0; i < fields.length; i++) updatedFields.push(`${fields[i]}=$${i+1}`);
        let condition_where = "";
        if(conditions_and.length > 0) condition_where = `where ${conditions_and.join(" and ")}`;
        let sql = `update ${table} set ${updatedFields.join(",")} ${condition_where}`;
        this.client.query(sql, values, callback);
    }

    delete({table="", conditions_and=[]} = {}, callback) {
        let condition_where = "";
        if(conditions_and.length > 0) condition_where = `where ${conditions_and.join(" and ")}`;
        let sql = `delete from ${table} ${condition_where}`;
        console.log(sql);
        this.client.query(sql, callback);
    }

    query(sql, callback) {
        this.client.query(sql, callback);
    }
}

module.exports = BDAccess;
