//Import librarys needed
const dotenv = require('dotenv');
const sql = require("mysql");
const {promisify} = require('util');

//Get data from env file
dotenv.config({path: 'api/.env'});

//Connect to mysql database in current file
exports.connect = sql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER, 
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    port: process.env.DATABASE_PORT
});

//Create variable for export to be used in the file 
const selfConnect = this.connect;

//Insert into table
exports.insert = async function insertQuery(db, object) {
    try {
        const insertResult = await promisify(selfConnect.query.bind(selfConnect))("INSERT INTO " + db + " SET ?", object); 
    
        return insertResult;
    } catch (error) {console.log(error);}
} 

//Delete from table using one param
exports.delete = async function deleteQuery(db, params) {
    try {
        let objectArray = Object.keys(params).map((key) => ({[key]: params[key]}));

        const deleteMultipleResult = await promisify(selfConnect.query.bind(selfConnect))("DELETE FROM " + db + " WHERE ? " + "AND ? ".repeat(objectArray.length - 1), objectArray); 
        return deleteMultipleResult;
    } catch (error) {console.log(error);}
}

//Select from table using one param
exports.select = async function selectQuery(db, params) {
    try {
        let objectArray = Object.keys(params).map((key) => ({[key]: params[key]}));
    
        const deleteMultipleResult = await promisify(selfConnect.query.bind(selfConnect))("SELECT * FROM " + db + " WHERE ? " + "AND ? ".repeat(objectArray.length - 1), objectArray); 
        return deleteMultipleResult;
    } catch (error) {console.log(error);}
}

//Update from table using one param
exports.update = async function updateQuery(db, setColumns, params) {
    try {
        let objectArray = Object.keys(params).map((key) => ({[key]: params[key]}));
    
        const updateResult = await promisify(selfConnect.query.bind(selfConnect))("UPDATE " + db + " SET ? WHERE ? " + "AND ? ".repeat(objectArray.length - 1), [setColumns, ...objectArray]);
        return updateResult;
    } catch (error) {console.log(error);}
} 
