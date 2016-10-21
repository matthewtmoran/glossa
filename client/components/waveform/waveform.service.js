angular.module('glossa')
    .factory('mdWavesurferUtils', mdWavesurferUtils);

function mdWavesurferUtils($q, $document, $timeout) {

    var service = {
        getLength: getLength
    };

    return service;
    ///////////////


    function getLength(object) {
        var deferred = $q.defer();
        var estimateLength = function (url) {
            var audio = $document[0].createElement('audio');
            audio.src = url;

            console.log('audio', audio);

            audio.addEventListener('loadeddata', function listener() {
                deferred.resolve(this.duration);
                audio.removeEventListener('loadeddata', listener);
                audio.src = 'data:audio/mpeg,0';//destroy loading.
            });

            audio.addEventListener('error', function (e) {
                deferred.resolve(e.target.error);
            });
        };

        if (typeof object === 'string') {
            //this is a URL
            estimateLength(object);
        } else {
            $timeout(function () {
                deferred.reject(new DOMError("NotSupportedError", "Specified argument is not supported"));
            });
        }

        return deferred.promise;
    }
}