var Project = require('../api/project/project.model');
var User = require('../api/user/user.model');
var Session = require('../api/session/session.model');
var currentUser;

module.exports = {
    findUser: findUser,
    createUser: createUser,
    findProject: findProject,
    createProject: createProject,
};


Session.find({}, function(err, sessions) {
    if (err) {return console.log('There was an error laoding session.')};
    if (sessions.length < 1) {
        console.log('No Session exists so build new project');
        return buildProject();
    }
    console.log('Session exists');
    return sessions[0];
});


//count users if none exists create a new one and save results somewhere

function buildProject() {
    User.count({}, function(err, count) {
        if (err) {return console.log('There was an error loading project.....')}
        //if no users exist it mean this is the first time the application has run... Maybe we run more checks here to be extra careful.
        if (count < 1) {

            //create new user object
            var newUser = {
                name: 'glossa user',
                createdAt: Date.now()
            };

            //insert new user object into db
            User.insert(newUser, function(err, createdUser) {
                if (err) {return console.log('there was an error')}

                //creeate new project object
                var newProject = {
                    name: 'glossa project',
                    createdAt: Date.now(),
                    createdById: createdUser._id
                };

                //insert project object into db
                Project.insert(newProject, function(err, createdProject) {
                    if (err) {return console.log('there was an error')}

                    //create new session object
                    var session = {
                        start: Date.now(),
                        projectId: createdProject._id,
                        userId: createdUser._id,
                        currentState: 'corpus.meta',
                        currentStateParams: {user: createdUser._id, corpus:'default'}
                    };

                    //insert session object into db
                    Session.insert(session, function(err, createdSession) {
                        if (err) {return console.log('there was an error')}
                        console.log('Session created: ', createdSession);

                        return createdSession;

                    })
                });
            })

        } else {
            console.log('user exists load session');
        }
    });
}







// User.find({}, function(err, user) {
//     if (err) {return console.log('There was an error looking for user information...')}
//     if (user.length < 1) {
//         console.log('Now user data.. Must be first time running application.. Build environment.');
//
//         var newUser = {
//             name: 'glossa user',
//             createdAt: Date.now()
//         };
//
//         User.insert(newUser, function(err, createdUser) {
//             if (err) {return console.log('There was an error Creating new User')}
//             console.log('this is the newly created user: ', createdUser);
//         })
//
//     }
// });
// Project.find({}, function(err, project) {
//     if (err) {return console.log('There was an error looking for user information...')}
//     if (user.length < 1) {
//         console.log('Now user data.. Must be first time running application.. Build environment.');
//
//         var newProject = {
//             name: 'glossa project',
//             createdAt: Date.now(),
//             createdById: String
//         };
//
//
//         Project.insert(newProject, function(err, createdProject) {
//             if (err) {return console.log('There was an error Creating new Project')}
//             console.log('this is the newly created user: ', createdProject);
//         })
//
//     }
// });



function findUser() {
    console.log('findUser');
    return new Promise(function(resolve, reject) {
        return User.find({}, function(err, user) {
            if (err) {reject('Error finding user', err)}
            console.log('user', user);
            if (user.length < 1) {
                console.log('Now user data.. Must be first time running application.. Build environment.');
                reject('No user Found');
            }
            currentUser = user[0];
           resolve(user);
        });
    });
}

function createUser() {
    return new Promise(function(resolve, reject) {
        var newUser = {
            name: 'glossa user',
            createdAt: Date.now()
        };
        User.insert(newUser, function(err, createdUser) {
            if (err) {reject(null)}
            console.log('this is the newly created user: ', createdUser);
            currentUser = createdUser;
            resolve(createdUser);
        })
    });
}

function findProject() {
    return new Promise(function(resolve, reject) {
        return Project.find({}, function(err, project) {
            if (err) {reject(err)}
            if (project.length < 1) {
                console.log('No project data.. Must be first time running application.. Build environment.');
                reject('No project found');
            }
            resolve(project);
        });
    });
}

function createProject() {
    return new Promise(function(resolve, reject) {
        var newProject = {
            name: 'glossa project',
            createdAt: Date.now(),
            createdById: currentUser._id
        };

       return Project.insert(newProject, function(err, createdProject) {
            if (err) {reject(err)}
            resolve(createdProject);
        })
    });
}

