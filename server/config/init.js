var Project = require('../api/project/project.model');
var User = require('../api/user/user.model');
var Session = require('../api/session/session.model');
var Settings = require('../api/settings/settings.model');
var currentUser;

module.exports = {
    findUser: findUser,
    createUser: createUser,
    findProject: findProject,
    createProject: createProject,
    checkForSession: checkForSession
};

var defaultUser = {
    name: 'glossa user'
};
var defaultSession = {
    currentState: 'corpus.meta'
};
var defualtProject = {
    name: 'glossa project'
};
var defaultSettings = {
    media: {
        waveColor: 'black',
        skipLength: 2,
    }
};

//check for session
    //if false check for user
    //if true return session
//check for user as extra measure
    //if user does not exist create new project

function checkForSession() {
    Session.find({}, function(err, sessions) {
        if (err) {
            return console.log('There was an error loading session.', err);
        }
        if (sessions.length < 1) {
            console.log('No Session exists; check for user');
            return userCheck();
        }
        console.log('Session exists');
        return sessions[0];
    });
}

function userCheck() {
    User.count({}, function(err, count) {
        if (err) {
           return console.log('Error Counting users', err);
        }
        //if no users exist
        if (count < 1) {
            //data should be session
           return buildProject().then(function(data) {
                return data;
            });
        }
    })
}

//count users if none exists create a new one and save results somewhere
function createDefaultUser() {
    defaultUser.createdAt = Date.now();

   return new Promise(function (resolve, reject) {
      User.insert(defaultUser, function (err, createdUser) {
            if (err) {
                console.log('There was an Error creating User', err);
                reject(err);
            }
            resolve(createdUser);
        });
    })
}

function createDefaultProject(user) {

    defualtProject.createdAt = Date.now();
    defualtProject.createdById = user._id;

    return new Promise(function (resolve, reject) {
       Project.insert(defualtProject, function(err, createdProject) {
            if (err) {
                console.log('Error Creating Project');
                reject(err);
            }
            resolve(createdProject);
        })
    })
}

function createDefaultSession(user, project) {
    defaultSession.start = Date.now();
    defaultSession.projectId = project._id;
    defaultSession.userId = user._id;
    defaultSession.currentStateParams = {user: user._id, corpus:'default'};

    return new Promise(function (resolve, reject) {
       Session.insert(defaultSession, function(err, createdSession) {
            if (err) {
                console.log('Error Creating Session', err);
                reject(err);
            }
            resolve(createdSession);
        })
    });
}

function createDefaultSettings() {
    Settings.insert(defaultSettings, function(err, createdSettings) {
        if (err) {
            return console.log('Error Creating Session', err);
        }
        console.log('Settings Created', createdSettings._id);
    });
}

function buildProject() {
    console.log('buildProject');

    createDefaultSettings();

   return createDefaultUser()
        .then(function(user) {
            console.log('First response user:', user._id);
            return createDefaultProject(user)
                .then(function(project) {
                    console.log('Second response project:', project._id);
                    return createDefaultSession(user, project)
                        .then(function(session) {
                            console.log('Third response session:', session._id);
                            return session;
                        })
                });
        })
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

