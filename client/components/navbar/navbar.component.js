'use strict';

angular.module('glossa')
    .component('navbarComponent', {
        controller: navbarCtrl,
        controllerAs: 'navVm',
        transclude: true,
        templateUrl: 'components/navbar/navbar.html',
        bindings: {
            searchText: '='
        }
    });

function navbarCtrl($mdSidenav, $scope) {
    var navVm = this;
    var originatorEv;
    navVm.searchText = '';

    navVm.execute = execute;
    navVm.concordance = concordance;
    navVm.DictionaryBase = DictionaryBase;
    navVm.PersistentWordPatterns = PersistentWordPatterns;
    navVm.settings = settings;
    navVm.about = about;
    navVm.openMenu = openMenu;
    navVm.showSearch = false;
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
    navVm.searchText = '';

    navVm.toggleLeft = buildToggler('left');
    navVm.toggleRight = buildToggler('right');

    function buildToggler(componentId) {
        return function() {
            $mdSidenav(componentId).toggle();
        }
    }

    function openMenu($mdOpenMenu, ev) {
        originatorEv = ev;
        $mdOpenMenu(ev);
    }

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