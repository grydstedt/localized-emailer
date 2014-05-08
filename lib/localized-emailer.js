/*
 * localized-emailer
 * user/repo
 *
 * Copyright (c) 2014 Gustav Rydstedt
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');
var _ = require('underscore');
var ejs = require('ejs');
var Handlebars = require('handlebars');

var DEFAULT_LOCALE = 'en';

var LocalizedEmailer;

LocalizedEmailer = function(options) {

  options = options || {};

  this.options = options;

  var onLoaded = options.onloaded || function() {};

  this.onBeforeSend = options.onbeforesend || function() {};

  // Allow for custom logger
  this.logger = options.logger || console;

  this.emails = {};

  this.layouts = {};

  this.emailer = options.emailer;

  if(!this.emailer) {
    return onLoaded('no emailer given');
  }

  this.hbsInstance = Handlebars.create();

  this.hbsInstance.registerHelper('partial', _.bind(this._partialHelper, this));

  // Given a directory, load it
  if(options.dir) {
    this.readDirectory(options.dir, onLoaded);
  } else {
    onLoaded();
  }
};


/**
 * Partial Helper for layouts
 */
LocalizedEmailer.prototype._partialHelper = function() {

};

/**
 * Load template
 * @param  {string}   data Raw email data to be compiled
 */
LocalizedEmailer.prototype._loadTemplate = function(data) {
  return this.hbsInstance.compile(data);
};

/**
 * Email with name and options
 * @param  {object}   opts email options
 * @param  {Function} cb   Callback when email was sent.
 */
LocalizedEmailer.prototype.email = function(name, data, opts, cb) {

  data = data || {};
  opts = opts || {};

  var emails = this.getEmailByName(name);
  var locale = opts.locale || DEFAULT_LOCALE;
  var email, layout;

  if(!emails) {
    return cb('email not found or loaded: ' + name);
  }

  layout = this.layouts[opts.layout || this.options.default_layout];


  if(opts.layout && !layout) {
    this.logger.warn('Layout [%s] not found.', opts.layout);
  }

  email = emails[locale];

  if(!email) {
    email = emails[DEFAULT_LOCALE];
  }

  if(!email) {
    return cb('email not found for given or default locale: ' + name);
  }


  var getCompiled = function(raw, backup, data) {
    if(_.isString(raw)) {
      // EJS
      return (raw ? ejs.render(raw, data) : (backup || ''));
    } else {
      // Precompield handlebars
      return (raw ? raw(data) : (backup || ''));
    }
  }

  opts.text = getCompiled(email.text, opts.text, data);
  opts.subject = getCompiled(email.subject, opts.subject, data);

  if(layout) {
    var html = getCompiled(email.html, opts.html, data);
    opts.html = layout(_.extend(data, {html: html}));
  } else {
    opts.html = getCompiled(email.html, opts.html, data);
  }

  this.onBeforeSend(name, opts);

  this.emailer.email(opts, cb);
};

/**
 * Read the directory
 * @param  {[type]}   dirName [description]
 * @param  {Function} cb      [description]
 * @return {[type]}           [description]
 */
LocalizedEmailer.prototype.readDirectory = function(dirName, cb) {
  var _this = this;

  var findLocales = function(type, emailName, emailDirName, inCb) {
    var dirName = path.resolve(emailDirName, type);

    fs.readdir(dirName, function(err, files) {

      if(err) {
        _this.logger.warn('no folder ' + type + ' found for email ' + emailName);
        return inCb();
      }

      async.forEachSeries(files, function(file, inCb2) {


        var filePath = path.resolve(dirName, file);

        fs.stat(filePath, function(err, stat) {

          if(err) return imCb(err);

          if(stat.isFile()) {

            var ext = path.extname(file);
            var locale = path.basename(file, ext);

            if(!_.isObject(_this.emails[emailName][locale])) {
              _this.emails[emailName][locale] = {};
            }

            fs.readFile(filePath, 'utf8', function (err, data) {
              if (err) {
                return inCb2(err);
              }
              if(ext === '.ejs') {
                _this.emails[emailName][locale][type] = data;
              } else {
                _this.emails[emailName][locale][type] = _this._loadTemplate(data);
              }
              inCb2();
            });

          } else {
            inCb2();
          }
        });

      }, inCb);
    });
  };

  fs.readdir(dirName, function(err, files) {

    if(err) return cb(err);

    async.forEachSeries(files, function(file, inCb) {

      if(file !== '_layouts' && file[0] === '_') {
        return inCb();
      }

      var filePath = path.resolve(dirName, file);

      fs.stat(filePath, function(err, stat) {

        if(err) return inCb(err);

        if(stat.isDirectory()) {

          // Load a layout
          if(file === '_layouts') {

            fs.readdir(filePath, function(err, files) {

              async.forEachSeries(files, function(layoutFile, inCb2) {

                var layoutPath = path.resolve(filePath, layoutFile);

                fs.readFile(layoutPath, 'utf8', function (err, data) {

                  if (err) {
                    return inCb2(err);
                  } else {

                    var compiled = _this._loadTemplate(data);

                    _this.layouts[path.basename(layoutFile, '.hbs')] = compiled;

                    inCb2();

                  }

                });

              }, inCb);
            });

          } else {
          
            var emailName = file;
            _this.emails[file] = {};

            async.parallel([

              function(inCb2) {
                findLocales('html', file, filePath, inCb2);
              },

              function(inCb2) {
                findLocales('text', file, filePath, inCb2);
              },

              function(inCb2) {
                findLocales('subject', file, filePath, inCb2);
              }

            ], inCb);

          }
        } else {
          inCb();
        }
      });

    }, cb);

  });
};

/**
 * Get email by name
 * @param  {string} name Name of email
 * @return {object}      Emails with localization
 */
LocalizedEmailer.prototype.getEmailByName = function(name) {
  return this.emails[name];
};

/**
 * Get emails
 * @param  {string} name Name of email
 * @return {object}      All loaded emails
 */
LocalizedEmailer.prototype.getEmails = function() {
  return this.emails || {};
};


module.exports = LocalizedEmailer;
