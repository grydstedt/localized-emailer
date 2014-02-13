/*
 * localized-emailer
 * user/repo
 *
 * Copyright (c) 2014 Gustav Rydstedt
 * Licensed under the MIT license.
 */

'use strict';

var BaseEmailer = require('./base');
var _ = require('underscore');
var request = require('request');

var MailgunEmailer;

MailgunEmailer = function(options) {

  options = options || {};

  this.key = options.key;
  this.user = options.user;

};

MailgunEmailer.prototype = Object.create(BaseEmailer.prototype);


MailgunEmailer.prototype.sendMailgunEmail = function(options, cb) {

  var defaultOptions = {
    method: 'POST',
    url: 'https://api.mailgun.net/v2/m.' + this.user + '.com/messages',
    auth: {
      'user': 'api',
      'pass': this.key
    }
  };

  options = options || {};

  _.each(options.headers || {}, function(value, key) {
    switch(key) {
      case 'X-Mailgun-Tag':
        options['o:tag'] = value;
        break;
      case 'X-Mailgun-Campaign-Id':
        options['o:campaign'] = value;
        break;
      case 'X-Mailgun-Dkim':
        options['o:dkim'] = value;
        break;
      case 'X-Mailgun-Deliver-By':
        options['o:deliverytime'] = value;
        break;
      case 'X-Mailgun-Drop-Message':
        options['o:tracking'] = value;
        break;
      case 'X-Mailgun-Track':
        options['o:tracking'] = value;
        break;
      case 'X-Mailgun-Track-Clicks':
        options['o:tracking-clicks'] = value;
        break;
      case 'X-Mailgun-Track-Opens':
        options['o:tracking-opens'] = value;
        break;
      case 'X-Mailgun-Variables':
        break;
      default:
        options['h:' + key] = value;
        break;
    }
  });

  options = {form: options}
  options = _.extend(options, defaultOptions)

  request(options, function(err, res, body) {
    // Callback with error if request fails or mailgun returns failure code
    // Otherwise, call empty callback
    if (err) {
      return cb(err);
    }

    if (res.statusCode === 200) {
      cb();
    } else {
      cb(body);
    }
  });
};

MailgunEmailer.prototype.email = function(options, cb) {
  this.sendMailgunEmail(options, cb);
};

module.exports = MailgunEmailer;