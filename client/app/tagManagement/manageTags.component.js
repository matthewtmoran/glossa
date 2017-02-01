'use strict';

angular.module('glossa')
    .component('manageTagsComponent', {
        controller: manageTagsCtrl,
        controllerAs: 'tagVm',
        transclude: true,
        templateUrl: 'app/tagManagement/manageTags.html'
    });

function manageTagsCtrl(hashtagSrvc, $mdEditDialog, $scope, dialogSrvc) {
    var tagVm = this;
    var changesMade = false;

    tagVm.hide = function() {
        dialogSrvc.hide();
    };

    tagVm.cancel = function() {
        var returnObj = {
            data: null,
            dataChanged: changesMade,
            event:"cancel"
        };

        return dialogSrvc.cancel(returnObj);
    };

    tagVm.showData = 'alldata';
    tagVm.infiniteItems = [];

    tagVm.$onInit = function() {

        hashtagSrvc.getHashtags().then(function(data) {

            tagVm.infiniteItems = data;

            // data.forEach(function(tag, index) {
            //     hashtagSrvc.findOccurrenceOfTag(tag).then(function(result) {
            //         if (!result) {
            //             tag.occurrence = 0;
            //         } else {
            //             tag.occurrence = result;
            //         }
            //         tagVm.infiniteItems.push(tag);
            //     })
            // });
        });

    };



    tagVm.showAll = showAll;
    tagVm.showDetails = showDetails;
    tagVm.showTagList = showTagList;
    tagVm.editField = editField;
    tagVm.updateTag = updateTag;
    tagVm.removeTag = removeTag;

    tagVm.tableOptions = {
        rowSelection: false,
        multiSelect: true,
        autoSelect: true,
        decapitate: false,
        largeEditDialog: false,
        boundaryLinks: false,
        limitSelect: true,
        pageSelect: true
    };

    tagVm.selected = [];

    tagVm.filterOptions = {
        userTags: true,
        systemTags: true,
        usedTags: true,
        unusedTags: true
    };

    $scope.$watch('tagVm.orederOptions', function() {
        console.log('tagVm.orederOptions change');
    });


    function showAll() {
        tagVm.showData = 'alldata';
    }

    function showDetails(item) {
        tagVm.currentItem = item;
        tagVm.currentItem_OG = angular.copy(item);
        tagVm.showData = 'details';
    }

    function showTagList() {
        tagVm.showData = 'alldata';

        if (!angular.equals(tagVm.currentItem, tagVm.currentItem_OG)) {
            console.log('TODO: need to figure out a way to confirm changes here or something')
        }

    }

    function editField(event, tag, value, field) {
        event.stopPropagation(); // in case autoselect is enabled
        // tagVm.midEdit = true;
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
        if(tagVm.tableOptions.largeEditDialog) {
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
                var index = tagVm.infiniteItems.indexOf(item);
                tagVm.infiniteItems.splice(index, 1);
                changesMade = true;
            }).catch(function(err) {
                console.log('error removing and normalizing', err);
            });

        } else {
            return false;
        }
    }




}