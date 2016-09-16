'use strict';
var fs = require('fs');

angular.module('glossa')
    .factory('nodeSrvc', nodeSrvc);

function nodeSrvc() {


    var service = {
        readfiles: readfiles
    };

    return service;


    //////////


    function readfiles(files) {


        console.log('readFiles', files);
        var filePath = files[0].path;
        console.log('filePath', filePath);
        fs.createReadStream(filePath).pipe(fs.createWriteStream('uploads/' + files[0].name));

        // if (files.length > 1) {
        //     files.forEach(function(file) {
        //         console.log('file', file);
        //     });
        // }




        // files.forEach(function(file) {
        //
        // })
    }

}