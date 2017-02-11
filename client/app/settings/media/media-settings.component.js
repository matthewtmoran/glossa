'use strict';

angular.module('glossa')
    .component('mediaSettingsComponent', {
        controller: MediaComponent,
        controllerAs: 'vm',
        transclude: true,
        templateUrl: 'app/settings/media/media-settings.component.html',
        bindings: {
            settings: '='
        }
    });

function MediaComponent(SettingsService) {
    var vm = this;

    vm.defaultSettings = {
        waveColor: 'black',
        skipForward: 2,
        skipBack: 2
    };
    vm.waveColorOptions = [
        {
            name: 'Red',
            value: 'red'
        },
        {
            name: 'White',
            value: 'white'
        },
        {
            name: 'Blue',
            value: 'blue'
        },
        {
            name: 'Purple',
            value: 'Purple'
        },
        {
            name: 'Black',
            value: 'black'
        }
    ];

    vm.$onInit = init;
    vm.restoreDefaults = restoreDefaults;
    vm.saveMediaSettings = saveMediaSettings;

    function init() {
        console.log('Media init');
    }

    function saveMediaSettings(settings) {
        SettingsService.saveSettings(settings).then(function(data) {
            vm.settings = data;
        })
    }

    function restoreDefaults() {
        console.log('restoreDefaults');
    }

}