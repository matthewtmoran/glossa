'use strict';

// var bonjour = require('bonjour')();
var config = require('./../config/environment/index');
var browser;
var myLocalService = null;
var browserInitiated = false;



module.exports = {
    initListeners: function(glossaUser, browser) {
        console.log("");
        console.log("initListeners called");
        return new Promise(function(resolve, reject) {
            // if (!browserInitiated) {
            //     browser = bonjour.find({type: 'http'});
            // }

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



                    }
                }
            });
        });

    },

    publish: function(glossaUser, browser, bonjour, callback) {
        console.log('');
        console.log('publish saga');
        if (!browser || !browser.services.length) {
            console.log('there is no browser object or there are no services');
            console.log('... this is where publish happens');
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
            console.log('there are services....');
            //flag for local service
            var localServicePublished = false;

            //check for local service in published services
            for (var i = 0; i < browser.services.length; i++) {
                console.log('browser.services[i].name', browser.services[i].name);
                console.log('glossaApp-' + glossaUser._id);
                if (browser.services[i].name === 'glossaApp-' + glossaUser._id) {

                    console.log('My service is already published on the network');
                    // browser.services[i].stop();
                    localServicePublished = true;
                    // return callback("ERROR: Service is already published")
                }
            }

            console.log('service check done');

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

    getMyBonjourService: function() {
        console.log('getMyBonjourService');
        return myLocalService;
    },

    destroy: function() {
        console.log("destroying bonjour service called ");
        myLocalService.stop(function() {
            console.log('Service Stop Success! called from bonjour-service.js');
            myLocalService = null;
        });
    }
};