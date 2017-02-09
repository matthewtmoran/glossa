'use strict';

angular.module('glossa')
    .component('baselineComponent', {
        controller: baselineCtrl,
        controllerAs: 'blVm',
        templateUrl: 'app/baseline/baseline.component.html',
        transclude: true,
        bindings: {
            currentFile: '=',
            notebookAttachment: '=',
            markdownFiles: '='
        },
        require: {
            parent: '^^corpusComponent'
        }
    });
// On enter
//
function baselineCtrl($scope, fileSrvc, $mdDialog, baselineSrvc, notebookSrvc, $timeout) {
    var blVm = this;

    var isDoubleClick = false;
    var singleClick;

    blVm.textContent = '';

    blVm.$onInit = init;
    blVm.codemirrorLoaded = codemirrorLoaded;
    blVm.update = update;
    blVm.getTimeStamp = getTimeStamp;

    $scope.$watch('blVm.currentFile', function(newValue) {
        blVm.audioPath = '';
        blVm.imagePath = '';
        getMediaData(newValue)
    });


    function init() {

        // getMediaData(blVm.currentFile)


    }

    var _doc;


    function codemirrorLoaded(_editor) {
        console.log('_editor', _editor);
        _doc = _editor.getDoc();



        _editor.setOption('lineNumbers', true);

        _editor.setOption('extraKeys', {
            Enter: enterEvent
        });

        _editor.on('keypress', function(instance, event) {
            // console.log('keypress');
        });

        hyperlinkOverlay(_editor);

        function hoverWidgetOnOverlay(cm, overlayClass, widget) {

            cm.addWidget({line:0, ch:0}, widget, true);
            widget.style.position = 'fixed';
            widget.style.zIndex=100000;
            widget.style.top=widget.style.left='-1000px'; // hide it
            widget.dataset.token=null;

            cm.getWrapperElement().addEventListener('mousemove', function(e) {
                var onToken = e.target.classList.contains("cm-"+overlayClass),
                    onWidget = (e.target === widget || widget.contains(e.target));

                if (onToken && e.target.innerText !== widget.dataset.token) { // entered token, show widget
                    var rect = e.target.getBoundingClientRect();
                    widget.style.left=rect.left+'px';
                    widget.style.top=rect.bottom+'px';
                    //let charCoords=cm.charCoords(cm.coordsChar({ left: e.pageX, top:e.pageY }));
                    //widget.style.left=(e.pageX-5)+'px';
                    //widget.style.top=(cm.charCoords(cm.coordsChar({ left: e.pageX, top:e.pageY })).bottom-1)+'px';

                    widget.dataset.token=e.target.innerText;
                    if (typeof widget.onShown==='function') widget.onShown();

                } else if ((e.target===widget || widget.contains(e.target))) { // entered widget, call widget.onEntered
                    if (widget.dataset.entered==='true' && typeof widget.onEntered==='function')  widget.onEntered();
                    widget.dataset.entered='true';

                } else if (!onToken && widget.style.left!=='-1000px') { // we stepped outside
                    widget.style.top=widget.style.left='-1000px'; // hide it
                    delete widget.dataset.token;
                    widget.dataset.entered='false';
                    if (typeof widget.onHidden==='function') widget.onHidden();
                }

                return true;
            });
        }

        function hyperlinkOverlay(cm) {
            if (!cm) return;

            var rx_word = "\" "; // Define what separates a word
            var endTag = ">";
            // var rx_word = "-->\" "; // Define what separates a word


            function isTimeStamp(s) {
                console.log('s', s);
               var comment =  /<!--.*?-->/;
                if (!comment.test(s)) {
                    console.log('returning false');
                    return false;
                } else if (comment.test(s)) {
                    console.log('returning true');
                    return true;
                }
            }


            cm.addOverlay({
                    token: function(stream) {
                        console.log('stream:', stream);
                        var ch = stream.peek();
                        console.log('ch:', ch);
                        var word = "";

                        // console.log('rx_word', rx_word);
                        // console.log('ch', ch);
                        // console.log('rx_word.includes(ch)', rx_word.includes(ch));

                        if (rx_word.includes(ch) || ch==='\uE000' || ch==='\uE001') {
                            stream.next();
                            return null;
                        }

                        // if (endTag.includes(ch)) {
                        //     stream.next();
                        //     return null
                        // }

                        while ((ch = stream.peek()) && !rx_word.includes(ch)) {
                            word += ch;
                            stream.next();
                        }

                        console.log('word:', word);

                        if (isTimeStamp(word)) return "url"; // CSS class: cm-url
                    }},
                { opaque : true }  // opaque will remove any spelling overlay etc
            );

            var widget = document.createElement('button');
            widget.innerHTML = '&rarr;';
            widget.onclick = function(e) {
                if (!widget.dataset.token) return;
                var link=widget.dataset.token;
                if (!(new RegExp('^(?:(?:https?|ftp):\/\/)', 'i')).test(link)) link="http:\/\/"+link;
                window.open(link, '_blank');
                return true;
            };
            hoverWidgetOnOverlay(cm, 'url', widget);
        }


    }



    function enterEvent(cm) {
        var doc = cm.getDoc();
        if(!isDoubleClick) {
            isDoubleClick = true;
            press();
        } else {
            doublePress();
        }
        function press() {
            singleClick = $timeout(function() {
                doc.replaceSelection("\n" ,"end");
                isDoubleClick = false;
            }, 250)
        }

        function doublePress() {
            $timeout.cancel(singleClick);

            $scope.$broadcast('get:timeStamp');


            isDoubleClick = false;
        }
    }

    $scope.$on('send:timeStamp', function(event, data) {
        console.log('send:timestamp listener', data);

        var string = " <!--" + formatTime(data) + "--> ";

        _doc.replaceSelection(  string, 'end');

    });

    function getMediaData(file) {
        if (file.attachment) {
            notebookSrvc.findNotebook(file.attachment.notebookId).then(function(notebook) {
                blVm.audioPath = notebook.audio.path ||'';
                blVm.imagePath = notebook.image.path ||'';
            });
            return;
        }
        if (blVm.currentFile.audio) {
            blVm.audioPath = blVm.currentFile.audio.path || null;
        }

        if (blVm.currentFile.image) {
            blVm.imagePath = blVm.currentFile.image.path || null;
        }
    }


    function getTimeStamp() {
        console.log('get time stamp');
    }


    function getTextContent(file) {
        baselineSrvc.readContent(file, function(result) {
            blVm.textContent = result;
            $scope.$apply();
        });
    }

    function getAudioImagePath() {
        if (blVm.currentFile.audio) {
            blVm.audioPath = path.join(globalPaths.static.trueRoot, blVm.currentFile.audio.path)
        }
        if (blVm.currentFile.image) {
            blVm.imagePath = path.join(globalPaths.static.trueRoot, blVm.currentFile.image.path)
        }
    }



    function update() {
        baselineSrvc.updateContent(blVm.currentFile, blVm.textContent);
    }

   function formatTime (time) {
        var sec_num = parseInt(time, 10); // don't forget the second param
        var hours   = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);

        if (hours   < 10) {hours   = "0"+hours;}
        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}
        return hours+':'+minutes+':'+seconds;
    }
}

