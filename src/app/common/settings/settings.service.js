export class SettingsService {
  constructor($http, $window,) {
    'ngInject';

    this.$http = $http;
    this.$window = $window;

  }

  getProject() {
    return this.$http.get('/api/project/')
      .then((response) => {
        return response.data[0];
      })
      .catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }

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

  getFileNameFromHttpResponse(httpResponse) {
    let contentDispositionHeader = httpResponse.headers('Content-Disposition');
    let result = contentDispositionHeader.split(';')[1].trim().split('=')[1];
    return result.replace(/"/g, '');
  }


}