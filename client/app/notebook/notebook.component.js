'use strict';

angular.module('glossa')
    .component('notebookComponent', {
        controller: notebookCtrl,
        controllerAs: 'nbVm',
        transclude: true,
        templateUrl: 'app/notebook/notebook.html'
    });

function notebookCtrl(fileSrvc, notebookSrvc, $scope, $mdDialog, $timeout, postSrvc, dialogSrvc, $sce) {
    var nbVm = this;

    nbVm.hidden = false;
    nbVm.isOpen = false;
    nbVm.hover = false;
    nbVm.items = [
        { name: "Create Audio Post", icon: "volume_up", direction: "left", type: 'audio' },
        { name: "Create Image Post", icon: "camera_alt", direction: "left", type: 'image' },
        { name: "Create Normal Post", icon: "create", direction: "left", type: 'normal' }
    ];
    nbVm.notebooks = [];

    nbVm.openNBDialog = openNBDialog;
    nbVm.tagManageDialog = tagManageDialog;
    nbVm.newPost = newPost;

    nbVm.commonTags = [];

    var hashtagsUsed = [];

    $scope.$watch('nbVm.isOpen', isOpenWatch);

    activate();
    function activate() {
        queryNotebooks();
    }

    function queryNotebooks() {
        hashtagsUsed = [];
        nbVm.commonTags = [];
        notebookSrvc.queryNotebooks().then(function(result) {

            //iterates over all notebooks
            result.data.forEach(function(doc) {
                if (doc.hashtags) {

                    doc.hashtags.forEach(function(tag) {
                        //pushes each hashtag to an array
                        hashtagsUsed.push(tag);
                    })
                }
            });

            findCommon(hashtagsUsed).forEach(function(item) {
                nbVm.commonTags.push(item.item);
            });

            nbVm.notebooks = result.data;
        }).catch(function(err) {
            console.log('there was an error querying notebooks', err);
        });
    }

    // TODO: move to service
    //find the common tags accross notebooks
    function findCommon(arr) {
        var uniqs = {};

        for(var i = 0; i < arr.length; i++) {
            uniqs[arr[i].tag] = (uniqs[arr[i].tag] || {});
            uniqs[arr[i].tag]['item'] = arr[i];
            uniqs[arr[i].tag]['occurance'] = (uniqs[arr[i].tag]['occurance'] || 0) + 1;
        }

        var props = Object.keys(uniqs).map(function(key) {
            return { item: this[key].item, occurance: this[key].occurance };
        }, uniqs);

        props.sort(function(p1, p2) {
            return p2.occurance - p1.occurance;
        });

        var topThree = props.slice(0, 5);

        return topThree;
    }


    /**
     * Calls the service method and waits for promise.  When promise returns, it means the data has been saved in the database and the file has been written to the filesystem then we push the created notebook to the array
     * @param ev - the event
     * @param type - the type of post
     */
    function openNBDialog(ev, notebook) {
        var postOptions = postSrvc.postOptions(ev, notebook);

        dialogSrvc.openPostDialog(ev, postOptions, notebook).then(function(result) {
            //if there was data changed
            if (result && !result.dataChanged) {
                return;
            }
            queryNotebooks();
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

    function newPost(event, type) {
        var notebook = {
            media: {},
            postType: type
        };
        openNBDialog(event, notebook)
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
}