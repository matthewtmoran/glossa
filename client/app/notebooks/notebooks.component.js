'use strict';

angular.module('glossa')
    .component('notebooksComponent', {
        controller: notebookCtrl,
        controllerAs: 'nbVm',
        transclude: true,
        templateUrl: 'app/notebooks/notebooks.component.html'
    });

function notebookCtrl(NotebookService, $scope, $timeout, dialogSrvc, HashtagService, UserService, AppService, $window) {
    var nbVm = this;
    var hashtagsUsed = [];

    nbVm.$onInit = function() {
        queryNotebooks();
        console.log('$window.socket', $window.socket);
        // queryCommonTags();
        // nbVm.occurringTags = HashtagService.countHashtags();
    };

    nbVm.isLoading = true;
    nbVm.hidden = false;
    nbVm.isOpen = false;
    nbVm.hover = false;
    nbVm.items = [
        { name: "Create Audio Post", icon: "volume_up", direction: "left", type: 'audio' },
        { name: "Create Image Post", icon: "camera_alt", direction: "left", type: 'image' },
        { name: "Create Normal Post", icon: "create", direction: "left", type: 'normal' }
    ];
    nbVm.notebooks = [];
    nbVm.externalNotebooks = [];
    nbVm.commonTags = [];
    nbVm.uniqueUsers = {};


    nbVm.showNewUpdates = showNewUpdates;
    nbVm.viewDetails = viewDetails;
    nbVm.tagManageDialog = tagManageDialog;
    nbVm.newPost = newPost;


    $scope.$watch('nbVm.isOpen', isOpenWatch);
    $scope.$watch('nbVm.uniqueUsers', function(newValue) {
        console.log('there was a change in notebook....', newValue);
    });

    /**
     * Queries all notebooks
     */
    function queryNotebooks() {
        NotebookService.getNotebooks().then(function(data) {
            nbVm.notebooks = data;
            nbVm.isLoading = false;
        })
    }

    function queryCommonTags() {
        HashtagService.getCommonTags().then(function(data) {
            nbVm.commonTags = data
        })
    }


    //TODO: deal with updating notebooks
    function showNewUpdates() {
        nbVm.externalNotebooks.forEach(function(newNotebook) {
            newNotebook.isNew = true;
            nbVm.notebooks.push(newNotebook);
        });
        nbVm.externalNotebooks = [];
    }

    /**
     * Calls the service method and waits for promise.  When promise returns, it means the data has been saved in the database and the file has been written to the filesystem then we push the created notebooks to the array
     * @param ev - the event
     * @param notebook object - postType should be defined everytime
     */
    function viewDetails(ev, notebook, index) {
        //get options depending on post type
        var postOptions = NotebookService.postOptions(ev, notebook);

        //open post dialog
        dialogSrvc.notebookDetails(ev, postOptions, notebook).then(function(result) {
            //if there was no data changed just return
            if (result && !result.dataChanged) {
                var index = nbVm.notebooks.indexOf(notebook);
                nbVm.notebooks[index] = result.data;
            }

            //update the specific notebooks in the view
            if (result && result.event === 'update') {
                var index = nbVm.notebooks.indexOf(notebook);
                nbVm.notebooks[index] = result.data;
            }

            //add the new notebooks to the view
            if (result && result.event === 'save') {
                nbVm.notebooks.push(result.data);
            }

        }).catch(function(result) {
            console.log('catch result', result);
        });
    }

    function tagManageDialog() {
        dialogSrvc.manageTags().then(function(res) {
            if (res.dataChanged) {
                queryNotebooks();
            }
        })
    }

    function isOpenWatch(isOpen) {
        if (isOpen) {
            $timeout(function() {
                $scope.tooltipVisible = nbVm.isOpen;
            }, 600);
        } else {
            $scope.tooltipVisible = nbVm.isOpen;
        }
    }

    /**
     * Called when someone click the mini-fab button
     * @param event - the target event
     * @param type - the type of notebooks selected to create (picture, audio, normal)
     */
    function newPost(event, type) {
        var notebook = {
            postType: type
        };
        viewDetails(event, notebook)
    }

    $scope.$on('update:externalData', function(event, data) {
        console.log('update:externalData', data);

        if (Array.isArray(data.updatedData)) {
            data.updatedData.forEach(function(notebook) {

                var isUpdate = false;

                for(var i = 0, len = nbVm.notebooks.length; i < len; i++) {
                    if (nbVm.notebooks[i]._id === notebook._id) {
                        isUpdate = true;
                        console.log('this means notebook exists already and its just an update that was submitted');
                        nbVm.notebooks[i] = notebook;
                        console.log("Notebook shoudl be updated... ");
                        console.log("TODO: give user notification update was made.... ")
                    }
                }
                if (!isUpdate) {
                    nbVm.externalNotebooks.push(notebook);
                }
            })
        } else {
            console.log('single update received.... ');

            var isUpdate = false;
            for(var i = 0, len = nbVm.notebooks.length; i < len; i++) {
                if (nbVm.notebooks[i]._id === data.updatedData._id) {
                    isUpdate = true;
                    console.log('this means notebook exists already and its just an update that was submitted');
                    nbVm.notebooks[i] = data.updatedData;
                    console.log("Notebook should be updated... ");
                    console.log("TODO: give user notification update was made.... ")
                }
            }

            if (!isUpdate) {
                nbVm.externalNotebooks.push(data.updatedData);
            }
        }
    });

    $scope.$on('normalize:notebooks', function(event, data) {
        console.log('normalize:notebooks', data);
        nbVm.notebooks.forEach(function(notebook) {
            if (notebook.createdBy._id === data._id) {
                notebook.createdBy.name = data.name;
                notebook.createdBy.avatar = data.avatar;
            }
        })
    })
}
