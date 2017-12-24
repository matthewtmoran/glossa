import SimpleMDE from 'simplemde';

export class NotebookService {
  constructor($http, $q, ParseService, Upload, RootService) {
    'ngInject';
    this.$http = $http;
    this.$q = $q;
    this.parseService = ParseService;
    this.upload = Upload;
    this.rootService = RootService;

    this.test = this.test.bind(this);

    this.simplemdeToolbar = [
      {
        name: "italic",
        action: SimpleMDE.toggleItalic,
        className: "md-icon-button toolbar-icon md-button md-ink-ripple",
        iconClass: 'format_italic',
        title: "Italic",
      },
      {
        name: "bold",
        action: SimpleMDE.toggleBold,
        className: "md-icon-button toolbar-icon md-button md-ink-ripple",
        iconClass: "format_bold",
        title: "Bold",
      },
      {
        name: "header",
        action: SimpleMDE.toggleHeading1,
        className: "md-icon-button toolbar-icon md-button md-ink-ripple",
        iconClass: "title",
        title: "Header",
      },
      "|", // Separator
      {
        name: "Blockquote",
        action: SimpleMDE.toggleBlockquote,
        className: "md-icon-button toolbar-icon md-button md-ink-ripple",
        iconClass: "format_quote",
        title: "Blockquote",
      },
      {
        name: "Bullet List",
        action: SimpleMDE.toggleUnorderedList,
        className: "md-icon-button toolbar-icon md-button md-ink-ripple",
        iconClass: "format_list_bulleted",
        title: "Bullet List",
      },
      {
        name: "Ordered List",
        action: SimpleMDE.toggleOrderedList,
        className: "md-icon-button toolbar-icon md-button md-ink-ripple",
        iconClass: 'format_list_numbered',
        title: "Numbered List",
      },
      "|",
      {
        name: "Toggle Preview",
        action: SimpleMDE.togglePreview,
        className: "md-icon-button toolbar-icon md-button md-ink-ripple",
        iconClass: 'visibility',
        title: "Toggle Preview",
      },
      {
        name: "Help",
        action: this.test,
        className: "md-icon-button toolbar-icon md-button md-ink-ripple",
        iconClass:'help',
        title: "Toggle Preview",
      }
    ];

  }

  /**
   * Queries all the notebooks and returns results
   */
  getNotebooks() {
    return this.$http.get('/api/notebooks')
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        return response.data;
      });
  }

  /**
   * Finds specific notebooks
   * @param nbId
   * @returns {*}
   */
  findNotebook(nbId) {
    return this.$http.get(`/api/notebooks/${nbId}`)
      .then((response) => {
        return response.data;
      })
      .catch((response) => {
        return false;
      });
  }
  /**
   * Saves a new notebooks
   * @param notebook
   * @returns {*}
   */

  createNotebook(notebook) {
    notebook.name = this.parseService.title(notebook);
    return this.$q.when(this.parseService.hashtags(notebook))
      .then((data) => {
        notebook.hashtags = data;
        let options = {
          url:'/api/notebooks/',
          method: 'POST'
        };
        return this.uploadReq(notebook, options)
          .then((data) => {
          this.rootService.broadcastUpdates(data);
          return data
        })
      });
    }

  /**
   * Updates an existing notebooks
   * @param notebook
   * @returns {*}
   */
  updateNotebook(notebook) {
    //parse name of notebooks in case it was changed...
    notebook.name = this.parseService.title(notebook);

    //parse hashtags in description
    return this.$q.when(this.parseService.hashtags(notebook))
      .then((data) => {
        notebook.hashtags = data;
        let options = {
          url:`/api/notebooks/${notebook._id}`,
          method: 'PUT'
        };
        return this.uploadReq(notebook, options)
          .then((data) => {
            this.rootService.broadcastUpdates(data);
            return data;
          })
      });
    }

  deleteNotebook(notebook) {
   return this.$http.delete(`/api/notebooks/${notebook._id}`)
      .then((response) => {
        if (response.status === 204) {
          return true;
        }
      })
      .catch((response) => {
        return false;
      })
  }

    //////////
    //helper//
    //////////


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
        return response.data;
      });
    }

    postOptions(event) {
      let options = {
        simplemde: {},
        template: '',
      };

      switch(event.notebook.postType) {
        case 'image':
          options.template = NotebookImageTemplate;
          options.simplemde = {
            toolbar: false,
            status: false,
            spellChecker: false,
            autoDownloadFontAwesome: false,
            // forceSync: true,
            placeholder: 'Image caption...',
          };
          break;
        case 'audio':
          options.template = 'app/notebooks/notebook-dialog/notebook-dialog-audio.controller.html';
          options.simplemde = {
            toolbar: false,
            status: false,
            spellChecker: false,
            autoDownloadFontAwesome: false,
            // forceSync: true,
            placeholder: 'Audio caption...'
          };
          break;
        case 'normal':
          // options.template = 'app/notebooks/notebook-dialog/notebook-dialog.controller.html';
          options.template = NotebookNormalTemplate;
          options.simplemde = {
            toolbar: this.simplemdeToolbar,
            spellChecker: false,
            status: false,
            autoDownloadFontAwesome: false,
            // forceSync: true,
            placeholder: 'Post description...',
          };
          break;
        case 'default':
      }
      return options;
    }

    test(e) {
    }





}