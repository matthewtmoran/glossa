import templateUrl from './app.html';

export const appComponent = {
  templateUrl,
  controller: class AppComponent {
    constructor($state, RootService) {
      'ngInject';

      // this.authService = AuthService;
      this.rootService = RootService;
      this.$state = $state;
      this.searchText = '';
      // this.user = AuthService.getUser();

      this.currentUser = this.rootService.getUser();
    }
    logout() {
      // return this.authService
      //   .logout()
      //   .then(() => this.$state.go('auth.login'));
    }



    searchSubmit(event) {
      this.searchText = event.searchText;
    }

  },
};
