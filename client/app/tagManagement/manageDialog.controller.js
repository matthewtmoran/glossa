'use strict';

angular.module('glossa')
    .controller('manageTagsCtrl', manageTagsCtrl);

function manageTagsCtrl(dialogSrvc, hashtagSrvc, $mdEditDialog, $mdDialog, $q) {
    var dialogVm = this;

    dialogVm.hide = function() {
        dialogSrvc.hide();
    };

    dialogVm.cancel = function() {
        return dialogSrvc.cancel('Manage Dialog cancel');
    };

    dialogVm.showData = 'alldata';

    hashtagSrvc.get().then(function(result) {
        dialogVm.infiniteItems = result.data;
    });


    dialogVm.showAll = showAll;
    dialogVm.showDetails = showDetails;
    dialogVm.showTagList = showTagList;
    dialogVm.editField = editField;
    dialogVm.updateTag = updateTag;

    dialogVm.tableOptions = {
        rowSelection: true,
        multiSelect: true,
        autoSelect: true,
        decapitate: false,
        largeEditDialog: false,
        boundaryLinks: false,
        limitSelect: true,
        pageSelect: true
    };
    dialogVm.selected = [];

    function showAll() {
        dialogVm.showData = 'alldata';
    }

    function showDetails(item) {
        dialogVm.currentItem = item;
        dialogVm.currentItem_OG = angular.copy(item);
        dialogVm.showData = 'details';
    }

    function showTagList() {
        dialogVm.showData = 'alldata';

        if (!angular.equals(dialogVm.currentItem, dialogVm.currentItem_OG)) {
            console.log('TODO: need to figure out a way to confirm changes here or something')
        }

    }

    function editField(event, value, field) {
        event.stopPropagation(); // in case autoselect is enabled
        // dialogVm.midEdit = true;
        //
        var editDialog = {
            modelValue: value,
            placeholder: 'Edit ' + field,
            save: function (input) {
                dialogVm.currentItem[field] = input.$modelValue;
            },
            targetEvent: event,
            title: 'Edit ' + field,
            validators: {}
        };
        //
        var promise;
        //
        if(dialogVm.tableOptions.largeEditDialog) {
            promise = $mdEditDialog.large(editDialog);
        } else {
            promise = $mdEditDialog.small(editDialog);
        }
        //
        promise.then(function (ctrl) {
            var input = ctrl.getInput();

            input.$viewChangeListeners.push(function () {
                input.$setValidity('test', input.$modelValue !== 'test');
            });
        });

    }

    function updateTag() {
        console.log('TODO: normalize file data(currently hashtags are normalized)');
        hashtagSrvc.updateTag(dialogVm.currentItem).then(function(result) {
            hashtagSrvc.normalizeHashtag(result.data).then(function(result) {
                dialogVm.showData = 'alldata';
            }).catch(function(err) {
                console.log('there was an error',err);
            });
        }).catch(function(err) {
            console.log('there was an error', err)
        });
    }

    // In this example, we set up our model using a plain object.
    // Using a class works too. All that matters is that we implement
    // getItemAtIndex and getLength.
    // dialogVm.infiniteItems = {
    //     numLoaded_: 0,
    //     toLoad_: 0,
    //     items: [],
    //
    //     // Required.
    //     getItemAtIndex: function(index) {
    //         if (index > this.numLoaded_) {
    //             this.fetchMoreItems_(index);
    //             return null;
    //         }
    //
    //         return this.items[index];
    //     },
    //
    //     // Required.
    //     // For infinite scroll behavior, we always return a slightly higher
    //     // number than the previously loaded items.
    //     getLength: function() {
    //         return this.numLoaded_ + 5;
    //     },
    //
    //     fetchMoreItems_: function(index) {
    //         // For demo purposes, we simulate loading more items with a timed
    //         // promise. In real code, this function would likely contain an
    //         // $http request.
    //
    //         if (this.toLoad_ < index) {
    //             this.toLoad_ += 20;
    //
    //             // hashtagSrvc.get().then(function(hashtags) {
    //             //     this.numLoaded_ = this.toLoad_;
    //             //
    //             //     dialogVm.hashtagList = hashtags;
    //             // });
    //             hashtagSrvc.get().then(angular.bind(this, function (obj) {
    //                 console.log('test', obj);
    //                 this.items = this.items.concat(obj);
    //                 this.numLoaded_ = this.toLoad_;
    //             }));
    //
    //             // $timeout(angular.noop, 300).then(angular.bind(this, function() {
    //             //     this.numLoaded_ = this.toLoad_;
    //             // }));
    //         }
    //     }
    // };
}
