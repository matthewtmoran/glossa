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

    vm.$onInit = function() {
        console.log('About init');
    };

    vm.contributers = [
        {
            name: 'Matthew Moran',
            title: 'Software Engineer',
            url: 'http:........',
            avatar: ''
        },
        {
            name: 'Chris Jones',
            title: 'Field Linguist',
            url: 'onechrisjones.me',
            avatar: ''
        }
    ];

    vm.softwares = [
        {
            name: 'Angular Material',
            url: 'http://............'
        }
    ]

}