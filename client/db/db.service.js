'use strict';

angular.module('glossa')
    .factory('dbSrvc', dbSrvc);

function dbSrvc($q, $timeout) {
    var service = {
        find: find,
        insert: insert,
        update: update,
        remove: remove,
        count: count,
        updateAll: updateAll,
        basicUpdate: basicUpdate
    };

    return service;
    ///////////////

    function find(db, query) {
        var deferred = $q.defer();
        db.find(query, function(err, docs) {
            if (err) {
                console.log('There was an error with the query: ' + query + 'with db: ' + db);
                deferred.reject({
                    success: false,
                    msg: 'Query not successful',
                    data: err
                });
            } else {
                deferred.resolve({
                    success: true,
                    msg: 'Query successful',
                    data: docs
                });
            }
        });
        return deferred.promise;
    }

    function insert(db, data) {
        var deferred = $q.defer();
            db.insert(data, function(err, doc) {
                if (err) {
                    console.log('There was an error saving file data to the DB', err);
                    deferred.reject({
                        success: false,
                        msg: 'Creation failure',
                        data: err
                    });
                } else {
                    deferred.resolve({
                        success: true,
                        msg: 'Creation success',
                        data: doc
                    });
                }
            });
        return deferred.promise;
    }

    function update(db, data) {
        var deferred = $q.defer();
        db.update({_id: data.fileId}, { $set: data.newObj }, data.options, function(err, numReplaced, affectedDocuments) {
            if (err) {
                deferred.reject(err);
            }
            deferred.resolve(affectedDocuments);
        });
        return deferred.promise;
    }

    function updateAll(db, data) {
        var deferred = $q.defer();
        db.update({_id: data.fileObj._id}, data.fileObj, data.options, function(err, numReplaced, updatedDocument) {
            if (err) {
                deferred.reject(err);
            }
            deferred.resolve(updatedDocument);
        });
        return deferred.promise;
    }

    function cleanObject(obj) {
        delete obj.$$hashKey;
        return obj;
    }

    function basicUpdate(db, data) {
        var deferred = $q.defer();
        db.update({_id: data._id}, cleanObject(data), {returnUpdatedDocs: true, upsert: true}, function(err, numReplaced, updatedDocument) {
            if (err) {
                deferred.reject({
                    success: false,
                    msg: 'Update not successful',
                    data: err
                });
            }
            deferred.resolve({
                success: true,
                msg: 'Update successful',
                data: updatedDocument
            });
        });
        return deferred.promise;
    }

    function remove(db, fileId) {
        var deferred = $q.defer();
        db.remove({_id: fileId}, function(err, docs) {
            if (err) {
                console.log('There was an error deleting the file');
                deferred.reject({
                    success: false,
                    msg: 'Update not successful',
                    data: err
                });
            } else {
                deferred.resolve({
                    success: true,
                    msg: 'Update successful',
                    data: docs
                });
            }
        });
        return deferred.promise;
    }
    function count(db, query) {
        var deferred = $q.defer();
        db.count(query, function(err, result) {
            if (err) {
                console.log('There was an error deleting the file');
                deferred.reject({
                    success: false,
                    msg: 'Update not successful',
                    data: err
                });
            } else {
                deferred.resolve({
                    success: true,
                    msg: 'Update successful',
                    data: result
                });
            }
        });
        return deferred.promise;
    }
}