/**
 * Express configuration
 */

'use strict';

var express = require('express');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var path = require('path');
var config = require('./environment');

var electron = require('electron'),
    electronApp = electron.app;  // Module to control application life.

module.exports = function(app) {
  console.log('What is happeing');
  var env = app.get('env');

  console.log('env', env);

  app.set('views', config.root + '/server/views');
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser());

  console.log('debug1');
  if ('production' === env) {
    console.log('environment is production');
    app.use(favicon(path.join(config.root, 'public', 'favicon.ico')));
    app.use(express.static(path.join(config.root, 'public')));
    app.set('appPath', path.join(config.root, 'public'));
    app.use(morgan('dev'));
  }

  if ('development' === env || 'test' === env) {
    console.log('is dev environment!!!');
    // app.use(require('connect-livereload')());
    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(express.static(path.join(config.root, 'client')));
    app.use(express.static(path.join(config.root, 'server/data')));
    app.set('appPath', path.join(config.root, 'client'));
    app.use(morgan('dev'));
    app.use(errorHandler()); // Error handler - has to be last
  }

    if ('dev-es6' === env) {
        console.log('es6 dev environment!');
        // app.use(require('connect-livereload')());
        app.use(express.static(path.join(config.root, '.tmp')));
        app.use(express.static(path.join(config.root, 'dist')));
        app.use(express.static(path.join(config.root, 'server/data')));
        app.set('appPath', path.join(config.root, 'dist'));
        app.use(morgan('dev'));
        app.use(errorHandler()); // Error handler - has to be last
    }
  console.log('debug2');
};
