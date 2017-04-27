export class DrawerService {
  constructor(RootService) {
    'ngInject';
    this.rootService = RootService;
    this.section = [
      {
        name: 'Project',
        type: 'heading',
        orderNum: 0
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
        orderNum: 2
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
            name: 'View All',
            type: ''
          },
          {
            name: 'Add Corpus',
            type: '',
            action: 'corpusDialog'
          },
          {
            // THIS OPTION BELONGS ON A CHILD ELEMENT... BUT IT IS HERE TO GIVE AN IDEA.
            name: 'Duplicate',
            type: ''
          },
          {
            name: 'Bulk-Edit Word Forms',
            type: '',
            disabled: true
          },
          {
            name: 'Phonology Assistant',
            type: '',
            disabled: true
          },
          {
            name: 'Primer Assistant',
            type: '',
            disabled: true
          },
          {
            name: 'Export',
            type: ''
          }
        ],
        orderNum: 3
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
        orderNum: 4
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
        orderNum: 5
      },
      {
        name: 'Help',
        type: 'heading',
        orderNum: 6
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
        orderNum: 7

      },
      {
        name: 'Grammatical Helps',
        type: 'toggle',
        orderNum: 8
      },
      {
        name: 'Phonology Helps',
        type: 'toggle',
        orderNum: 9
      },
      {
        name: 'Dev',
        type: 'heading',
        orderNum: 10
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
        orderNum: 11
      },
      {
        name: 'Help',
        type: 'link',
        state:'help',
        orderNum: 12
      },
    ];
    this.openedSection;
    this.init();
  }

  init() {
    this.rootService.getProject().then((data) => {
      this.section[0].name = data.name;
    });
    this.addCustomItems();
  }

  addCustomItems() {
    this.section.forEach((sec) => {
      if (sec.name === 'Corpora') {
        this.rootService.getCorporia().then((data) => {
          data.forEach((corpus) => {
            sec.pages.push(corpus);
          });
        });
      }
    });
  }

  toggleSelectSection(section) {
    this.openedSection = (this.openedSection === section ? null : section);
  }

  isSectionSelected(section) {
    return this.openedSection === section;
  }

  toggleSettingsSection(section) {
    this.openSetting = (this.openSetting === section ? null : section);
  }

  isSectionSettingsSelected(section) {
    return this.openSetting === section;
  }



}