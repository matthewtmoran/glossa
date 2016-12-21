angular.module('simplemde', [])
    .directive('simplemde', [
    '$parse', '$timeout', 'simpleParse', '$q', 'hashtagSrvc', function ($parse, $timeout, simpleParse, $q, hashtagSrvc) {
        return {
            restrict: 'A',
            require: 'ngModel',
            controller: ['$scope', function ($scope, hashtagSrvc, $q) {
                return {
                    get: function () {
                        return $scope.simplemde.instance;
                    },
                    rerenderPreview: function (val) {
                        return $scope.simplemde.rerenderPreview(val);
                    }
                };
            }],
            link: function (scope, element, attrs, ngModel) {
                // scope.parentScope = scope;
                var hashReg = new RegExp("(^|\s)(#[a-z\d-]+)", "i");
                var hashtagList = [];
                var options, rerenderPreview;
                options = $parse(attrs.simplemde)(scope) || {};
                options.element = element[0];
                var mde = new SimpleMDE(options);
                //This is the actual instance that we can use to call
                var cm = mde.myCodeMirror;
                //this is the specific instance - much more limited
                var editor = mde.codemirror;


               //Get all tags an map each one to have the required field 'text'
               getAllTags().then(function(result) {
                   if (!result.success) {
                       return console.log(result);
                   }
                   hashtagList = result.data.map(function(tag) {
                       tag.displayText = tag.tag;
                       tag.text = tag.tag;
                       return tag;
                   });
                });

                mde.codemirror.on('change', function (instance, object) {
                    scope.$applyAsync(function () {
                        ngModel.$setViewValue(mde.value());
                    });

                    showHashtagHints(instance, object);


                });


                function showHashtagHints(instance, object) {
                    var cursor = instance.getCursor();
                    var currentLine = instance.getLine(cursor.line);
                    var start = cursor.ch;
                    var end = start;
                    while (end < currentLine.length && /[\w#]+/.test(currentLine.charAt(end))) ++end;
                    while (start && /[\w#]+/.test(currentLine.charAt(start - 1))) --start;
                    var curWord = start != end && currentLine.slice(start, end);

                    //if it's a hashtag this gets called
                    if (hashReg.test(curWord))  {
                        //I'm binding the list here and passing it to codemirror
                        instance.list = hashtagList;
                        //calls this custom function that's defined in codemirror.  Definitley need that option otherwise we will end up in an endless loop
                        cm.showHint(instance, cm.hint.customList, {"completeSingle" : false, 'closeOnUnfocus': false})
                    }
                }



                //just a gets all the tags and return promise.
                function getAllTags() {
                   return hashtagSrvc.get().then(function(result) {
                       return result
                    });
                }

                ngModel.$render = function () {
                    var val = ngModel.$modelValue || options["default"];
                    mde.value(val);
                    if (mde.isPreviewActive()) {
                        rerenderPreview(val);
                    }
                };
                rerenderPreview = function (val) {
                };


                scope.simplemde = {
                    instance: mde,
                    rerenderPreview: rerenderPreview
                };
            }
        };
    }
]);
