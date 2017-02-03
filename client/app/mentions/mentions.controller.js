'use strict';

// .directive('contenteditable', ['$sce', function($sce) {
//     return {
//         restrict: 'A', // only activate on element attribute
//         require: '?ngModel', // get a hold of NgModelController
//         link: function(scope, element, attrs, ngModel) {
//             function read() {
//                 var html = element.html();
//                 // When we clear the content editable the browser leaves a <br> behind
//                 // If strip-br attribute is provided then we strip this out
//                 if (attrs.stripBr && html === '<br>') {
//                     html = '';
//                 }
//                 ngModel.$setViewValue(html);
//             }
//
//             if(!ngModel) return; // do nothing if no ng-model
//
//             // if (!ngModel) {
//             //     return console.log('nothing here')
//             // }
//
//             // Specify how UI should be updated
//             ngModel.$render = function() {
//                 if (ngModel.$viewValue !== element.html()) {
//                     element.html($sce.getTrustedHtml(ngModel.$viewValue || ''));
//                 }
//             };
//
//             // Listen for change events to enable binding
//             element.on('blur keyup change', function(e) {
//                 scope.$apply(read);
//             });
//             read(); // initialize
//         }
//     };
// }])
//     .directive('myeditable', function() {
//         return {
//             restrict: 'A',
//             link: function(scope, element, attrs) {
//
//             }
//         }
//     })

angular.module('glossa')
    .controller('mentionsCtrl', mentionsCtrl);


function mentionsCtrl($q, $timeout, hashtagSrvc, $scope) {
    var mentionsVm = this;

    mentionsVm.typedTerm = 'Hello';

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

    mentionsVm.theTextArea = '';
    mentionsVm.theTextArea2 = '';


    mentionsVm.searchProducts = searchProducts;
    mentionsVm.getProductTextRaw = getProductTextRaw;

    mentionsVm.getPeopleTextRaw = getPeopleTextRaw;
    mentionsVm.searchPeople = searchPeople;

    mentionsVm.getPeopleText = getPeopleText;
    mentionsVm.getProductText = getProductText;

    mentionsVm.searchHashtags = searchHashtags;
    mentionsVm.selectHashtag = selectHashtag;


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
            deferred.resolve('#' + item.title);
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

    function searchHashtags(term) {
        var hashtagList = [];
        if (term.length > 1) {
            return hashtagSrvc.searchHastags(term).then(function (response) {
                angular.forEach(response, function(item) {
                    if (item.tag.toUpperCase().indexOf(term.toUpperCase()) >= 0) {
                        hashtagList.push(item);
                    }
                });
                mentionsVm.hashtags = hashtagList;
                return $q.when(hashtagList);
            });
        } else if(hashtagList.length < 2 && term) {

        } else {
            mentionsVm.hashtags = [];
        }
    }

    function selectHashtag(item) {
        //This is were we will add the tag data to the current notebooks/textfile



        var parent = angular.element('.CodeMirror-line');
        var element = parent.find('span').text() === $scope.typedTerm;
        $(element).text(item.tag || item.label);
        var res = mentionsVm.theTextArea.replace($scope.typedTerm, item.tag || item.label);
        mentionsVm.theTextArea = res;

        return '#' + (item.tag || item.label);

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
        console.log('******************************Called when product selected', item);
        // note item.label is sent when the typedText wasn't found
        return '#' + (item.name || item.label || item.title);
        // return '[~<i>' + (item.name || item.label) + '</i>]';
    };

}