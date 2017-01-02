'use strict';

angular.module('glossa')
    .factory('simpleSrvc', simpleSrvc);

function simpleSrvc( ) {
    var instance,
    service = {
        getEditor: getEditor,
        setEditor: setEditor,
        refreshEditor: refreshEditor
    };
    return service;


    function getEditor() {
        return instance;
    }
    function setEditor(val) {
        instance = val;
    }

    //there is an issue where content is not displayed within textarea - this refresh called within a timeout 'fixes' that.  https://github.com/NextStepWebs/simplemde-markdown-editor/issues/344
    function refreshEditor() {
        // instance.refresh();
    }

    // function setVal(val) {
    //
    // }

}