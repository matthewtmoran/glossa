(function () {
    'use strict';

    // var angular = require('angular');
    // var io = require('socket.io-client');

    angular
        .module('socket.io', [])
        .provider('$socket', $socketProvider);

    /* @ngInject */
    function $socketProvider() {
        var ioUrl = '';
        var ioConfig = {};

        // Private Function to assign properties to ioConfig
        function setOption(name, value, type) {
            if (typeof value !== type)
                throw new TypeError('\'' + name + '\' must be of type \'' + type + '\'');
            else
                ioConfig[name] = value;
        }

        this.$get = function $socketFactory($rootScope) {
            var socket = io(ioUrl, ioConfig);

            return {
                on: function on(event, callback) {
                    socket.on(event, function() {
                        var resData = arguments;

                        $rootScope.$apply(function() {
                            callback.apply(socket, resData);
                        });
                    });
                },
                off: function off(event, callback) {
                    if (typeof callback === 'function')
                        socket.removeListener(event, callback);
                    else
                        socket.removeAllListeners(event);
                },
                emit: function emit(event, data, callback) {
                    if (typeof callback === 'function') {
                        socket.emit(event, data, function() {
                            callback.apply(socket, arguments);
                        });
                    }
                    else
                        socket.emit(event, data);
                }
            };
        };

        this.setConnectionUrl = function setConnectionUrl(url) {
            if (typeof url === 'string')
                ioUrl = url;
            else
                throw new TypeError('url must be of type string');
        };

        this.setPath = function setPath(value) {
            setOption('path', value, 'string');
        };

        this.setConnectTimeout = function setConnectTimeout(value) {
            setOption('connect timeout', value, 'number');
        };

        this.setTryMultipleTransports = function setTryMultipleTransports(value) {
            setOption('try multiple transports', value, 'boolean');
        };

        this.setReconnect = function setReconnect(value) {
            setOption('reconnect', value, 'boolean');
        };

        this.setReconnectionDelay = function setReconnectionDelay(value) {
            setOptions('reconnection delay', value, 'number');
        };

        this.setReconnectionLimit = function setReconnectionLimit(value) {
            setOptions('max reconnection attempts', value, 'number');
        };

        this.setSyncDisconnectOnUnload = function setSyncDisconnectOnUnload(value) {
            setOptions('sync disconnect on unload', value, 'boolean');
        };

        this.setAutoConnect = function setAutoConnect(value) {
            setOptions('auto connect', value, 'boolean');
        };

        this.setFlashPolicyPort = function setFlashPolicyPort(value) {
            setOptions('flash policy port', value, 'number');
        };

        this.setForceNewConnection = function setForceNewConnection(value) {
            setOptions('force new connection', value, 'boolean');
        };
    }

})();