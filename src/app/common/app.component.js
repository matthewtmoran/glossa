import templateUrl from './app.html';

export const appComponent = {
  templateUrl,
  controller: class AppComponent {
    constructor($state) {
      'ngInject';

      // this.authService = AuthService;
      this.$state = $state;
      this.searchText = '';
      // this.user = AuthService.getUser();
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
