'use strict';

var fs = require('fs'),
    path = require('path'),
    _ = require('lodash');

angular.module('glossa')
    .factory('baselineSrvc', baselineSrvc);

function baselineSrvc() {

    var content;

    var service = {
        readContent: readContent,
        updateContent: updateContent
    };
    return service;


    function readContent(file, cb) {
       return fs.readFile(file.path, "utf8", function read(err, data) {
            if (err) {
                return console.log('there was an error', err);
            }
            content = data;
            return cb(content);
        })
    }

    function updateContent(file, newValue) {
        fs.writeFileSync(file.path, newValue, 'utf-8');
    //    write to file system new changes
    }

    function sendFileContent(content) {
        return content;
    }
}