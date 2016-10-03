'use strict';

angular.module('glossa')
    .controller('mdWavesurferPlayerController', mdWavesurferPlayerController);


function mdWavesurferPlayerController($element, $scope, $attrs, $interval, $mdTheming) {
    var control = this,
        timeInterval;

    control.themeClass = "md-" + $mdTheming.defaultTheme() + "-theme";
    control.isReady = false;
    control.surfer = null;

    control.toggleMute = toggleMute;

    function toggleMute() {
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
                progressColor: 'purple'
            };

            options = angular.extend(defaults, $attrs, (control.properties || {}), options);
            control.surfer.init(options);

            control.surfer.on('ready', function () {
                control.isReady = true;
                if (control.autoPlay) {
                    control.surfer.play();
                }
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
};