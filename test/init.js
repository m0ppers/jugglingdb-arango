module.exports = require('should');

var Schema = require('jugglingdb').Schema;

global.getSchema = function() {
    var db = new Schema(__dirname + '/..', {url: "http://localhost:8529/" + (process.env.TESTDATABASE || "") });
    db.name = 'arango';
    return db;
};

