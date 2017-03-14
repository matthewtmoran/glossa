'use strict';

angular.module('glossa')
    .component('userCard', {
        controller: userCardController,
        controllerAs: 'vm',
        templateUrl: 'app/settings/network-users/user-card.html',
        bindings: {
            user: '='
        }
    });


function userCardController(AppService, socketFactory, __user) {
    var vm = this;

    var alphabetColors = ["#5A8770", "#B2B7BB", "#6FA9AB", "#F5AF29", "#0088B9", "#F18636",
        "#D93A37", "#A6B12E", "#5C9BBC", "#F5888D", "#9A89B5", "#407887", "#9A89B5",
        "#5A8770", "#D33F33", "#A2B01F", "#F0B126", "#0087BF", "#F18636", "#0087BF",
        "#B2B7BB", "#72ACAE", "#9C8AB4", "#5A8770", "#EEB424", "#407887"];
    var colorIndex = Math.floor((vm.user.name.charCodeAt(0) - 65) % alphabetColors.length);

    console.log('vm.user', vm.user);

    vm.user.color = alphabetColors[colorIndex];


    vm.toggleFollow = toggleFollow;


    function toggleFollow(user) {
        console.log('user', user);
        vm.user.following = !vm.user.following;
        AppService.updateConnection(user);
    }
}

