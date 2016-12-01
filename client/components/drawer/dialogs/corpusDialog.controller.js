'use strict';

angular.module('glossa')
    .controller('corpusDialogCtrl', corpusDialogCtrl);

function corpusDialogCtrl($mdDialog, drawerMenu) {
    var dialogVm = this;

    dialogVm.newCorpus = {
        params: {
            corpus: ''
        }
    };


    dialogVm.cancel = cancel;
    dialogVm.hide = hide;
    dialogVm.save = save;

    function cancel() {
        console.log('....')
        $mdDialog.cancel('cancel');
    }
    function hide() {
        $mdDialog.hide('hide');
    }

    function save() {


        drawerMenu.createCorpus(dialogVm.newCorpus).then(function(result) {
            drawerMenu.addCreatedCorpus(result);

            $mdDialog.hide(result);

            dialogVm.newCorpus = {
                name:'',
                params: {
                    corpus: ''
                }
            };
        });

    }

}