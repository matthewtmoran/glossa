angular.module('glossa')
    .component('aboutComponent', {
        controller: About,
        controllerAs: 'vm',
        transclude: true,
        templateUrl: 'app/settings/about/about.component.html'
    });

function About() {
    var vm = this;

    $onInit = function() {
        console.log('About init');
    };
}