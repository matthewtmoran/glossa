'use strict';

angular.module('glossa')
    .controller('mentionsCtrl', mentionsCtrl)
    .directive('contenteditable', ['$sce', function($sce) {
    return {
        restrict: 'A', // only activate on element attribute
        require: '?ngModel', // get a hold of NgModelController
        link: function(scope, element, attrs, ngModel) {
            function read() {
                var html = element.html();
                // When we clear the content editable the browser leaves a <br> behind
                // If strip-br attribute is provided then we strip this out
                if (attrs.stripBr && html === '<br>') {
                    html = '';
                }
                ngModel.$setViewValue(html);
            }

            if(!ngModel) return; // do nothing if no ng-model

            // Specify how UI should be updated
            ngModel.$render = function() {
                if (ngModel.$viewValue !== element.html()) {
                    element.html($sce.getTrustedHtml(ngModel.$viewValue || ''));
                }
            };

            // Listen for change events to enable binding
            element.on('blur keyup change', function() {
                scope.$apply(read);
            });
            read(); // initialize
        }
    };
}]);

function mentionsCtrl($q, $timeout) {
    var mentionsVm = this;

    console.log('init');

    mentionsVm.peopleList = [
        {name: 'Matt'},
        {name: 'Chris'},
        {name: 'Justin'}
    ];

    mentionsVm.productList = [
        {title: 'Coke'},
        {title: 'Pepsi'},
        {title: 'Beer'}
    ];

    mentionsVm.theTextArea = 'Type an # and some text';
    mentionsVm.theTextArea2 = 'Type an @';

    mentionsVm.searchProducts = searchProducts;
    mentionsVm.getProductTextRaw = getProductTextRaw;

    mentionsVm.getPeopleTextRaw = getPeopleTextRaw;
    mentionsVm.searchPeople = searchPeople;

    mentionsVm.getPeopleText = getPeopleText;
    mentionsVm.getProductText = getProductText;



    function searchProducts(term) {
        var prodList = [];

        angular.forEach(mentionsVm.productList, function(item) {
            if (item.title.toUpperCase().indexOf(term.toUpperCase()) >= 0) {
                prodList.push(item);
            }
        });
        mentionsVm.products = prodList;
        // return $q.when(prodList);
    }
    function getProductTextRaw(item) {
        console.log('product create', item);
        var deferred = $q.defer();
        /* the select() function can also return a Promise which ment.io will handle
         propertly during replacement */
        // simulated async promise
        $timeout(function() {
            deferred.resolve('#' + item.sku);
        }, 500);
        return deferred.promise;
    }

    function searchPeople(term) {
        var peopleList = [];

        angular.forEach(mentionsVm.peopleList, function(item) {
            if (item.name.toUpperCase().indexOf(term.toUpperCase()) >= 0) {
                peopleList.push(item);
            }
        });

        mentionsVm.people = peopleList;

        // return $http.get('peopledata.json').then(function (response) {
        //     angular.forEach(response.data, function(item) {
        //         if (item.name.toUpperCase().indexOf(term.toUpperCase()) >= 0) {
        //             peopleList.push(item);
        //         }
        //     });
        //     $scope.people = peopleList;
        //     return $q.when(peopleList);
        // });
    }
    function getPeopleTextRaw(item) {
        console.log('people create', item);
        return '@' + item.name;
    };


    function getPeopleText(item) {
        // note item.label is sent when the typedText wasn't found
        return '[~<i>' + (item.name || item.label) + '</i>]';
    };


    function getProductText(item) {
        console.log('Called when product selected', item);
        // note item.label is sent when the typedText wasn't found
        return '<span class="highlight">#' + (item.name || item.label || item.title) + '</span>';
        // return '[~<i>' + (item.name || item.label) + '</i>]';
    };

}