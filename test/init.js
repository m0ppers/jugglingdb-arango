module.exports = require('should');

var Schema = require('jugglingdb').Schema;

global.getSchema = function() {
    var db = new Schema(__dirname + '/..');
    db.name = 'arango';
    return db;
};

