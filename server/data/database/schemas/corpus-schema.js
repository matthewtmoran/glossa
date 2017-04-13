var corpus = {
    _id: String, //unique ID
    name: String, // user input name of corpus
    params: {
        corpus: String //will be lowercase and name without special characters or spaces
    },
    type: String, // should always be 'link'
    state: String, //should always be 'corpus'
    settings: [{  // will define options for each corpus
        name: String,
        type: String,
        disabled: Boolean
    }]
};
