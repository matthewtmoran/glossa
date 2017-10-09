import templateUrl from './about-sidebar.html';

export const aboutSidebarComponent = {
  bindings: {
    contributers: '<',
    onViewLicense: '&'
  },
  templateUrl,
  controller: class AboutSidebarComponent {
    constructor() {
      'ngInject';

    }

    viewLicense() {
      this.onViewLicense();
    }

  }
};