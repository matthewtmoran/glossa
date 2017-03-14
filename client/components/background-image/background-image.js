'use strict';

angular.module('glossa')
    .directive('backgroundImage', backgroundImage);

function backgroundImage( __rootUrl) {

    return function(scope, element, attrs) {

        //element where background image should be attached to
        attrs.$observe('backgroundImage', function (value) {
            console.log('value', value);

            //fix for windows paths... I'm not sure how this will effect mac/linux
            // TODO: find univeral way to fix path vs regex....
            var pathFix = value.replace(/\\/g, "\\\\");

            element.css({
                'background-image': 'url(' + __rootUrl + pathFix + ')',
                'background-size': 'cover',
                'background-position': 'center center',
                'height': '100%'
            });

        });
    }
}