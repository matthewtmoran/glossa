export class CorpusService {
  constructor($http, Upload, $stateParams, __user) {
    'ngInject';
    this.$http = $http;
    this.Upload = Upload;
    this.$stateParams = $stateParams;
    //TODO: refractor the use of __user constant
    this.__user = __user;
  }

  //get all md files
  getFiles(corpus) {
    return this.$http.get(`/api/transcription/corpus/${corpus}`)
      .then((response) => {
        return response.data;
      }).catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }

  //update md file
  updateFile(file) {
    console.log('updateFile in corpus.service', file);
    let options = {
      url:`/api/transcription/${file._id}`,
      method: 'PUT'
    };

    return this.uploadReq(file, options)
      .then((data) => {
        return data;
    });
  }

  //remove md file
  removeFile(file) {
    return this.$http.delete(`/api/transcription/${file._id}`)
      .then((response) => {
        return response.data;
      }).catch((response) => {
        console.log('There was an error', response);
        return response.data;
      })
  }

  //TODO: consider moving this to server?
  //create new md file
  createFile(name) {
    let file = {
      displayName: name || 'untitled',
      description: '',
      content: '',
      corpus: this.$stateParams.corpus,
      createdAt: Date.now(),
      createdBy: this.__user._id,
      projectId: this.__user.session.projectId
    };

    return this.$http.post('/api/transcription', file)
      .then((response) => {
        return response.data;
      }).catch((response) => {
        console.log('There was an error', response);
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
      console.log('Error with upload', response);
      return response.data;
    });
  }
}