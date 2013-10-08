var dbName = 'EAK_Todos',
    storeName = 'todos';

function setupEIDB() {
  EIDB.open(dbName).then(function(db) {
    if (!db.hasObjectStore(storeName)) {
      EIDB.createObjectStore(dbName, storeName).then(function() {

        // The following is a workaround for bug when using IndexedDBShim in Safari
        // (first record, that has id of 0, can't be updated)
        return EIDB.addRecord(dbName, storeName, {});
      }).then(function(id) {
        EIDB.deleteRecord(dbName, storeName, id);
      });
    }
  });
}

export default setupEIDB;
