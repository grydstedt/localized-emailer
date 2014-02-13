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

var DEFAULT_LOCALE = 'en';

var LocalizedEmailer;

LocalizedEmailer = function(options) {

  options = options || {};

  this.options = options;

  var onLoaded = options.onloaded || function() {};

  // Allow for custom logger
  this.logger = options.logger || console;

  this.emails = {};

  this.emailer = options.emailer;

  if(!this.emailer) {
    return onLoaded('no emailer given');
  }

  // Given a directory, load it
  if(options.dir) {
    this.readDirectory(options.dir, onLoaded);
  } else {
    onLoaded();
  }
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
  var email;

  if(!emails) {
    return cb('email not found or loaded: ' + name);
  }

  email = emails[locale];

  if(!email) {
    email = email[DEFAULT_LOCALE];
  }

  if(!email) {
    return cb('email not found for given or default locale: ' + name);
  }

  opts.text = email.text ? ejs.render(email.text, data) : '';
  opts.html = email.html ? ejs.render(email.html, data) : '';
  opts.subject = email.subject ? ejs.render(email.subject, data) : '';

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
        return inCb();
      }
      
      async.forEachSeries(files, function(file, inCb2) {


        var filePath = path.resolve(dirName, file);

        fs.stat(filePath, function(err, stat) {

          if(err) return imCb(err);

          if(stat.isFile()) {

            var locale = path.basename(file, '.ejs');

            if(!_.isObject(_this.emails[emailName][locale])) {
              _this.emails[emailName][locale] = {};
            }

            fs.readFile(filePath, 'utf8', function (err, data) {
              if (err) {
                return inCb2(err);
              }
              _this.emails[emailName][locale][type] = data;
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

      var filePath = path.resolve(dirName, file);

      fs.stat(filePath, function(err, stat) {

        if(err) return imCb(err);

        if(stat.isDirectory()) {
          
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