'use strict';

var util = require('util');
var arango = require('arangojs');
var aqb = require('aqb');

exports.initialize = function initializeSchema(schema, callback) {
    schema.client = new arango.Database(schema.settings.url ? schema.settings.url : "");
    schema.adapter = new Arango(schema.client);
    callback();
};

function Arango(client) {
    this._client = client;
    this._models = {};
}

Arango.prototype.define = function (descr) {
    if (!descr.settings) {
        descr.settings = {};
    }
    descr.properties.id = { type: String };
    this._models[descr.model.modelName] = descr;
};

Arango.prototype.defineForeignKey = function (model, key, cb) {
    cb(null, String);
};

Arango.prototype.fromDatabase = function(model, data) {
    if (!data) {
        return null;
    }

    data.id = data._key;

    var props = this._models[model].properties;
    return Object.keys(data)
        .reduce(function (res, key) {
            var val = data[key];
            if (props[key]) {
                if (props[key].type.name === 'Date' && val !== null) {
                    val = new Date(val);
                }
            }
            res[key] = val;
            return res;
        }, {});
};

Arango.prototype.create = function (model, data, callback) {
    this._client.collection(model).save(data)
    .then(doc => {
        callback(null, doc._key);
    })
    .catch(callback);
};

Arango.prototype.find = function(model, id, callback) {
    if (typeof id == 'string' && id.indexOf('/') !== -1) {
        callback();
        return;
    }
    this._client.collection(model).document(model + '/' + id)
    .then(doc => {
        callback(null, this.fromDatabase(model, doc));
    })
    .catch(err => {
        if (err.code == 404) {
            callback();
        } else {
            callback(err);
        }
    });
};

Arango.prototype.exists = function (model, id, callback) {
    this._client.collection(model).document(model + '/' + id)
    .then(doc => {
        callback(null, true);
    })
    .catch(err => {
        callback(null, false);
    });
};

Arango.prototype.all = function(model, filter, callback) {
    if (!model.match(/^[0-9a-zA-Z_-]+$/)) {
        throw new Error('Invalid model name ' + model);
    }
    filter = filter || {};

    let query = aqb.for('doc')
        .in(model);

    if (filter.where) {
        Object.keys(filter.where).forEach(filterKey => {
            let realFilterKey = filterKey;
            if (filterKey == 'id') {
                realFilterKey = '_key';
            }
            
            let cond = filter.where[filterKey];
            var spec = false;
            if (cond && cond.constructor.name === 'Object') {
                spec = Object.keys(cond)[0];
                cond = cond[spec];
            }
            if (spec) {
                if (spec == 'inq') {
                    query = query.filter(aqb.ref('doc.' + realFilterKey).in(aqb(cond)));
                } else {
                    throw new Error('Unknown spec ' + spec + ' while filtering!');
                }
            } else {
                query = query.filter(aqb.ref('doc.' + realFilterKey).eq(aqb(cond)));
            }
        });
    }

    if (filter.order) {
        let order = filter.order.split(' ');
        query = query.sort('doc.' + order[0], order[1]);
    }
    
    if (filter.limit) {
        query = query.limit(filter.limit);
    }

    query = query.return('doc');
    var promise = this._client.query(query);
    
    promise.then(cursor => {
        return cursor.all();
    })
    .then(docs => {
        var jugglingDocs = docs.map(doc => {
            return this.fromDatabase(model, doc);
        });

        if (filter.include) {
            this._models[model].model.include(jugglingDocs, filter.include, callback);
        } else {
            callback(null, jugglingDocs);
        }
    })
    .catch(err => {
        callback(err);
    });
    return;
    /*
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
        if (isError(err)) {
            callback(res);
        } else {
            var mapFn = function(o) { 
                o = self.fromDatabase(model, o);
                o.id = o._id;
                delete o._id;
                return o;
            };
            var objs = res.result.map(mapFn); 
            if (filter && filter.include) {
                self._models[model].model.include(objs, filter.include, callback);
            } else {
                callback(null, objs);
            }
        }
    };
    if (filter) {
        if (filter.where) {
            var filterQuery = [];
            var index=0;
            Object.keys(filter.where).forEach(function(k) {
                var cond = filter.where[k];
                var spec = false;
                partName = 'where' + (index++);
                key = k;
                if (key == 'id') {
                    key = '_id';
                }

                if (cond && cond.constructor.name === 'Object') {
                    spec = Object.keys(cond)[0];
                    cond = cond[spec];
                }
                if (spec) {
                    if (spec === 'between') {
                        // mop: XXX need to check docs
                        throw new Error("between statements not supported for arangodb");
                    } else {
                        queryArgs[partName] = cond;
                        filterQuery.push('result.' + key + ' IN @' + partName);
                    }
                } else {
                    queryArgs[partName] = cond;
                    filterQuery.push('result.' + key + ' == @' + partName);
                }
            });
            query.filter(filterQuery.join(' && '));
        }
        if (filter.order) {
            var order = 'result.' + filter.order;
            if (typeof order === 'string') order = [order];
            query.sort(order.join(', '));
        }
        if (filter.limit) {
            if (filter.skip) {
                query.limit(filter.skip + "," + filter.limit);
            } else {
                query.limit(filter.limit);
            }
        }
    }
    this._client.query.string = query.toString();
    this._client.query.exec(queryArgs, resultFunction);
    */
};

function isError(err) {
    return err && err !== -1;
}

Arango.prototype.save = function(model, data, callback) {
    let id = model + '/' + data.id;
    this._client.collection(model).update(id, data)
    .then(() => {
        callback();
    }, callback);
};

Arango.prototype.updateOrCreate = function(model, data, callback) {
    var adapter = this;

    if (!data.id) {
        return this.create(model, data, callback);
    } else {
        return this.save(model, data, callback);
    }
};

Arango.prototype.toObject = function(data) {
    var obj = {};
    Object.keys(data).forEach(function(key) {
        if (key.charAt(0) !== '_') {
            obj[key] = data[key];
        }
    });
    return obj;
};

Arango.prototype.destroy = function(model, id, callback) {
    this._client.collection(model).remove(id)
    .then(() => {
        callback();
    })
    .catch(err => {
        callback(err);
    });
};

Arango.prototype.updateAttributes = function(model, id, newData, callback) {
    this.find(model, id, function(err, data) {
        if (isError(err)) {
            callback(err);
        } else {
            data = data || {};
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
        this._client.collection(model).count()
        .then(count => {
            callback(null, count.count);
        })
        .catch(callback);
    } else {
        this._client.collection(model).byExample(where, {count: true})
        .then(cursor => {
            callback(null, cursor.count);
        })
        .catch(callback);
    }
};

Arango.prototype.automigrate = function(cb) {
    return Promise.all(
        Object.keys(this._models)
        .map(model => {
            return this._client.collection(model).drop()
            .catch(e => {
                if (e.code != 404) {
                    return Promise.reject(e);
                }
            })
            .then(() => {
                this._client.collection(model).create({ waitForSync: true});
            });
        })
    )
    .then(() => {
        cb();
    }, cb);
};

Arango.prototype.destroyAll = function(model, callback) {
    this._client.truncate(model, function(err, result) {
        if (isError(err)) {
            callback(err, []);
        } else {
            callback();
        }
    });
};

