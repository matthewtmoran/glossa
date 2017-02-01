'use strict';

angular.module('glossa')
    .controller('manageCorpusCtrl', manageCorpusCtrl);

function manageCorpusCtrl(dialogSrvc, manageCorpusSrvc, drawerMenu) {
    var dialogVm = this;

    dialogVm.corpus = {};

    dialogVm.newCorpus = {
        params: {
            corpus: ''
        }
    };

    dialogVm.cancel = cancel;
    dialogVm.hide = hide;

    dialogVm.save = save;
    dialogVm.removeCorpus = removeCorpus;

    init();
    function init() {

    }

    function cancel() {
        dialogSrvc.cancel('cancel');
    }
    function hide() {
        dialogSrvc.hide('hide');
    }

    function save(corpus) {

        manageCorpusSrvc.createCorpus(corpus).then(function(data) {

            drawerMenu.addCreatedCorpus(data);

            // dialogVm.newCorpus = {
            //     name:'',
            //     params: {
            //         corpus: ''
            //     }
            // };

            dialogVm.corpus = {};

            dialogSrvc.hide('hide');

        });
    }

    function removeCorpus() {

    }


}