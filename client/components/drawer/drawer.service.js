'use strict';

var db = require('../db/database'),
    fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    corporaMenus = db.corporaMenu;

angular.module('glossa')
    .factory('drawerMenu', drawerMenu);

function drawerMenu() {

    var section = [
        {
            name: 'Test Heading',
            type: 'heading',
            orderNum: 0
        },
        {
            name: 'Corpora',
            type: 'toggle',
            pages: [
                {
                    name: 'Corpus',
                    type: 'link',
                    state: 'corpus',
                    params: {
                        user: 'Moran',
                        corpus: 'default'
                    },
                        // corpus: {
                        //     _id: '0001',
                        //     name: 'default'
                        // }
                    settings: [
                        {
                            name: 'Sub Option1',
                            type: ''
                        },
                        {
                            name: 'Sub Option2',
                            type: ''
                        },
                        {
                            name: 'Sub Option3',
                            type: ''
                        }
                    ]
                },
                {
                    name: 'His New Corpus',
                    type: 'link',
                    state: 'beers.ipas',
                    icon: 'fa fa-group'
                },
                {
                    name: 'Phonetics',
                    state: 'home.toollist',
                    type: 'link',
                    icon: 'fa fa-map-marker'
                },
                {
                    name: 'Literacy Stories',
                    state: 'home.createTool',
                    type: 'link',
                    icon: 'fa fa-plus'
                }
            ],
            settings: [
                {
                    name: 'Add Corpus',
                    type: ''
                },
                {
                  // THIS OPTION BELONGS ON A CHILD ELEMENT... BUT IT IS HERE TO GIVE AN IDEA.
                    name: 'Duplicate',
                    type: ''
                }, 
                {
                    name: 'Bulk-Edit Word Forms',
                    type: ''
                },
                {
                    name: 'Phonology Assistant',
                    type: ''
                },
                {
                    name: 'Primer Assistant',
                    type: ''
                },
                {
                    name: 'Export',
                    type: ''
                }
            ],
            orderNum: 1
        },
        {
            name: 'Lexicon',
            type: 'toggle',
            pages: [
                {
                    name: 'View / Edit',
                    type: 'link',
                    state: 'beers.ipas',
                    icon: 'fa fa-group'
                },
                {
                    name: 'Concordance',
                    state: 'home.toollist',
                    type: 'link',
                    icon: 'fa fa-map-marker'
                }
            ],
            settings: [
                {
                    name: 'Export Dictionary',
                    type: ''
                },
                {
                    name: 'Export Lexicon',
                    type: ''
                },
                {
                    name: 'Export Concordance',
                    type: ''
                }
            ],
            orderNum: 2
        },
        {
            name: 'Grammar',
            type: 'toggle',
            pages: [
                {
                    name: 'Affix Templates',
                    type: 'link',
                    state: 'beers.ipas',
                    icon: 'fa fa-group'
                },
                {
                    name: 'Categories',
                    state: 'home.toollist',
                    type: 'link',
                    icon: 'fa fa-map-marker'
                },
                {
                    name: 'Rules and Features',
                    state: 'home.createTool',
                    type: 'link',
                    icon: 'fa fa-plus'
                }
            ],
            orderNum: 3
        },
        {
            name: 'Notebooks',
            type: 'toggle',
            pages: [
                {
                    name: 'My Notebook',
                    type: 'link',
                    state: 'notebook',
                    icon: 'fa fa-group'
                },
                {
                    name: '@matthewtmoran',
                    state: 'munchies.bananachips',
                    type: 'link',
                    icon: 'fa fa-map-marker'
                },
                {
                    name: '@justin_rees',
                    state: 'munchies.donuts',
                    type: 'link',
                    icon: 'fa fa-map-marker'
                }
            ],
            orderNum: 4
        },
        {
            name: 'Help',
            type: 'heading',
            orderNum: 5
        },
        {
            name: 'Glossa Basics',
            type: 'toggle',
            pages: [
                {
                    name: 'Glossa Basics sub item 1',
                    type: 'link',
                    state: 'munchies.cheetos',
                    icon: 'fa fa-group'
                },
                {
                    name: 'Glossa Basics sub item 2',
                    state: 'munchies.bananachips',
                    type: 'link',
                    icon: 'fa fa-map-marker'
                },
                {
                    name: 'Glossa Basics sub item 3',
                    state: 'munchies.donuts',
                    type: 'link',
                    icon: 'fa fa-map-marker'
                }
            ],
            orderNum: 6

        },
        {
            name: 'Grammatical Helps',
            type: 'toggle',
            orderNum: 7
        },
        {
            name: 'Phonology Helps',
            type: 'toggle',
            orderNum: 8
        },
        {
            name: 'Dev',
            type: 'heading',
            orderNum: 9
        },
        {
            name: 'Sandbox States',
            type: 'toggle',
            pages: [
                {
                    name:'wavesurfer sandbox',
                    type: 'link',
                    state: 'wavesurfer'
                },
                {
                    name:'Mentions',
                    type: 'link',
                    state: 'mentions'
                },
                {
                    name: 'home',
                    type: 'link',
                    state: 'main.meta'
                }
            ],
            orderNum: 10
        }
    ];

    activate();

    function activate() {
        addCustomItems();
    }

    function addCustomItems() {
        section.forEach(function(sec) {
            if (sec.name === 'Corpora') {
                console.log('found corpora')
                return queryCorporaMenus().forEach(function(item) {
                    console.log('item', item);
                    sec.pages.push(item);
                    console.log('sec', sec);
                });
            }
        });
    }

    function queryCorporaMenus() {

        var items = [
            {
                name: 'Static 1',
                type: 'link',
                state: 'corpus',
                params: {
                    user: 'Moran',
                    corpus: 'static 1'
                }
            },
            {
                name: 'Static 2',
                type: 'link',
                state: 'corpus',
                params: {
                    user: 'Moran',
                    corpus: 'static 2'
                }
            },
            {
                name: 'Static 2',
                type: 'link',
                state: 'corpus',
                params: {
                    user: 'Moran',
                    corpus: 'static 2'
                }
            }
        ];
        return items;

        // return dbSrvc.find(corporaMenus, {}).then(function(docs) {
        //     return docs;
        // })
    }

    var service = {
        section: section,
        toggleSelectSection: toggleSelectSection,
        isSectionSelected: isSectionSelected,
        toggleSettingsSection: toggleSettingsSection,
        isSectionSettingsSelected: isSectionSettingsSelected
    };

    return service;
    ///////////////

    function toggleSelectSection(section) {
        service.openedSection = (service.openedSection === section ? null : section);
    };
    function isSectionSelected(section) {
        return service.openedSection === section;
    };

    function toggleSettingsSection(section) {
        service.openSetting = (service.openSetting === section ? null : section);
    }
    function isSectionSettingsSelected(section) {
        return service.openSetting === section;
    }
}