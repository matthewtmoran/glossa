/**
 * Main application routes
 */

'use strict';
const path = require('path');
const errors = require( './components/errors');
const express = require('express');
const remote = require('electron').remote;


module.exports = function(app, io) {
  // Insert routes below
  app.use('/api/project', require('./api/project'));
  app.use('/api/user', require('./api/user'));
  app.use('/api/notebooks', require('./api/notebook')(io));
  app.use('/api/connections', require('./api/connections')(io));
  app.use('/api/transcription', require('./api/transcription'));
  app.use('/api/hashtags', require('./api/hashtag'));
  app.use('/api/session', require('./api/session'));
  app.use('/api/settings', require('./api/settings'));
  app.use('/api/preload', require('./api/preload'));

  app.use('/image', express.static(path.join(remote.app.getPath('userData'), 'image')));
  app.use('/assets', express.static(path.resolve(remote.app.getAppPath(), 'dist/img/')));
  app.use('/audio', express.static(path.join(remote.app.getPath('userData'), 'audio')));


  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|bower_components|assets)/*')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.sendFile(path.resolve(remote.app.getAppPath(), 'dist/index.html'));
    });
};
