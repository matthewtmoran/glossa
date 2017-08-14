const path = require('path');
const fs = require('fs');
const Project = require(path.join(__dirname, '../api/project/project.model'));
const User = require(path.join(__dirname, '../api/user/user.model'));
const Notebook = require(path.join(__dirname, '../api/notebook/notebook.model'));
const Session = require(path.join(__dirname, '../api/session/session.model'));
const Settings = require(path.join(__dirname, '../api/settings/settings.model'));
const Connections = require(path.join(__dirname, '../api/connections/connection.model'));
const Transcriptions = require(path.join(__dirname, '../api/transcription/transcription.model'));
const Hashtags = require(path.join(__dirname, '../api/hashtag/hashtag.model'));
const q = require('q');

module.exports = {
  getInitialState: getInitialState
};

let isFirstRun = false;

function getInitialState() {
  return new Promise((resolve, reject) => {
    let statePromises = [];
    const initialState = {};
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
        if (isFirstRun) {
          resolve(normalizeInitialData(initialState))
        } else {
          resolve(initialState);
        }
      })



  })
}

function normalizeInitialData(initialState) {
  // initialState.session.currentStateParams.user = initialState.user._id;
  // initialState.session.projectId = initialState.project._id;

  const query = {_id: initialState.session._id};
  const update = initialState.session;
  const options = {};

  Session.update(query, update, options, (err, updatedSessionCount) => {
    if(err) {
       return console.log('update session error');
    }
  });

  initialState.project.createdBy = initialState.user._id;

  Project.update({_id: initialState.project._id}, initialState.project, {}, (err, updatedProjectCount) => {
    if(err) {
      return console.log('update project error');
    }
  });

  // console.log('returning initialState', initialState);

  return initialState;
}

/**
 * Look for initial user
 * If it does not exist, build new user
 * @returns {Promise} = user object either existing, or a newly created user
 */
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
/**
 *  Builds initial user
 *  Called if no user exists
 */
function buildInitialUser() {
  const user = {
    name: 'New Glossa User',
    createdAt: Date.now(),
  };
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

/**
 * Look for initial session
 * If it does not exist, build new session object
 * @returns {Promise} = session object either existing, or a newly created session
 */
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
/**
 *  Builds initial session
 *  Called if no user exists
 */
function buildInitialSession() {
  const session = {
    start: Date.now(),
    currentState: 'notebook',
    projectId: '',
    currentStateParams: {}
  };


  // session.currentStateParams.user = '';
  // session.currentStateParams.corpus = 'default';


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
    name: 'New Glossa Project',
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
    return resetConnectionData()
      .then(()=>{
        Connections.find({}, (err, connections) => {
          if (err) {
            console.log('Error getting initial connections', err);
            reject(err);
          }
          resolve(connections);
        });
      })
      .catch((err)=> {
        reject(err);
      })
  });
}

function resetConnectionData() {
  return new Promise((resolve, reject) => {
    Connections.find({}, (err, connections) => {
      if(err){reject(err)}

      let removable = connections.filter(connection => !connection.following);
      removable.forEach((connection) => {
        Connections.remove({_id: connection._id}, (err, count) => {
          if(err){reject(err)}
        })
      });

      connections = connections.filter(connection => connection.following).map((connection) => {
        delete connection.socketId;
        connection.online = false;
        return connection;
      });

      connections.forEach((connection) => {
        Connections.update({_id: connection._id}, connection, {}, (err, count) => {
          if (err) {reject(err)}
        })
      });
      resolve(connections);
    });
  })
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
      if (!hashtags.length) {

        fs.readFile(path.join(__dirname, '../../hashtags.json'), 'utf8', (err, contents) => {
          if (err) {
            return console.log('Error hashtag file... ', err)
          }
          let defaultHashtags = JSON.parse(contents);

          Hashtags.insert(defaultHashtags.hashtags, (err, insertedDocs)=> {
            if (err) {
              return console.log('error inserting default hashtags');
            }

            resolve(insertedDocs);
          });
        })
      } else {
        resolve(hashtags);
      }
    });
  });
}
