import Mousetrap from 'mousetrap';
//@electron-run
var ipc = window.require('electron').ipcRenderer;
var dialog = window.require('electron').remote.dialog;

export class RootService {
  constructor($http, $rootScope, $state, $window, NotificationService, Upload, cfpLoadingBar, IpcSerivce, __appData, ParseService, $q) {
    'ngInject';

    this.$http = $http;
    this.$rootScope = $rootScope;
    this.$state = $state;
    this.$window = $window;
    this.NotificationService = NotificationService;
    this.upload = Upload;
    this.cfpLoadingBar = cfpLoadingBar;
    this.ipcSerivce = IpcSerivce;
    this.__appData = __appData;
    this.parseService = ParseService;
    this.$q = $q;

    //TODO: move ipc listeners to their own service
    //@electron-run
    ipc.on('navigateToState', this.navigateToState.bind(this));


    ipc.on('reloadCurrentState', this.reloadCurrentState.bind(this));


    //this overwrites events even if input/codemirror/simplemde is focused...
    Mousetrap.prototype.stopCallback = ((e, element, combo) => {

      if (combo ===
        'command+down' ||
        'command+up' ||
        'command+right' ||
        'command+left' ||
        'ctrl+down' ||
        'ctrl+up' ||
        'ctrl+right' ||
        'ctrl+left' ||
        'ctrl+space' ||
        'command+space') {
        console.log('should prevent default');
        // e.preventDefault();
        // return false;
      }

    });
    //focus search bar binding
    Mousetrap.bind(['command+l', 'ctrl+l'], () => {
      angular.element('#main-search').focus();
      // return false to prevent default behavior and stop event from bubbling
      return false
    });
    //create new text file or normal notebook...
    Mousetrap.bind(['command+n', 'ctrl+n'], () => {
      if (this.$state.current.parent.indexOf('corpus') > -1) {
        this.$rootScope.$broadcast('newMarkdown');
      }
      if (this.$state.current.name.indexOf('notebook') > -1) {
        this.$rootScope.$broadcast('newNotebook', 'normal');
      }
      return false
    });
    Mousetrap.bind(['ctrl+right'], () => {
      this.$rootScope.$broadcast('scrubRight');
      // return false
    });
    Mousetrap.bind(['ctrl+left'], () => {
      this.$rootScope.$broadcast('scrubLeft');
      // return false
    });
    Mousetrap.bind(['command+t', 'ctrl+t'], () => {
      this.$rootScope.$broadcast('addTimeStamp');
      return false
    });
    Mousetrap.bind(['command+up'], () => {
      this.$rootScope.$broadcast('adjustPlaySpeedUp');
      return false
    });
    Mousetrap.bind(['command+down'], () => {
      this.$rootScope.$broadcast('adjustPlaySpeedDown');
      return false
    });
    Mousetrap.bind(['command+space', 'ctrl+space'], () => {
      this.$rootScope.$broadcast('playPause');
      return false
    });
    Mousetrap.bind(['command+1', 'ctrl+1'], () => {
      this.$state.go('corpus');
      return false
    });
    Mousetrap.bind(['command+2', 'ctrl+2'], () => {
      this.$state.go('notebook');
      return false
    });
  }


  //electron event
  ipcImportProject(event, message) {
    console.log('ipcImportProject');
    return new Promise((resolve, reject) => {
      console.log('test1');
      let options = {
        filters: [{name: 'Glossa File (.glossa)', extensions: ['glossa']}]
      };

      return dialog.showOpenDialog(options, (selectedFiles) => {
        console.log('showOpenDialog');
          if (selectedFiles) {
            console.log('file was selected');
            this.$http.post('/api/project/import', {projectPath: selectedFiles[0]})
              .then((response) => {
                console.log('response was success');
                this.$window.location.reload();
                resolve(response);
              })
              .catch((err) => {

                console.log('There was an error', err);
                this.$window.location.reload();
                reject(err);
              });
          } else {
            console.log('no file selected');
            resolve('Nothing selected');
          }
        }
      );
    });
  }

  navigateToState(event, data) {
    this.$state.go(data.state, {});
  }

  reloadCurrentState(event) {
    this.$state.reload('app');
  }

  //should only be called on stateChange and on every state change....
  updateSession(session) {
    return this.$http.put(`/api/user/${this.__appData.initialState.user._id}/session`, session)
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      })
  }


  //CORE

  //get user object (settings is also extracted from this data)
  getUser() {
    return this.$http.get('/api/user/')
      .then((response) => {
        console.log("User data received");
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }

  updateUser() {

  }

  getConnections() {
    return this.$http.get('/api/connections/')
      .then((response) => {
        console.log("connection data received");
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }

  getHashtags() {
    return this.$http.get('/api/hashtags/')
      .then((response) => {
        console.log("Hashtag data received");
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }

  createHashtag(text) {
    return this.$http.post('/api/hashtags/', {tag: text})
      .then((response) => {
        console.log("Hashtag data received");
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }

  deleteHashtag() {

  }

  updateHashtag() {

  }


  getCommonHashtags() {
    return this.$http.get('/api/hashtags/common/123')
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }

  ////////////
  //settings//
  ////////////

  //get project data
  getProject() {
    return this.$http.get('/api/project/')
      .then((response) => {
        console.log("Project data received");
        return response.data[0];
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }
  //update project
  updateProject(project) {
    return this.$http.put(`/api/project/${project._id}`, project)
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }
  //get initial settings object
  getSettings() {
    return this.$http.get('/api/settings/')
      .then((response) => {
        return response.data[0];
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }
  //update settings
  updateSettings(settings, user) {
    return this.$http.put(`/api/settings/${user._id}`, settings)
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      })
  }
  //exports all project data as .glossa file (zip)
  exportProject(project) {
    return this.$http.post(`/api/project/${project.createdBy}/${project._id}/export`, {}, {
      responseType: "arraybuffer",
      cache: false,
      headers: {
        'Content-Type': 'application/zip; charset=utf-8',
        'Accept': 'application/zip'
      }
    })
      .then((response) => {
        let blob = new Blob([response.data], {type: 'application/zip'});
        let fileName = this.getFileNameFromHttpResponse(response);
        let url = this.$window.URL.createObjectURL(blob);
        let downloadLink = angular.element('<a></a>');

        downloadLink.attr('href', url);
        downloadLink.attr('download', fileName);
        downloadLink[0].click();

        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }
  //toggle sharing called when toggled
  toggleSharing(isSharing) {
    this.ipcSerivce.send('toggle:sharing', {isSharing: isSharing})
  }


  //////////
  //corpus//
  //////////

  //get initial transcription array
  getTranscriptions() {
    return this.$http.get('/api/transcription/')
      .then((response) => {
        console.log("transcription data received");
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }
  //create new transcription
  createTranscription(event, user, project, corpus) {
    let file = {
      displayName: event && event.name ? event.name : 'untitled',
      description: '',
      content: '',
      corpus: corpus,
      createdAt: Date.now(),
      createdBy: user._id,
      projectId: project._id
    };

    return this.$http.post(`/api/transcription/`, file)
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      })
  }
  //delete transcription
  deleteTranscription(id) {
    return this.$http.delete(`/api/transcription/${id}`,)
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      })
  }
  //update transcription
  updateTranscription(file, hashtags) {
    return new Promise((resolve, reject) => {
      const options = {
        url:`/api/transcription/${file._id}`,
        method: 'PUT'
      };
      let tagsInText = this.parseService.findHashtagsInText(file.description);
      let hashtagPromises = [];


      if (!file.hashtags) {
        file.hashtags = [];
      }

      file.hashtags = file.hashtags.filter((t, index) => {
        if (t) {
          if (tagsInText.indexOf(t.tag) > -1) {
            return t;
          }
        }
      });

      //remove tags that are used from tags found in text
      tagsInText = tagsInText.filter((tag) => {
        let exists = false;
        file.hashtags.forEach((t) => {
          if (t.tag === tag)  {
            exists = true;
          }
        });
        if (!exists) {
          return tag;
        }
      });

      //if their are tags in text that need object
      if (tagsInText.length > 0) {
        tagsInText.forEach((tag) => {
          let isCreated = false;
          //check if hashtag exists
          hashtags.forEach((hashtag) => {
            if (tag.toLowerCase() === hashtag.tag.toLowerCase()) {
              isCreated = true;
              file.hashtags.push = hashtag;
            }
          });
          //if it doesn't exit, create a new tag
          if (!isCreated) {
            hashtagPromises.push(this.createHashtag(tag));
          }
        })
      }

      if (hashtagPromises.length > 0) {
        //once the new tag promise resolves
        Promise.all(hashtagPromises)
          .then((newTags) => {
            //add to notebook hashtags list
            file.hashtags = [...file.hashtags, ...newTags];

            //make post request through ng-upload
            return this.uploadReq(file, options)
              .then((data) => {
                console.log('Data returned from ng-upload File creation', data);
                //sends ipc event to server
                //TODO: change this to emit from server automatically if the user is sharing.
                resolve({transcription: data, hashtags:newTags})
              })
              .catch((err) => {
                reject(err);
              })
          })
          .catch((err) => {
            console.log('There was an error creating new hashtags', err);
          });
      } else {
        return this.uploadReq(file, options)
          .then((data) => {
            //sends ipc event to server
            //TODO: change this to emit from server automatically if the user is sharing.
            this.broadcastUpdates(data);
            this.cfpLoadingBar.complete();
            resolve({transcription: data})
          })
          .catch((err) => {
            reject(err);
          })
      }




    })
  }


  //get all notebooks
  getNotebooks() {
    return this.$http.get('/api/notebooks/')
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }

  //create new notebook
  createNotebook(notebook, user, projectId, hashtags) {
    return new Promise((resolve, reject) => {
      const options = {
        url:'/api/notebooks/',
        method: 'POST'
      };
      let hashtagPromises = [];
      notebook.createdBy = {
        _id: user._id,
        avatar: user.avatar || null,
        name: user.name
      };
      notebook.projectId = projectId;
      notebook.name = this.parseService.title(notebook);
      if (!notebook.hashtags) {
        notebook.hashtags = [];
      }
      let tagsInText = this.parseService.findHashtagsInText(notebook.description);

      tagsInText.forEach((tag, index) => {
        let isCreated = false;
        hashtags.forEach((hashtag) => {
          if (tag.toLowerCase() === hashtag.tag.toLowerCase()) {
            isCreated = true;
            notebook.hashtags.push = hashtag;
          }
        });
        if (!isCreated) {
          hashtagPromises.push(this.createHashtag(tag));
        }
      });


      if (hashtagPromises.length > 0) {
        Promise.all(hashtagPromises)
          .then((newTags) => {
            notebook.hashtags = [...notebook.hashtags, ...newTags];

            //make post request through ng-upload
            return this.uploadReq(notebook, options)
              .then((data) => {
                //sends ipc event to server
                //TODO: change this to emit from server automatically if the user is sharing.
                resolve({notebook: data, hashtags:newTags})
              })
              .catch((err) => {
                reject(err);
              })

          })
          .catch((err) => {
            console.log('There was an error createing new hashtags', err);
          });
      } else {
        return this.uploadReq(notebook, options)
          .then((data) => {
            console.log('Data returned from ng-upload Notebook creation', data);
            //sends ipc event to server
            //TODO: change this to emit from server automatically if the user is sharing.
            resolve({notebook: data})
          })
          .catch((err) => {
            reject(err);
          })
      }
    });
  }
  /**
   * Updates an existing notebooks
   * @param notebook
   * @param hashtags
   * @returns {*}
   */
  updateNotebook(notebook, hashtags) {
    return new Promise((resolve, reject) => {
      const options = {
        url:`/api/notebooks/${notebook._id}`,
        method: 'PUT'
      };
      //parse name of notebooks in case it was changed...
      notebook.name = this.parseService.title(notebook);
      let hashtagPromises = [];
      //get tags from text
      let tagsInText = this.parseService.findHashtagsInText(notebook.description);
      //remove tags that are not used
      notebook.hashtags = notebook.hashtags.filter((t, index) => {
        if (t) {
          if (tagsInText.indexOf(t.tag) > -1) {
          return t;
          }
        }
      });

      //remove tags that are used from tags found in text
      tagsInText = tagsInText.filter((tag) => {
        let exists = false;
        notebook.hashtags.forEach((t) => {
          if (t.tag === tag)  {
            exists = true;
          }
        });
        if (!exists) {
          return tag;
        }
      });

      //if their are tags in text that need object
      if (tagsInText.length > 0) {
        tagsInText.forEach((tag) => {
          let isCreated = false;
          //check if hashtag exists
          hashtags.forEach((hashtag) => {
            if (tag.toLowerCase() === hashtag.tag.toLowerCase()) {
              isCreated = true;
              notebook.hashtags.push = hashtag;
            }
          });
          //if it doesn't exit, create a new tag
          if (!isCreated) {
            hashtagPromises.push(this.createHashtag(tag));
          }
        })
      }

      if (hashtagPromises.length > 0) {
        //once the new tag promise resolves
        Promise.all(hashtagPromises)
          .then((newTags) => {
            //add to notebook hashtags list
            notebook.hashtags = [...notebook.hashtags, ...newTags];

            //make post request through ng-upload
            return this.uploadReq(notebook, options)
              .then((data) => {
                console.log('Data returned from ng-upload Notebook creation', data);
                //sends ipc event to server
                //TODO: change this to emit from server automatically if the user is sharing.
                resolve({notebook: data, hashtags:newTags})
              })
              .catch((err) => {
                reject(err);
              })
          })
          .catch((err) => {
            console.log('There was an error creating new hashtags', err);
          });
      } else {
        return this.uploadReq(notebook, options)
          .then((data) => {
            //sends ipc event to server
            //TODO: change this to emit from server automatically if the user is sharing.
            resolve({notebook: data})
          })
          .catch((err) => {
            reject(err);
          })
      }
    })
  }
  //delete notebook
  deleteNotebook(notebook) {
    return this.$http.delete(`/api/notebooks/${notebook._id}`)
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return false;
      })
  }






  getUserIpc() {
    console.log('getUserIpc');
    this.ipcSerivce.send('get:user', (data) => {
      console.log('get:userIpc callback', data);
        return data;
      }
    )
  }






  ////////////
  //SETTINGS//
  ////////////

  //update settings
  //TODO: refractor to updateSettings()
  saveSettings(settings) {
    return this.$http.put(`/api/settings/${this.__appData.initialState.user._id}`, settings)
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });

  }
  //upload avatar image
  uploadAvatar(file) {
    return new Promise((resolve, reject) => {
      this.upload.upload({
        url: 'api/user/avatar',
        data: {files: file},
        arrayKey: '',
        headers: {'Content-Type': undefined}
      })
        .then((response) => {
        resolve(response.data);
      })
        .catch((err) => {
        console.log('Error: ',err);
        reject(err)
      });
    });


  }
  //remove avatar image
  removeAvatar(file, user) {
    return this.$http.put(`/api/user/${user._id}/avatar`, {filePath: file.absolutePath})
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }
  //this api updates the user AND normalizes notebooks.
  updateUserInfo(user) {
    return this.$http.put(`/api/user/${user._id}/`, user)
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      })
  }


  //TODO: Refractor
  toggleFollow(user) {
    user.following = !user.following;
    return this.$http.post('/api/connections/', angular.toJson(user))
      .then((response) => {
        console.log('response is success', response.data);
        return response.data;
      })
      .catch((err) => {
        console.log('There was an error following user:', err);
      });

    // this.ipcSerivce.send('update:following', {user:  angular.toJson(user)})
    //we convert to json so we don't deal with angualar's hashing system
  }



  updateUserInfoIpc(user) {
    // this.ipcSerivce
  }


  ////////////
  //hashtags//
  ////////////

  updateTag(tag) {
    return this.$http.put(`/api/hashtags/${tag._id}/`, tag)
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      })
  }

  removeTag(tag) {
    return this.$http.post(`/api/hashtags/remove/${tag._id}`)
      .then((response) => {
        return response.data
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      })
  }


  //tunnels event to broadcast across application
  tunnelEvent(name, data) {
    this.$rootScope.$broadcast(name, data);
  }







  //TODO: refractor
  //broadcast updates to users that follow
  broadcastUpdates(data) {
    this.ipcSerivce.send('broadcast:Updates', data);
  }



  ///////////
  //helpers//
  ///////////

  //get the name of file created by server; used by project export
  getFileNameFromHttpResponse(httpResponse) {
    let contentDispositionHeader = httpResponse.headers('Content-Disposition');
    let result = contentDispositionHeader.split(';')[1].trim().split('=')[1];
    return result.replace(/"/g, '');
  }

  //ng-upload request
  uploadReq(dataObj, options) {
    let files = [];

    if (dataObj.image) {
      files.push(dataObj.image);
    }

    if (dataObj.audio) {
      files.push(dataObj.audio);
    }

    return this.upload.upload({
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
    }).catch((response) => {
      console.log('Error with upload', response);
      return response.data;
    });
  }

}
