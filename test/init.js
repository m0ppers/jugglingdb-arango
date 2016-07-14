module.exports = require('should');

var assert = require('assert');

var Schema = require('jugglingdb').Schema;

global.getSchema = function() {
    assert(process.env.ARANGO_HOST, 'ARANGO_HOST env variable is not set');

    var db = new Schema(__dirname + '/..', {url: 'http://' + process.env.ARANGO_HOST + ':8529/' + (process.env.TESTDATABASE || "") });
    db.name = 'arango';
    return db;
};

