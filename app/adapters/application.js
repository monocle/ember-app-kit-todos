var EIDBRecordAdapter = DS.Adapter.extend({
  find: function(store, type, id) {
    return this.request(type, 'getRecord', Number(id)).then(function(record) {
      if (record) {
        record.id = record[type.idAttr];
        return record;
      }

      throw 'Record not found';
    });
  },

  findQuery: function(store, type, query) {
    var self = this;

    return this.request(type, 'find', query).then(function(records) {
      return self.mapIds(type, records);
    });
  },

  createRecord: function(store, type, record) {
    var json = record.toJSON();

    return this.request(type, 'addRecord', json).then(function(id) {
      json.id = id;
      return json;
    });
  },

  updateRecord: function(store, type, record) {
    var json = record.toJSON(),
        key = record.id;

    return this.request(type, 'putRecord', json, Number(key)).then(function(id) {
      json.id = id;
      return json;
    });
  },

  deleteRecord: function(store, type, record) {
    var key = record.id;
    return this.request(type, 'deleteRecord', Number(key));
  },

  findAll: function(store, type) {
    var self = this;

    return this.request(type, 'getAll').then(function(records) {
      if (!records) { return []; }
      return self.mapIds(type, records);
    });
  },

  request: function(type, method) {
    var dbName = type.dbName,
        storeName = type.storeName || this.storeNameForType(type),
        idAttr = type.idAttr,
        reqArgs = [].slice.call(arguments, 2),
        fullArgs = [dbName, storeName].concat(reqArgs);

    return EIDB[method].apply(EIDB, fullArgs);
  },

  mapIds: function(type, records) {
    return records.map(function(record) {
      record.id = record[type.idAttr];
      return record;
    });
  },

  storeNameForType: function(type) {
    return Ember.String.pluralize(type.typeKey);
  }
});

export default EIDBRecordAdapter;
