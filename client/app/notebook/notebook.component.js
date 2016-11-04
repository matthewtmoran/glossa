'use strict';

angular.module('glossa')
    .component('notebookComponent', {
        controller: notebookCtrl,
        controllerAs: 'nbVm',
        transclude: true,
        templateUrl: 'app/notebook/notebook.html'
    });

/*

{
    name: String,
        description: String,
    image: {
    name: String,
        path: String,
        description: String,
},
    audio: {
        name: String,
            path: String,
            description: String,
    },
    createdBy: String,
        createdAt: Date,
    isAttached: Boolean,
    attachedToId: String
}

*/

function notebookCtrl() {
    var nbVm = this;


    nbVm.message = 'hello world';


    nbVm.items = [
        { name: "Audio", icon: "volume_up", direction: "top", accept: '.mp3, .m4a', type: 'audio' },
        { name: "Image", icon: "add_a_photo", direction: "top", accept: '.jpg, .png, .svg', type: 'image' }
    ];




}