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

// function userCard() {



    // return {
    //     restrict: 'E',
    //     templateUrl: 'app/settings/network-users/user-card.html',
    //     scope: {
    //         user: '='
    //     },
    //     controller: userCardController,
    //     controllerAs: 'vm',
    //     bindToController: true,
    //     link: userCardLink
    // };

    function userCardController(AppService, socketFactory, __user) {
        var vm = this;

        var alphabetColors = ["#5A8770", "#B2B7BB", "#6FA9AB", "#F5AF29", "#0088B9", "#F18636",
            "#D93A37", "#A6B12E", "#5C9BBC", "#F5888D", "#9A89B5", "#407887", "#9A89B5",
            "#5A8770", "#D33F33", "#A2B01F", "#F0B126", "#0087BF", "#F18636", "#0087BF",
            "#B2B7BB", "#72ACAE", "#9C8AB4", "#5A8770", "#EEB424", "#407887"];
        var colorIndex = Math.floor((vm.user.name.charCodeAt(0) - 65) % alphabetColors.length);


        vm.user.color = alphabetColors[colorIndex];

        console.log('vm.user', vm.user);

        vm.toggleFollow = toggleFollow;


        function toggleFollow(following) {
            vm.user.following = following;

            __user.connections.forEach(function(connection, index) {
                if (connection._id === vm.user._id) {
                    console.log('__user.connections', __user.connections);
                    // __user.connections[index] = vm.user;
                    console.log('__user.connections - after', __user.connections);

                    socketFactory.emit('update:userConnections', angular.toJson(__user.connections));
                }
            })


        }
    }

    function userCardLink(scope, element, attrs) {

    }
// }

// 'use strict';
//
// angular.module('glossa')
//     .directive('userCard', userCard);
//
// function userCard() {
//     return {
//         restrict: 'E',
//         templateUrl: 'app/settings/network-users/user-card.html',
//         scope: {
//             user: '='
//         },
//         controller: userCardController,
//         controllerAs: 'vm',
//         bindToController: true,
//         link: userCardLink
//     };
//
//     function userCardController() {
//         var vm = this;
//
//         var alphabetColors = ["#5A8770", "#B2B7BB", "#6FA9AB", "#F5AF29", "#0088B9", "#F18636",
//             "#D93A37", "#A6B12E", "#5C9BBC", "#F5888D", "#9A89B5", "#407887", "#9A89B5",
//             "#5A8770", "#D33F33", "#A2B01F", "#F0B126", "#0087BF", "#F18636", "#0087BF",
//             "#B2B7BB", "#72ACAE", "#9C8AB4", "#5A8770", "#EEB424", "#407887"];
//         var colorIndex = Math.floor((vm.user.name.charCodeAt(0) - 65) % alphabetColors.length);
//
//
//         vm.user.color = alphabetColors[colorIndex];
//
//         console.log('vm.user', vm.user);
//     }
//
//     function userCardLink(scope, element, attrs) {
//         scope.toggleSharing = toggleSharing;
//
//
//         function toggleSharing(isSharing) {
//             scope.user.isSharing = isSharing;
//         }
//     }
// }