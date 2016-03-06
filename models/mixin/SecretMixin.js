'use strict';

const generateToken = require('../../utils/token').generateToken;

exports.classMethods = {
  generateSecret() {
    return generateToken();
  },

  decodeSecret(secret) {
    return new Buffer(secret, 'base64').toString('hex');
  }
};

exports.instanceMethods = {
  encodeSecret() {
    return new Buffer(this.get('secret'), 'hex').toString('base64');
  }
};
