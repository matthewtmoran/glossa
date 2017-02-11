var project = {
    _id: String, //nedb provided unique identifier,
    name: String, // default will be 'glossa project',
    description: String,
    createdAt: Date,
    createdById: String //id of the user who created the project
};