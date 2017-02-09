'use strict';

angular.module('glossa')
    .factory('NotebookService', NotebookService);

function NotebookService($http, $q, simpleParse, Upload) {

    //this is where we customize the toolbar i.e. icons
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

    var service = {
        getNotebooks: getNotebooks,
        findNotebook: findNotebook,
        createNotebook: createNotebook,
        updateNotebook: updateNotebook,
        postOptions: postOptions
    };

    return service;
    ///////////////



    /**
     * Queries all the notebooks and returns results
     */
    function getNotebooks() {
        return $http.get('/api/notebooks')
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    /**
     * Finds specific notebooks
     * @param nbId
     * @returns {*}
     */
    function findNotebook(nbId) {
        return $http.get('/api/notebooks/' + nbId)
            .then(function successCallback(response) {
                return response.data;
            }, function errorCallback(response) {
                console.log('There was an error', response);
                return response.data;
            });
    }

    /**
     * Saves a new notebooks
     * @param notebook
     * @returns {*}
     */
    function createNotebook(notebook) {

        var session = JSON.parse(localStorage.getItem('session'));

        notebook.name = simpleParse.title(notebook);
        notebook.createdAt = Date.now();
        notebook.createdBy = session.userId;
        notebook.projectId = session.projectId;

       return $q.when(simpleParse.hashtags(notebook))
            .then(function(data) {
                notebook.hashtags = data;
                var options = {
                     url:'/api/notebooks/',
                     method: 'POST'
                 };

                return uploadReq(notebook, options).then(function(data) {
                        return data
                })
            });
    }

    /**
     * Updates an existing notebooks
     * @param notebook
     * @returns {*}
     */
    function updateNotebook(notebook) {
        //parse name of notebooks in case it was changed...
        notebook.name = simpleParse.title(notebook);

        //parse hashtags in description
        return $q.when(simpleParse.hashtags(notebook))
            .then(function(data) {
                notebook.hashtags = data;
                var options = {
                    url:'/api/notebooks/' + notebook._id,
                    method: 'PUT'
                };
                return uploadReq(notebook, options).then(function(data) {
                    return data;
                })
            });
    }


    //////////
    //helper//
    //////////


    //ng-upload request
    function uploadReq(dataObj, options) {
        var files = [];



        // for (var key in dataObj.media) {
        //     if (dataObj.media.hasOwnProperty(key)) {
        //         if (dataObj.media[key]) {
        //             files.push(dataObj.media[key])
        //             delete dataObj.media[key];
        //         }
        //     }
        // }

        if (dataObj.image) {
            files.push(dataObj.image);
        }

        if (dataObj.audio) {
            files.push(dataObj.audio);
        }


        return Upload.upload({
            method: options.method,
            url: options.url,
            data: {
                files: files,
                dataObj: angular.toJson(dataObj)
            },
            arrayKey: '',
            headers: { 'Content-Type': undefined }
        }).then(function successCallback(response) {
            return response.data;

        }, function errorCallback(response){
            console.log('Error with upload', response);
            return response.data;
        });
    }

    function postOptions(ev, notebook) {
        var options = {
            simplemde: {},
            template: '',
        };

        switch(notebook.postType) {
            case 'image':
                options.template = 'app/notebooks/notebook-dialog/notebook-dialog-image.controller.html';
                options.simplemde = {
                    toolbar: false,
                    status: false,
                    spellChecker: false,
                    autoDownloadFontAwesome: false,
                    // forceSync: true,
                    placeholder: 'Image caption...',
                };
                break;
            case 'audio':
                options.template = 'app/notebooks/notebook-dialog/notebook-dialog-audio.controller.html';
                options.simplemde = {
                    toolbar: false,
                    status: false,
                    spellChecker: false,
                    autoDownloadFontAwesome: false,
                    // forceSync: true,
                    placeholder: 'Audio caption...'
                };
                break;
            case 'normal':
                options.template = 'app/notebooks/notebook-dialog/notebook-dialog.controller.html';
                options.simplemde = {
                    toolbar: simplemdeTollbar,
                    spellChecker: false,
                    status: false,
                    autoDownloadFontAwesome: false,
                    // forceSync: true,
                    placeholder: 'Post description...',
                };
                break;
            case 'default':
                console.log('error');
        }
        return options;
    }

    function test(e) {
        console.log('test', e);
    }
}

