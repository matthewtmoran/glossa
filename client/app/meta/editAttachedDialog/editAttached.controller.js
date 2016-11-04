'use strict';

angular.module('glossa')
    .controller('editAttached', editAttached);

function editAttached($mdDialog, currentFile, attachment, attachedType, fileSrvc) {
    var edVm = this;


    edVm.currentFile = currentFile;
    edVm.attachment = attachment;
    edVm.attachedType = attachedType;
    edVm.attachedPath = '../uploads/' + edVm.attachedType + '/' + edVm.attachment.name;

    edVm.save = save;

    function save() {

    }

    edVm.hide = function() {
        $mdDialog.hide();
    };

    edVm.cancel = function() {
        $mdDialog.cancel();
    };

    edVm.answer = function(answer) {
        $mdDialog.hide(answer);
    };
}