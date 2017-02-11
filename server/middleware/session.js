'use strict';

var config = require('../config/environment'),
    fs = require('fs'),
    path = require('path'),
    q = require('q'),
    Transcription = require('../api/transcription/transcription.model');

module.exports = {

    onInit: function() {
        console.log('The application init')
    },

    onEnd: function() {
        setTimeout(function() {
            console.log('The application is over');
        }, 600)
    }

};

