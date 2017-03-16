// TODO: consider if we should change this to application data instead of 'user data'

var user = {
    _id: String, //nedb provided unique identifier
    name: String, // default name will be 'glossa user'
    createdAt: String, // time this user was created
    avatar: String, // path to avatar image, default will be set....
    session: { //Session will be updated every time user changes a state
        start: Date, //time the session started
        end: Date, //time the session ended
        currentState: String, //current state of user (so app opens at this location) i.e. settings.network
        projectId: String, //Id of the project
        currentStateParams: { //current state parameters for ui.router
            user: String,
            corpus: String
        },
        updatedAt: Date //store last time this data was changed
    },
    settings: {
        waveColor: String,
        skipLength: Number,
        isSharing: Boolean //default will be true
    },
    connections: [{ // will be all the connections on the network.
        _id: String, //unique user id
        name: String, //user name
        type: String, //type will most likely always be 'external-client'
        following: Boolean, // has the user followed this connection
        lastSync: Date, //last time user synced with this connection
        socketId: String, //the current socket.id of the user
        online: Boolean, //is the user currently online
        avatar: String //path to this users locally stored avatar thumbnail
    }]
};

var test = {
    "name": "glossa user",
    "session": {
        "start": 1488675258085,
        "currentState": "settings.network",
        "projectId": "ABG4WUCaq1UTJhgJ",
        "currentStateParams": {"user": "Moran", "corpus": "default"}
    },
    "createdAt": 1488675258069,
    "_id": "6omvDcDQCrmzZLIn",
    "start": 1488675258085,
    "currentState": "settings.project",
    "projectId": "ABG4WUCaq1UTJhgJ",
    "currentStateParams": {"user": {}, "corpus": "default"},
    "connections": [{
        "name": "glossa user",
        "_id": "IfOgH9I4A0koxV9k",
        "type": "external-client",
        "socketId": "SixpxNDEdm_-mpjWAAAC",
        "online": false,
        "color": "#9A89B5",
        "isSharing": true,
        "lastSync": 1489105317672,
        "following": true
    }]
}