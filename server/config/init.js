var Project = require('../api/project/project.model');
var User = require('../api/user/user.model');
var Session = require('../api/session/session.model');
var Settings = require('../api/settings/settings.model');
var currentUser;

module.exports = {
    checkForSession: checkForSession,
    getGlossaUser: getGlossaUser
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
    return userCheck();
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
                console.log('Returning existing project.... data needs to be normalized')
                resolve(project);
                // return user;
            }
        })
    })
}

//count users if none exists create a new one and save results somewhere
function createDefaultUser() {
    defaultUser.createdAt = Date.now();
    return new Promise(function(resolve, reject) {
        return User.insert(defaultUser, function (err, createdUser) {
            if (err) {
                console.log('There was an Error creating User', err);
                reject(err);
            }
            resolve(createdUser);
            // return createdUser;
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
    Settings.insert(defaultSettings, function(err, createdSettings) {
        if (err) {
            return console.log('Error Creating Session', err);
        }
        console.log('Settings Created', createdSettings._id);
    });
}