'use strict';

angular.module('glossa')
    .component('manageTagsComponent', {
        controller: manageTagsCtrl,
        controllerAs: 'vm',
        transclude: true,
        templateUrl: 'app/tagManagement/manageTags.html'
    });

function manageTagsCtrl($scope, nodeSrvc, hashtagSrvc) {
    var vm = this;

    vm.newHashtag = {};

    vm.createHashtag = createHashtag;


    hashtagSrvc.get().then(function(result) {
        vm.hashtagList = result.data;
    });

    function createHashtag() {
        hashtagSrvc.createHashtag(vm.newHashtag).then(function(tag) {
            vm.hashtagList.push(tag);
        });
        vm.newHashtag = {};
    }




}