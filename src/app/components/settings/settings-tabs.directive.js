export class SettingsTabIndex {
  constructor($state) {
    'ngInject';

    this.restrict = 'A';
    this.$state = $state;

  }

  link($scope, $element, $attrs) {

    $scope.$watch($attrs.settingsTabIndex, (newValue, oldValue) => {
      switch (newValue) {
        case 0:
          this.$state.go('project');
          // $location.url("/meta");
          break;
        case 1:
          this.$state.go('media');
          // $location.url("/main.baseline");
          break;
        case 2:
          this.$state.go('sharing');
          // $location.url("/view3");
          break;
        case 3:
          this.$state.go('hashtags');
          // $location.url("/view3");
          break;
        case 4:
          this.$state.go('about');
          // $location.url("/view3");
          break;
      }
    });
  }
}
