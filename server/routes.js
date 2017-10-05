/**
 * Main application routes
 */

'use strict';
var path = require('path');
var errors = require(path.join(__dirname, './components/errors'));
var express = require('express');
var electronApp = require('electron').app;


module.exports = function(app, io) {
  // Insert routes below
  app.use('/api/project', require(path.join(__dirname,'./api/project')));
  app.use('/api/user', require(path.join(__dirname,'./api/user')));
  app.use('/api/notebooks', require(path.join(__dirname,'./api/notebook')));
  app.use('/api/connections', require(path.join(__dirname,'./api/connections'))(io));
  app.use('/api/transcription', require(path.join(__dirname,'./api/transcription')));
  app.use('/api/hashtags', require(path.join(__dirname,'./api/hashtag')));
  app.use('/api/session', require(path.join(__dirname,'./api/session')));
  app.use('/api/settings', require(path.join(__dirname,'./api/settings')));

  app.use('/image', express.static(path.join(electronApp.getPath('userData'), 'image')));
  app.use('/assets', express.static(path.join(__dirname, './components/assets/img/')));
  app.use('/audio', express.static(path.join(electronApp.getPath('userData'), 'audio')));
  // app.use('/assets', express.static(path.join(__dirname, 'audio')));


  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|bower_components|assets)/*')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.sendFile(path.resolve(electronApp.getAppPath(), 'dist/index.html'));
    });


  // serve angular front end files from root path
  // app.use('/', express.static('app', { redirect: false }));
//
// // rewrite virtual urls to angular app to enable refreshing of internal pages
//   app.get('*', function (req, res, next) {
//     res.sendFile(path.resolve('app/index.html'));
//   });
};
