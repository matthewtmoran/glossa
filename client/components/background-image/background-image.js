'use strict';

angular.module('glossa')
    .directive('backgroundImage', backgroundImage);

function backgroundImage( __rootUrl, $timeout) {

    return function(scope, element, attrs) {
        var myVal;
        var url = '';
        //element where background image should be attached to
       attrs.$observe('backgroundImage', function (value) {
            myVal = value;
            console.log('value', value);

            if (myVal) {
                if (value.indexOf(__rootUrl) > -1) {
                    url = myVal;
                } else {
                    var pathFix = myVal.replace(/\\/g, "\\\\");
                    url = __rootUrl + pathFix;
                }

                //fix for windows paths... I'm not sure how this will effect mac/linux
                // TODO: find univeral way to fix path vs regex....

                element.css({
                    'background-image': 'url(' + url + ')',
                    'background-size': 'cover',
                    'background-position': 'center center'
                    // 'height': '100%'
                });

            }
        });


        scope.$on('$destroy', function() {
            console.log('$destory......');
            console.log('background-image value 1',element.css('background-image'));
            element.css({
                'background-image': ''
            });
            console.log('background-image value 2',element.css('background-image'));


            // element[0].removeAttr('background-image');
            // // console.log('myVal', myVal);
            // url = null;
            // myVal = 'none';
            // // console.log('myVal', myVal);
            scope.$apply();
        });

    }
}