export class ParseService {
  constructor($q, $http) {
    'ngInject';
    this.$q = $q;
    this.$http = $http;
    this.termQuery = this.termQuery.bind(this);
  }
    //get title
  title(notebook) {
    if (notebook.postType === 'normal') {
      notebook.name = this.extractTitle(notebook.description);
    } else if (notebook.postType === 'image') {
      notebook.name = notebook.image.originalname;
    } else if (notebook.postType === 'audio') {
      notebook.name = notebook.audio.originalname;
    }
    return notebook.name;
  }

  findHashtagsInText(text) {
    let tagsFoundInText = this.extractHashtagText(text) || [];
    return tagsFoundInText;
  }


  hashtags(notebook) {
    //get array of tags by regex or empty array
    let tagsFoundInText = this.extractHashtagText(notebook.description) || [];
    //in case we are deleting tags from the text...
    let tagsToRemove = [];

    //if there is note hashtags property yet
    if (!notebook.hashtags) {
      notebook.hashtags = [];
    }

    //search for existing hashtags in the text
    notebook.hashtags.forEach((tag, index) => {
      if (tag && tagsFoundInText.indexOf(tag.tag) < 0) {
        //add to remove array
        tagsToRemove.push(tag);
        //remove from hashtag array
        notebook.hashtags.splice(index, 1);
      }
      //tag must have been found in the text.
    });
    //be unbiased and grab the most up to data for every tag found in the text
    return this.queryForNewTags(tagsFoundInText)
      .then((data) => {
        notebook.hashtags = data;
        return notebook.hashtags;
      });
  }
  

    ///////////
    //helpers//
    ///////////

    //new tags is an array of tags new to this notebooks;
  queryForNewTags(tagsInText) {
    return new Promise((resolve, reject) => {
      return this.$http.post('/api/hashtags/search/', tagsInText)
        .then((response) => {
          resolve(response.data);
        }).catch((response) => {
          console.log('There was an error', response);
          reject(response.data);
        });
    });
  }
  
    //Parses the title or return first 16 characters of text
  extractTitle(text) {
    let heading = /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/;
    if (heading.test(text)) {
      return text.match(heading)[0];
    } else {
      return text.slice(0, 16);
    }
  }
  
    //gets all hashtags in text
  extractHashtagText(text) {
    let hashtags = [];
    let hashReg = /(^|\s)(#[a-zA-Z\d-]+)/g;
    if (hashReg.test(text)) {
      hashtags = text.match(hashReg).map((tag) => {
        return tag.trim().substr(1);
      });
      return hashtags
    }
  }

  termQuery(term) {
    return this.$http.get('/api/hashtags/search/' + term)
      .then((response) => {
        return response.data;
      }).catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }
}