'use strict';

var bonjour = require('bonjour')();
var config = require('./../config/environment/index');
var browser;
var myLocalService = {};
var listenerAmount = 0;
var browserInitiated = false;



module.exports = {

    initListeners: function(glossaUser, callback) {
        console.log('init listeners should be running ...', glossaUser.socketId);
        return new Promise(function(resolve, reject) {
            if (!browserInitiated) {
                browser = bonjour.find({type: 'http'});
                listenerAmount++;

            } else {
                // browser.find()
            }
            browser.on('down', function(service) {
                console.log('');
                console.log('Service went down.......', service.name);
                console.log('Service on network:', browser.services.length);
            });

            browser.on('up', function(service) {
                console.log('');
                console.log('Service went/is live........', service.name);
                console.log('Services on network:', browser.services.length);

                //make sure network service is a glossa instance....
                if (service.name.indexOf('glossaApp') > -1) {
                    console.log('A glossa Application is online');
                    if (service.name === 'glossaApp-' + glossaUser._id) {
                        console.log('...Local service found IGNORE');
                        browserInitiated = true;
                    } else if (service.name !== 'glossaApp-' + glossaUser._id) {
                        console.log('...External service found CONNECT');
                        //    connect to external service as a client
                        // connectAsNodeClient(service);


                        resolve(service);
                        // callback(null, service);
                    }
                }
            });
        });

    },

    publish: function(glossaUser, callback) {
        if (!browser || !browser.services.length) {
            //publish service
            myLocalService = bonjour.publish({
                name:'glossaApp-' + glossaUser._id,
                type: 'http',
                port: config.port,
                txt: {
                    userid: glossaUser._id
                }
            });

            console.log('Published my glossa App... : ', myLocalService.name);

        } else if (browser.services.length > 0) {
            //flag for local service
            var localServicePublished = false;

            //check for local service in published services
            for (var i = 0; i < browser.services.length; i++) {
                if (browser.services[i].name === 'glossaApp-' + glossaUser._id) {
                    console.log('Service is already published on the network', myLocalService);
                    // browser.services[i].stop();
                    localServicePublished = true;
                    // return callback("ERROR: Service is already published")
                }
            }

            //if local service is not published publish service
            if (!localServicePublished) {
                console.log('...Services exist but they are not my service... Publishing my service....');
                myLocalService = bonjour.publish({
                    name:'glossaApp-' + glossaUser._id,
                    type: 'http',
                    port: config.port,
                    txt: {
                        userid: glossaUser._id
                    }
                });
            }
            return callback(null);
        }
    },



    destroy: function() {
        myLocalService.stop(function() {
            console.log('Service Stop Success!');
        });
    }
};