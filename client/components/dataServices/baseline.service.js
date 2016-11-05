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
        console.log('readContent: file', file);
    //    use file pathe to read contents
    //    pass contents to controller
    //    display contents

       return fs.readFile(file.path, "utf8", function read(err, data) {
            if (err) {
                return console.log('there was an error', err);
            }
            content = data;
            return cb(content);
        })
    }

    function updateContent(file, newValue) {
        console.log('file', file);
        fs.writeFileSync(file.path, newValue, 'utf-8');
    //    write to file system new changes
    }

    function sendFileContent(content) {
        console.log('debug1');
        return content;
    }
}