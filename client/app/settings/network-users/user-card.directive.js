'use strict';

angular.module('glossa')
    .directive('userCard', userCard);

function userCard() {
    return {
        restrict: 'E',
        templateUrl: 'app/settings/network-users/user-card.html',
        scope: {
            user: '='
        },
        controller: function ($scope) {
            var alphabetColors = ["#5A8770", "#B2B7BB", "#6FA9AB", "#F5AF29", "#0088B9", "#F18636",
                "#D93A37", "#A6B12E", "#5C9BBC", "#F5888D", "#9A89B5", "#407887", "#9A89B5",
                "#5A8770", "#D33F33", "#A2B01F", "#F0B126", "#0087BF", "#F18636", "#0087BF",
                "#B2B7BB", "#72ACAE", "#9C8AB4", "#5A8770", "#EEB424", "#407887"];

            console.log('$scope.user.online', $scope.user.online);

            var colorIndex = Math.floor(($scope.user.name.charCodeAt(0) - 65) % alphabetColors.length);
            $scope.user.color = alphabetColors[colorIndex];
        }
    }
}