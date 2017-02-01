/**
 * Main application routes
 */

'use strict';
var errors = require('./components/errors');
var path = require('path');

module.exports = function(app) {

  // Insert routes below
  app.use('/api/notebook', require('./api/notebook'));
  app.use('/api/hashtag', require('./api/hashtag'));
  app.use('/api/transcription', require('./api/transcription'));
  app.use('/api/corporia', require('./api/corpus'));

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.sendFile(path.resolve(app.get('appPath') + '/index.html'));
    });
};
