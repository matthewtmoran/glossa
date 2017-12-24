export class CorpusService {
  constructor($http, Upload, $stateParams, __appData, $q, ParseService) {
    'ngInject';
    this.$http = $http;
    this.Upload = Upload;
    this.$stateParams = $stateParams;
    this.__appData = __appData;
    this.$q = $q;
    this.parseService = ParseService;

  }

  //get all md files
  getFiles(corpus) {
    return this.$http.get(`/api/transcription/corpus/${corpus}`)
      .then((response) => {
        return response.data;
      }).catch((response) => {
        return response.data;
      });
  }

  //update md file
  updateFile(file) {
    return this.$q.when(this.parseService.hashtags(file))
      .then((data) => {
        file.hashtags = data;
        let options = {
          url:`/api/transcription/${file._id}`,
          method: 'PUT'
        };
        return this.uploadReq(file, options)
          .then((data) => {
            return data;
        })
    });
  }

  //remove md file
  removeFile(file) {
    return this.$http.delete(`/api/transcription/${file._id}`)
      .then((response) => {
        return response.data;
      }).catch((response) => {
        return response.data;
      })
  }

  //TODO: consider moving this to server?
  //create new md file
  createFile(name) {
    console.log('created file')
    let file = {
      displayName: name || 'untitled',
      description: '',
      content: '',
      corpus: this.$stateParams.corpus,
      createdAt: Date.now(),
      createdBy: this.__appData.initialState.user._id,
      projectId: this.__appData.initialState.project._id
    };




    return this.$http.post('/api/transcription', file)
      .then((response) => {
        return response.data;
      }).catch((response) => {
        return response.data;
      });
  }

  //attach notebooks to object and return
  attachNotebook(file, notebook) {
    file.notebookId = notebook._id;
    return {file: file, notebook: notebook};
  }


  ///////////
  //helpers//
  ///////////


  //ng-upload request
  uploadReq(dataObj, options) {
    let files = [];

    if (dataObj.image) {
      files.push(dataObj.image);
    }

    if (dataObj.audio) {
      files.push(dataObj.audio);
    }

    return this.Upload.upload({
      method: options.method,
      url: options.url,
      data: {
        files: files,
        dataObj: angular.toJson(dataObj)
      },
      arrayKey: '',
      headers: { 'Content-Type': undefined }
    }).then((response) => {
      return response.data;
    }).catch((response) =>{
      return response.data;
    });
  }
}