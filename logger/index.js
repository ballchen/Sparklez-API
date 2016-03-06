'use strict';

const bunyan = require('bunyan');
const config = require('../config');

const logger = bunyan.createLogger({
  name: 'dcard-api',
  level: config.logLevel,
  serializers: bunyan.stdSerializers
});

module.exports = logger;
