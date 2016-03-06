'use strict';

const Sequelize = require('sequelize');
const _ = require('lodash');
const Promise = require('bluebird');
const ScopeMixin = require('./mixin/ScopeMixin');
const SecretMixin = require('./mixin/SecretMixin');
const clearCache = require('./hooks/clearCache');

const GRANT_TYPE = {
  password: 'password',
  clientCredentials: 'client_credentials',
  authorizationCode: 'authorization_code',
  refreshToken: 'refresh_token'
};

const BASIC_AUTH_DELIMITER = ':';

module.exports = function(sequelize) {
  const Application = sequelize.define('Application', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4
    },
    secret: {
      type: Sequelize.STRING,
      allowNull: false
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    url: {
      type: Sequelize.STRING,
      defaultValue: ''
    },
    description: {
      type: Sequelize.TEXT,
      defaultValue: ''
    },
    redirectUri: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      defaultValue: [],
      field: 'redirect_uri'
    },
    logo: {
      type: Sequelize.STRING,
      defaultValue: ''
    },
    scopes: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: []
    },
    suspended: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    memberId: {
      type: Sequelize.BIGINT,
      references: {
        model: 'Member',
        key: 'id'
      },
      field: 'member_id'
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
    tableName: 'applications',
    classMethods: _.assign({}, SecretMixin.classMethods, {
      createApplication: Promise.coroutine(function*(data, options) {
        let secret = yield this.generateSecret();

        return Application.create(_.assign({
          secret
        }, data), options);
      }),

      decodeBasicAuth(secret) {
        let raw = new Buffer(secret, 'base64').toString('ascii');
        let index = raw.indexOf(BASIC_AUTH_DELIMITER);
        if (!~index) return;

        return {
          id: raw.substring(0, index),
          secret: Application.decodeSecret(raw.substring(index + 1))
        };
      }
    }),
    instanceMethods: _.assign({}, ScopeMixin.instanceMethods, SecretMixin.instanceMethods, {
      encodeBasicAuth() {
        let str = this.get('id') + BASIC_AUTH_DELIMITER + this.encodeSecret();
        return new Buffer(str, 'ascii').toString('base64');
      }
    })
  });

  Application.GRANT_TYPE = GRANT_TYPE;

  // Clear token cache
  Application.beforeDestroy(clearCache({
    modelName: 'Token',
    attribute: 'applicationId'
  }));

  // Revoke tokens after the application is suspended
  Application.beforeUpdate(Promise.coroutine(function*(instance) {
    if (!instance.get('suspended') || !instance.changed('suspended')) return;

    const Token = sequelize.model('Token');

    yield clearCache({
      modelName: 'Token',
      attribute: 'applicationId'
    }).call(this, instance);

    yield Token.destroy({
      where: {
        applicationId: instance.get('id')
      }
    });
  }));

  return Application;
};
