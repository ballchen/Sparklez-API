'use strict';

// Fix pg treats BIGINT as string
// https://github.com/sequelize/sequelize/issues/1774
require('pg').defaults.parseInt8 = true;

const config = require('../config');
const Sequelize = require('sequelize');
const Redis = require('ioredis');
const Redlock = require('redlock');
const _ = require('lodash');
const logger = require('../logger');

const sequelize = new Sequelize(config.pg.database, config.pg.user, config.pg.password, {
  host: config.pg.host,
  port: config.pg.port,
  dialect: 'postgres',
  logging: function(msg) {
    logger.trace({sql: msg});
  },

  native: true,
  define: {
    timestamps: true
  }
});

const redis = new Redis(config.redis);
const redlock = new Redlock([redis], {});

let models = {
  Application: require('./Application')(sequelize),
  Token: require('./Token')(sequelize, redis, redlock),
};

Object.keys(models).forEach(function(key) {
  const model = models[key];

  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

models.sequelize = sequelize;
models.redis = redis;
models.redlock = redlock;

module.exports = models;
