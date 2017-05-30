export class SettingsHashtagsComponent {
  constructor($q, RootService, SocketService, DialogService, cfpLoadingBar, $mdEditDialog, $scope) {
    'ngInject';

    this.$q = $q;
    this.$scope = $scope;
    this.rootService = RootService;
    this.socketService = SocketService;
    this.dialogService = DialogService;
    this.cfpLoadingBar = cfpLoadingBar;
    this.$mdEditDialog = $mdEditDialog;

    console.log('this.$scope', this.$scope);


  }

  $onChanges(changes) {
    console.log('$onChanges in settings-hashtags.component', changes);
    if (changes.hashtags) {
      // this.hashtags = angular.copy(changes.hashtags.currentValue);
    }
  }

  //TODO: find a away to add loading dialog while dom loads data
  toggleFilter(item) {
    this.cfpLoadingBar.start();
    this.cfpLoadingBar.complete();
  }

  $onInit() {

    this.tableOptions = {
      rowSelection: false,
      multiSelect: true,
      autoSelect: true,
      decapitate: false,
      largeEditDialog: false,
      boundaryLinks: false,
      limitSelect: true,
      pageSelect: true
    };

    this.selected = [];

    this.selectedFilters = [];

    this.filterOptions = {
      userTags: true,
      systemTags: false,
      usedTags: false,
      unusedTags: false
    };

  }

  selectedRowCallback(rows) {
    console.log('selectedRowCallback', rows);
  }

  editField(event, tag, value, field) {
    event.stopPropagation(); // in case autoselect is enabled

    let editDialog = {
      modelValue: value,
      placeholder: 'Edit ' + field,
      save: (input) => { //called on enter
        tag[field] = input.$modelValue; // replace thei tag value with update
        this.updateTag(tag); // call updateTag on save
      },
      targetEvent: event,
      title: 'Edit ' + field,
      validators: {}
    };

    let promise;

    //display large or small depending on option
    if (this.tableOptions.largeEditDialog) {
      promise = this.$mdEditDialog.large(editDialog);
    } else {
      promise = this.$mdEditDialog.small(editDialog);
    }

    promise
      .then((ctrl) => {

        let input = ctrl.getInput();

        //we can set custom validators....
        input.$viewChangeListeners.push(() => {
          input.$setValidity('test', input.$modelValue !== 'test');
        });
      });

  }

  updateTag(item) {
    console.log('updateTag', item);
    this.onUpdateTag({
      $event: {
        tag: item
      }
    });
    // HashtagService.update(item).then(function(result) {
    //   HashtagService.normalizeHashtag(result.data).then(function(result) {
    //     changesMade = true;
    //
    //   }).catch(function(err) {
    //     console.log('there was an error',err);
    //   });
    // }).catch(function(err) {
    //   console.log('there was an error', err)
    // });
  }


}