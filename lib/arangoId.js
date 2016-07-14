'use strict';

module.exports = ArangoId;

function ArangoId(fullId) {
    var parts = fullId.split('/');
    this._id  = parts[0];
    this._rev = parts[1];
};

ArangoId.prototype.id = function() {
    return this._id;
};

ArangoId.prototype.rev = function() {
    return this._rev;
};

ArangoId.prototype.fullId = function() {
    return this._id + '/' + this._rev;
};

ArangoId.prototype.setRev = function(rev) {
    this._rev = rev;
};

