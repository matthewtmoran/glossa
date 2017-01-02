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

function copyWrite2(from, to) {

  var pipeAction = fs.createReadStream(from)
        .pipe(fs.createWriteStream(to));

    return new Promise(function(resolve, reject){
        pipeAction.on("close",function(){ //waits for data to be consumed
            // pipe has ended here, so we resolve the promise
            resolve({
                success: true,
                msg: 'file copied success',
                data: {
                    from: from,
                    to: to,
                    err: null
                }});
        }).on('error', function(err) {
            reject({
                success: false,
                msg: 'File copy failed',
                data: {
                    from: from,
                    to: to,
                    err: err
                }});
        })
    });

}



/**
 * Check if file exists
 * Returns true if the file exists and false if the file does not exist
 * @param dir
 * @returns {boolean}
 *
 * TODO: consider just querying the db for an existing file by the name(path)
 */
function doesExist(dir) {
    try {
        fs.statSync(dir);
        return true;
    } catch (err) {
        return !(err && err.code === 'ENOENT');
    }
}

function createMediaObject(mediaObj, type) {
    var newMediaObj = {
        name: mediaObj.name,
        path: 'uploads/' + type + '/' + mediaObj.name,
        extension: mediaObj.extension,
        description: '',
        type: type
    };
    return newMediaObj;
}


function removeItem(path) {

    return new Promise(function(resolve, reject) {
        fs.unlink(path, function(err) {
            if (err) {
               return reject(err);
            }
            resolve();
        });
    })

}

module.exports = {
    createMediaObject: createMediaObject,
    doesExist: doesExist,
    copyAndWrite : copyAndWrite,
    copyWrite2: copyWrite2,
    removeItem: removeItem
};