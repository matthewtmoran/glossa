'use strict';

angular.module('glossa')
    .controller('manageTagsCtrl', manageTagsCtrl);

function manageTagsCtrl(dialogSrvc, hashtagSrvc, $mdEditDialog, $mdDialog, $q) {
    var dialogVm = this;
    var changesMade = false;

    dialogVm.hide = function() {
        dialogSrvc.hide();
    };

    dialogVm.cancel = function() {
        var returnObj = {
            data: null,
            dataChanged: changesMade,
            event:"cancel"
        };

        return dialogSrvc.cancel(returnObj);
    };

    dialogVm.showData = 'alldata';

    // hashtagSrvc.query().then(function(result) {
    //     result.data.forEach(function(tag, index) {
    //         hashtagSrvc.findOccurrenceOfTag(tag).then(function(result) {
    //             if (!result) {
    //                 tag[index].occurrence = 0;
    //             } else {
    //                 tag[index].occurrence = result;
    //             }
    //         })
    //     });
    //     dialogVm.infiniteItems = result.data;
    //
    //
    // });


    dialogVm.showAll = showAll;
    dialogVm.showDetails = showDetails;
    dialogVm.showTagList = showTagList;
    dialogVm.editField = editField;
    dialogVm.updateTag = updateTag;
    dialogVm.removeTag = removeTag;

    dialogVm.tableOptions = {
        rowSelection: false,
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

    function editField(event, tag, value, field) {
        event.stopPropagation(); // in case autoselect is enabled
        // dialogVm.midEdit = true;
        //
        var editDialog = {
            modelValue: value,
            placeholder: 'Edit ' + field,
            save: function (input) {
                tag[field] = input.$modelValue;
                updateTag(tag);
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

    function updateTag(item) {
        hashtagSrvc.update(item).then(function(result) {
            hashtagSrvc.normalizeHashtag(result.data).then(function(result) {
                changesMade = true;

            }).catch(function(err) {
                console.log('there was an error',err);
            });
        }).catch(function(err) {
            console.log('there was an error', err)
        });
    }

    function removeTag(event, item) {
        event.stopPropagation();
        var r = confirm("Are you sure you want to remove this tag from the application?");
        if (r == true) {
            hashtagSrvc.removeHashtag(item).then(function(result) {
                var index = dialogVm.infiniteItems.indexOf(item);
                dialogVm.infiniteItems.splice(index, 1);
                changesMade = true;
            }).catch(function(err) {
                console.log('error removing and normalizing', err);
            });

        } else {
            return false;
        }
    }
}
