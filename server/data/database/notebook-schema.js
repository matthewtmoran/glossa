var transcription = {
    _id: String, //unique ID
    name: String, //display name... of file
    description: String, // description (meta data)
    image: {}, //will only exist on independent attachments...
    audio: {}, //
    createdAt: Date, //date file was created/
    createdBy: String, // (optional) The id of the user who created this file
    notebookId: String, // (optional) ID of the attached notebooks
    projectId: String // (optional) The project ID this transfile is tied to
};

