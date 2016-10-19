'use strict';

angular.module('glossa')
    .controller('metaCrtl', metaCrtl);

function metaCrtl($scope, $timeout, fileSrvc) {
    var metaVm = this;

    metaVm.hidden = false;
    metaVm.isOpen = false;
    metaVm.hover = false;

    metaVm.attachFile = attachFile;

    // On opening, add a delayed property which shows tooltips after the speed dial has opened
    // so that they have the proper position; if closing, immediately hide the tooltips
    $scope.$watch('metaVm.isOpen', isOpenWatch);


    metaVm.items = [
        { name: "Attach Audio", icon: "volume_up", direction: "bottom", accept: '.mp3, .m4a', type: 'audio' },
        { name: "Attach Image", icon: "add_a_photo", direction: "top", accept: '.jpg, .png, .svg', type: 'image' }
    ];

    function attachFile(item) {
        var input = angular.element('#attachFileInput');
        input.attr('accept', item.accept);
        input.click();
        input.on('change', function (e) {
            var file = e.target.files[0];
            fileSrvc.attachAudioFile(file);
        });
    }

    function isOpenWatch(isOpen) {
        if (isOpen) {
            $timeout(function() {
                $scope.tooltipVisible = metaVm.isOpen;
            }, 600);
        } else {
            $scope.tooltipVisible = metaVm.isOpen;
        }
    }

}