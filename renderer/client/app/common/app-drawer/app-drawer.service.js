export class DrawerService {
  constructor(RootService) {
    'ngInject';
    this.rootService = RootService;
    this.section = [
      {
        name: 'Notebooks',
        type: 'link',
        state: 'notebook',
        // pages: [
        //   {
        //     name: 'My Notebook',
        //     type: 'link',
        //     state: 'notebook',
        //     icon: 'fa fa-group'
        //   },
        //   {
        //     name: '@matthewtmoran',
        //     state: 'munchies.bananachips',
        //     type: 'link',
        //     icon: 'fa fa-map-marker',
        //     disabled: true
        //   },
        //   {
        //     name: '@justin_rees',
        //     state: 'munchies.donuts',
        //     type: 'link',
        //     icon: 'fa fa-map-marker',
        //     disabled: true
        //   }
        // ],
        orderNum: 0
      },
      {
        name: 'Corpora',
        type: 'link',
        state: 'meta'
        // pages: [
        //   {
        //     name: 'Corpus',
        //     type: 'link',
        //     state: 'corpus',
        //     params: {
        //       user: 'Moran',
        //       corpus: 'default'
        //     },
        //     settings: [
        //       {
        //         name: 'Sub Option1',
        //         type: ''
        //       },
        //       {
        //         name: 'Sub Option2',
        //         type: ''
        //       },
        //       {
        //         name: 'Sub Option3',
        //         type: ''
        //       }
        //     ]
        //   }
        // ],
        // settings: [
        //   {
        //     name: 'View All',
        //     type: ''
        //   },
        //   {
        //     name: 'Add Corpus',
        //     type: '',
        //     action: 'corpusDialog'
        //   },
        //   {
        //     // THIS OPTION BELONGS ON A CHILD ELEMENT... BUT IT IS HERE TO GIVE AN IDEA.
        //     name: 'Duplicate',
        //     type: '',
        //     disabled: true
        //   },
        //   {
        //     name: 'Bulk-Edit Word Forms',
        //     type: '',
        //     disabled: true
        //   },
        //   {
        //     name: 'Phonology Assistant',
        //     type: '',
        //     disabled: true
        //   },
        //   {
        //     name: 'Primer Assistant',
        //     type: '',
        //     disabled: true
        //   },
        //   {
        //     name: 'Export',
        //     type: '',
        //     disabled: true
        //   }
        // ],
        // orderNum: 3
      },
      {
        name: 'Lexicon',
        type: 'toggle',
        disabled: true,
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
        orderNum: 3
      },
      {
        name: 'Grammar',
        type: 'toggle',
        disabled: true,
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
        orderNum: 4
      },
      {
        name: 'Help',
        type: 'heading',
        orderNum: 5,
        disabled: true
      },
      {
        name: 'Glossa Basics',
        type: 'toggle',
        disabled: true,
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
        disabled: true,
        orderNum: 7
      },
      {
        name: 'Phonology Helps',
        type: 'toggle',
        disabled: true,
        orderNum: 8
      },
      {
        name: 'Dev',
        type: 'heading',
        disabled: true,
        orderNum: 9
      },
      {
        name: 'Sandbox States',
        type: 'toggle',
        disabled: true,
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
        orderNum: 12
      },
      {
        name: 'Help',
        type: 'link',
        state:'help',
        disabled: true,
        orderNum: 11
      },
    ];
    this.openedSection;
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