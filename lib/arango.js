/**
 * Module dependencies
 */
var arango = require('arango.client');

exports.initialize = function initializeSchema(schema, callback) {
    if (!arango) return;
    
    schema.client = new arango.Connection();
    
    schema.adapter = new Arango(schema.client);
    callback();
};

ArangoId = function(fullId) {
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

function Arango(client) {
    this._client = client;
    this._models = {};
}

Arango.prototype.define = function (descr) {
    if (!descr.settings) descr.settings = {};
    this._models[descr.model.modelName] = descr;
};

Arango.prototype.create = function (model, data, callback) {
    //console.log("CREATE", data);
    this._client.document.create(true, model, data, function(err, res, hdr) {
        callback(err, err ? null : res._id);
    });
};

Arango.prototype.find = function(model, id, callback) {
    this._client.document.get(id, function(err, data) {
        callback(err ? true : false, err ? null : data);
    });
};

Arango.prototype.exists = function (model, id, callback) {
    this._client.document.get(id, function (err, data) {
        callback(err, !err && data);
    });
};

Arango.prototype.all = function(model, filter, callback) {
    var _self = this;
    
    var func;
    var args = [model];

    var resultFunction = function(err, res, hdr) {
        callback(err ? true : false, res.result.map(function(o) { o.id = o._id; delete o.id; return o; }));
    };
    //console.log(filter);
    if (filter === null) {
        func = this._client.simple.list;
        args.push({});
    } else {
        func = this._client.simple.example;
        args.push({});
        args.push(filter.where);
    }
    args.push(resultFunction);
    func.apply(this, args);
};

Arango.prototype.save = function(model, data, callback) {
    //console.log(data);
    var id = data.id;
    //console.log("SAVE", id);
    this._client.document.put(id, data, function(err, res) {
        if (!err) {
            var newId = new ArangoId(res._id);
            newId.setRev(res._rev);
            data.id = newId.fullId();
        }
        //console.log("SAVE RESULT", arguments);
        callback(err);
    });
};

Arango.prototype.destroy = function(model, id, callback) {
    this._client.document.delete(id, function(err) {
        callback(err ? true : false);
    });
};

Arango.prototype.updateAttributes = function(model, id, newData, callback) {
    this.find(model, id, function(err, data) {
        if (err) {
            callback(err);
        } else {
            for (var key in newData) {
                if (newData.hasOwnProperty(key)) {
                    data[key] = newData[key];        
                }
            }
            data.id = id;
            this.save(model, data, callback);
        }
    }.bind(this));
};

Arango.prototype.count = function(model, callback, where) {
    if (!where) {
        this._client.collection.count(model, function(err, result) {
            callback(err ? true : false, err ? null : result.count);
        });
    } else {
        console.log(where);
    }
};
