var Project = require('../api/project/project.model');
var User = require('../api/user/user.model');
var Notebook = require('../api/notebook/notebook.model');
var Session = require('../api/session/session.model');
var Settings = require('../api/settings/settings.model');
var Connections = require('../api/connections/connection.model');
var Transcriptions = require('../api/transcription/transcription.model');
var Hashtags = require('../api/hashtag/hashtag.model');
var currentUser;
var q = require('q');

module.exports = {
  checkForSession: checkForSession,
  getGlossaUser: getGlossaUser,
  checkForApplicationData: checkForApplicationData,
  getInitialState: getInitialState
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

const initialState = {
  user: {
    name: 'glossa user',
    createdAt: Date.now(),
    settings: {
      isSharing: false,
      waveColor: "#BDBDBD",
      skipLength: 2
    },
    session: {
      start: Date.now(),
      currenteState: 'notebook',
      projectId: '',
      currentStateParams: {
        user: '',
        corpus: ''
      }
    }
  },
  project: {
    name: 'glossa project',
    // createdBy: userData._id
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
              resetConnections()
                .then(function(){
                resolve(user);
              });
            }
        });
    })
}

function getConnections() {
  return new Promise((resolve, reject) => {
    Connections.find({}, (err, connections) => {
      if (err) {
        console.log('Error getting initial notebooks', err);
        reject(err);
      }
      console.log('do notebooks exist?', !!notebooks);
      resolve(notebooks);
    });
  });
}

function resetConnections() {
  return new Promise(function(resolve, reject) {

    Connections.find({}, function(err, connections) {
      connections.forEach(function(connection) {
        if (!connection.following) {
          Connections.remove({_id: connection._id});
        } else {
          Connections.update({_id: connection._id}, {$set: {online: false}})
        }
      })
    });
    resolve();

  })
}

function defaultAppData() {
    console.log('Creating application data');

    var user = {
        name: 'glossa user',
        createdAt: Date.now(),
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


///////////////////////////////////////////////////
///////////////////////////////////////////////////

let isFirstRun = false;

function getInitialState() {
  return new Promise((resolve, reject) => {
    let statePromises = [];
    const initialState = {};


    // let initUser = getInitialUser()
    //     .then((data) => {
    //       initialState.user = data;
    //       console.log('getInitalUser resolved', !!data)
    //     });
    //
    // let initSess = getInitialSession()
    //   .then((data) => {
    //     initialState.session = data;
    //     console.log('getInitialSession resolved', !!data)
    //   })
    //
    //   let initProj = getInitialProject()
    //     .then((data) => {
    //       initialState.project = data
    //       console.log('getInitialProject resolved', !!data)
    //     });
    //
    //  let initSett = getInitialSettings()
    //     .then((data) => {
    //       initialState.settings = data
    //       console.log('getInitialSettings resolved', !!data)
    //     });
    //
    //   let initNote = getInitialNotebooks()
    //     .then((data) => {
    //       initialState.notebooks = data
    //       console.log('getInitialNotebooks resolved', !!data)
    //     });
    //
    //   let initConn = getInitialConnections()
    //     .then((data) => {
    //       initialState.connections = data
    //       console.log('getInitialConnections resolved', !!data)
    //     });
    //
    //   let initTran = getInitialTranscriptions()
    //     .then((data) => {
    //       initialState.transcriptions = data
    //       console.log('getInitialTranscriptions resolved', !!data)
    //     });
    //
    //   let initHash = getInitialHashtags()
    //     .then((data) => {
    //       initialState.hashtags = data
    //       console.log('getInitialHashtags resolved', !!data)
    //     });
    //
    //   statePromises.push();
    //
    // //  initSess, initSett, initNote, initTran, initHash, initConn, initProj
    //


    statePromises.push(

      getInitialUser()
        .then((data) => {
          initialState.user = data;
        }),

      getInitialSession()
        .then((data) => {
          initialState.session = data;
        }),

      getInitialProject()
        .then((data) => {
          initialState.project = data;
        }),
      getInitialSettings()
        .then((data) => {
          initialState.settings = data
        }),

      getInitialNotebooks()
        .then((data) => {
          initialState.notebooks = data
        }),

      getInitialConnections()
        .then((data) => {
          initialState.connections = data
        }),

      getInitialTranscriptions()
        .then((data) => {
          initialState.transcriptions = data
        }),

      getInitialHashtags()
        .then((data) => {
          initialState.hashtags = data
        })


    );



    Promise.all(statePromises)
      .then((results) => {
      console.log('all state promises have resolved...');
        if (isFirstRun) {
          console.log('this is a first run');
          resolve(normalizeInitialData(initialState))
        } else {
          console.log('this is not a first run');
          resolve(initialState);
        }
      })



  })
}

function normalizeInitialData(initialState) {

  initialState.session.currentStateParams.user = initialState.user._id;
  initialState.session.projectId = initialState.project._id;
  Session.update({_id: initialState.session._id}, initialState.session, {}, (err, updatedSessionCount) => {
    if(err) {
       return console.log('update session error');
    }
    console.log('update session success');
  });

  initialState.project.createdBy = initialState.user._id;
  Project.update({_id: initialState.project._id}, initialState.project, {}, (err, updatedProjectCount) => {
    if(err) {
      return console.log('update projecterror');
    }
    console.log('update project success');
  });

  return initialState;
}

function getInitialUser() {
  return new Promise((resolve, reject) => {
    User.findOne({}, (err, user) => {
      if (err) {
        reject(err)
      }
      if (!user) {
        isFirstRun = true;
        resolve(buildInitialUser())
      }
      resolve(user)
    })
  })
}
function buildInitialUser() {
  const user = {
    name: 'glossa user',
    createdAt: Date.now(),
  };
    // settings: {
    //   isSharing: true,
    //   waveColor: "#BDBDBD",
    //   skipLength: 2
    // },

  return new Promise((resolve, reject) => {
    User.insert(user, (err, user) => {
      if (err) {
        console.log('Error creating initial user', err);
        reject(err)
      }
      resolve(user)
    })
  });

}


function getInitialSession() {
  return new Promise((resolve, reject) => {
    Session.findOne({}, (err, session) => {
      if (err) {
        reject(err)
      }
      if (!session) {
        resolve(buildInitialSession())
      }
      resolve(session)
    })

  })
}
function buildInitialSession() {
  const session = {
    start: Date.now(),
    currenteState: 'notebook',
    projectId: '',
    currentStateParams: {}
  };

  console.log('session.currentStateParams', session.currentStateParams);

  session.currentStateParams.user = '';
  session.currentStateParams.corpus = 'default';



  return new Promise((resolve, reject) => {
    Session.insert(session, (err, data) => {
      if (err) {
        console.log('Error creating initial session', err);
        reject(err)
      }
      resolve(data)
    })
  });

}

function getInitialProject() {
  return new Promise((resolve, reject) => {
    Project.findOne({}, (err, project) => {
      if (err) {
        reject(err)
      }
      if (!project) {
        isFirstRun = true;
        resolve(buildInitialProject())
      }
      resolve(project)
    })
  })
}
function buildInitialProject() {
  const project = {
    name: 'glossa project',
    createdBy: ''
  };
  return new Promise((resolve, reject) => {
    Project.insert(project, (err, data) => {
      if (err) {
        console.log('Error creating initial project', err);
        reject(err)
      }
      resolve(data)
    })
  });

}

function getInitialSettings() {
  return new Promise((resolve, reject) => {
    Settings.findOne({}, (err, settings) => {
      if (err) {
        reject(err)
      }
      if (!settings) {
        isFirstRun = true;
        resolve(buildInitialSettings())
      }
      resolve(settings)
    })
  })
}
function buildInitialSettings() {
  const settings = {
    media: {
      waveColor: '#BDBDBD',
      skipLength: 2
    },
    isSharing: false,
    waveColor: "#BDBDBD",
    skipLength: 2
  };

  return new Promise((resolve, reject) => {
    Settings.insert(settings, (err, data) => {
      if (err) {
        console.log('Error creating initial settings', err);
        reject(err)
      }
      resolve(data)
    })
  });

}

function getInitialNotebooks() {
  return new Promise((resolve, reject) => {
    Notebook.find({}, (err, notebooks) => {
      if (err) {
        console.log('Error getting initial notebooks', err);
        reject(err);
      }
      resolve(notebooks);
    });
  });
}

function getInitialConnections() {
  return new Promise((resolve, reject) => {
    Connections.find({}, (err, connections) => {
      if (err) {
        console.log('Error getting initial connections', err);
        reject(err);
      }
      resolve(connections);
    });
  });
}

function getInitialTranscriptions() {
  return new Promise((resolve, reject) => {
    Transcriptions.find({}, (err, transcriptions) => {
      if (err) {
        console.log('Error getting initial connections', err);
        reject(err);
      }
      resolve(transcriptions);
    });
  });
}

function getInitialHashtags() {
  return new Promise((resolve, reject) => {
    Hashtags.find({}, (err, hashtags) => {
      if (err) {
        console.log('Error getting initial hashtags', err);
        reject(err);
      }
      resolve(hashtags);
    });
  });
}


function buildInitialState() {

}