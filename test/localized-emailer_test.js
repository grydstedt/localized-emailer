'use strict';

var LocalizedEmailer = require('../lib/localized-emailer.js');
var MailgunEmailer = require('../lib/emailers/mailgun.js');

var _ = require('underscore');
var path = require('path');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.localizedEmailer = {
  setUp: function(done) {
    // setup here
    done();
  },

  'empty load': function(test) {
    var mailgunEmailer = new MailgunEmailer({
      key: 'key-81y74kso84m41qzbu8',
      user: 'verbling'
    });

    new LocalizedEmailer({

      emailer: mailgunEmailer,

      onloaded: function(err) {

        test.equal(err, undefined, 'loading no emails should work');

        test.done();
      }
    });
  },

  'load': function(test) {
    var mailgunEmailer = new MailgunEmailer({
      key: 'key-81y74kso84m41qzbu8',
      user: 'verbling'
    });

    var emailer = new LocalizedEmailer({

      emailer: mailgunEmailer,

      dir: path.resolve(__dirname + '/examples'),

      onloaded: function(err) {

        test.equal(err, undefined, 'loading mails should work');

        var emails = emailer.getEmails();

        test.equal(_.size(emails), 2, 'should have loaded two emails');

        emailer.email('test_email1',
          {}, 
          {
            locale: 'es',
            from:'verbling@verbling.com',
            to: 'gustav.rydstedt@gmail.com',
          }, 
          function(err) {
            test.done();
        });

      }
    });
  },

};
