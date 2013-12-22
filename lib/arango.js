/**
 * Module dependencies
 */
var util = require('util');
var arango = require('arango');

exports.initialize = function initializeSchema(schema, callback) {
    if (!arango) return;
    
    schema.client = new arango.Connection(schema.settings.url ? schema.settings.url : "");
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

Arango.prototype.fromDatabase = function(model, data) {
    if (!data) return null;
    var props = this._models[model].properties;
    Object.keys(data).forEach(function (key) {
        var val = data[key];
        if (props[key]) {
            if (props[key].type.name === 'Date' && val !== null) {
                val = new Date(val);
            }
        }
        data[key] = val;
    });
    return data;
};

Arango.prototype.create = function (model, data, callback) {
    this._client.document.create(model, data, {}, function(err, res, hdr) {
        if (callback) {
            callback(err, err ? null : res._id);
        }
    });
};

Arango.prototype.find = function(model, id, callback) {
    var self = this;
    this._client.document.get(id, function(err, data) {
        callback(err ? err : false, err ? null : self.fromDatabase(model, data));
    });
};

Arango.prototype.exists = function (model, id, callback) {
    this._client.document.get(id, function (err, data) {
        callback(err, !err && data);
    });
};

Arango.prototype.all = function(model, filter, callback) {
    var key;
    var self = this;
    var query = this._client.query.new();
    query.for('result')
            .in(model)
            .return('result');
    
    var queryArgs = {};
    var index;
    var partName;
    var realKey;
    var resultFunction = function(err, res, hdr) {
        if (err) {
            callback(res);
        } else {
            callback(false, res.result.map(function(o) { o = self.fromDatabase(model, o); o.id = o._id; delete o._id; return o; }));
        }
    };
    if (filter) {
        if (filter.where) {
            var filterQuery = [];

            index=0;
            for (key in filter.where) {
                realKey = key;
                if (key == 'id') {
                    realKey = '_id';
                }
                if (filter.where.hasOwnProperty(key)) {
                    partName = 'where' + (index++);
                    filterQuery.push('result.' + realKey + ' == @' + partName);
                    queryArgs[partName] = filter.where[key];
                }
            }
            query.filter(filterQuery.join(' && '));
        }
        if (filter.order) {
            var order = 'result.' + filter.order;
            if (typeof order === 'string') order = [order];
            query.sort(order.join(', '));
        }
    }
    this._client.query.string = query.toString();
    this._client.query.exec(queryArgs, resultFunction);
};

Arango.prototype.save = function(model, data, callback) {
    var id = data.id;
    this._client.document.put(id, data, function(err, res) {
        if (!err) {
            var newId = new ArangoId(res._id);
            newId.setRev(res._rev);
            data.id = newId.fullId();
        }
        callback(err);
    });
};

Arango.prototype.updateOrCreate = function(model, data, callback) {
    var adapter = this;
    if (!data.id) {
        return this.create(model, data, callback);
    }
    // mop: copypasta from mongodb
    this.find(model, data.id, function (err, inst) {
        if (!err) {
            adapter.updateAttributes(model, data.id, data, callback);
        } else {
            delete data.id;
            adapter.create(model, data, function (err, id) {
                if (err) return callback(err);
                if (id) {
                    data.id = id;
                    delete data._id;
                    callback(null, data);
                } else{
                    callback(null, null); // wtf?
                }
            });
        }
    });
};

Arango.prototype.destroy = function(model, id, callback) {
    this._client.document.delete(id, function(err) {
        callback(err);
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
            callback(err ? err : false, err ? null : result.count);
        });
    } else {
        this._client.simple.example(model, {}, where, function(err, result) {
            if (err) {
                callback(err, result);
            } else {
                callback(false, result.count);
            }
        });
    }
};

Arango.prototype.destroyAll = function(model, callback) {
    this._client.collection.truncate(model, function(err, result) {
        callback(err ? err : false, result);
    });
};
