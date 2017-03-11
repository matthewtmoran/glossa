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

function MediaComponent(AppService) {
    var vm = this;

    vm.defaultSettings = {
        waveColor: 'black',
        skipLength: 2
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

        vm.settings.waveColor = settings.waveColor;
        vm.settings.skipLength = settings.skipLength;

        AppService.saveSettings(vm.settings).then(function(data) {
            vm.settings = data.settings;
        })
    }

    function restoreDefaults() {
        console.log('TODO: restoreDefaults');
    }

}