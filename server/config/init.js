var Project = require('../api/project/project.model');
var User = require('../api/user/user.model');
var Notebook = require('../api/notebook/notebook.model');
var Session = require('../api/session/session.model');
var Settings = require('../api/settings/settings.model');
var Connections = require('../api/connections/connection.model');
var Transcriptions = require('../api/transcription/transcription.model');
var Hashtags = require('../api/hashtag/hashtag.model');
var q = require('q');

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
  });

  initialState.project.createdBy = initialState.user._id;
  Project.update({_id: initialState.project._id}, initialState.project, {}, (err, updatedProjectCount) => {
    if(err) {
      return console.log('update projecterror');
    }
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
