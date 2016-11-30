'use strict';

angular.module('glossa')
    .controller('newPostCtrl', newPostCtrl);

function newPostCtrl($mdDialog, hashtagSrvc, simplemdeOptions, postSrvc, currentNotebook, $scope, $q) {
    var newPostVm = this;

    newPostVm.cancel = cancel;
    newPostVm.hide = hide;
    newPostVm.save = save;
    newPostVm.currentPost = '';
    newPostVm.editorOptions = simplemdeOptions;

    newPostVm.searchHashtags = searchHashtags;
    newPostVm.selectHashtag = selectHashtag;

    newPostVm.currentNotebook = currentNotebook;
    newPostVm.potentialTags = newPostVm.currentNotebook.hashtags || [];

    function cancel() {
        $mdDialog.cancel('cancel');
    }
    function hide() {
        $mdDialog.hide('hide');
    }

    function save() {

        //search the description and compare to potential tags
        //remove potential tag if it does not exist in the text
        //

        newPostVm.potentialTags.forEach(function(tag) {
            if (currentNotebook.description.indexOf(tag.tag) > -1) {
                if (!currentNotebook.hashtags) {
                    currentNotebook.hashtags = [];
                }
                delete tag.$$hashKey;
                currentNotebook.hashtags.push(tag);
            }
        });

        postSrvc.save[currentNotebook.postType](currentNotebook).then(function(result) {
            newPostVm.currentNotebook = {
                media: {}
            };
            $mdDialog.hide(result);
        });

    }


    function searchHashtags(term) {
        var hashtagList = [];
        if (term.length > 1) {
            return hashtagSrvc.searchHastags(term).then(function (response) {
                angular.forEach(response, function(item) {
                    if (item.tag.toUpperCase().indexOf(term.toUpperCase()) >= 0) {
                        hashtagList.push(item);
                    }
                });
                newPostVm.hashtags = hashtagList;
                return $q.when(hashtagList);
            });
        } else if(hashtagList.length < 2 && term) {

        } else {
            newPostVm.hashtags = [];
        }
    }
    function selectHashtag(item) {
        //This is were we will add the tag data to the current notebook/textfile

        if (item.label) {
            console.log('TODO: verify that this tag does not exist');
            console.log('TODO: Save tag to db');
        } else {
            newPostVm.potentialTags.push(item);
            var parent = angular.element('.CodeMirror-line');
            var element = parent.find('span').text() === $scope.typedTerm;
            $(element).text(item.tag || item.label);
            var res = newPostVm.currentNotebook.description.replace($scope.typedTerm, item.tag || item.label);
            newPostVm.currentNotebook.description = res;
        }




        return '#' + (item.tag || item.label);

    }



}