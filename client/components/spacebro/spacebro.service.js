/* global io */
'use strict';

angular.module('glossa')
    .factory('spacebroFactory', spacebroFactory);

function spacebroFactory($rootScope, $window, __session) {


    var socket;
    var service = {
        on: on,
        emit: emit,
        init: init,
        off: off
    };

    return service;

    function init() {
        var ioRoom = $window.location.origin;
        // var ioRoom = $window.location.origin + '/' + $window.localStorage.code;
        // $window.socket = io(ioRoom);

        // var spacebroClient = $window.spacebroClient;

        $window.spacebroClient.connect({
            clientName: 'local-client',
            channelName: 'local-channel',
            verbose: true
        })


    }


    function on(eventName, callback) {
        $window.spacebroClient.on(eventName, function() {
            var args = arguments;
            $rootScope.$apply(function() {
                callback.apply($window.spacebroClient, args);
            });
        });
    }

    function emit(eventName, data, callback) {
        $window.spacebroClient.emit(eventName, data, function() {
            var args = arguments;
            $rootScope.$apply(function() {
                if (callback) {
                    callback.apply($window.spacebroClient, args);
                }
            });
        });
    }

    function off(eventName, callback) {
        $window.spacebroClient.off(eventName, function() {
            var args = arguments;
            $rootScope.$apply(function() {
                if (callback) {
                    callback.apply($window.spacebroClient, args);
                }
            });
        });
    }
}
