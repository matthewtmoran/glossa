'use strict';

angular.module('glossa')
    .controller('Waveform', Waveform);

function Waveform () {
// function Waveform (attributes, $element) {
//     var audio = this;
//
//     audio.tracks = [];
//     audio.selectedIndex = audio.selectedIndex || 0;
//     audio.currentTrack = null;
//
//     //adds to an audio track
//     audio.addTrack = function (trackScope) {
//         if (audio.tracks.indexOf(trackScope) < 0) {
//             audio.tracks.push(trackScope);
//         }
//
//         if (!audio.currentTrack) {
//             audio.currentTrack = audio.tracks[audio.selectedIndex];
//         }
//     };
//
//     //remove audio track
//     audio.removeTrack = function (trackScope) {
//         var idx = audio.tracks.indexOf(trackScope);
//         if (idx >= 0) {
//             audio.tracks.splice(idx, 1);
//         }
//     };
//
//     audio.playerProperties = {}
//     var nKey;
//     for (var attr in attributes) {
//         if (attr.match(/^player/)) {
//             nKey = attr.replace(/^player([A-Z])/, function (m, $1) {
//                 return $1.toLowerCase();
//             });
//             audio.playerProperties[nKey] = attributes[attr];
//         }
//     }
//
//     var getPlayer = function(){
//         return $element.find('md-wavesurfer-player').controller('mdWavesurferPlayer');
//     };
//     var setAutoPlay = function (forcePlay) {
//         var controller = getPlayer();
//         if (controller && (forcePlay || controller.surfer.isPlaying())) {
//             controller.autoPlay = true;
//         }
//     };
//     audio.setTrack = function (idx, forcePlay) {
//         if (audio.tracks.length > idx) {
//             if (audio.selectedIndex === idx) {
//                 var ctrl = getPlayer();
//                 ctrl.surfer.playPause();
//             } else {
//                 setAutoPlay(forcePlay);
//                 audio.currentTrack = audio.tracks[idx];
//                 audio.selectedIndex = idx;
//             }
//         }
//     };
//
//     audio.extraButtons = [{
//         icon: 'zmdi zmdi-skip-previous',
//         title: 'Previous',
//         action: function ($event) {
//             if (audio.selectedIndex > 0) {
//                 audio.setTrack(audio.selectedIndex - 1);
//             }
//         },
//         class: ''
//     }, {
//         icon: 'zmdi zmdi-skip-next',
//         title: 'Next',
//         action: function ($event) {
//             if (audio.selectedIndex < audio.tracks.length - 1) {
//                 audio.setTrack(audio.selectedIndex + 1);
//             }
//         },
//         class: ''
//     }];


}
