var transcription = {
    _id: String, //unique ID
    displayName: String, //display name... of file
    description: String, // description (meta data)
    createdAt: Date, //date file was created/
    content: String, // should be the baseline text ... the 'content' of the md file
    image: {}, //will only exist on independent attachments...
    audio: {}, //
    corpus: String, //corpus that this file 'belongs' to
    notebookId: String, // (optional) ID of the attached notebooks
    createdBy: String, // (optional) The id of the user who created this file
    projectId: String // (optional) The project ID this transfile is tied to
};

