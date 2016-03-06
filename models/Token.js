'use strict';

const Sequelize = require('sequelize');
const Promise = require('bluebird');
const _ = require('lodash');
const RedisCache = require('./cache/RedisCache');
const CacheMap = require('./cache/CacheMap');
const ScopeMixin = require('./mixin/ScopeMixin');
const SecretMixin = require('./mixin/SecretMixin');

module.exports = function(sequelize, redis, redlock) {
  const Token = sequelize.define('Token', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    secret: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    scopes: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: []
    },
    requestScopes: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      defaultValue: [],
      field: 'request_scopes'
    },
    refreshToken: {
      type: Sequelize.STRING,
      unique: true,
      field: 'refresh_token'
    },
    expiresIn: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'expires_in'
    },
    memberId: {
      type: Sequelize.BIGINT,
      references: {
        model: 'Member',
        key: 'id'
      },
      field: 'member_id'
    },
    applicationId: {
      type: Sequelize.UUID,
      references: {
        model: 'Application',
        key: 'id'
      },
      field: 'application_id'
    },
    createdAt: {
      type: Sequelize.DATE,
      field: 'created_at'
    },
    updatedAt: {
      type: Sequelize.DATE,
      field: 'updated_at'
    }
  }, {
    tableName: 'tokens',
    classMethods: _.assign({}, SecretMixin.classMethods, {
      createToken: Promise.coroutine(function*(data, options) {
        let secret = yield this.generateSecret();

        return Token.create(_.assign({
          secret
        }, data), options);
      })
    }),
    instanceMethods: _.assign({}, ScopeMixin.instanceMethods, SecretMixin.instanceMethods)
  });

  const cache = new RedisCache({
    model: Token,
    redis,
    lock: redlock,
    cacheTTL: 60 * 60 // 1 hour
  });
  cache.bind();

  const secretCache = new CacheMap(Token, 'secret');
  secretCache.bind();

  return Token;
};
