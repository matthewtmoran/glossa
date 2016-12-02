'use strict';

angular.module('glossa')
    .controller('manageTagsCtrl', manageTagsCtrl);

function manageTagsCtrl(dialogSrvc, hashtagSrvc) {
    var dialogVm = this;



    dialogVm.hide = function() {
        dialogSrvc.hide();
    };

    dialogVm.cancel = function() {
        return dialogSrvc.cancel('Manage Dialog cancel');
    };


    hashtagSrvc.get().then(function(result) {
        dialogVm.infiniteItems = result;
    });

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
