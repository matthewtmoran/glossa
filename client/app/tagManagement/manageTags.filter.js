'use strict';

angular.module('glossa')
    .filter('tagFilter', function() {

        return function( items, filterOptions) {
            var filtered = [];
            var anyChecked = false;
            for (var key in filterOptions) {
                if (filterOptions.hasOwnProperty(key)) {
                    anyChecked = anyChecked || filterOptions[key];
                }
            }
            if (!anyChecked) return items;

            angular.forEach(items, function (tag) {

                angular.forEach(filterOptions, function (isfiltered, type) {
                    if (isfiltered && type === 'userTags' ) {
                        if (tag.canEdit) {
                            if (filtered.indexOf(tag) < 0) {
                                filtered.push(tag);
                            }
                        }
                    } else if (isfiltered && type === 'usedTags') {
                        if (tag.occurrence > 0) {
                            if (filtered.indexOf(tag) < 0) {
                                filtered.push(tag);
                            }
                        }
                    } else if (isfiltered && type === 'unusedTags') {
                        if (tag.occurrence < 1) {
                            if (filtered.indexOf(tag) < 0) {
                                filtered.push(tag);
                            }
                        }
                    } else if (isfiltered && type === 'systemTags') {
                        if (!tag.canEdit) {
                            if (filtered.indexOf(tag) < 0) {
                                filtered.push(tag);
                            }
                        }
                    }
                });
            });
            return filtered;
        };
});