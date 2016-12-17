'use strict';

var db = require('../db/database'),
    fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    corporaMenus = db.corporaMenu;

angular.module('glossa')
    .factory('drawerMenu', drawerMenu);

function drawerMenu(dbSrvc, $mdDialog) {

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
                }
            ],
            settings: [
                {
                    name: 'Add Corpus',
                    type: '',
                    action: corpusDialog
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

    var service = {
        section: section,
        toggleSelectSection: toggleSelectSection,
        isSectionSelected: isSectionSelected,
        toggleSettingsSection: toggleSettingsSection,
        isSectionSettingsSelected: isSectionSettingsSelected,
        createCorpus: createCorpus,
        addCreatedCorpus: addCreatedCorpus
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


    function addCustomItems() {
        section.forEach(function(sec) {
            if (sec.name === 'Corpora') {
                return queryCorporaMenus().then(function(result) {
                    if (!result.success) {
                        return console.log(result);
                    }
                    result.data.forEach(function(item) {
                        sec.pages.push(item);
                    });
                });
            }
        });
    }

    function addCreatedCorpus(corpus) {
        section.forEach(function(sec) {
            if (sec.name === 'Corpora') {
                return sec.pages.push(corpus);
            }
        });
    }

    function queryCorporaMenus() {
        return dbSrvc.find(corporaMenus, {}).then(function(docs) {
            return docs;
        })
    }

    function corpusDialog() {
        $mdDialog.show({
            templateUrl: 'components/drawer/dialogs/corpusDialog.html',
            parent: angular.element(document.body),
            // targetEvent: ev,
            controller: corpusDialogCtrl,
            controllerAs: 'dialogVm',
            bindToController: true,
            clickOutsideToClose: false,
        }).then(function(data) {

            console.log('Dialog is closed. data', data);

            return data;
        }, function(data) {
            return data;
        });
    }

    function createCorpus(corpus) {

        corpus.params.corpus = corpus.name.replace(/\s/g,'').toLowerCase();
        corpus.type = 'link';
        corpus.state = 'corpus';

       return dbSrvc.insert(corporaMenus, corpus).then(function(docs) {
            return docs.data;
        })
    }
}