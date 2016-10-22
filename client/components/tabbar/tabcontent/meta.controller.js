// 'use strict';
//
// angular.module('glossa')
//     .controller('metaCrtl', metaCrtl)
//
// function metaCrtl($scope, $timeout, fileSrvc) {
//     var metaVm = this;
//
//     metaVm.hidden = false;
//     metaVm.isOpen = false;
//     metaVm.hover = false;
//
//     // On opening, add a delayed property which shows tooltips after the speed dial has opened
//     // so that they have the proper position; if closing, immediately hide the tooltips
//     $scope.$watch('metaVm.isOpen', isOpenWatch);
//
//
//     metaVm.items = [
//         { name: "Attach Audio", icon: "volume_up", direction: "bottom", accept: '.mp3, .m4a', type: 'audio' },
//         { name: "Attach Image", icon: "add_a_photo", direction: "top", accept: '.jpg, .png, .svg', type: 'image' }
//     ];
//
//     function isOpenWatch(isOpen) {
//         if (isOpen) {
//             $timeout(function() {
//                 $scope.tooltipVisible = metaVm.isOpen;
//             }, 600);
//         } else {
//             $scope.tooltipVisible = metaVm.isOpen;
//         }
//     }
// }
