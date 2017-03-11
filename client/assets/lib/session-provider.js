(function () {
    'use strict';

    angular
        .module('configService', [])
        .provider('$configSettings', $configProvider);

    /* @ngInject */
    function $configProvider() {
        var configOptions = {};

        this.$get = function $configOptions($rootScope) {

            return {
                getSettings: function() {

                },

                updateSettings: function() {

                }
            };
        };

        this.setUserSession = function setUserSession(userSession) {
            if (typeof userSession === 'object')
                session = userSession;
            else
                throw new TypeError('url must be of type string');
        };

        this.getUserSession = function getUserSession() {

        }


    }


    })();