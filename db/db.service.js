'use strict';

angular.module('glossa')
    .factory('dbSrvc', dbSrvc);

function dbSrvc($q) {
    var service = {
        find: find
    };

    return service;
    ///////////////

    function find(db, query) {
        var deferred = $q.defer();
        db.find(query, function(err, docs) {
            if (err) {
                console.log('There was an error with the query: ' + query + 'with db: ' + db);
                deferred.reject(err);
            } else {
                deferred.resolve(docs);
            }
        });
        return deferred.promise;
    }
}