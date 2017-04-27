var Project = require('../api/project/project.model');
var User = require('../api/user/user.model');
var Session = require('../api/session/session.model');
var Settings = require('../api/settings/settings.model');
var currentUser;

module.exports = {
    checkForSession: checkForSession,
    getGlossaUser: getGlossaUser,
    checkForApplicationData: checkForApplicationData
};

// var defaultUser = {
//     name: 'glossa user'
// };
var defaultSession = {
    currentState: 'notebook'
};
var defualtProject = {
    name: 'glossa project'
};

var defaultSettings = {
    media: {
        waveColor: '#BDBDBD',
        skipLength: 2
    }
};


function checkForApplicationData() {
    return new Promise(function(resolve, reject) {
        User.findOne({}, function(err, user) {
            if (err) {
                console.log('There was an error loading session.', err);
                reject(err);
            }
            if (!user) {
                console.log('No application data exists');
                resolve(defaultAppData());
            } else {
                console.log('When app begins, set connections.online to false');
                resolve(user);
            }
        });
    })
}

function defaultAppData() {
    console.log('Creating application data');

    var user = {
        name: 'glossa user',
        createdAt: Date.now(),
        settings: {
            isSharing: true,
            waveColor: "#BDBDBD",
            skipLength: 2
        },
        session: {}
    };

   return createUserData(user)
       .then(function(userData) {
        console.log("createUserData promise resolved ");
       return createProjectData(userData)
           .then(function(projectData) {
            console.log("createProjectData promise resolved ");
           return createSessionData(userData, projectData)
               .then(function(updatedUserData) {
                console.log('createSessionData promise resolved');
                return updatedUserData;
            })

        })
    });
}

function createUserData(user) {
    console.log('createUserData');
    return new Promise(function(resolve, reject) {
        User.insert(user, function (err, createdUser) {
            if (err) {
                console.log('There was an Error creating User', err);
                reject(err);
            }
            console.log('Created default user', createdUser);
            resolve(createdUser);
        });
    })
}

function createProjectData(userData) {
    console.log('createProjectData');
    var project = {
        name: 'glossa project',
        createdBy: userData._id
    };
    return new Promise(function(resolve, reject) {
        Project.insert(project, function(err, createdProject) {
            if (err) {
                console.log('There was an Error creating Project', err);
                reject(err);
            }
            console.log('Created default project', createdProject);
            resolve(createdProject);
        })
    })
}

function createSessionData(userData, projectData) {
    console.log('createSessionData');
    var options = {returnUpdatedDocs: true};
    return new Promise(function(resolve, reject) {

        userData.session.start = Date.now();
        userData.session.currentState = 'notebook';
        userData.session.projectId = projectData._id;
        userData.session.currentStateParams = {};
        userData.session.currentStateParams.user = userData._id;
        userData.session.currentStateParams.corpus = 'default';

        User.update({_id: userData._id}, userData, options, function(err, updatedCount, updatedUser) {
            if (err) {
                console.log('There was an error updating user', err);
                reject(err);
            }
            console.log('Updated user data', updatedUser);
            resolve(updatedUser);
        })
    })
}

function createApplicationData() {
    var defaultApplicationData = {
        name: 'glossa user',
        session: {}
    };

   return createDefaultUser(defaultApplicationData)
        .then(function(userData) {
            return projectCheck(userData)
                .then(function(projectData) {
                    return createDefaultSettings(userData, projectData)
                        .then(function() {
                            var options = {
                                returnUpdatedDocs: true
                            };

                            userData.session.start = Date.now();
                            userData.session.currentState = 'notebook';
                            userData.session.projectId = projectData._id;
                            userData.session.currentStateParams = {user: userData._id, corpus: 'default'};

                            return new Promise(function (resolve, reject) {
                                User.update({_id: userData._id}, userData, options, function (err, numUpdated, updatedUser) {
                                    if (err) {
                                        console.log('Error Creating Session', err);
                                        reject(err);
                                    }
                                    User.persistence.stopAutocompaction();
                                    resolve(updatedUser);
                                });
                            });
                        });
                });
        })
}


//check for session
    //if false check for user
    //if true return session
//check for user as extra measure
    //if user does not exist create new project

function checkForSession() {

    return new Promise(function(resolve, reject) {
        Session.find({}, function(err, sessions) {
            if (err) {
                console.log('There was an error loading session.', err);
                reject(err);
            }
            if (sessions.length < 1) {
                console.log('No Session exists; check for user');
                resolve(validateAll());
            }
            resolve(sessions[0]);
        });
    })

}


function validateAll() {
    userCheck()
        .then(function(userData) {
           return projectCheck(userData)
               .then(function(projectData) {
                   return createDefaultSettings(userData, projectData)
                       .then(function(sessionData) {
                          return createDefaultSession(userData, projectData);
                    })
               });
        })
}

function getGlossaUser() {
    return new Promise(function(resolve, reject) {
        User.find({}, function(err, user) {
            if (err) {
                reject(err);
            } else {
                resolve(user);
            }
        })
    })
}



function userCheck() {
    return new Promise(function(resolve, reject) {
        User.find({}, function(err, user) {
            if (err) {
                // return console.log('Error Counting users', err);
                reject(err);
            }
            //if no users exist
            if (user.length < 1) {
                //data should be session

                return createDefaultUser().then(function(user) {
                    console.log('Created user: ', user);
                    resolve(user);
                    // return user
                });

            } else {
                console.log('Resolving user data needs to be normalized...');
                resolve(user);
                // return user;
            }
        })
    })
}

function projectCheck(user) {
    return new Promise(function(resolve, reject) {
        Project.find({}, function(err, project) {
            if (err) {
                // return console.log('Error Counting users', err);
                reject(err);
            }
            //if no users exist
            if (project.length < 1) {
                //data should be session

                return createDefaultProject(user).then(function(project) {
                    console.log('Created project: ', project);
                    resolve(project);
                    // return user
                });

            } else {
                console.log('Returning existing project.... data needs to be normalized');
                resolve(project);
                // return user;
            }
        })
    })
}

//count users if none exists create a new one and save results somewhere
function createDefaultUser(defaultUser) {
    defaultUser.createdAt = Date.now();
    return new Promise(function(resolve, reject) {
        return User.insert(defaultUser, function (err, createdUser) {
            if (err) {
                console.log('There was an Error creating User', err);
                reject(err);
            }

            console.log('created default user', createdUser);
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
       return Session.insert(defaultSession, function(err, createdSession) {
            if (err) {
                console.log('Error Creating Session', err);
                reject(err);
            }
            resolve(createdSession);
        })
    });
}

function createDefaultSettings() {
    return new Promise(function (resolve, reject) {
        Settings.insert(defaultSettings, function (err, createdSettings) {
            if (err) {
                console.log('Error Creating Session', err);
                reject(err);
            }
            console.log('created default settings');
            resolve(createdSettings);
        });
    });
}