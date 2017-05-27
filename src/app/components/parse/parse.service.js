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
  
    //get hashtags
  hashtags(notebook) {
    //gets the hashtags existing in text
    let tagsInText = this.extractHashtagText(notebook.description) || [];
    let removedTags = [];
    //if no hashtags exist..
    if (!notebook.hashtags) {
      notebook.hashtags = [];
    }
  
    //verify old tags exist in text still...
    notebook.hashtags.forEach((tag, index) => {
  
      if (tagsInText.indexOf(tag.tag) < 0) {
        //add to removed tags
        removedTags.push(tag);
        //remove from hashtags array
        notebook.hashtags.splice(index, 1);
      }
      //splice tags in text if it already exists....
      tagsInText.splice(tagsInText.indexOf(tag.tag), 1)
    });
  
    // removedTags.forEach(function(tag) {
    //     HashtagService.decreaseTagCount(tag);
    // });
  
    //the rest of the tags here should be tags new to this notebooks...
    return this.queryForNewTags(tagsInText)
      .then((data) => {
      data.forEach((tag) => {
        notebook.hashtags.push(tag);
      });
      return notebook.hashtags;
    });
  }
  
  
    ///////////
    //helpers//
    ///////////
  
  
    //new tags is an array of tags new to this notebooks;
  queryForNewTags(tagsInText) {
    let promises = [];
    tagsInText.forEach((tag, index) => {
      //push this query to promises array
      promises.push(this.termQuery(tag)
        .then((data)=> {
        //update the notebooks model property
          tagsInText[index] = data;
          return data;
        }))
    });
    return this.$q.all(promises).then((data) => {
      return data;
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