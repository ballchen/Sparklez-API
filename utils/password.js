'use strict';

const crypto = require('crypto');
const Promise = require('bluebird');
const bcrypt = Promise.promisifyAll(require('bcrypt'));

const generatePassword = Promise.coroutine(function*(password) {
  const salt = yield bcrypt.genSaltAsync(10);
  const hash = yield bcrypt.hashAsync(password, salt);

  return hash;
});

function isMD5Password(hash) {
  return hash.trim().length === 12;
}

function generateMD5Password(password) {
  let key = 'yoyoyo';
  let md5ed = crypto.createHash('md5').update(password + key).digest('hex');
  return md5ed.substring(0, 12);
}

function compareMD5Password(password, hash) {
  return Promise.resolve(generateMD5Password(password) === hash.trim());
}

function comparePassword(password, hash) {
  if (isMD5Password(hash)) {
    return compareMD5Password(password, hash);
  }

  return bcrypt.compareAsync(password, hash);
}

exports.generatePassword = generatePassword;
exports.comparePassword = comparePassword;
exports.isMD5Password = isMD5Password;
exports.generateMD5Password = generateMD5Password;
