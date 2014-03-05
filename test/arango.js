var should = require('./init.js');
var db, User;
describe('arango specific tests', function() {
    before(function(done) {
        db = getSchema();

        User = db.define('User', {
            name: {type: String, sort: true, limit: 100},
            email: {type: String, index: true, limit: 100},
            role: {type: String, index: true, limit: 100},
            order: {type: Number, index: true, sort: true, limit: 100}
        });

        db.automigrate(done);
    });
    it('should query by id: not found', function(done) {
        User.find("User/23324", function(err, u) {
            should.not.exist(u);
            should.not.exist(err);
            done();
        });
    });
});
