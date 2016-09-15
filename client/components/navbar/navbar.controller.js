'use strict';

angular.module('glossa')
    .controller('NavbarCtrl', NavbarCtrl);

function NavbarCtrl($mdDialog, $scope, $mdSidenav) {
    var navVm = this;

    navVm.showSearch = false;
    navVm.execute = execute;
    navVm.concordance = concordance;
    navVm.DictionaryBase = DictionaryBase;
    navVm.PersistentWordPatterns = PersistentWordPatterns;
    navVm.settings = settings;
    navVm.about = about;
    navVm.dropDownMenu = [
        {
            action: 'concordance',
            title: 'Concordance'
        },
        {
            action: 'DictionaryBase',
            title: 'Dictionary'
        },
        {
            action: 'PersistentWordPatterns',
            title: 'Word Patterns'
        },
        {
            action: 'settings',
            title: 'Settings'
        },
        {
            action: 'about',
            title: 'About Corpus'
        }
    ];

    navVm.toggleLeft = buildToggler('left');
    navVm.toggleRight = buildToggler('right');

    function buildToggler(componentId) {
        return function() {
            $mdSidenav(componentId).toggle();
        }
    }

    var originatorEv;
    navVm.openMenu = function($mdOpenMenu, ev) {
        originatorEv = ev;
        $mdOpenMenu(ev);
    };


    //Calls dynamic function
    function execute(action) {
        navVm[action]();
    }

    function concordance() {
        console.log('concordance');
    }
    function DictionaryBase() {
        console.log('DictionaryBase');
    }
    function PersistentWordPatterns() {
        console.log('PersistentWordPatterns');
    }
    function settings() {
        console.log('settings');
    }
    function about() {
        console.log('about');
    }
}

