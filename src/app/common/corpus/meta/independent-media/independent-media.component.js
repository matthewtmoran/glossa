import templateUrl from './independent-media.html';

export const independentMediaComponent = {
  bindings: {
    file: '<',
    onRemoveMedia: '&'
  },
  templateUrl,
  controller: class IndependentMediaComponent {
    constructor() {
      'ngInject';
    }

    $onChanges(changes) {
      if(changes.file) {
        this.file = angular.copy(changes.file.currentValue);
      }
    }

    $onInit() {
      this.isAudio = this.file.mimetype.indexOf('audio') > -1;
    }

    removeMedia(file) {
      this.onRemoveMedia({
        $event: {
          file: file,
          type: this.isAudio ? 'audio' : 'image'
        }
      })
    }


  }
};