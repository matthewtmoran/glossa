'use strict';

angular.module('glossa')
    .factory('postSrvc', postSrvc);

function postSrvc($mdDialog, notebookSrvc, $q) {
    /**
     * This is a little mini api that we can call dynamically.
     * @type {{image: save.image, normal: save.normal, audio: save.audio}}
     */
    var save = {
        image: function(currentNotebook, postContent) {
            return saveImagePost(currentNotebook, postContent);
        },
        normal: function (currentNotebook, postContent) {
            return saveNormalPost(currentNotebook, postContent);
        },
        audio: function(currentNotebook, postContent) {
            return saveAudioPost(currentNotebook, postContent);
        }
    };
    var service = {
        parseTitle: parseTitle,
        newPostDialog: newPostDialog,
        existingPostDialog: existingPostDialog,
        save: save
    };
    return service;

    function parseTitle(text) {
        var re = /(#+)\s(.*)/;
        var m = text.match(re);
        return m[0] || text.splice(0, 16);
    }

    function newPostDialog(ev, type, currentNotebook) {
        var options = {
            simplemde: {},
            template: ''
        };
        currentNotebook.postType = type;
        switch(type) {
            case 'image':
                options.template = 'app/notebook/imageDialog/imagePost.html';
                options.simplemde = {toolbar: false};
                break;
            case 'audio':
                options.template = 'app/notebook/postDialog/audioPost.html';
                options.simplemde = {toolbar: false};
                break;
            case 'normal':
                options.template = 'app/notebook/postDialog/newPost.html';
                options.simplemde = {hideIcons: ['image', 'link', 'preview/fullscreen']};
                break;
            case 'default':
                console.log('error');
        }
        return openPostDialog(ev, options, currentNotebook);
    }

    /**
     * Here we pass in the options object and send current object that is being created/modified.  I return the entire dialog object.
     *
     * It waits till the dialog is closed by some means then passes the data back to the notebook controller.
     * @param ev
     * @param options - an object that has simplemde options and template options
     * @param currentNotebook - the data object we are modifying
     * @returns {*} the modified data.
     */
    function openPostDialog(ev, options, currentNotebook) {
        return $mdDialog.show({
            controller: newPostCtrl,
            controllerAs: 'newPostVm',
            templateUrl: options.template,
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: false,
            bindToController: true,
            locals: {
                simplemdeOptions: options.simplemde,
                currentNotebook: currentNotebook
            }
        }).then(function(data) {

            console.log('Dialog is closed. data', data);

            return data;
        }, function(data) {
            return data;
        });
    }

    function existingPostDialog(currentNotebook) {
        return $mdDialog.show({
            templateUrl: 'app/notebook/postDialog/existingPost.html',
            parent: angular.element(document.body),
            // targetEvent: ev,
            controller: newPostCtrl,
            controllerAs: 'newPostVm',
            bindToController: true,
            clickOutsideToClose: false,
            locals: {
                simplemdeOptions: '',
                currentNotebook: currentNotebook
            }
        }).then(function(data) {

            console.log('Dialog is closed. data', data);

            return data;
        }, function(data) {
            return data;
        });
    }

    /**
     * Here we create a promise object.  This enables us to 'wait' for the file system copy/write and the databse save.
     * @param currentNotebook - this is the object we are savin in the database
     * @param postContent - this is the content of the simplmde text are where we will parse titles, tags, mentions etc...
     * @returns {promise.promise|jQuery.promise|promise|*|d.promise|Promise}
     * TODO: we can turn this into one dynamic function
     */
    function saveNormalPost(currentNotebook) {
        var deferred = $q.defer();

        // TODO: Need to modify the parseTitle function to return some sort fo string if no title markdown elemnt is provided
        currentNotebook.name = parseTitle(currentNotebook.description);

        notebookSrvc.createNotebook(currentNotebook, function(result) {
            if (!result) {
                deferred.reject('There was an issue')
            }
            currentNotebook = {
                media: {}
            };
            deferred.resolve(result);
        });
        return deferred.promise;
    }

    function saveImagePost(currentNotebook, postContent) {
        var deferred = $q.defer();

        currentNotebook.name = currentNotebook.media.image.name;
        currentNotebook.media.image.caption = postContent;

        notebookSrvc.createNotebook(currentNotebook, function(result) {
            if (!result) {
                deferred.reject('There was an issue')
            }
            currentNotebook = {
                media: {}
            };
            deferred.resolve(result);
        });
        return deferred.promise;
    }

    function saveAudioPost(currentNotebook, postContent) {
        var deferred = $q.defer();

        currentNotebook.name = currentNotebook.media.audio.name;
        currentNotebook.media.audio.caption = postContent;

        notebookSrvc.createNotebook(currentNotebook, function(result) {
            if (!result) {
                deferred.reject('There was an issue')
            }
            currentNotebook = {
                media: {}
            };
            deferred.resolve(result);
        });
        return deferred.promise;
    }




}