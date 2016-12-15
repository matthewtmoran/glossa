angular.module('glossa')
    .directive('hashtagmenu', function($window) {
        return {
            restrict: 'E',
            scope: {
                items: '=items',
                search: '=hashtagSearch',
                parentScope: '=parentScope'
            },
            templateUrl: 'components/hashtagDropDown/hashtagDropdown.html',
            controller: hashtagmenuCtrl,
            link: hashtagmenuLink
        };

        function hashtagmenuCtrl($scope) {
            $scope.visible = false;

            this.activate = $scope.activate = function (item) {
                console.log('activate')
                $scope.activeItem = item;
            };

            $scope.isVisible = isVisible;
            $scope.showMenu = showMenu;

            function isVisible () {
                console.log('isVisible');
                return $scope.visible;
            }
            function showMenu () {
                console.log('showMenu');
                if (!$scope.visible) {
                    $scope.requestVisiblePendingSearch = true;
                }
            }
        }

        function hashtagmenuLink(scope, element, attrs) {
            // scope.menuScope = scope;
            var coordinates;


            console.log('cord', scope.parentScope.simplemde.instance.codemirror.cursorCoords());



            scope.$watch('parentScope.typedTerm', function(val) {
                var chart = angular.element(document.createElement('div'));
                var el = $compile( chart )( scope );

                //where do you want to place the new element?
                angular.element(document.body).append(chart);

                // $scope.insertHere = el;

                coordinates = scope.parentScope.simplemde.instance.codemirror.cursorCoords(null, 'local');
                scope.search(val);
                console.log('chart', chart);
                chart.css({
                    // bottom: coordinates.bottom + 'px',
                    top: coordinates.top + 'px',
                    left: coordinates.left + 'px',
                    position: 'absolute',
                    zIndex: 10000,
                    display: 'block'
                });
            });




            scope.$watch('items', function (items) {
                if (items && items.length > 0) {
                    scope.activate(items[0]);
                    if (!scope.visible && scope.requestVisiblePendingSearch) {
                        scope.visible = true;
                        scope.requestVisiblePendingSearch = false;
                    }
                } else {
                    scope.hideMenu();
                }
            });

            scope.hideMenu = function () {
                scope.visible = false;
            };

        }

    })