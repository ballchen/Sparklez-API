'use strict';

const config = require('../config');
const Promise = require('bluebird');
const AWS = require('aws-sdk');

const BASE_URL = `https://s3-${config.aws.region}.amazonaws.com/${config.aws.bucket}`;

const paramsSchema = {
  Bucket: config.aws.bucket
};
const putObjectSchema = Object.assign({}, paramsSchema, {
  ACL: 'public-read',
  ContentType: 'image/jpeg'
});

const client = Promise.promisifyAll(new AWS.S3(config.aws));

const putObject = Promise.coroutine(function*(params) {
  params = Object.assign({}, putObjectSchema, params);
  try {
    yield client.putObjectAsync(params);
  } catch (err) {
    throw err.code;
  }
});

const deleteObjects = Promise.coroutine(function*(objects) {
  let params = Object.assign({}, paramsSchema, {
    Delete: {
      Objects: objects
    }
  });

  try {
    yield client.deleteObjectsAsync(params);
  } catch (err) {
    throw err.code;
  }
});

const moveAvatar = Promise.coroutine(function*(id) {
  let params = Object.assign({}, paramsSchema, {
    ACL: 'public-read',
    CopySource: `${config.aws.bucket}/avatar/applicants/${id}.jpg`,
    Key: `avatar/${id}.jpg`
  });

  try {
    yield client.copyObjectAsync(params);
    yield deleteObjects([
      { Key: `avatar/applicants/${id}.jpg` }
    ]);
  } catch (err) {
    throw err.code;
  }
});

exports.client = client;
exports.moveAvatar = moveAvatar;
exports.putObject = putObject;
exports.deleteObjects = deleteObjects;

exports.avatarUrl = function(filename) {
  return `${BASE_URL}/avatar/${filename}.jpg`;
};

exports.avatarPendingUrl = function(filename) {
  return `${BASE_URL}/avatar/applicants/${filename}.jpg`;
};

exports.avatarDir = function(filename) {
  return `avatar/applicants/${filename}.jpg`;
};

exports.studentCardUrl = function(filename) {
  return `${BASE_URL}/studentCard/${filename}.jpg`;
};

exports.studentCardDir = function(filename) {
  return `studentCard/${filename}.jpg`;
};
