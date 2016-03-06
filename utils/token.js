'use strict';

const Promise = require('bluebird');
const crypto = Promise.promisifyAll(require('crypto'));

exports.generateToken = function() {
  return crypto.randomBytesAsync(256).then(function(buf) {
    return crypto.createHash('sha256').update(buf).digest('hex');
  });
};
