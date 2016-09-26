'use strict';

angular.module('glossa')
    .factory('drawerMenu', drawerMenu);

function drawerMenu() {

    var section = [
        {
            name: 'Beers',
            type: 'toggle',
            pages: [{
                name: 'IPAs',
                type: 'link',
                state: 'beers.ipas',
                icon: 'fa fa-group'
            }, {
                name: 'Porters',
                state: 'home.toollist',
                type: 'link',
                icon: 'fa fa-map-marker'
            },
                {
                    name: 'Wheat',
                    state: 'home.createTool',
                    type: 'link',
                    icon: 'fa fa-plus'
                }
            ]
        },
        {
            name: 'Munchies',
            type: 'toggle',
            pages: [{
                name: 'Cheetos',
                type: 'link',
                state: 'munchies.cheetos',
                icon: 'fa fa-group'
            }, {
                name: 'Banana Chips',
                state: 'munchies.bananachips',
                type: 'link',
                icon: 'fa fa-map-marker'
            },
                {
                    name: 'Donuts',
                    state: 'munchies.donuts',
                    type: 'link',
                    icon: 'fa fa-map-marker'
                }]
        }];

    var service = {
        section: section,
        toggleSelectSection: toggleSelectSection,
        isSectionSelected: isSectionSelected
    };

    return service;
    ///////////////

    function toggleSelectSection(section) {
        service.openedSection = (service.openedSection === section ? null : section);
    };
    function isSectionSelected(section) {
        return service.openedSection === section;
    };

}