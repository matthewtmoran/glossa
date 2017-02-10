'use strict';

angular.module('glossa')
    .component('aboutSettingsComponent', {
        controller: About,
        controllerAs: 'vm',
        transclude: true,
        templateUrl: 'app/settings/about/about-settings.component.html'
    });

function About() {
    var vm = this;

    $onInit = function() {
        console.log('About init');
    };
}