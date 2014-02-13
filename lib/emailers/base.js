/*
 * localized-emailer
 * user/repo
 *
 * Copyright (c) 2014 Gustav Rydstedt
 * Licensed under the MIT license.
 */

'use strict';

var BaseEmailer;

BaseEmailer = function(options) {

};

BaseEmailer.prototype.email = function(opts, cb) {
  cb();
};

module.exports = BaseEmailer;