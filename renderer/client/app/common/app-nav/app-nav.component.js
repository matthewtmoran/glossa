import templateUrl from './app-nav.html';

export const navComponent = {
  bindings: {
    searchText: '<',
    onSearchSubmit: '&',
    onCreateTranscription: '&',
    onClearSearch: '&',
    onCreate: '&'
  },
  templateUrl,
  controller: class NavComponent {
    constructor($state, $mdSidenav, $scope, RootService) {
      'ngInject';

      this.$state = $state;
      this.$mdSidenav = $mdSidenav;
      this.$scope = $scope;
      this.rootService = RootService;
    }



    $onInit() {
      this.onlineConnections = [];
    }

    $onChanges(changes) {
      if (changes.searchText) {
        if (!!changes.searchText.currentValue){
          this.searchSubmit();
        }
      }
    }
    toggleDrawer(event) {
      this.$mdSidenav('drawer').toggle();
    }

    searchSubmit() {
      this.onSearchSubmit({
        $event: {
          searchText: this.searchText
        }
      })
    }

    create() {
      if (this.$state.current.parent === 'corpus') {
        this.onCreateTranscription({
          $event: {
            name: this.searchText
          }
        });
      }
        // this.rootService.tunnelEvent('createNamedMarkdown', {name: this.searchText});
      this.onClearSearch({
        $event: {
          text: ''
        }
      });
    }
  }
};
