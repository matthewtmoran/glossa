'use strict';

angular.module('glossa')
    .factory('simpleParse', simpleParse);

function simpleParse() {
    var service = {
        parseTitle: parseTitle
    };
    return service;


    function parseTitle(text) {
       var heading = /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/;

        var m = text.match(heading);

        return m[0] || text.splice(0, 16);
    }


    function passTagData(tag) {
        console.log('tag', tag);
    }

    // function parseTitle(text) {
    //     var re = /(#+)\s(.*)/;
    //     var m = text.match(re);
    //     return m[0] || text.splice(0, 16);
    // }
}