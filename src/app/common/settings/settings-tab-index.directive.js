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
          break;
        case 1:
          this.$state.go('media');
          break;
        case 2:
          this.$state.go('sharing');
          break;
        case 3:
          this.$state.go('hashtags');
          break;
        case 4:
          this.$state.go('about');
          break;
      }
    });
  }
}
