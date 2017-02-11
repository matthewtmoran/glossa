angular.module('glossa')
    .component('helpComponent', {
        controller: helpCtrl,
        controllerAs: 'vm',
        transclude: true,
        templateUrl: 'app/help/help.component.html'
    });

function helpCtrl() {
    var vm = this;

    $onInit = function() {
        console.log('help init');
    }

}