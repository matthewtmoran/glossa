'use strict';

// var path = require('path');

// TODO: Need to separate the directive and controller
angular.module('glossa')
    .controller('wavesurferPlayerController', WavesurferPlayerController)
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


function WavesurferPlayerController($element, $scope, $attrs, $interval, $mdTheming, SettingsService) {
    var control = this,
        timeInterval;

    control.loading = true;
    control.themeClass = "md-" + $mdTheming.defaultTheme() + "-theme"; //not sure what this affects
    control.isReady = false;
    control.surfer = null;

    control.defaultSettings = { //not sure we need if db is populated.....
        skipForward: 2,
        skipBack: 2,
        waveColor: 'black'
    };

    SettingsService.getSettings().then(function(data) {
        control.mediaSettings = data.media;
        initWaveSurfer();
    });

    var speed = [
        {
            value: 1,
            label: '1.0x'
        },
        {
            value: 0.75,
            label: '0.75x'
        },
        {
            value: 0.5,
            label: '0.5x'
        }
    ];



    control.toggleMute = toggleMute;
    //pause
    control.pause = pause;
    control.adjustPlaySpeed = adjustPlaySpeed;
    control.playbackSpeed = speed[0];

    $scope.$on('get:timeStamp', getTimeStamp);
    $scope.$on('set:timeStamp', setTimestamp);
    //re-init wavesurfer
    $scope.$watch('control.src', resetWaveSurfer);

    $scope.$watch(function () {
        var div = $element[0].querySelector('.audioPlayerWrapper');
        return div ? div.offsetWidth : 0;
    }, function (width) {
        if (width < 1) {
            //hidden
            control.pause();
        }
    });

    $element.on('$destroy', function () {
        if (control.surfer) {
            control.surfer.destroy();
        }
        stopInterval();
    });


    var startInterval = function () {
        timeInterval = $interval(function () {
            control.currentTime = control.isReady ? control.surfer.getCurrentTime() : 0;
        }, 1000);
    }, stopInterval = function () {
        $interval.cancel(timeInterval);
    };

    //initiate the wavesurfer
    function initWaveSurfer() {
        control.isReady = false;
        control.currentTime = 0;
        if (!control.surfer) {
            control.surfer = Object.create(window.WaveSurfer);
            var options = {
                container: $element[0].querySelector('.waveSurferWave')
            }, defaults = {
                skipLength: control.mediaSettings.skipLength,
                scrollParent: false,
                waveColor: control.mediaSettings.waveColor,
                progressColor: 'purple',
                height: '200'
            };

            options = angular.extend(defaults, $attrs, (control.playerProperties || {}), options);
            control.playerProperties = {};
            control.surfer.init(options);

            control.surfer.on('loading', function(progress) {
                control.wavesurferProgress = progress;
                $scope.$apply();
            });

            control.surfer.on('ready', function () {
                control.loading = false;
                control.isReady = true;
                if (control.autoPlay) {
                    control.surfer.play();
                }
                $scope.$apply();
            });

            var nKey;
            for (var attr in $attrs) {
                if (attr.match(/^player/)) {
                    nKey = attr.replace(/^player([A-Z])/, function (m, $1) {
                        return $1.toLowerCase();
                    });
                    control.playerProperties[nKey] = $attrs[attr];
                }
            }
        }

        //play event listener
        control.surfer.on('play', play);
        //end of sound event listener
        control.surfer.on('finish', finish);

        control.title = control.title || control.src.split('/').pop();
        control.surfer.load(control.src);

    }

    var index = 1;
    function adjustPlaySpeed() {
        control.playbackSpeed = speed[index];
        index = (index+1)%(speed.length);

        control.surfer.setPlaybackRate(control.playbackSpeed.value);

    }

    function pause() {
        if (control.surfer) {
            stopInterval();
        }
    }

    function finish() {
        if (control.surfer) {
            stopInterval();
        }
    }

    function play() {
        if (control.surfer) {
            startInterval();
        }
    }

    function toggleMute() {
        console.log('toggleMute');
        if (control.surfer) {
            control.surfer.toggleMute();
            control.isMute = !control.isMute;
        }
    }

    function resetWaveSurfer(src1, src2){
        if (src1 != src2) {
            initWaveSurfer();
        }
    }

    function getTimeStamp() {
        var timeStamp = control.surfer.getCurrentTime();
        $scope.$emit('send:timeStamp', timeStamp);
    }

    function setTimestamp(event, seconds) {
        control.surfer.seekTo(seconds / control.surfer.getDuration());
    }
}