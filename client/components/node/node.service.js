'use strict';
var fs = require('fs');
var path = require('path');
var _ = require('lodash');

var acceptedAudio = ['mp3','wav','wma'];

angular.module('glossa')
    .factory('nodeSrvc', nodeSrvc);

function nodeSrvc() {

    var uploadPath = './uploads/';

    if (!fs.existsSync(uploadPath)){
        fs.mkdirSync(uploadPath);
    }

    var fileArray = [];
    var editorInstance = {};

    var service = {
        addFiles: addFiles,
        getFiles: getFiles,
        getFileContent: getFileContent
        // createEditor: createEditor
    };

    return service;
    //////////


    /**
     * Add files from user's selection to uploads direcoty
     * TODO: add validation for files with the same name
     * TODO: add validation for file types
     * TODO: maybe sort audio/video files
     *
     * @param files
     */
    function addFiles(files) {
        for (var key in files) {
            if (files.hasOwnProperty(key)) {
                fs.createReadStream(files[key].path).pipe(fs.createWriteStream(uploadPath + files[key].name));
                buildFileObject(files[key].name);
            }
        }
        return fileArray;
    }

    /**
     * Builds an object with file data to pass back to view to be consumed by angular
     *
     * @param file - a string of the file name
     */
    function buildFileObject(file) {
        var filePath = path.join(uploadPath, file);
        var tObj = {
            fileName: file,
            filePath: filePath,
            fileExt: file.substr(file.lastIndexOf('.')+1)
        };
        tObj.fileCategory = defineCategory(tObj.fileExt);

        fileArray.push(tObj);
    }

    function defineCategory(fileExt) {

        if (_.includes(acceptedAudio, fileExt)) {
            return 'audio';
        } else if (fileExt === 'txt') {
            return 'text';
        } else {
            return 'other';
        }
    }

    /**
     * The function is called when the controller is initialized
     * @returns {Array} - an array of file object for angular
     *
     * TODO: I don't like having to define the file path here and also in the build function
     */
    function getFiles() {
        fs.readdirSync(uploadPath).forEach(function(file) {
            var filePath = path.join(uploadPath, file);
            if (!fs.statSync(filePath).isDirectory()) {
                buildFileObject(file);
            }
        });
        return fileArray;
    }

    /**
     * Reads the content of file and returns that content.
     * @param srcpath - the source of the file.  Will be passed during click event
     * @returns content of file as string
     */
    function getFileContent(srcpath) {
        return fs.readFileSync(srcpath, {encoding: 'utf-8'});
    }

    // function createEditor(){
    //     // Set up ace editor
    //     var editor = ace.edit('editor');
    //     // Add line wrapping
    //     editor.getSession().setUseWrapMode(true);
    //     var textfield = editor.textInput.getElement();
    //     editor.getSession().setMode("ace/mode/markdown");
    //     editor.on('change', function(){
    //         render(editor.getValue());
    //         Util.session.save();
    //     });
    //     editorInstance = editor;
    //     return editor;
    // }


    // function getDirectories(srcpath) {
    //     return fs.readdirSync(srcpath).filter(function(file) {
    //         return fs.statSync(path.join(srcpath, file)).isDirectory();
    //     });
    // }
    //
    // function getFiles(srcpath) {
    //     console.log("What I got "+srcpath);
    //     var files = fs.readdirSync(srcpath);
    //     return files.filter(function(file) {
    //         return !fs.statSync(path.join(srcpath, file)).isDirectory();
    //     });
    // }
    //

    //
    // function writeFile(srcpath,content) {
    //     fs.writeFile( srcpath, content, function(err) {
    //         if(err) {
    //             return console.log(err);
    //         }
    //
    //         console.log("The file was saved!");
    //     });
    // }

}