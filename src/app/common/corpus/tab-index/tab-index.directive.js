export class SelectTabIndex {
  constructor($timeout, $state) {
    'ngInject';

    this.restrict = 'A';
    this.$state = $state;

  }

  link($scope, $element, $attrs) {

    $scope.$watch($attrs.selectTabIndex, (newValue, oldValue) => {
      switch (newValue) {
        case 0:
          this.$state.go('meta');
          // $location.url("/meta");
          break;
        case 1:
          this.$state.go('baseline');
          // $location.url("/main.baseline");
          break;
        case 2:
          // $location.url("/view3");
          break;
      }
    });
  }
}
