'use strict';

angular.module('glossa')
    .factory('postSrvc', postSrvc);

function postSrvc($mdDialog, notebookSrvc, $q, simpleParse) {
    var simplemdeTollbar = [
        {
            name: "italic",
            action: SimpleMDE.toggleItalic,
            className: "md-icon-button toolbar-icon md-button md-ink-ripple",
            iconClass: 'format_italic',
            title: "Italic",
        },
        {
            name: "bold",
            action: SimpleMDE.toggleBold,
            className: "md-icon-button toolbar-icon md-button md-ink-ripple",
            iconClass: "format_bold",
            title: "Bold",
        },
        {
            name: "header",
            action: SimpleMDE.toggleHeading1,
            className: "md-icon-button toolbar-icon md-button md-ink-ripple",
            iconClass: "title",
            title: "Header",
        },
        "|", // Separator
        {
            name: "Blockquote",
            action: SimpleMDE.toggleBlockquote,
            className: "md-icon-button toolbar-icon md-button md-ink-ripple",
            iconClass: "format_quote",
            title: "Blockquote",
        },
        {
            name: "Bullet List",
            action: SimpleMDE.toggleUnorderedList,
            className: "md-icon-button toolbar-icon md-button md-ink-ripple",
            iconClass: "format_list_bulleted",
            title: "Bullet List",
        },
        {
            name: "Ordered List",
            action: SimpleMDE.toggleOrderedList,
            className: "md-icon-button toolbar-icon md-button md-ink-ripple",
            iconClass: 'format_list_numbered',
            title: "Numbered List",
        },
        "|",
        {
            name: "Toggle Preview",
            action: SimpleMDE.togglePreview,
            className: "md-icon-button toolbar-icon md-button md-ink-ripple",
            iconClass: 'visibility',
            title: "Toggle Preview",
        },
        {
            name: "Help",
            action: test,
            className: "md-icon-button toolbar-icon md-button md-ink-ripple",
            iconClass:'help',
            title: "Toggle Preview",
        }
    ];

    /**
     * This is a little mini api that we can call dynamically.
     * @type {{image: save.image, normal: save.normal, audio: save.audio}}
     */
    var save = {
        image: function(currentNotebook, postContent) {
            return saveImagePost(currentNotebook, postContent);
        },
        normal: function (currentNotebook, postContent) {
            return saveNormalPost(currentNotebook);
        },
        audio: function(currentNotebook, postContent) {
            return saveAudioPost(currentNotebook, postContent);
        }
    };
    var service = {
        // parseTitle: parseTitle,
        newPostDialog: newPostDialog,
        existingPostDialog: existingPostDialog,
        save: save
    };
    return service;

    function test(e) {
        console.log('test', e);
    }

    function newPostDialog(ev, type, currentNotebook) {
        var options = {
            simplemde: {},
            template: ''
        };
        currentNotebook.postType = type;
        switch(type) {
            case 'image':
                options.template = 'app/notebook/postDialog/imagePost.html';
                options.simplemde = {
                    toolbar: false,
                    status: false,
                    spellChecker: false,
                    autoDownloadFontAwesome: false,
                    forceSync: true,
                    placeholder: 'image caption...',

                };
                break;
            case 'audio':
                options.template = 'app/notebook/postDialog/audioPost.html';
                options.simplemde = {
                    toolbar: false,
                    status: false,
                    spellChecker: false,
                    autoDownloadFontAwesome: false,
                    forceSync: true,
                    placeholder: 'audio caption...'
                };
                break;
            case 'normal':
                options.template = 'app/notebook/postDialog/newPost.html';
                options.simplemde = {
                    toolbar: simplemdeTollbar,
                    spellChecker: false,
                    status: false,
                    autoDownloadFontAwesome: false,
                    forceSync: true,
                    placeholder: 'Post description...',
                };
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

        currentNotebook = simpleParse.parseNotebook(currentNotebook);

        notebookSrvc.createNotebook(currentNotebook, function(result) {
            if (!result.success) {
                deferred.reject(result);
            }
            currentNotebook = {
                media: {}
            };
            deferred.resolve(result);
        });
        return deferred.promise;
    }

    function saveImagePost(currentNotebook) {
        var deferred = $q.defer();

        currentNotebook.name = currentNotebook.media.image.name;

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