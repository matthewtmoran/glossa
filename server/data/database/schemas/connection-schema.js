var corpus = {
    _id: String, //unique ID provided by client
    name: String, // user input name of client
    type: String, // should always be 'external-client'
    following: Boolean, //defaults to false
    lastSync: Date, //Date of last time updates have been synced
    avatar: String //path of image
};