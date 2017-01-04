'use strict';

angular.module('glossa')
    .component('notebookComponent', {
        controller: notebookCtrl,
        controllerAs: 'nbVm',
        transclude: true,
        templateUrl: 'app/notebook/notebook.html'
    });

function notebookCtrl(notebookSrvc, $scope, $timeout, postSrvc, dialogSrvc, hashtagSrvc, $http) {
    var nbVm = this;
    var hashtagsUsed = [];

    nbVm.$onInit = function() {
        queryNotebooks();
        // nbVm.occurringTags = hashtagSrvc.countHashtags();
    };

    nbVm.hidden = false;
    nbVm.isOpen = false;
    nbVm.hover = false;
    nbVm.items = [
        { name: "Create Audio Post", icon: "volume_up", direction: "left", type: 'audio' },
        { name: "Create Image Post", icon: "camera_alt", direction: "left", type: 'image' },
        { name: "Create Normal Post", icon: "create", direction: "left", type: 'normal' }
    ];
    nbVm.notebooks = [];
    nbVm.commonTags = [];

    nbVm.openNBDialog = openNBDialog;
    nbVm.tagManageDialog = tagManageDialog;
    nbVm.newPost = newPost;

    $scope.$watch('nbVm.isOpen', isOpenWatch);

    /**
     * Queries all notebooks
     */
    function queryNotebooks() {
        notebookSrvc.getNotebooks().then(function(data) {
            nbVm.notebooks = data
        })
    }

    // TODO: move to service
    // TODO: refractor to store use data within tag document vs creating every time
    //find the common tags accross notebooks
    /**
     * Calls the service method and waits for promise.  When promise returns, it means the data has been saved in the database and the file has been written to the filesystem then we push the created notebook to the array
     * @param ev - the event
     * @param notebook object - postType should be defined everytime
     */
    function openNBDialog(ev, notebook) {
        //get options depending on post type
        var postOptions = postSrvc.postOptions(ev, notebook);

        //open post dialog
        dialogSrvc.openPostDialog(ev, postOptions, notebook).then(function(result) {
            //if there was no data changed just return
            if (result && !result.dataChanged) {
                return;
            }
            var index = nbVm.notebooks.indexOf(notebook);
            nbVm.notebooks[index] = result.data;
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
     * @param type - the type of notebook selected to create (picture, audio, normal)
     */
    function newPost(event, type) {
        var notebook = {
            media: {},
            postType: type
        };
        openNBDialog(event, notebook)
    }
}
