'use strict';

const models = require('../../models');
const Token = models.Token;
const Application = models.Application;
const OAUTH_ERROR_CODE = require('../common/error').OAUTH_ERROR_CODE;
const renderBearerTokenError = require('../common/error').renderBearerTokenError;
const render = require('../common/render');
const validator = require('validator');

// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
function parseAuthHeader(str) {
  let index = str.indexOf(' ');
  if (!~index) return;

  return {
    type: str.substring(0, index),
    content: str.substring(index + 1)
  };
}

exports.bearer = function*(next) {
  const authHeader = this.get('Authorization');
  let data = parseAuthHeader(authHeader);

  // Check access_token in form
  if (!data && this.is('urlencoded') && this.request.body) {
    data = {
      type: 'Bearer',
      content: this.request.body.access_token
    };
  }

  if (data && data.type === 'Bearer' && data.content) {
    const token = this.state.token = yield Token.findBySecret(Token.decodeSecret(data.content));

    if (!token) {
      this.status = 401;
      return renderBearerTokenError.call(this, {
        error: OAUTH_ERROR_CODE.invalidToken,
        description: 'Token is invalid'
      });
    }

    if (token.get('expiresIn') && token.get('updatedAt').getTime() + token.get('expiresIn') * 1000 < Date.now()) {
      this.status = 401;
      return renderBearerTokenError.call(this, {
        error: OAUTH_ERROR_CODE.invalidToken,
        description: 'Token is expired'
      });
    }
  }

  yield next;
};

exports.basic = function*(next) {
  const authHeader = this.get('Authorization');
  const data = parseAuthHeader(authHeader);

  if (data && data.type === 'Basic') {
    this.response.set({
      'Pragma': 'no-cache',
      'Cache-Control': 'no-store'
    });

    const auth = Application.decodeBasicAuth(data.content);

    if (!auth) {
      this.status = 400;
      return render.call(this, {
        error: OAUTH_ERROR_CODE.invalidGrant,
        error_description: 'Authorization header is invalid'
      });
    }

    const applicationId = auth.id;
    let app;

    if (validator.isUUID(applicationId, 4)) {
      app = yield Application.findById(applicationId);
    }

    if (!app) {
      this.status = 401;
      return render.call(this, {
        error: OAUTH_ERROR_CODE.invalidClient,
        error_description: 'Application not found'
      });
    }

    if (app.get('suspended')) {
      this.status = 401;
      return render.call(this, {
        error: OAUTH_ERROR_CODE.invalidClient,
        error_description: 'Application has been suspended'
      });
    }

    if (app.get('secret') !== auth.secret) {
      this.status = 401;
      return render.call(this, {
        error: OAUTH_ERROR_CODE.invalidClient,
        error_description: 'Application secret mismatch'
      });
    }

    this.state.application = app;
  }

  yield next;
};
// jscs:enable requireCamelCaseOrUpperCaseIdentifiers
