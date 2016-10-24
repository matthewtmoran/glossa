angular.module('glossa')
    .controller('tabCtrl', function($scope, $location, $log, $state) {
        var tabVm = this;

        $scope.selectedIndex = 0;

        $scope.$watch('selectedIndex', function (current, old) {
            switch (current) {
                case 0:
                    $state.go('main.meta');
                    // $location.url("/meta");
                    break;
                case 1:
                    $state.go('main.baseline');
                    // $location.url("/main.baseline");
                    break;
                case 2:
                    // $location.url("/view3");
                    break;
            }
        });
    });