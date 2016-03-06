'use strict';

const coBody = require('co-body');
const formidable = require('koa-formidable');
const render = require('../common/render');
const ERROR_CODE = require('../common/error').ERROR_CODE;

const IGNORE_METHODS = ['GET', 'HEAD', 'DELETE'];

module.exports = function(options) {
  return function*(next) {
    if (~IGNORE_METHODS.indexOf(this.method.toUpperCase())) {
      return yield next;
    }

    let body = {};

    try {
      if (this.is('json')) {
        body = yield coBody.json(this, options);
      } else if (this.is('urlencoded')) {
        body = yield coBody.form(this, options);
      } else if (this.is('text')) {
        body = yield coBody.text(this, options);
      } else if (this.is('multipart')) {
        body = yield formidable.parse({ keepExtensions: true }, this);
      }
    } catch (err) {
      this.log.error(err);
      this.status = 400;
      render.call(this, {
        error: ERROR_CODE.bodyParse,
        message: 'Failed to parse body'
      });
    }

    this.request.body = body;

    yield next;
  };
};
