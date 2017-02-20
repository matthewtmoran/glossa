'use strict';

angular.module('glossa')
    .component('corpusComponent', {
        controller: corpusCtrl,
        controllerAs: 'vm',
        transclude: true,
        templateUrl: 'app/corpus/corpus.component.html',
        bindings: { markdownFiles: '=' } //defined in route resolve
    });

//$socket ...custom socket library implementation...
function corpusCtrl($scope, $state,  $stateParams, CorpusService, NotebookService, $mdToast, socketFactory, AppService, $window) {
    var vm = this;

    // socketFactory.init();
    // AppService.initListeners();

    vm.$onInit = onInit;
    vm.createMDFile = createMDFile;
    vm.deletMDFile = deletMDFile;
    vm.fileSelection = fileSelection;

    //water for tab click events
    $scope.$watch('selectedIndex', selectedIndexWatch);
    //watch for file attachment and update object to be bound
    $scope.$watch('vm.currentFile.notebookId', attachmentWatcher);

    $scope.$on('joined', function(data) {
        console.log("Angular Event Listenettr Joined");
        var pinTo = $scope.getToastPosition();
        var toast = $mdToast.simple()
            .textContent('Socket Heard: joined from corpus.component' + data.socketId)
            .action('Okay')
            .highlightAction(true)
            .highlightClass('md-accent')// Accent is used by default, this just demonstrates the usage.
            .position(pinTo);

        $mdToast.show(toast).then(function(response) {
            if ( response == 'ok' ) {
                alert('You clicked the \'Okay\' action.');
            }
        });
    });

    // $scope.$on('local:server-connection', function() {
    //     var pinTo = $scope.getToastPosition();
    //     var toast = $mdToast.simple()
    //         .textContent('Connection with server complete')
    //         .action('Okay')
    //         .highlightAction(true)
    //         .highlightClass('md-accent')// Accent is used by default, this just demonstrates the usage.
    //         .position(pinTo);
    //
    //     $mdToast.show(toast);
    // });


    //custom socket library implementation begin
    // $socket.on('echo', function(data) {
    //     console.log('echo client listener', data);
    //
    //     var pinTo = $scope.getToastPosition();
    //     var toast = $mdToast.simple()
    //         .textContent('echo client listener' + data.message)
    //         .action('Okay')
    //         .highlightAction(true)
    //         .highlightClass('md-accent')// Accent is used by default, this just demonstrates the usage.
    //         .position(pinTo);
    //
    //     $mdToast.show(toast).then(function(response) {
    //         if ( response == 'ok' ) {
    //             alert('You clicked the \'Okay\' action.');
    //         }
    //     });
    //
    //
    // });
    //
    // $socket.emit('echo', {message: 'This is a message!'});
    //custom socket library implementation end


    var last = {
        bottom: false,
        top: true,
        left: false,
        right: true
    };

    // $scope.toastPosition = angular.extend({},last);
    //
    // function sanitizePosition() {
    //     var current = $scope.toastPosition;
    //
    //     if ( current.bottom && last.top ) current.top = false;
    //     if ( current.top && last.bottom ) current.bottom = false;
    //     if ( current.right && last.left ) current.left = false;
    //     if ( current.left && last.right ) current.right = false;
    //
    //     last = angular.extend({},current);
    // }
    // $scope.getToastPosition = function() {
    //     sanitizePosition();
    //
    //     return Object.keys($scope.toastPosition)
    //         .filter(function(pos) { return $scope.toastPosition[pos]; })
    //         .join(' ');
    // };




    // $socket.on('echo', function (data) {
    //     console.log('echo client listener', data);
    // });
    //
    // $scope.emitBasic = function emitBasic() {
    //     $socket.emit('echo', $scope.dataToSend);
    //     $scope.dataToSend = '';
    // };
    //
    // $scope.emitACK = function emitACK() {
    //     $socket.emit('echo-ack', $scope.dataToSend, function (data) {
    //         console.log('echo-ack data', data);
    //         $scope.serverResponseACK = data;
    //     });
    //     $scope.dataToSend = '';
    // };


    //runs on component initialization
    function onInit() {
        console.log('onInit');
        if (!$window.socket) {
        console.log('no $window.socket');
            socketFactory.init()
            AppService.initListeners();
        }

        vm.currentFile = vm.markdownFiles[0];
    }

    //bound to buttons to create new md file
    function createMDFile(name) {

        CorpusService.createFile(name).then(function(data) {
            vm.markdownFiles.push(data);
            vm.currentFile = data;
        });
    }

    //removes deleted file from filelist
    function deletMDFile(file) {
        var index;
         vm.markdownFiles.forEach(function(f, i) {
            if (f._id === file._id) {
                index = i;
                return i;
            }
        });
        vm.markdownFiles.splice(index, 1);
        vm.currentFile = vm.markdownFiles[0];
    }

    //changes the current file
    function fileSelection(file) {
        vm.currentFile = file;
    }

    //tab click events - changes child state
    function selectedIndexWatch(current, old) {
        switch (current) {
            case 0:
                $state.go('corpus.meta');
                // $location.url("/meta");
                break;
            case 1:
                $state.go('corpus.baseline');
                // $location.url("/main.baseline");
                break;
            case 2:
                // $location.url("/view3");
                break;
        }
    }

    //watch for file attachment and update object to be bound
    function attachmentWatcher(newValue, oldValue) {
        if (newValue) {
            NotebookService.findNotebook(newValue)
                .then(function(data) {
                    vm.notebookAttachment = data;
                })
        } else {
            vm.notebookAttachment = null;
        }
    }

}