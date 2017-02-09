'use strict';

// var path = require('path');

// TODO: Need to separate the directive and controller
angular.module('glossa')
    .controller('mdWavesurferPlayerController', mdWavesurferPlayerController)
    .directive('backImg', function($timeout){
        return function(scope, element, attrs){
            //element where background image should be attached to
            var waveEl = angular.element(element[0].querySelector('.waveSurferWave'));
            attrs.$observe('backImg', function(value) {

                //fix for windows paths... I'm not sure how this will effect mac/linux
                var pathFix = value.replace(/\\/g, "\\\\");

                if (value) {

                    waveEl.css({
                        'background-image': 'url(http://localhost:9000/' + pathFix + ')',
                        'background-size' : 'cover',
                        'background-position' : 'center center'
                    });

                }

            });
        };
});


function mdWavesurferPlayerController($element, $scope, $attrs, $interval, $mdTheming) {
    var control = this,
        timeInterval;

    control.themeClass = "md-" + $mdTheming.defaultTheme() + "-theme";
    control.isReady = false;
    control.surfer = null;


    $scope.$on('get:timeStamp', function() {
        console.log('get time stamp listener');
        var time = control.surfer.getCurrentTime();


        $scope.$emit('send:timeStamp', time);
    });

    control.toggleMute = toggleMute;

    function toggleMute() {
        console.log('toggleMute');
        if (control.surfer) {
            control.surfer.toggleMute();
            control.isMute = !control.isMute;
        }
    }

    //initiate the wavesurfer
    var initWaveSurfer = function () {
        control.isReady = false;
        control.currentTime = 0;
        if (!control.surfer) {
            control.surfer = Object.create(window.WaveSurfer);
            var options = {
                container: $element[0].querySelector('.waveSurferWave')
            }, defaults = {
                scrollParent: false,
                waveColor: 'violet',
                progressColor: 'purple',
                height: '200'
            };

            control.playerProperties = {};
            var nKey;
            for (var attr in $attrs) {
                if (attr.match(/^player/)) {
                    nKey = attr.replace(/^player([A-Z])/, function (m, $1) {
                        return $1.toLowerCase();
                    });
                    control.playerProperties[nKey] = $attrs[attr];
                }
            }

            options = angular.extend(defaults, $attrs, (control.playerProperties || {}), options);

            control.surfer.init(options);

            control.surfer.on('ready', function () {
                control.isReady = true;
                if (control.autoPlay) {
                    control.surfer.play();
                }

                // angular.element('.waveSurferWave').css('background-image', 'url(' + control.image + ')');

                $scope.$apply();
            });

            //pause event
            control.surfer.on('pause', function () {
                stopInterval();
            });

            //end of sound
            control.surfer.on('finish', function () {
                stopInterval();
            });

            //play event
            control.surfer.on('play', function () {
                startInterval();
            });

        }


        control.title = control.title || control.src.split('/').pop();
        control.surfer.load(control.src);

    };

    var startInterval = function () {
        timeInterval = $interval(function () {
            control.currentTime = control.isReady ? control.surfer.getCurrentTime() : 0;
        }, 1000);
    }, stopInterval = function () {
        $interval.cancel(timeInterval);
    };


    initWaveSurfer();

    $scope.$watch('control.src', function (src1, src2) {
        if (src1 != src2) {
            initWaveSurfer();
        }
    });

    $element.on('$destroy', function () {
        if (control.surfer) {
            control.surfer.destroy();
        }
        stopInterval();
    });

    $scope.$watch(function () {
        var div = $element[0].querySelector('.audioPlayerWrapper');
        return div ? div.offsetWidth : 0;
    }, function (width) {
        if (width < 1) {
            //hidden
            control.surfer.pause();
        }
    });
}