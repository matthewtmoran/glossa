'use strict';
var fs = require('fs');

/**
 * "Upload" file into app"
 * Takes the original file location, the new file location, and a callback function
 * It will copy the file and wirte the file and then initait the saveToDb callback
 * @param from - the original file location
 * @param to - the new file location
 * @param callback - call back that take the new Path and saves data in db.
 */
function copyAndWrite(from, to, data, callback){
        //copy the file
    fs.createReadStream(from)
    //write the file
        .pipe(fs.createWriteStream(to)
            .on('close', function() {
                return callback(null, data);
            })
            .on('error', function(err) {
                return callback(err, null);
            })
        );
}

module.exports = {
    copyAndWrite : copyAndWrite,
};