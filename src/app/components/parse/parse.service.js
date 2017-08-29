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
      //if the tag we are looking at is not found in the text
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
  
    //get hashtags
  // hashtags(notebook) {
  //   console.log('parsing hashtag:', notebook);
  //   //gets the hashtags existing in text
  //   let tagsInText = this.extractHashtagText(notebook.description) || [];
  //   console.log("tags in the text:", tagsInText);
  //   let removedTags = [];
  //   //if no hashtags exist..
  //   if (!notebook.hashtags) {
  //     notebook.hashtags = [];
  //   }
  //
  //   console.log('notebook.hashtags.length', notebook.hashtags.length);
  //   console.log('notebook.hashtags', notebook.hashtags);
  //   //verify old tags exist in text still...
  //   notebook.hashtags.forEach((tag, index) => {
  //
  //     if (tagsInText.indexOf(tag.tag) < 0) {
  //       console.log("removing tag");
  //       //add to removed tags
  //       removedTags.push(tag);
  //       //remove from hashtags array
  //       notebook.hashtags.splice(index, 1);
  //     }
  //     console.log('splicing tag... ', tagsInText);
  //     //splice tags in text if it already exists....
  //     tagsInText.splice(tagsInText.indexOf(tag.tag), 1);
  //     console.log('spliced tag... ', tagsInText);
  //   });
  //
  //   // removedTags.forEach(function(tag) {
  //   //     HashtagService.decreaseTagCount(tag);
  //   // });
  //
  //   //the rest of the tags here should be tags new to this notebooks...
  //   return this.queryForNewTags(tagsInText)
  //     .then((data) => {
  //     console.log('queryingForNewTags', data);
  //     data.forEach((tag) => {
  //       notebook.hashtags.push(tag);
  //     });
  //     console.log('notebook.hashtags.length', notebook.hashtags.length);
  //     return notebook.hashtags;
  //   });
  // }
  //
  
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
    console.log('Text we are looking at:', text);
    let hashtags = [];
    let hashReg = /(^|\s)(#[a-zA-Z\d-]+)/g;
    if (hashReg.test(text)) {
      hashtags = text.match(hashReg).map((tag) => {
        return tag.trim().substr(1);
      });
      console.log("hashtags.length", hashtags.length);
      return hashtags
    }
  }

  termQuery(term) {
    console.log('Search db for term:', term);
    return this.$http.get('/api/hashtags/search/' + term)
      .then((response) => {
      console.log("response from term query:", response);
        return response.data;
      }).catch((response) => {
        console.log('There was an error', response);
        return response.data;
      });
  }
}