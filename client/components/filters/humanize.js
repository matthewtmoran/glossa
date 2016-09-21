'use strict';

angular.module('glossa')
    .filter('humanizeDoc', humanizeDoc);

function humanizeDoc() {
    return function (doc) {
        if (!doc) return;
        if (doc.type === 'directive') {
            return doc.name.replace(/([A-Z])/g, function ($1) {
                return '-' + $1.toLowerCase();
            });
        }
        return doc.label || doc.name;
    };
}