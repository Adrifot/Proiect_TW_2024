// bdaccess.js

const {Client, Pool} = require("pg");

class BDAccess {
    static #instance = null;
    static #initialized = false;

    /**
     * Constructs a new BDAccess instance.
     * @throws {Error} If the instance is already initialized or not called from getInstance.
     */
    constructor() {
        if(BDAccess.#instance) throw new Error("BDAccess already initialized.");
        else if(!BDAccess.#initialized) throw new Error("Should be called only from getInstance.");
    }

    /**
     * Initializes a local database connection.
     */
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
    
    /**
     * Returns the database client.
     * @throws {Error} If the instance is not yet initialized.
     * @returns {Client} The database client.
     */
    getClient() {
        if(!BDAccess.#instance) throw new Error("Not yet initialized.");
        return this.client;
    }

    /**
     * Returns the singleton instance of the BDAccess class.
     * @param {Object} [init] - Object with initialization parameters.
     * @param {string} [init.init="local"] - Initialization type.
     * @returns {BDAccess} The singleton instance of the BDAccess class.
     */
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

    /**
     * Executes a SELECT query on the database.
     * @param {Object} [options] - Options for the SELECT query.
     * @param {string} [options.table=""] - The table to select from.
     * @param {string[]} [options.fields=[]] - The fields to select.
     * @param {string[]} [options.conditions_and=[]] - The conditions for the WHERE clause.
     * @param {function} callback - The callback function to handle the query result.
     * @param {Array} [queryParams=[]] - The parameters for the query.
     */
    select({table="", fields=[], conditions_and=[]} = {}, callback, queryParams=[]) {
        let condition_where = "";
        if(conditions_and.length > 0) condition_where = `where ${conditions_and.join(" and ")} `;
        let sql = `select ${fields.join(",")} from ${table} ${condition_where}`;
        this.client.query(sql, queryParams, callback);
    }

    /**
     * Executes a SELECT query on the database asynchronously.
     * @param {Object} [options] - Options for the SELECT query.
     * @param {string} [options.table=""] - The table to select from.
     * @param {string[]} [options.fields=[]] - The fields to select.
     * @param {string[]} [options.conditions_and=[]] - The conditions for the WHERE clause.
     * @returns {Promise<Object|null>} The query result or null if an error occurs.
     */
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

    /**
     * Executes an INSERT query on the database.
     * @param {Object} [options] - Options for the INSERT query.
     * @param {string} [options.table=""] - The table to insert into.
     * @param {Object} [options.fields={}] - The fields and values to insert.
     * @param {function} callback - The callback function to handle the query result.
     */
    insert({table="", fields={}} = {}, callback) {
        let sql =`insert into ${table}(${Object.keys(fields).join(",")}) values (${Object.values(fields).map((x) => `'${x}'`).join(",")})`;
        console.log(sql);
        this.client.query(sql, callback);
    }

    /**
     * Executes an UPDATE query on the database.
     * @param {Object} [options] - Options for the UPDATE query.
     * @param {string} [options.table=""] - The table to update.
     * @param {Object} [options.fields={}] - The fields and values to update.
     * @param {string[]} [options.conditions_and=[]] - The conditions for the WHERE clause.
     * @param {function} callback - The callback function to handle the query result.
     * @param {Array} queryParams - The parameters for the query.
     */
    update({table="", fields={}, conditions_and=[], callback, queryParams}) {
        let updatedFields = [];
        for(let prop in fields) updatedFields.push(`${prop} = '${fields[prop]}'`);
        let condition_where = "";
        if(conditions_and.length > 0) condition_where = `where ${conditions_and.join(" and ")}`;
        let sql = `update ${table} set ${updatedFields.join(",")} ${condition_where}`;
        console.log(sql);
        this.client.query(sql, callback);
    }

    /**
     * Executes an UPDATE query on the database with parameters.
     * @param {Object} [options] - Options for the UPDATE query.
     * @param {string} [options.table=""] - The table to update.
     * @param {string[]} [options.fields=[]] - The fields to update.
     * @param {Array} [options.values=[]] - The values to update.
     * @param {string[]} [options.conditions_and=[]] - The conditions for the WHERE clause.
     * @param {function} callback - The callback function to handle the query result.
     * @param {Array} queryParams - The parameters for the query.
     * @throws {Error} If the number of fields does not match the number of values.
     */
    updatewParams({table="", fields=[], values=[], conditions_and=[]} = {}, callback, queryParams) {
        if(fields.length != values.length) throw new Error("Nr of fields should be equal to nr of values");
        let updatedFields = [];
        for(let i = 0; i < fields.length; i++) updatedFields.push(`${fields[i]}=$${i+1}`);
        let condition_where = "";
        if(conditions_and.length > 0) condition_where = `where ${conditions_and.join(" and ")}`;
        let sql = `update ${table} set ${updatedFields.join(",")} ${condition_where}`;
        this.client.query(sql, values, callback);
    }

    /**
     * Executes a DELETE query on the database.
     * @param {Object} [options] - Options for the DELETE query.
     * @param {string} [options.table=""] - The table to delete from.
     * @param {string[]} [options.conditions_and=[]] - The conditions for the WHERE clause.
     * @param {function} callback - The callback function to handle the query result.
     */
    delete({table="", conditions_and=[]} = {}, callback) {
        let condition_where = "";
        if(conditions_and.length > 0) condition_where = `where ${conditions_and.join(" and ")}`;
        let sql = `delete from ${table} ${condition_where}`;
        console.log(sql);
        this.client.query(sql, callback);
    }

    /**
     * Executes a custom SQL query on the database.
     * @param {string} sql - The SQL query string.
     * @param {function} callback - The callback function to handle the query result.
     */
    query(sql, callback) {
        this.client.query(sql, callback);
    }
}

module.exports = BDAccess;
