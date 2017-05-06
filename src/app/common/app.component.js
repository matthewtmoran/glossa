import templateUrl from './app.html';

export const appComponent = {
  binding: {
    allConnections: '<',
  },
  templateUrl,
  controller: class AppComponent {
    constructor($state, RootService, $scope, NotificationService) {
      'ngInject';

      // this.authService = AuthService;
      this.rootService = RootService;
      this.$state = $state;
      this.$scope = $scope;
      this.notificationService = NotificationService;
      // this.user = AuthService.getUser();

      this.currentUser = this.rootService.getUser();

      console.log('this.allConnections', this.allConnections);

      this.$scope.$on('update:connections', this.updateConnections.bind(this));
      this.$scope.$on('update:connection', this.updateConnection.bind(this));

      this.onlineConnections = [];

    }

    $onChanges(changes) {
      console.log('$onChanges in app.component', changes);
      if (changes.allConnections) {
        console.log('changes in allConnections');
        this.allConnections = angular.copy(changes.allConnections.currentValue);
      }
    }


    updateConnection(event, data) {

      this.allConnections.map((connection, index) => {
        if (connection._id === data.connection._id) {
          if (!data.connection.online) {
            this.allConnections.splice(index, 1);
          } else {
            this.allConnections[index] = connection;
          }
        }
      });

      this.onlineConnections.map((connection, index) => {
        if (connection._id === data.connection._id) {
          if (!data.connection.online) {
            this.onlineConnections.splice(index, 1);
          } else {
            this.onlineConnections[index] = connection;
          }
        }
      })

    }


    updateConnections(event, data) {

      this.allConnections.map((existing, index) => {
        if (data.connections.indexOf(existing) < 0) {
          console.log('if the existing is not in the new array - remove it');
          this.allConnections.splice(this.allConnections.indexOf(existing), 1)
        }
      });

      data.connections.forEach((potential) => {
        if(this.allConnections.indexOf(potential) < 0) {
          console.log('this connection does not exist in the allConnections array');
          this.allConnections.push(potential);

          if (potential.following && potential.online) {
            console.log('we are following this connection. ');
            console.log('TODO: notify user connection has come online');
            let msg = `${potential.name} is online.`;
            let delay = 3000;
            this.notificationService.show({
              message: msg,
              hideDelay: delay
            });
          }
        }
      });

      this.allConnections = angular.copy(this.allConnections);

      // this.allConnections.map((existing) => {
      //   data.connections.forEach((potential) => {
      //   })
      // });


      // this.allConnections = data.connections;
      // data.connections.forEach((connection) => {
      //   if (connection.online && this.onlineConnections.indexOf(connection) < 0) {
      //     console.log('connections is online and does not exist in online array');
      //     this.onlineConnections.push(connection);
      //   }
      //   if (!connection.online && this.onlineConnections.indexOf(connection) > -1) {
      //     console.log('connection is offline and exists in connection array');
      //     this.onlineConnections.splice(this.onlineConnections.indexOf(connection), 1);
      //   }
      // });
      //
      // this.onlineConnections.forEach((connection) => {
      //   if (data.connections.indexOf(connection) < 0) {
      //     console.log('connection is no longer online so remove from online array');
      //     this.onlineConnections.splice(this.onlineConnections.indexOf(connection), 1);
      //   }
      // });
    }

    $onInit() {
      this.rootService.getConnections()
        .then((data) => {
          this.allConnections = angular.copy(data);
      });
    }



    searchSubmit(event) {
      this.searchText = event.searchText;
    }

    clearSearch(event) {
      console.log('clearSearch',event);
      this.searchText = angular.copy(event.text);
    }

  },
};
